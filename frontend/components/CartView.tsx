"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { useCart } from "./CartProvider";
import QuantityControl from "./QuantityControl";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export default function CartView() {
  const cart = useCart();

  if (!cart.hydrated) return <div className="h-64 animate-pulse rounded-xl bg-muted" aria-busy="true" />;

  if (cart.lines.length === 0) {
    return (
      <Card className="items-start gap-4 p-5">
        <p className="text-muted-foreground">Your cart is empty. Pick something tasty from the menu.</p>
        <Button render={<Link href="/">Browse menu</Link>} />
      </Card>
    );
  }

  return (
    <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_340px]">
      <ul className="m-0 grid list-none gap-3 p-0">
        {cart.lines.map((line) => (
          <li key={line.id} className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-xl border bg-card p-3 sm:grid-cols-[72px_minmax(0,1fr)_auto_90px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={line.image} alt="" className="row-span-2 h-16 w-16 rounded-lg object-cover sm:row-span-1 sm:h-[72px] sm:w-[72px]" />
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2 className="text-base font-semibold">{line.name}</h2>
              <span className="text-sm text-muted-foreground">{formatPrice(line.price)} each</span>
              <Button type="button" variant="link" className="h-auto self-start p-0 text-destructive" onClick={() => cart.remove(line.id)}>
                Remove
              </Button>
            </div>
            <QuantityControl
              name={line.name}
              quantity={line.quantity}
              onIncrement={() => cart.increment(line.id)}
              onDecrement={() => cart.decrement(line.id)}
            />
            <span className="justify-self-end font-bold">{formatPrice(line.price * line.quantity)}</span>
          </li>
        ))}
      </ul>

      <Card className="gap-4 p-5" role="complementary" aria-label="Order summary">
        <h2 className="text-xl font-semibold">Summary</h2>
        <dl className="m-0 grid gap-2">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Items</dt>
            <dd className="m-0 font-semibold">{cart.count}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-dashed pt-3 text-lg font-bold">
            <dt>Total</dt>
            <dd className="m-0">{formatPrice(cart.total)}</dd>
          </div>
        </dl>
        <Button render={<Link href="/checkout">Go to checkout</Link>} className="w-full" />
        <Button type="button" variant="link" className="h-auto self-start p-0 text-destructive" onClick={cart.clear}>
          Clear cart
        </Button>
      </Card>
    </div>
  );
}
