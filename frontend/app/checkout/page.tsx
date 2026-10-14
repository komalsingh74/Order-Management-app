import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Checkout · Dishpatch" };

export default function CheckoutPage() {
  return (
    <>
      <h1 className="mb-5 text-3xl font-bold tracking-tight sm:text-4xl">Checkout</h1>
      <CheckoutForm />
    </>
  );
}
