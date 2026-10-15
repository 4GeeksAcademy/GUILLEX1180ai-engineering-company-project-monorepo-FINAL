// ──────────────────────────────────────────────
// Página: Orden de Salida (Inventario)
// Ruta: /inventory/orders/outbound (Backoffice TrackFlow)
// POST /inventory/orders/outbound
// Comportamiento reactivo: muestra current_stock al seleccionar producto
// ──────────────────────────────────────────────

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useInventoryProducts } from "@/hooks/useInventoryProducts";
import { useWarehouses } from "@/hooks/useWarehouses";
import { inventoryApi } from "@/lib/inventory";
import type { FormStatus } from "@/types/inventory";
import { STOCK_THRESHOLD_LOW } from "@/types/inventory";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { InlineError } from "@/components/InlineError";
import { SuccessBanner } from "@/components/SuccessBanner";

export default function OutboundOrderPage() {
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
  const [reason, setReason] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [apiError, setApiError] = useState<string | null>(null);
  const [quantityError, setQuantityError] = useState<string | null>(null);

  // Producto seleccionado (para stock reactivo)
  const selectedProduct = useMemo(() => {
    if (selectedProductId === "") return null;
    return products.find((p) => p.id === selectedProductId) ?? null;
  }, [products, selectedProductId]);

  // Si viene de producto precargado
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

  // Validación de cantidad contra stock disponible
  const quantityNum = Number(quantity);
  const exceedsStock = selectedProduct !== null && quantityNum > selectedProduct.current_stock;
  const isStockLow = selectedProduct !== null && selectedProduct.current_stock <= STOCK_THRESHOLD_LOW;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setApiError(null);
      setQuantityError(null);

      if (selectedProductId === "" || selectedWarehouseId === "" || !quantity || exceedsStock) return;

      setFormStatus("submitting");

      try {
        await inventoryApi.createOutboundOrder({
          item_id: Number(selectedProductId),
          warehouse_id: Number(selectedWarehouseId),
          quantity: Number(quantity),
          reason: reason || undefined,
          destination: destination || undefined,
        });

        setFormStatus("success");
        // Limpiar formulario
        setSelectedProductId("");
        setSelectedWarehouseId("");
        setQuantity("");
        setReason("");
        setDestination("");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al registrar salida";
        // Si el error menciona stock insuficiente, mostrarlo inline junto a cantidad
        if (/stock\s*insuficiente|insufficient/i.test(message)) {
          setQuantityError(message);
        }
        setApiError(message);
        setFormStatus("error");
      }
    },
    [selectedProductId, selectedWarehouseId, quantity, reason, destination, exceedsStock]
  );

  const isSubmitting = formStatus === "submitting";
  const isValid =
    selectedProductId !== "" &&
    selectedWarehouseId !== "" &&
    quantity &&
    quantityNum > 0 &&
    !exceedsStock;

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
      <h1 className="text-2xl font-bold text-tf-dark mb-6">Registrar Salida de Stock</h1>

      {/* Banner de éxito */}
      {formStatus === "success" && (
        <div className="mb-6">
          <SuccessBanner
            message="Salida de stock registrada correctamente."
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
            onChange={(e) => {
              setSelectedProductId(e.target.value ? Number(e.target.value) : "");
              setQuantity(""); // Resetear cantidad al cambiar producto
            }}
            disabled={isSubmitting}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-tf-blue-light focus:outline-none disabled:opacity-50"
            required
          >
            <option value="">Seleccionar producto…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </div>

        {/* Indicador reactivo de Stock */}
        {selectedProduct && (
          <div
            className={`rounded-lg border px-4 py-3 ${
              isStockLow
                ? "border-red-200 bg-red-50"
                : "border-blue-200 bg-blue-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Stock disponible de <strong>{selectedProduct.name}</strong>:
              </span>
              <span
                className={`text-lg font-bold ${
                  isStockLow ? "text-red-600" : "text-tf-blue"
                }`}
              >
                {selectedProduct.current_stock}
              </span>
            </div>
            {isStockLow && (
              <p className="mt-1 text-xs text-red-600">
                ⚠️ Stock bajo — considera registrar una entrada antes de realizar esta salida.
              </p>
            )}
          </div>
        )}

        {/* Selector de Almacén */}
        <div>
          <label htmlFor="warehouse" className="block text-sm font-medium text-gray-700 mb-1">
            Almacén de origen *
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
            className={`block w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none disabled:opacity-50 ${
              exceedsStock
                ? "border-red-400 focus:border-red-500 bg-red-50"
                : "border-gray-300 focus:border-tf-blue-light"
            }`}
            required
          />
          {/* Advertencia de stock insuficiente (client-side) */}
          {exceedsStock && (
            <p className="mt-1 text-xs text-red-600">
              ⚠️ La cantidad ingresada ({quantityNum}) supera el stock disponible ({selectedProduct?.current_stock}). No es posible registrar esta salida.
            </p>
          )}
          {/* Error de la API inline (stock insuficiente u otra regla de negocio) */}
          {quantityError && !exceedsStock && (
            <p className="mt-1 text-xs text-red-600">
              ⚠️ {quantityError}
            </p>
          )}
        </div>

        {/* Motivo */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
            Motivo de la salida
          </label>
          <input
            id="reason"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSubmitting}
            placeholder="Ej: Venta, Devolución, Traslado, Merma…"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-tf-blue-light focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Destino */}
        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
            Destino
          </label>
          <input
            id="destination"
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            disabled={isSubmitting}
            placeholder="Ej: Cliente X, Sucursal Y…"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-tf-blue-light focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Botón de envío */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="rounded-lg bg-tf-blue px-6 py-2.5 text-sm font-medium text-white hover:bg-tf-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              exceedsStock
                ? "La cantidad supera el stock disponible"
                : "Registrar salida"
            }
          >
            {isSubmitting ? "Registrando salida…" : "Registrar Salida"}
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