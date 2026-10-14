import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { MenuItem } from "@/lib/types";
import MenuCard from "./MenuCard";

const item: MenuItem = {
  id: "m1",
  name: "Margherita Pizza",
  description: "Fresh mozzarella and basil.",
  price: 249,
  image: "/menu/margherita-pizza.svg",
  category: "Pizza",
  isAvailable: true,
};

const setup = (quantity = 0) => {
  const handlers = { onAdd: vi.fn(), onIncrement: vi.fn(), onDecrement: vi.fn() };
  render(<MenuCard item={item} quantity={quantity} {...handlers} />);
  return handlers;
};

describe("MenuCard", () => {
  it("shows name, description, price and image", () => {
    setup();
    expect(screen.getByRole("heading", { name: item.name })).toBeInTheDocument();
    expect(screen.getByText(item.description)).toBeInTheDocument();
    expect(screen.getByText(/249/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: item.name })).toHaveAttribute("src", item.image);
  });

  it("calls onAdd when 'Add to cart' is clicked", async () => {
    const { onAdd } = setup();
    await userEvent.click(screen.getByRole("button", { name: /add margherita pizza to cart/i }));
    expect(onAdd).toHaveBeenCalledWith(item);
  });

  it("shows quantity controls once the item is in the cart", async () => {
    const { onIncrement, onDecrement } = setup(2);
    expect(screen.queryByRole("button", { name: /add .* to cart/i })).not.toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /increase quantity/i }));
    await userEvent.click(screen.getByRole("button", { name: /decrease quantity/i }));
    expect(onIncrement).toHaveBeenCalledWith("m1");
    expect(onDecrement).toHaveBeenCalledWith("m1");
  });

  it("disables '+' at the maximum quantity", () => {
    setup(20);
    expect(screen.getByRole("button", { name: /increase quantity/i })).toBeDisabled();
  });
});
