// ──────────────────────────────────────────────
// useWarehouses — Hook para cargar almacenes
// ──────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback } from "react";
import type { LoadingState } from "@/lib/types";
import type { Warehouse } from "@/types/inventory";
import { inventoryApi } from "@/lib/inventory";

interface UseWarehousesReturn {
  warehouses: Warehouse[];
  state: LoadingState;
  error: string | null;
}

export function useWarehouses(): UseWarehousesReturn {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [state, setState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const data = await inventoryApi.getWarehouses();
      setWarehouses(data);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar almacenes");
      setState("error");
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { warehouses, state, error };
}