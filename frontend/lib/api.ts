import axios, { type AxiosResponse } from "axios";
import type { CreateOrderPayload, MenuItem, Order } from "./types";

interface ApiFieldError {
  field: string;
  message: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: ApiFieldError[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly fieldErrors: ApiFieldError[] = [],
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const baseURL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

const api = axios.create({
  baseURL,
  timeout: 10_000,
  headers: { Accept: "application/json" },
});

async function unwrap<T>(
  request: Promise<AxiosResponse<ApiEnvelope<T>>>,
): Promise<T> {
  try {
    const response = await request;
    const envelope = response.data;
    if (!envelope || envelope.success !== true || !("data" in envelope)) {
      throw new ApiError(
        envelope?.message || "The API returned an unexpected response.",
        [],
        response.status,
      );
    }
    return envelope.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
      const body = error.response?.data;
      throw new ApiError(
        body?.message || error.message || "The API request failed.",
        body?.errors || [],
        error.response?.status,
      );
    }

    throw error;
  }
}

export function getMenu(): Promise<MenuItem[]> {
  return unwrap(api.get<ApiEnvelope<MenuItem[]>>("/menu"));
}

export function createOrder(payload: CreateOrderPayload): Promise<Order> {
  return unwrap(api.post<ApiEnvelope<Order>>("/orders", payload));
}

export function getOrder(orderId: string): Promise<Order> {
  return unwrap(
    api.get<ApiEnvelope<Order>>(`/orders/${encodeURIComponent(orderId)}`),
  );
}

export function cancelOrder(orderId: string): Promise<Order> {
  return unwrap(
    api.delete<ApiEnvelope<Order>>(`/orders/${encodeURIComponent(orderId)}`),
  );
}

export function orderStreamUrl(orderId: string): string {
  return `${baseURL}/orders/${encodeURIComponent(orderId)}/stream`;
}

export default api;
