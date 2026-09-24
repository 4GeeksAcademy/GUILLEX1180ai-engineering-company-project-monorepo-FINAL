// ──────────────────────────────────────────────
// Página: Listado de Incidencias (CRUD)
// Ruta: /incidents — Gestor de Incidencias Centralizado
// ──────────────────────────────────────────────

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useIncidentsList } from "@/hooks/useIncidentsList";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { IncidentFilters } from "@/components/IncidentFilters";
import {
  IncidentStatusBadge,
  IncidentOriginBadge,
  IncidentStatusSelect,
} from "@/components/IncidentBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { humanize } from "@/lib/types";
import type { IncidentStatus } from "@/lib/types";

export default function IncidentsListPage() {
  const { isChecking, isAuthenticated } = useAuthGuard();
  const {
    incidents,
    state,
    error,
    filters,
    setStatus,
    setOrigin,
    setBranch,
    setCategory,
    refetch,
    changeStatus,
    remove,
  } = useIncidentsList();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleStatusChange = useCallback(
    async (id: string, newStatus: IncidentStatus) => {
      setActionLoading(id);
      setSuccessMsg(null);
      const ok = await changeStatus(id, newStatus);
      setActionLoading(null);
      if (ok) {
        setSuccessMsg(`Estado actualizado a "${humanize(newStatus)}" correctamente.`);
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    },
    [changeStatus]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setActionLoading(id);
      setSuccessMsg(null);
      const ok = await remove(id);
      setActionLoading(null);
      setConfirmDelete(null);
      if (ok) {
        setSuccessMsg("Incidencia eliminada correctamente.");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    },
    [remove]
  );

  if (isChecking) return <LoadingSpinner message="Verificando sesión…" />;
  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      {/* ─── Encabezado ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-tf-dark">
            📋 Gestor de Incidencias
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Registro, seguimiento y gestión del ciclo de vida de incidencias de
            TrackFlow.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/incidents/summary"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            📊 Resumen
          </Link>
          <Link
            href="/incidents/new"
            className="rounded-lg bg-tf-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            + Nueva incidencia
          </Link>
        </div>
      </div>

      {/* ─── Mensajes ─── */}
      {successMsg && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          ✅ {successMsg}
        </div>
      )}

      {error && (
        <ErrorMessage
          title="Error al cargar incidencias"
          message={error}
        />
      )}

      {/* ─── Filtros ─── */}
      <IncidentFilters
        status={filters.status}
        origin={filters.origin}
        branch={filters.branch}
        category={filters.category}
        onStatusChange={setStatus}
        onOriginChange={setOrigin}
        onBranchChange={setBranch}
        onCategoryChange={setCategory}
      />

      {/* ─── Tabla de incidencias ─── */}
      {state === "loading" && <LoadingSpinner message="Cargando incidencias…" />}

      {state !== "loading" && incidents.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-lg text-gray-400">No hay incidencias registradas</p>
          <Link
            href="/incidents/new"
            className="mt-4 inline-block rounded-lg bg-tf-blue px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            Crear primera incidencia
          </Link>
        </div>
      )}

      {state !== "loading" && incidents.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Título
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Origen
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Sede
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Creada
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {incidents.map((inc) => (
                  <tr
                    key={inc.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    {/* Título */}
                    <td className="max-w-[250px] px-4 py-3">
                      <Link
                        href={`/incidents/${inc.id}`}
                        className="font-medium text-tf-blue hover:underline"
                      >
                        {inc.title}
                      </Link>
                      <p className="mt-0.5 line-clamp-1 text-xs text-gray-400">
                        {inc.description}
                      </p>
                    </td>

                    {/* Categoría */}
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {inc.category}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3">
                      {actionLoading === inc.id ? (
                        <span className="text-xs text-gray-400">
                          Actualizando…
                        </span>
                      ) : (
                        <IncidentStatusSelect
                          currentStatus={inc.status}
                          onChange={(s) => handleStatusChange(inc.id, s)}
                          disabled={actionLoading !== null}
                        />
                      )}
                    </td>

                    {/* Origen */}
                    <td className="px-4 py-3">
                      <IncidentOriginBadge origin={inc.origin} />
                    </td>

                    {/* Sede */}
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {inc.branch || "central"}
                    </td>

                    {/* Fecha de creación */}
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(inc.created_at).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 text-right">
                      {confirmDelete === inc.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-red-500">¿Eliminar?</span>
                          <button
                            onClick={() => handleDelete(inc.id)}
                            disabled={actionLoading !== null}
                            className="rounded bg-red-600 px-2 py-1 text-xs text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                          >
                            Sí
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-100"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(inc.id)}
                          className="rounded px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50"
                          title="Eliminar incidencia"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pie de tabla */}
          <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
            {incidents.length} incidencia{incidents.length !== 1 ? "s" : ""} encontrada{incidents.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}