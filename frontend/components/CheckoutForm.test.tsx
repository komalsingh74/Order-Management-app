import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CART_STORAGE_KEY } from "@/lib/cart";
import { CartProvider } from "./CartProvider";
import CheckoutForm from "./CheckoutForm";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const createOrder = vi.fn();
const getMenu = vi.fn();
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    createOrder: (...args: unknown[]) => createOrder(...args),
    getMenu: (...args: unknown[]) => getMenu(...args),
  };
});
import { ApiError } from "@/lib/api";

const renderForm = () =>
  render(
    <CartProvider>
      <CheckoutForm />
    </CartProvider>,
  );

const fillForm = async () => {
  await userEvent.type(screen.getByLabelText(/full name/i), "Rahul Sharma");
  await userEvent.type(screen.getByLabelText(/delivery address/i), "221B MG Road, Bareilly");
  await userEvent.type(screen.getByLabelText(/phone number/i), "98765 43210");
};

beforeEach(() => {
  vi.clearAllMocks();
  getMenu.mockResolvedValue([
    {
      id: "m1",
      name: "Margherita Pizza",
      description: "Pizza",
      price: 249,
      image: "/p.svg",
      category: "Pizza",
      isAvailable: true,
    },
  ]);
  localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify([{ id: "m1", name: "Margherita Pizza", price: 249, image: "/p.svg", quantity: 2 }]),
  );
});

describe("CheckoutForm", () => {
  it("shows an empty state when the cart is empty", async () => {
    localStorage.clear();
    renderForm();
    expect(await screen.findByText(/cart is empty/i)).toBeInTheDocument();
  });

  it("shows validation errors and does not call the API for empty fields", async () => {
    renderForm();
    await userEvent.click(await screen.findByRole("button", { name: /place order/i }));

    expect(screen.getByText(/enter your full name/i)).toBeInTheDocument();
    expect(screen.getByText(/enter your full delivery address/i)).toBeInTheDocument();
    expect(screen.getByText(/valid phone number/i)).toBeInTheDocument();
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("submits the order, clears the cart and opens the tracking page", async () => {
    createOrder.mockResolvedValue({ id: "order123" });
    renderForm();
    await screen.findByRole("button", { name: /place order/i });
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: /place order/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/orders/order123"));
    expect(createOrder).toHaveBeenCalledWith({
      customer: { name: "Rahul Sharma", address: "221B MG Road, Bareilly", phone: "98765 43210" },
      items: [{ menuItemId: "m1", quantity: 2 }],
    });
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "[]")).toEqual([]);
  });

  it("refreshes stale menu item IDs before submitting the order", async () => {
    getMenu.mockResolvedValue([
      {
        id: "fresh-menu-id",
        name: "Margherita Pizza",
        description: "Pizza",
        price: 275,
        image: "/fresh-p.svg",
        category: "Pizza",
        isAvailable: true,
      },
    ]);
    createOrder.mockResolvedValue({ id: "order123" });
    renderForm();
    await screen.findByRole("button", { name: /place order/i });
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: /place order/i }));

    await waitFor(() =>
      expect(createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          items: [{ menuItemId: "fresh-menu-id", quantity: 2 }],
        }),
      ),
    );
  });

  it("shows the server's error and keeps the cart when ordering fails", async () => {
    createOrder.mockRejectedValue(new ApiError('"Margherita Pizza" is currently unavailable', [], 409));
    renderForm();
    await screen.findByRole("button", { name: /place order/i });
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: /place order/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/currently unavailable/i);
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /place order/i })).toBeEnabled();
  });

  it("maps server field errors onto the right input", async () => {
    createOrder.mockRejectedValue(
      new ApiError("Validation failed", [{ field: "customer.phone", message: "Phone must contain 10 to 15 digits" }], 400),
    );
    renderForm();
    await screen.findByRole("button", { name: /place order/i });
    await fillForm();
    await userEvent.click(screen.getByRole("button", { name: /place order/i }));

    expect(await screen.findByText("Phone must contain 10 to 15 digits")).toBeInTheDocument();
  });
});
