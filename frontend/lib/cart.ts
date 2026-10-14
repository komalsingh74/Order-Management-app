export const MAX_QTY = 20;
export const CART_STORAGE_KEY = "dishpatch.cart.v1";

export interface CartLine {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface CartState {
  lines: CartLine[];
  /** false until localStorage has been read (avoids a flash of "empty cart"). */
  hydrated: boolean;
}

export type CartAction =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; item: Omit<CartLine, "quantity"> }
  | { type: "replace"; lines: CartLine[] }
  | { type: "increment"; id: string }
  | { type: "decrement"; id: string }
  | { type: "remove"; id: string }
  | { type: "clear" };

export const initialCartState: CartState = { lines: [], hydrated: false };

const clamp = (quantity: number) => Math.min(MAX_QTY, quantity);

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return { lines: action.lines, hydrated: true };

    case "add": {
      const exists = state.lines.some((l) => l.id === action.item.id);
      const lines = exists
        ? state.lines.map((l) =>
            l.id === action.item.id ? { ...l, quantity: clamp(l.quantity + 1) } : l,
          )
        : [...state.lines, { ...action.item, quantity: 1 }];
      return { ...state, lines };
    }

    case "replace":
      return { ...state, lines: action.lines };

    case "increment":
      return {
        ...state,
        lines: state.lines.map((l) =>
          l.id === action.id ? { ...l, quantity: clamp(l.quantity + 1) } : l,
        ),
      };

    case "decrement":
      return {
        ...state,
        lines: state.lines
          .map((l) => (l.id === action.id ? { ...l, quantity: l.quantity - 1 } : l))
          .filter((l) => l.quantity > 0),
      };

    case "remove":
      return { ...state, lines: state.lines.filter((l) => l.id !== action.id) };

    case "clear":
      return { ...state, lines: [] };

    default:
      return state;
  }
}

export const cartCount = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + l.quantity, 0);

export const cartTotal = (lines: CartLine[]) =>
  Math.round(lines.reduce((sum, l) => sum + l.price * l.quantity, 0) * 100) / 100;

const isCartLine = (value: unknown): value is CartLine => {
  if (typeof value !== "object" || value === null) return false;
  const l = value as Record<string, unknown>;
  return (
    typeof l.id === "string" &&
    typeof l.name === "string" &&
    typeof l.image === "string" &&
    typeof l.price === "number" &&
    l.price >= 0 &&
    Number.isInteger(l.quantity) &&
    (l.quantity as number) >= 1 &&
    (l.quantity as number) <= MAX_QTY
  );
};

/** Safely reads whatever is in localStorage; garbage in -> empty cart. */
export function parseStoredCart(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCartLine) : [];
  } catch {
    return [];
  }
}
