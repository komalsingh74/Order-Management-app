import type { Metadata } from "next";
import CartView from "@/components/CartView";

export const metadata: Metadata = { title: "Your cart · Dishpatch" };

export default function CartPage() {
  return (
    <>
      <h1 className="mb-5 text-3xl font-bold tracking-tight sm:text-4xl">Your cart</h1>
      <CartView />
    </>
  );
}
