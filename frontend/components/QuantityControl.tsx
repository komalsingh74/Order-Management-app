import { MAX_QTY } from "@/lib/cart";
import { Minus, Plus } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  name: string;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export default function QuantityControl({
  name,
  quantity,
  onIncrement,
  onDecrement,
}: Props) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border p-1" role="group" aria-label={`Quantity of ${name}`}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDecrement}
        aria-label={`Decrease quantity of ${name}`}
      >
        <Minus aria-hidden="true" />
      </Button>
      <output className="min-w-8 text-center font-bold" aria-live="polite">
        {quantity}
      </output>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onIncrement}
        disabled={quantity >= MAX_QTY}
        aria-label={`Increase quantity of ${name}`}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}
