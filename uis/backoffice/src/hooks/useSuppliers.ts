"use client";

import { useState, useEffect, useCallback } from "react";
import type { Supplier, SupplierFormData, LoadingState } from "@/lib/types";
import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplierRate,
  updateSupplierStatus,
  deleteSupplier,
} from "@/lib/api";

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [state, setState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetchSuppliers = useCallback(
    async (pais?: string, categoria?: string) => {
      setState("loading");
      setError(null);
      try {
        const data = await getAllSuppliers(pais, categoria);
        setSuppliers(data);
        setState("success");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar proveedores");
        setState("error");
      }
    },
    []
  );

  const refetch = useCallback(
    () => fetchSuppliers(),
    [fetchSuppliers]
  );

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  return { suppliers, state, error, refetch, fetchSuppliers };
}

export function useSupplier(id: number) {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [state, setState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetchOne = useCallback(async () => {
    if (!id) return;
    setState("loading");
    setError(null);
    try {
      const data = await getSupplierById(id);
      if (!data) {
        setError("Proveedor no encontrado");
        setState("error");
        return;
      }
      setSupplier(data);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar proveedor");
      setState("error");
    }
  }, [id]);

  useEffect(() => {
    fetchOne();
  }, [fetchOne]);

  const updateRate = useCallback(
    async (tarifa: number) => {
      if (!supplier) return;
      const updated = await updateSupplierRate(supplier.id, tarifa);
      setSupplier(updated);
      return updated;
    },
    [supplier]
  );

  const updateStatus = useCallback(
    async (status: string) => {
      if (!supplier) return;
      const updated = await updateSupplierStatus(supplier.id, status);
      setSupplier(updated);
      return updated;
    },
    [supplier]
  );

  const remove = useCallback(async () => {
    if (!supplier) return;
    await deleteSupplier(supplier.id);
  }, [supplier]);

  return { supplier, state, error, refetch: fetchOne, updateRate, updateStatus, remove };
}