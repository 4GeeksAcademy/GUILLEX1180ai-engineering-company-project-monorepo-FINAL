// ──────────────────────────────────────────────
// Página: Nuevo Proveedor
// Ruta: /suppliers/new (Backoffice TrackFlow)
// ──────────────────────────────────────────────

"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupplier } from "@/lib/api";
import {
  COUNTRY_OPTIONS,
  PRODUCT_CATEGORY_OPTIONS,
  SUPPLIER_STATUS_OPTIONS,
  type Country,
  type ProductCategory,
  type SupplierStatus,
} from "@/lib/types";
import { ErrorMessage } from "@/components/ErrorMessage";

export default function NewSupplierPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [pais, setPais] = useState<Country | "">("");
  const [categorias, setCategorias] = useState<ProductCategory[]>([]);
  const [tarifa, setTarifa] = useState("");
  const [status, setStatus] = useState<SupplierStatus>("activo");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const toggleCategoria = (cat: ProductCategory) => {
    setCategorias((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!nombre || nombre.trim().length < 2) {
      errors.nombre = "El nombre debe tener al menos 2 caracteres";
    }
    if (!pais) {
      errors.pais = "Selecciona un país";
    }
    if (categorias.length === 0) {
      errors.categorias = "Selecciona al menos una categoría";
    }
    const tarifaNum = parseFloat(tarifa);
    if (!tarifa || isNaN(tarifaNum) || tarifaNum <= 0) {
      errors.tarifa = "La tarifa debe ser un número estrictamente positivo";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError(null);

    try {
      await createSupplier({
        nombre: nombre.trim(),
        pais: pais as Country,
        categorias,
        tarifa: parseFloat(tarifa),
        status,
      });
      router.push("/suppliers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear proveedor");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <Link
          href="/suppliers"
          className="text-sm text-tf-blue hover:underline"
        >
          ← Volver a proveedores
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-tf-dark">
          Nuevo Proveedor
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Registra un nuevo proveedor logístico en TrackFlow.
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage
            title="Error al crear proveedor"
            message={error}
          />
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del proveedor *
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none focus:ring-1 focus:ring-tf-blue-light"
            placeholder="Ej: DHL España"
          />
          {fieldErrors.nombre && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.nombre}</p>
          )}
        </div>

        {/* País */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            País *
          </label>
          <select
            value={pais}
            onChange={(e) => setPais(e.target.value as Country)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
          >
            <option value="">Seleccionar país</option>
            {COUNTRY_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {fieldErrors.pais && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.pais}</p>
          )}
        </div>

        {/* Categorías */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categorías de producto *
          </label>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategoria(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  categorias.includes(cat)
                    ? "bg-tf-blue text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          {fieldErrors.categorias && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.categorias}</p>
          )}
        </div>

        {/* Tarifa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tarifa (€) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={tarifa}
            onChange={(e) => setTarifa(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none focus:ring-1 focus:ring-tf-blue-light"
            placeholder="Ej: 12.50"
          />
          {fieldErrors.tarifa && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.tarifa}</p>
          )}
        </div>

        {/* Estado inicial */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado inicial
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as SupplierStatus)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
          >
            {SUPPLIER_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "activo" ? "Activo" : "Suspendido"}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/suppliers"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-tf-blue px-6 py-2 text-sm text-white hover:bg-tf-blue-dark transition-colors disabled:opacity-50"
          >
            {submitting ? "Registrando…" : "Registrar proveedor"}
          </button>
        </div>
      </form>
    </div>
  );
}