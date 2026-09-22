// ──────────────────────────────────────────────
// Página: Detalle de Proveedor
// Ruta: /suppliers/[id] (Application TrackFlow)
// ──────────────────────────────────────────────

"use client";

import { useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSupplier } from "@/hooks/useSuppliers";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { SupplierBadge } from "@/components/SupplierBadge";
import { SUPPLIER_STATUS_OPTIONS, type SupplierStatus } from "@/lib/types";

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supplierId = parseInt(id, 10);
  const { supplier, state, error, refetch, updateRate, updateStatus, remove } = useSupplier(supplierId);

  const [editingRate, setEditingRate] = useState(false);
  const [newRate, setNewRate] = useState("");
  const [rateError, setRateError] = useState<string | null>(null);
  const [rateSubmitting, setRateSubmitting] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<SupplierStatus>("activo");
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (state === "loading") return <LoadingSpinner message="Cargando proveedor…" />;

  if (state === "error" || !supplier) {
    return <div className="space-y-4"><ErrorMessage title="Proveedor no encontrado" message={error ?? "El proveedor solicitado no existe."} showBack /></div>;
  }

  const handleRateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const tarifaNum = parseFloat(newRate);
    if (isNaN(tarifaNum) || tarifaNum <= 0) { setRateError("La tarifa debe ser un número estrictamente positivo"); return; }
    setRateError(null);
    setRateSubmitting(true);
    try { await updateRate(tarifaNum); setEditingRate(false); }
    catch (err) { setRateError(err instanceof Error ? err.message : "Error"); }
    finally { setRateSubmitting(false); }
  };

  const handleStatusSubmit = async () => {
    setStatusSubmitting(true);
    setStatusError(null);
    try {
      await updateStatus(newStatus);
      setEditingStatus(false);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Error al cambiar estado");
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar este proveedor?")) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await remove();
      router.push("/suppliers");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Error al eliminar proveedor");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6"><Link href="/suppliers" className="text-sm text-tf-blue hover:underline">← Volver a proveedores</Link></div>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-tf-dark">{supplier.nombre}</h1>
            <SupplierBadge status={supplier.status} />
          </div>
          <p className="mt-1 text-sm text-gray-500">ID: {supplier.id} · Última actualización: {new Date(supplier.updated_at).toLocaleString("es-ES")}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button onClick={handleDelete} disabled={deleting}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
            {deleting ? "Eliminando…" : "Eliminar proveedor"}
          </button>
          {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
        </div>
      </div>

      <div className="mb-8 grid gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-tf-dark">Información general</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">País</p>
            <p className="mt-1 text-sm text-gray-800">{supplier.pais}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Categorías</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {supplier.categorias.map((cat) => (
                <span key={cat} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{cat}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-tf-dark">Tarifa</h2>
            {!editingRate ? (
              <p className="mt-1 text-2xl font-bold text-tf-blue">{supplier.tarifa.toFixed(2)} €</p>
            ) : (
              <form onSubmit={handleRateSubmit} className="mt-2 flex items-center gap-2">
                <div>
                  <input type="number" step="0.01" min="0.01" value={newRate} onChange={(e) => { setNewRate(e.target.value); setRateError(null); }}
                    className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none" autoFocus />
                  {rateError && <p className="mt-1 text-xs text-red-600">{rateError}</p>}
                </div>
                <button type="submit" disabled={rateSubmitting}
                  className="rounded-lg bg-tf-blue px-3 py-2 text-sm text-white hover:bg-tf-blue-dark transition-colors disabled:opacity-50">
                  {rateSubmitting ? "Guardando…" : "Guardar"}
                </button>
                <button type="button" onClick={() => { setEditingRate(false); setRateError(null); }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              </form>
            )}
          </div>
          {!editingRate && (
            <button onClick={() => { setNewRate(supplier.tarifa.toString()); setEditingRate(true); }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Actualizar tarifa</button>
          )}
        </div>
      </div>

      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-tf-dark">Estado</h2>
            {!editingStatus ? (
              <div className="mt-2"><SupplierBadge status={supplier.status} /></div>
            ) : (
              <div className="mt-2 flex items-center gap-2">
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as SupplierStatus)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none">
                  {SUPPLIER_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === "activo" ? "Activo" : "Suspendido"}</option>)}
                </select>
                <button onClick={handleStatusSubmit} disabled={statusSubmitting}
                  className="rounded-lg bg-tf-blue px-3 py-2 text-sm text-white hover:bg-tf-blue-dark transition-colors disabled:opacity-50">
                  {statusSubmitting ? "Guardando…" : "Guardar"}
                </button>
                <button onClick={() => { setEditingStatus(false); setStatusError(null); }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              </div>
              {statusError && <p className="mt-2 text-xs text-red-600">{statusError}</p>}
            )}
          </div>
          {!editingStatus && (
            <button onClick={() => { setNewStatus(supplier.status); setEditingStatus(true); }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cambiar estado</button>
          )}
        </div>
      </div>
    </div>
  );
}