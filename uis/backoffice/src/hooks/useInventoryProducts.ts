// ──────────────────────────────────────────────
// useInventoryProducts — Hook para listado de productos
// ──────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback } from "react";
import type { LoadingState } from "@/lib/types";
import type { InventoryProduct } from "@/types/inventory";
import { inventoryApi } from "@/lib/inventory";

interface UseInventoryProductsReturn {
  products: InventoryProduct[];
  state: LoadingState;
  error: string | null;
  refetch: () => void;
}

export function useInventoryProducts(): UseInventoryProductsReturn {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [state, setState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const data = await inventoryApi.getProducts();
      setProducts(data);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar productos");
      setState("error");
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { products, state, error, refetch: fetch };
}