import type { OrderStatus } from "./types";

/** Happy-path steps shown in the tracker, in order. */
export const STATUS_STEPS: { status: OrderStatus; label: string; hint: string }[] =
  [
    {
      status: "RECEIVED",
      label: "Order received",
      hint: "The restaurant has your order.",
    },
    {
      status: "PREPARING",
      label: "Preparing",
      hint: "Your food is being cooked.",
    },
    {
      status: "OUT_FOR_DELIVERY",
      label: "Out for delivery",
      hint: "Your rider is on the way.",
    },
    {
      status: "DELIVERED",
      label: "Delivered",
      hint: "Enjoy your meal!",
    },
  ];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  RECEIVED: "Order received",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const isFinalStatus = (status: OrderStatus) =>
  status === "DELIVERED" || status === "CANCELLED";
