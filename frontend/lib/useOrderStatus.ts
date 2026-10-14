"use client";

import { useEffect, useState } from "react";
import { getOrder, orderStreamUrl } from "./api";
import { isFinalStatus } from "./orderStatus";
import type { Order } from "./types";

export type Connection = "connecting" | "live" | "polling" | "closed";

const POLL_INTERVAL_MS = 5000;

/**
 * Loads an order and keeps it fresh.
 *  1. Opens a Server-Sent Events stream (real-time push from the backend).
 *  2. If SSE is unavailable or drops, falls back to polling every 5s.
 *  3. Stops everything once the order is DELIVERED or CANCELLED.
 */
export function useOrderStatus(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<Connection>("connecting");

  useEffect(() => {
    let disposed = false;
    let source: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const stop = () => {
      source?.close();
      source = null;
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = null;
    };

    const apply = (next: Order) => {
      if (disposed) return;
      setOrder(next);
      setError(null);
      if (isFinalStatus(next.status)) {
        stop();
        setConnection("closed");
      }
    };

    const startPolling = () => {
      if (disposed || pollTimer) return;
      setConnection("polling");
      pollTimer = setInterval(() => {
        getOrder(orderId).then(apply).catch((err: Error) => {
          if (!disposed) setError(err.message);
        });
      }, POLL_INTERVAL_MS);
    };

    getOrder(orderId)
      .then((initial) => {
        apply(initial);
        if (disposed || isFinalStatus(initial.status)) return;

        if (typeof EventSource === "undefined") {
          startPolling();
          return;
        }
        source = new EventSource(orderStreamUrl(orderId));
        setConnection("live");
        source.addEventListener("status", (event) => {
          apply(JSON.parse((event as MessageEvent<string>).data) as Order);
        });
        source.onerror = () => {
          source?.close();
          source = null;
          startPolling();
        };
      })
      .catch((err: Error) => {
        if (!disposed) {
          setError(err.message);
          setConnection("closed");
        }
      });

    return () => {
      disposed = true;
      stop();
    };
  }, [orderId]);

  return { order, error, connection, setOrder };
}
