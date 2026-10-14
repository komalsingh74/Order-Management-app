import { describe, expect, it } from "vitest";
import {
  MAX_QTY,
  cartCount,
  cartReducer,
  cartTotal,
  initialCartState,
  parseStoredCart,
  type CartState,
} from "./cart";

const pizza = { id: "p1", name: "Pizza", price: 250, image: "/p.svg" };
const burger = { id: "b1", name: "Burger", price: 150.5, image: "/b.svg" };
const ready: CartState = { lines: [], hydrated: true };

describe("cartReducer", () => {
  it("adds a new item with quantity 1", () => {
    const state = cartReducer(ready, { type: "add", item: pizza });
    expect(state.lines).toEqual([{ ...pizza, quantity: 1 }]);
  });

  it("adding the same item again increases its quantity", () => {
    let state = cartReducer(ready, { type: "add", item: pizza });
    state = cartReducer(state, { type: "add", item: pizza });
    expect(state.lines).toHaveLength(1);
    expect(state.lines[0].quantity).toBe(2);
  });

  it("never goes above the max quantity", () => {
    let state = cartReducer(ready, { type: "add", item: pizza });
    for (let i = 0; i < MAX_QTY + 5; i++) state = cartReducer(state, { type: "increment", id: "p1" });
    expect(state.lines[0].quantity).toBe(MAX_QTY);
  });

  it("decrement lowers quantity and removes the line at zero", () => {
    let state = cartReducer(ready, { type: "add", item: pizza });
    state = cartReducer(state, { type: "increment", id: "p1" });
    state = cartReducer(state, { type: "decrement", id: "p1" });
    expect(state.lines[0].quantity).toBe(1);
    state = cartReducer(state, { type: "decrement", id: "p1" });
    expect(state.lines).toHaveLength(0);
  });

  it("removes a line and clears the cart", () => {
    let state = cartReducer(ready, { type: "add", item: pizza });
    state = cartReducer(state, { type: "add", item: burger });
    state = cartReducer(state, { type: "remove", id: "p1" });
    expect(state.lines.map((l) => l.id)).toEqual(["b1"]);
    state = cartReducer(state, { type: "clear" });
    expect(state.lines).toEqual([]);
    expect(state.hydrated).toBe(true);
  });

  it("hydrate loads lines and marks the cart as ready", () => {
    const state = cartReducer(initialCartState, {
      type: "hydrate",
      lines: [{ ...pizza, quantity: 3 }],
    });
    expect(state.hydrated).toBe(true);
    expect(state.lines[0].quantity).toBe(3);
  });

  it("replaces cart lines with refreshed menu details", () => {
    const state = cartReducer(
      { ...ready, lines: [{ ...pizza, quantity: 2 }] },
      {
        type: "replace",
        lines: [{ ...pizza, id: "fresh-pizza-id", price: 275, quantity: 2 }],
      },
    );
    expect(state.lines).toEqual([
      { ...pizza, id: "fresh-pizza-id", price: 275, quantity: 2 },
    ]);
  });
});

describe("totals", () => {
  it("computes count and total", () => {
    const lines = [
      { ...pizza, quantity: 2 },
      { ...burger, quantity: 1 },
    ];
    expect(cartCount(lines)).toBe(3);
    expect(cartTotal(lines)).toBe(650.5);
  });
});

describe("parseStoredCart", () => {
  it("returns [] for empty, invalid or non-array data", () => {
    expect(parseStoredCart(null)).toEqual([]);
    expect(parseStoredCart("not json")).toEqual([]);
    expect(parseStoredCart('{"a":1}')).toEqual([]);
  });

  it("keeps valid lines and drops tampered ones", () => {
    const raw = JSON.stringify([
      { ...pizza, quantity: 2 },
      { ...burger, quantity: -5 },
      { ...burger, quantity: 999 },
      { id: 1, name: "x" },
    ]);
    expect(parseStoredCart(raw)).toEqual([{ ...pizza, quantity: 2 }]);
  });
});
