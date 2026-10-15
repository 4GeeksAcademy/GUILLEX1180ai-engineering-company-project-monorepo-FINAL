// ──────────────────────────────────────────────
// Página: Orden de Entrada (Inventario)
// Ruta: /inventory/orders/inbound (Backoffice TrackFlow)
// POST /inventory/orders/inbound
// ──────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useInventoryProducts } from "@/hooks/useInventoryProducts";
import { useWarehouses } from "@/hooks/useWarehouses";
import { inventoryApi } from "@/lib/inventory";
import type { FormStatus } from "@/types/inventory";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { InlineError } from "@/components/InlineError";
import { SuccessBanner } from "@/components/SuccessBanner";

export default function InboundOrderPage() {
  const { isChecking } = useAuthGuard();
  const searchParams = useSearchParams();
  const router = useRouter();

  const preselectedProductId = searchParams.get("product_id")
    ? Number(searchParams.get("product_id"))
    : undefined;

  const { products, state: productsState, error: productsError, refetch: refetchProducts } = useInventoryProducts();
  const { warehouses, state: warehousesState, error: warehousesError } = useWarehouses();

  const [selectedProductId, setSelectedProductId] = useState<number | "">(preselectedProductId ?? "");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | "">("");
  const [quantity, setQuantity] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [apiError, setApiError] = useState<string | null>(null);

  // Si viene de producto precargado, sincronizar
  useEffect(() => {
    if (preselectedProductId && products.length > 0) {
      const exists = products.some((p) => p.id === preselectedProductId);
      if (exists) {
        setSelectedProductId(preselectedProductId);
      }
    }
  }, [preselectedProductId, products]);

  // Auto-seleccionar primer warehouse si solo hay uno
  useEffect(() => {
    if (warehouses.length === 1 && selectedWarehouseId === "") {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setApiError(null);

      if (selectedProductId === "" || selectedWarehouseId === "" || !quantity) return;

      setFormStatus("submitting");

      try {
        await inventoryApi.createInboundOrder({
          item_id: Number(selectedProductId),
          warehouse_id: Number(selectedWarehouseId),
          quantity: Number(quantity),
          notes: notes || undefined,
        });

        setFormStatus("success");
        // Limpiar formulario
        setSelectedProductId("");
        setSelectedWarehouseId("");
        setQuantity("");
        setNotes("");
      } catch (err) {
        setApiError(err instanceof Error ? err.message : "Error al registrar entrada");
        setFormStatus("error");
      }
    },
    [selectedProductId, selectedWarehouseId, quantity, notes]
  );

  const isSubmitting = formStatus === "submitting";
  const isValid =
    selectedProductId !== "" &&
    selectedWarehouseId !== "" &&
    quantity &&
    Number(quantity) > 0;

  if (isChecking) {
    return <LoadingSpinner message="Verificando autenticación…" fullPage />;
  }

  if (productsState === "loading" || warehousesState === "loading") {
    return <LoadingSpinner message="Cargando datos…" fullPage />;
  }

  if (productsState === "error") {
    return (
      <ErrorMessage
        title="Error al cargar productos"
        message={productsError ?? "Error de conexión"}
        onRetry={refetchProducts}
        fullPage
      />
    );
  }

  if (warehousesState === "error") {
    return (
      <ErrorMessage
        title="Error al cargar almacenes"
        message={warehousesError ?? "Error de conexión"}
        fullPage
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-tf-dark mb-6">Registrar Entrada de Stock</h1>

      {/* Banner de éxito */}
      {formStatus === "success" && (
        <div className="mb-6">
          <SuccessBanner
            message="Entrada de stock registrada correctamente."
            onDismiss={() => setFormStatus("idle")}
          />
        </div>
      )}

      {/* Error de API */}
      {apiError && (
        <div className="mb-6">
          <InlineError message={apiError} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selector de Producto */}
        <div>
          <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">
            Producto *
          </label>
          <select
            id="product"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : "")}
            disabled={isSubmitting}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-tf-blue-light focus:outline-none disabled:opacity-50"
            required
          >
            <option value="">Seleccionar producto…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku}) — Stock: {p.current_stock}
              </option>
            ))}
          </select>
        </div>

        {/* Selector de Almacén */}
        <div>
          <label htmlFor="warehouse" className="block text-sm font-medium text-gray-700 mb-1">
            Almacén de destino *
          </label>
          <select
            id="warehouse"
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value ? Number(e.target.value) : "")}
            disabled={isSubmitting}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-tf-blue-light focus:outline-none disabled:opacity-50"
            required
          >
            <option value="">Seleccionar almacén…</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.city}, {w.country})
              </option>
            ))}
          </select>
        </div>

        {/* Cantidad */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad *
          </label>
          <input
            id="quantity"
            type="number"
            min="0.01"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={isSubmitting}
            placeholder="0"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-tf-blue-light focus:outline-none disabled:opacity-50"
            required
          />
        </div>

        {/* Notas / Proveedor / Nº de lote */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notas
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
            placeholder="Proveedor, Nº de lote, albarán u observaciones…"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-tf-blue-light focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Botón de envío */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="rounded-lg bg-tf-blue px-6 py-2.5 text-sm font-medium text-white hover:bg-tf-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Registrando entrada…" : "Registrar Entrada"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/inventory/products")}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}