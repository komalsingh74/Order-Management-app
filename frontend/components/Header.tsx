"use client";

import Link from "next/link";
import { ShoppingBag, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "./CartProvider";

export default function Header() {
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <span className="text-lg">Dishpatch</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Button render={<Link href="/">Menu</Link>} variant="ghost" size="sm" />
          <Button
            render={
              <Link href="/cart" aria-label={`Cart, ${count} items`}>
                <ShoppingBag className="h-4 w-4" />
                <span className="ml-2">Cart</span>
                {count > 0 && (
                  <Badge
                    className="absolute -right-2 -top-2 h-5 min-w-5 rounded-full px-1.5 text-[10px]"
                    variant="default"
                  >
                    {count}
                  </Badge>
                )}
              </Link>
            }
            variant="outline"
            size="sm"
            className="relative"
          />
        </nav>
      </div>
    </header>
  );
}