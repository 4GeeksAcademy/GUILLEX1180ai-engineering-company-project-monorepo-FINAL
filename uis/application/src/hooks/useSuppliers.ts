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
        setError(err instanceof Error ? err.message : "No se pudieron cargar los proveedores. Por favor, intenta de nuevo.");
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
        setError("Proveedor no encontrado. Verifica el ID e intenta de nuevo.");
        setState("error");
        return;
      }
      setSupplier(data);
      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el proveedor. Por favor, intenta de nuevo.");
      setState("error");
    }
  }, [id]);

  useEffect(() => {
    fetchOne();
  }, [fetchOne]);

  const updateRate = useCallback(
    async (tarifa: number): Promise<Supplier | null> => {
      if (!supplier) return null;
      try {
        const updated = await updateSupplierRate(supplier.id, tarifa);
        setSupplier(updated);
        return updated;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al actualizar tarifa";
        throw new Error(msg);
      }
    },
    [supplier]
  );

  const updateStatus = useCallback(
    async (status: string): Promise<Supplier | null> => {
      if (!supplier) return null;
      try {
        const updated = await updateSupplierStatus(supplier.id, status);
        setSupplier(updated);
        return updated;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al cambiar estado";
        throw new Error(msg);
      }
    },
    [supplier]
  );

  const remove = useCallback(async () => {
    if (!supplier) return;
    try {
      await deleteSupplier(supplier.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al eliminar proveedor";
      throw new Error(msg);
    }
  }, [supplier]);

  return { supplier, state, error, refetch: fetchOne, updateRate, updateStatus, remove };
}