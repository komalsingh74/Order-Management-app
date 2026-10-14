import { formatPrice } from "@/lib/format";
import type { MenuItem } from "@/lib/types";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import QuantityControl from "./QuantityControl";

interface Props {
  item: MenuItem;
  /** How many of this item are already in the cart. */
  quantity: number;
  onAdd: (item: MenuItem) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
}

export default function MenuCard({
  item,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
}: Props) {
  return (
    <Card className="h-full p-0" role="article">
      <div className="aspect-[4/3] overflow-hidden bg-secondary">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <CardContent className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <span className="shrink-0 font-bold">{formatPrice(item.price)}</span>
        </div>
        <p className="flex-1 text-sm text-muted-foreground">{item.description}</p>
        <div className="mt-2 flex">
          {quantity > 0 ? (
            <QuantityControl
              name={item.name}
              quantity={quantity}
              onIncrement={() => onIncrement(item.id)}
              onDecrement={() => onDecrement(item.id)}
            />
          ) : (
            <Button
              type="button"
              className="w-full"
              onClick={() => onAdd(item)}
              aria-label={`Add ${item.name} to cart`}
            >
              Add to cart
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
