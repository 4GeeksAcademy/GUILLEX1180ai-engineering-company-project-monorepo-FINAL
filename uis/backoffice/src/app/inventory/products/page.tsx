// ──────────────────────────────────────────────
// Página: Listado de Productos (Inventario)
// Ruta: /inventory/products (Backoffice TrackFlow)
// ──────────────────────────────────────────────

"use client";

import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useInventoryProducts } from "@/hooks/useInventoryProducts";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { StockBadge } from "@/components/StockBadge";

export default function InventoryProductsPage() {
  const { isChecking } = useAuthGuard();
  const { products, state, error, refetch } = useInventoryProducts();

  if (isChecking) {
    return <LoadingSpinner message="Verificando autenticación…" fullPage />;
  }

  if (state === "loading") {
    return <LoadingSpinner message="Cargando productos…" fullPage />;
  }

  if (state === "error") {
    return (
      <ErrorMessage
        title="Error al cargar productos"
        message={error ?? "Ocurrió un error inesperado. Verifica que el backend esté funcionando."}
        onRetry={refetch}
        fullPage
      />
    );
  }

  if (state === "success" && products.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-tf-dark">Aún no hay productos</h2>
        <p className="mt-2 text-gray-500">
          Los productos se crean desde la base de datos. Una vez registrados, aparecerán aquí con su stock calculado.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Cabecera */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tf-dark">Productos</h1>
          <p className="mt-1 text-sm text-gray-500">
            {products.length} producto{products.length !== 1 ? "s" : ""} en catálogo
          </p>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                SKU
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Nombre
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Categoría
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Unidad
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Stock Actual
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="whitespace-nowrap px-4 py-4">
                  <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700">
                    {product.sku}
                  </code>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <div className="text-sm font-medium text-tf-dark">
                    {product.name}
                  </div>
                  {product.description && (
                    <div className="mt-0.5 text-xs text-gray-400 line-clamp-1 max-w-xs">
                      {product.description}
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className="text-sm text-gray-600">
                    {product.category ?? "—"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className="text-sm text-gray-600">
                    {product.unit ?? "unidad"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <StockBadge currentStock={product.current_stock} />
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/inventory/orders/inbound?product_id=${product.id}`}
                      className="rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
                    >
                      Registrar Entrada
                    </Link>
                    <Link
                      href={`/inventory/orders/outbound?product_id=${product.id}`}
                      className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                    >
                      Registrar Salida
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}