"use client";

import Link from "next/link";
import { useState } from "react";
import { cancelOrder } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { isFinalStatus } from "@/lib/orderStatus";
import { useOrderStatus } from "@/lib/useOrderStatus";
import StatusStepper from "./StatusStepper";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export default function OrderTracker({ orderId }: { orderId: string }) {
  const { order, error, connection, setOrder } = useOrderStatus(orderId);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function handleCancel() {
    setCancelling(true);
    setCancelError(null);
    try {
      setOrder(await cancelOrder(orderId));
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Could not cancel the order.");
    } finally {
      setCancelling(false);
    }
  }

  if (error && !order) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-destructive" role="alert">
        <p>{error}</p>
        <Button render={<Link href="/">Back to menu</Link>} variant="outline" />
      </div>
    );
  }

  if (!order) return <div className="h-64 animate-pulse rounded-xl bg-muted" aria-busy="true" />;

  const cancelled = order.status === "CANCELLED";

  return (
    <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="gap-4 p-5" role="region" aria-labelledby="tracker-title">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="tracker-title" className="text-xl font-semibold">Order #{order.id.slice(-6).toUpperCase()}</h2>
          {!isFinalStatus(order.status) && (
            <Badge variant={connection === "live" ? "default" : "secondary"} role="status">
              {connection === "live" ? "Live updates" : connection === "polling" ? "Refreshing every 5s" : "Connecting…"}
            </Badge>
          )}
        </div>

        {error && order && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive" role="status">
            Could not refresh order status: {error}
          </p>
        )}

        {cancelled ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive" role="status">
            This order was cancelled.
          </p>
        ) : (
          <StatusStepper status={order.status} history={order.statusHistory} />
        )}

        {cancelError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive" role="alert">
            {cancelError}
          </p>
        )}

        <div className="flex gap-3">
          {order.status === "RECEIVED" && (
            <Button type="button" variant="outline" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? "Cancelling…" : "Cancel order"}
            </Button>
          )}
          {isFinalStatus(order.status) && (
            <Button render={<Link href="/">Order again</Link>} />
          )}
        </div>
      </Card>

      <Card className="gap-4 p-5" role="complementary" aria-label="Order details">
        <h2 className="text-xl font-semibold">Order details</h2>
        <ul className="m-0 grid list-none gap-2 p-0">
          {order.items.map((item) => (
            <li key={item.menuItem} className="flex justify-between gap-4">
              <span>
                {item.quantity} × {item.name}
              </span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="m-0 grid gap-2">
          <div className="flex justify-between gap-4 border-t border-dashed pt-3 text-lg font-bold">
            <dt>Total</dt>
            <dd className="m-0">{formatPrice(order.totalAmount)}</dd>
          </div>
        </dl>
        <p className="text-sm text-muted-foreground">
          Delivering to <strong>{order.customer.name}</strong>
          <br />
          {order.customer.address}
          <br />
          {order.customer.phone}
        </p>
      </Card>
    </div>
  );
}
