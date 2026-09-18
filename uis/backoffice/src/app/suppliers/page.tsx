// ──────────────────────────────────────────────
// Página: Directorio de Proveedores
// Ruta: /suppliers (Backoffice TrackFlow)
// ──────────────────────────────────────────────

"use client";

import { Suspense, useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useSuppliers } from "@/hooks/useSuppliers";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { SupplierBadge } from "@/components/StatusBadge";
import {
  PRODUCT_CATEGORY_OPTIONS,
  COUNTRY_OPTIONS,
} from "@/lib/types";

function SupplierListContent() {
  const { suppliers, state, error, fetchSuppliers } = useSuppliers();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const paisFilter = searchParams.get("pais") ?? "";
  const categoriaFilter = searchParams.get("categoria") ?? "";

  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      if (paisFilter && s.pais !== paisFilter) return false;
      if (categoriaFilter && !s.categorias.includes(categoriaFilter as any)) return false;
      return true;
    });
  }, [suppliers, paisFilter, categoriaFilter]);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const clearFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  // ─── Estados ───

  if (state === "loading") {
    return <LoadingSpinner message="Cargando proveedores…" />;
  }

  if (state === "error") {
    return (
      <div className="space-y-4">
        <ErrorMessage
          title="Error al cargar proveedores"
          message={error ?? "Ocurrió un error inesperado"}
        />
        <div className="text-center">
          <button
            onClick={() => fetchSuppliers()}
            className="rounded-lg bg-tf-blue px-4 py-2 text-sm text-white hover:bg-tf-blue-dark transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (state === "success" && suppliers.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-tf-dark">Aún no hay proveedores</h2>
        <p className="mt-2 text-gray-500">
          Los proveedores aparecerán aquí una vez registrados.
        </p>
        <Link
          href="/suppliers/new"
          className="mt-6 inline-block rounded-lg bg-tf-blue px-6 py-3 text-white hover:bg-tf-blue-dark transition-colors"
        >
          Registrar proveedor
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Cabecera */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tf-dark">Proveedores</h1>
          <p className="mt-1 text-sm text-gray-500">
            {suppliers.length} proveedor{ suppliers.length !== 1 ? "es" : "" } en total
            {filtered.length < suppliers.length && ` · ${filtered.length} filtrados`}
          </p>
        </div>
        <Link
          href="/suppliers/new"
          className="rounded-lg bg-tf-blue px-4 py-2 text-sm text-white hover:bg-tf-blue-dark transition-colors"
        >
          + Nuevo proveedor
        </Link>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-4">
        {/* Filtro País */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            País
          </label>
          <select
            value={paisFilter}
            onChange={(e) => updateFilter("pais", e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
          >
            <option value="">Todos los países</option>
            {COUNTRY_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Filtro Categoría */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Categoría
          </label>
          <select
            value={categoriaFilter}
            onChange={(e) => updateFilter("categoria", e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
          >
            <option value="">Todas las categorías</option>
            {PRODUCT_CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Limpiar */}
        {(paisFilter || categoriaFilter) && (
          <button
            onClick={clearFilters}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla de proveedores */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron proveedores con estos filtros.</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-sm text-tf-blue hover:underline"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Proveedor</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">País</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Categorías</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Tarifa (€)</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-tf-dark">
                    <Link href={`/suppliers/${supplier.id}`} className="hover:text-tf-blue-light">
                      {supplier.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{supplier.pais}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {supplier.categorias.map((cat) => (
                        <span
                          key={cat}
                          className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">
                    {supplier.tarifa.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <SupplierBadge status={supplier.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/suppliers/${supplier.id}`}
                      className="text-sm text-tf-blue hover:underline"
                    >
                      Detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Page wrapper con Suspense por useSearchParams
export default function SuppliersPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Cargando proveedores…" />}>
      <SupplierListContent />
    </Suspense>
  );
}