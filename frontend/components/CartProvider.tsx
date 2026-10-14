"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  CART_STORAGE_KEY,
  cartCount,
  cartReducer,
  cartTotal,
  initialCartState,
  parseStoredCart,
  type CartLine,
} from "@/lib/cart";
import type { MenuItem } from "@/lib/types";

interface CartContextValue {
  lines: CartLine[];
  count: number;
  total: number;
  hydrated: boolean;
  add: (item: Pick<MenuItem, "id" | "name" | "price" | "image">) => void;
  replace: (lines: CartLine[]) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  // Load once from localStorage after the first render (client only).
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(CART_STORAGE_KEY);
    } catch {
      // storage blocked (private mode etc.) -> start with an empty cart
    }
    dispatch({ type: "hydrate", lines: parseStoredCart(stored) });
  }, []);

  // Save on every change, but only after loading so we never overwrite a saved cart.
  useEffect(() => {
    if (!state.hydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.lines));
    } catch {
      // ignore quota / blocked storage
    }
  }, [state.lines, state.hydrated]);

  const add = useCallback<CartContextValue["add"]>(
    ({ id, name, price, image }) =>
      dispatch({ type: "add", item: { id, name, price, image } }),
    [],
  );
  const replace = useCallback(
    (lines: CartLine[]) => dispatch({ type: "replace", lines }),
    [],
  );
  const increment = useCallback((id: string) => dispatch({ type: "increment", id }), []);
  const decrement = useCallback((id: string) => dispatch({ type: "decrement", id }), []);
  const remove = useCallback((id: string) => dispatch({ type: "remove", id }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines: state.lines,
      count: cartCount(state.lines),
      total: cartTotal(state.lines),
      hydrated: state.hydrated,
      add,
      replace,
      increment,
      decrement,
      remove,
      clear,
    }),
    [state.lines, state.hydrated, add, replace, increment, decrement, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
