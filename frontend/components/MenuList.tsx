"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import { useMenu } from "@/lib/useMenu";
import { useCart } from "./CartProvider";
import MenuCard from "./MenuCard";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

const ALL = "All";

export default function MenuList() {
  const { items, loading, error, retry } = useMenu();
  const cart = useCart();
  const [category, setCategory] = useState(ALL);

  const categories = useMemo(
    () => [ALL, ...Array.from(new Set(items.map((i) => i.category)))],
    [items],
  );
  const visible = category === ALL ? items : items.filter((i) => i.category === category);
  const quantityOf = (id: string) => cart.lines.find((l) => l.id === id)?.quantity ?? 0;

  if (loading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4" aria-busy="true" aria-label="Loading menu">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={i} className="h-80 gap-0 p-0">
            <Skeleton className="h-44 rounded-none" />
            <Skeleton className="m-4 h-5 w-2/3" />
            <Skeleton className="mx-4 h-4 w-4/5" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-destructive" role="alert">
        <p>{error}</p>
        <Button type="button" variant="outline" onClick={retry}>
          Try again
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="rounded-xl border bg-card p-5 text-muted-foreground">The menu is empty right now. Please check back soon.</p>;
  }

  return (
    <>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Menu categories">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={c === category}
            className="border-0 bg-transparent p-0"
            onClick={() => setCategory(c)}
          >
            <Badge
              variant={c === category ? "default" : "outline"}
              className="h-auto cursor-pointer px-4 py-2 text-sm"
            >
              {c}
            </Badge>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4">
        {visible.map((item) => (
          <MenuCard
            key={item.id}
            item={item}
            quantity={quantityOf(item.id)}
            onAdd={cart.add}
            onIncrement={cart.increment}
            onDecrement={cart.decrement}
          />
        ))}
      </div>

      {cart.count > 0 && (
        <Link href="/cart" className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-[560px] -translate-x-1/2 items-center justify-between rounded-xl bg-accent px-5 py-3 text-accent-foreground shadow-xl">
          <span className="font-semibold">
            {cart.count} {cart.count === 1 ? "item" : "items"} in cart
          </span>
          <strong className="font-bold">{formatPrice(cart.total)}</strong>
        </Link>
      )}
    </>
  );
}
