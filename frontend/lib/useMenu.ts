"use client";

import { useCallback, useEffect, useState } from "react";
import { getMenu } from "./api";
import type { MenuItem } from "./types";

interface MenuState {
  items: MenuItem[];
  loading: boolean;
  error: string | null;
}

export function useMenu() {
  const [state, setState] = useState<MenuState>({
    items: [],
    loading: true,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getMenu()
      .then((items) => {
        if (!cancelled) setState({ items, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ items: [], loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    setAttempt((a) => a + 1);
  }, []);

  return { ...state, retry };
}
