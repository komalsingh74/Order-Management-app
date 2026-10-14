"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { ApiError, createOrder, getMenu } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { CustomerDetails } from "@/lib/types";
import { validateCheckout, type CheckoutErrors } from "@/lib/validation";
import { useCart } from "./CartProvider";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

const EMPTY: CustomerDetails = { name: "", address: "", phone: "" };

export default function CheckoutForm() {
  const router = useRouter();
  const cart = useCart();
  const [values, setValues] = useState<CustomerDetails>(EMPTY);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange =
    (field: keyof CustomerDetails) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const found = validateCheckout(values);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const menu = await getMenu();
      const currentItems = new Map(menu.map((item) => [item.name.trim().toLowerCase(), item]));
      const refreshedLines = cart.lines.map((line) => {
        const currentItem = currentItems.get(line.name.trim().toLowerCase());
        if (!currentItem) {
          throw new Error(
            `"${line.name}" is no longer on the menu. Remove it from your cart and add it again.`,
          );
        }
        return {
          ...line,
          id: currentItem.id,
          name: currentItem.name,
          price: currentItem.price,
          image: currentItem.image,
        };
      });
      cart.replace(refreshedLines);
      const order = await createOrder({
        customer: {
          name: values.name.trim(),
          address: values.address.trim(),
          phone: values.phone.trim(),
        },
        items: refreshedLines.map((l) => ({ menuItemId: l.id, quantity: l.quantity })),
      });
      cart.clear();
      router.push(`/orders/${order.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors.length > 0) {
        const serverErrors: CheckoutErrors = {};
        err.fieldErrors.forEach(({ field, message }) => {
          const key = field.replace("customer.", "") as keyof CustomerDetails;
          if (key in EMPTY) serverErrors[key] = message;
        });
        setErrors(serverErrors);
      }
      setFormError(err instanceof Error ? err.message : "Could not place your order.");
      setSubmitting(false);
    }
  }

  if (!cart.hydrated) return <div className="h-64 animate-pulse rounded-xl bg-muted" aria-busy="true" />;

  if (cart.lines.length === 0) {
    return (
      <Card className="items-start gap-4 p-5">
        <p className="text-muted-foreground">Your cart is empty, so there is nothing to check out.</p>
        <Button render={<Link href="/">Browse menu</Link>} />
      </Card>
    );
  }

  return (
    <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_340px]">
      <form className="flex flex-col gap-4 rounded-xl border bg-card p-5" onSubmit={handleSubmit} noValidate>
        <h2 className="text-xl font-semibold">Delivery details</h2>

        <Field label="Full name" error={errors.name} htmlFor="name">
          <Input
            id="name"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={handleChange("name")}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
        </Field>

        <Field label="Delivery address" error={errors.address} htmlFor="address">
          <Textarea
            id="address"
            name="address"
            rows={3}
            autoComplete="street-address"
            value={values.address}
            onChange={handleChange("address")}
            aria-invalid={Boolean(errors.address)}
            aria-describedby={errors.address ? "address-error" : undefined}
          />
        </Field>

        <Field label="Phone number" error={errors.phone} htmlFor="phone">
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={handleChange("phone")}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
        </Field>

        {formError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive" role="alert">
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Placing order…" : `Place order · ${formatPrice(cart.total)}`}
        </Button>
      </form>

      <Card className="gap-4 p-5" role="complementary" aria-label="Order summary">
        <h2 className="text-xl font-semibold">Your order</h2>
        <ul className="m-0 grid list-none gap-2 p-0">
          {cart.lines.map((l) => (
            <li key={l.id} className="flex justify-between gap-4">
              <span className="text-muted-foreground">
                {l.quantity} × {l.name}
              </span>
              <span>{formatPrice(l.price * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="m-0 grid gap-2">
          <div className="flex justify-between gap-4 border-t border-dashed pt-3 text-lg font-bold">
            <dt>Total</dt>
            <dd className="m-0">{formatPrice(cart.total)}</dd>
          </div>
        </dl>
        <Link href="/cart" className="text-sm font-medium text-primary underline underline-offset-4">
          Edit cart
        </Link>
      </Card>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="font-semibold">{label}</label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
