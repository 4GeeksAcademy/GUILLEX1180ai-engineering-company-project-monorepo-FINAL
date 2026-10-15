// ──────────────────────────────────────────────
// useInventoryOrders — Hook para listado de órdenes
// ──────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback } from "react";
import type { LoadingState } from "@/lib/types";
import type { InventoryOrder } from "@/types/inventory";
import { inventoryApi } from "@/lib/inventory";

interface UseInventoryOrdersReturn {
  orders: InventoryOrder[];
  total: number;
  state: LoadingState;
  error: string | null;
  refetch: () => void;
}

export function useInventoryOrders(): UseInventoryOrdersReturn {
  const [orders, setOrders] = useState<InventoryOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const data = await inventoryApi.getOrders();
      setOrders(data.orders);
      setTotal(data.total);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar órdenes");
      setState("error");
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { orders, total, state, error, refetch: fetch };
}