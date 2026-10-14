import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Order } from "@/lib/types";
import OrderTracker from "./OrderTracker";

const useOrderStatus = vi.fn();
vi.mock("@/lib/useOrderStatus", () => ({ useOrderStatus: (id: string) => useOrderStatus(id) }));

const cancelOrder = vi.fn();
vi.mock("@/lib/api", () => ({ cancelOrder: (id: string) => cancelOrder(id) }));

const baseOrder: Order = {
  id: "64b7f0f2a1b2c3d4e5f60abc",
  customer: { name: "Rahul Sharma", address: "221B MG Road", phone: "9876543210" },
  items: [{ menuItem: "m1", name: "Margherita Pizza", price: 249, quantity: 2 }],
  totalAmount: 498,
  status: "RECEIVED",
  statusHistory: [{ status: "RECEIVED", at: "2026-10-13T10:00:00.000Z" }],
  createdAt: "2026-10-13T10:00:00.000Z",
  updatedAt: "2026-10-13T10:00:00.000Z",
};

const mockHook = (order: Order | null, extra = {}) =>
  useOrderStatus.mockReturnValue({ order, error: null, connection: "live", setOrder: vi.fn(), ...extra });

beforeEach(() => vi.clearAllMocks());

describe("OrderTracker", () => {
  it("shows the order id, current status and details", () => {
    mockHook(baseOrder);
    render(<OrderTracker orderId={baseOrder.id} />);

    expect(screen.getByRole("heading", { name: /order #F60ABC/i })).toBeInTheDocument();
    expect(screen.getByText(/live updates/i)).toBeInTheDocument();
    expect(screen.getByText(/2 × Margherita Pizza/)).toBeInTheDocument();
    expect(screen.getByText("Rahul Sharma")).toBeInTheDocument();
  });

  it("lets the customer cancel while the order is still received", async () => {
    const setOrder = vi.fn();
    mockHook(baseOrder, { setOrder });
    cancelOrder.mockResolvedValue({ ...baseOrder, status: "CANCELLED" });
    render(<OrderTracker orderId={baseOrder.id} />);

    await userEvent.click(screen.getByRole("button", { name: /cancel order/i }));
    await waitFor(() => expect(setOrder).toHaveBeenCalledWith(expect.objectContaining({ status: "CANCELLED" })));
    expect(cancelOrder).toHaveBeenCalledWith(baseOrder.id);
  });

  it("hides the cancel button once the kitchen has started", () => {
    mockHook({ ...baseOrder, status: "PREPARING" });
    render(<OrderTracker orderId={baseOrder.id} />);
    expect(screen.queryByRole("button", { name: /cancel order/i })).not.toBeInTheDocument();
  });

  it("shows a cancelled message and an 'Order again' link", () => {
    mockHook({ ...baseOrder, status: "CANCELLED" });
    render(<OrderTracker orderId={baseOrder.id} />);
    expect(screen.getByText(/this order was cancelled/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /order again/i })).toHaveAttribute("href", "/");
  });

  it("shows an error when the order cannot be loaded", () => {
    mockHook(null, { error: "Order not found", connection: "closed" });
    render(<OrderTracker orderId="bad" />);
    expect(screen.getByRole("alert")).toHaveTextContent(/order not found/i);
  });
});
