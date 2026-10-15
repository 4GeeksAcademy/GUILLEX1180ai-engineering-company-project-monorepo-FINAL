// ──────────────────────────────────────────────
// Página: Historial de Órdenes (Inventario)
// Ruta: /inventory/orders (Backoffice TrackFlow)
// GET /inventory/orders
// Vista de sólo lectura (sin edición ni borrado)
// ──────────────────────────────────────────────

"use client";

import { useMemo, useState } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useInventoryOrders } from "@/hooks/useInventoryOrders";
import { useInventoryProducts } from "@/hooks/useInventoryProducts";
import { useWarehouses } from "@/hooks/useWarehouses";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { OrderTypeBadge } from "@/components/OrderTypeBadge";
import type { OrderType } from "@/types/inventory";

export default function OrdersHistoryPage() {
  const { isChecking } = useAuthGuard();
  const { orders, total, state, error, refetch } = useInventoryOrders();
  const { products } = useInventoryProducts();
  const { warehouses } = useWarehouses();

  // Filtro local por tipo
  const [typeFilter, setTypeFilter] = useState<OrderType | "all">("all");

  // Mapa producto_id → nombre para mostrar
  const productMap = useMemo(() => {
    const map = new Map<number, string>();
    products.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [products]);

  // Mapa warehouse_id → nombre para mostrar
  const warehouseMap = useMemo(() => {
    const map = new Map<number, string>();
    warehouses.forEach((w) => map.set(w.id, w.name));
    return map;
  }, [warehouses]);

  const filtered = useMemo(() => {
    if (typeFilter === "all") return orders;
    return orders.filter((o) => o.type === typeFilter);
  }, [orders, typeFilter]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isChecking) {
    return <LoadingSpinner message="Verificando autenticación…" fullPage />;
  }

  if (state === "loading") {
    return <LoadingSpinner message="Cargando historial de órdenes…" fullPage />;
  }

  if (state === "error") {
    return (
      <ErrorMessage
        title="Error al cargar órdenes"
        message={error ?? "Ocurrió un error inesperado. Verifica que el backend esté funcionando."}
        onRetry={refetch}
        fullPage
      />
    );
  }

  if (state === "success" && orders.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-tf-dark">No hay movimientos de stock</h2>
        <p className="mt-2 text-gray-500">
          Las órdenes de entrada y salida aparecerán aquí una vez registradas.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Cabecera */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tf-dark">Historial de Órdenes</h1>
          <p className="mt-1 text-sm text-gray-500">
            {total} movimiento{total !== 1 ? "s" : ""} de stock
            {filtered.length < orders.length && ` · ${filtered.length} filtrados`}
          </p>
        </div>

        {/* Filtro rápido */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500">Filtrar:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as OrderType | "all")}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-tf-blue-light focus:outline-none"
          >
            <option value="all">Todas</option>
            <option value="inbound">Solo Entradas</option>
            <option value="outbound">Solo Salidas</option>
          </select>
        </div>
      </div>

      {/* Tabla de órdenes (solo lectura) */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Producto
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Cantidad
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Almacén
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Registrado por
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.map((order) => (
              <tr key={`${order.type}-${order.id}`} className="hover:bg-gray-50 transition-colors">
                <td className="whitespace-nowrap px-4 py-4">
                  <OrderTypeBadge type={order.type} />
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className="text-sm font-medium text-tf-dark">
                    {productMap.get(order.item_id) ?? `Producto #${order.item_id}`}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right">
                  <span
                    className={`text-sm font-bold ${
                      order.type === "inbound" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {order.type === "inbound" ? "+" : "-"}
                    {order.quantity}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className="text-sm text-gray-600">
                    {warehouseMap.get(order.warehouse_id) ?? `Almacén #${order.warehouse_id}`}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className="text-sm text-gray-600">
                    {formatDate(order.created_at)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className="text-xs font-mono text-gray-400">
                    {order.user_uuid}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Nota de solo lectura */}
      <p className="mt-4 text-center text-xs text-gray-400">
        Vista de solo lectura — las órdenes no se pueden editar ni eliminar.
      </p>
    </div>
  );
}