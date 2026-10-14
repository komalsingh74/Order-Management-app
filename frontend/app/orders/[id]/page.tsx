import type { Metadata } from "next";
import { Suspense } from "react";
import OrderTracker from "@/components/OrderTracker";

export const metadata: Metadata = { title: "Track your order · Dishpatch" };

// `params` is read inside <Suspense> because it is only known at request time.
async function Tracker({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderTracker orderId={id} />;
}

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <h1 className="mb-5 text-3xl font-bold tracking-tight sm:text-4xl">Track your order</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-muted" aria-busy="true" />}>
        <Tracker params={params} />
      </Suspense>
    </>
  );
}
