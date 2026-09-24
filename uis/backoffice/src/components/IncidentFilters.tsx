// ──────────────────────────────────────────────
// IncidentFilters — Panel de filtros para listado
// Gestor de Incidencias Centralizado — TrackFlow
// ──────────────────────────────────────────────

"use client";

import {
  INCIDENT_STATUS_OPTIONS,
  INCIDENT_ORIGIN_OPTIONS,
  INCIDENT_CATEGORY_OPTIONS,
  BRANCH_OPTIONS,
  humanize,
} from "@/lib/types";

interface IncidentFiltersProps {
  status: string;
  origin: string;
  branch: string;
  category: string;
  onStatusChange: (v: string) => void;
  onOriginChange: (v: string) => void;
  onBranchChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
}

export function IncidentFilters({
  status,
  origin,
  branch,
  category,
  onStatusChange,
  onOriginChange,
  onBranchChange,
  onCategoryChange,
}: IncidentFiltersProps) {
  const hasFilters = status || origin || branch || category;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Estado */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Estado</label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-tf-blue focus:outline-none focus:ring-1 focus:ring-tf-blue"
        >
          <option value="">Todos</option>
          {INCIDENT_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {humanize(s)}
            </option>
          ))}
        </select>
      </div>

      {/* Origen */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Origen</label>
        <select
          value={origin}
          onChange={(e) => onOriginChange(e.target.value)}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-tf-blue focus:outline-none focus:ring-1 focus:ring-tf-blue"
        >
          <option value="">Todos</option>
          {INCIDENT_ORIGIN_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {humanize(o)}
            </option>
          ))}
        </select>
      </div>

      {/* Sede */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Sede</label>
        <select
          value={branch}
          onChange={(e) => onBranchChange(e.target.value)}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-tf-blue focus:outline-none focus:ring-1 focus:ring-tf-blue"
        >
          <option value="">Todas</option>
          {BRANCH_OPTIONS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      {/* Categoría */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Categoría</label>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-tf-blue focus:outline-none focus:ring-1 focus:ring-tf-blue"
        >
          <option value="">Todas</option>
          {INCIDENT_CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Limpiar filtros */}
      {hasFilters && (
        <button
          onClick={() => {
            onStatusChange("");
            onOriginChange("");
            onBranchChange("");
            onCategoryChange("");
          }}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
        >
          ✕ Limpiar filtros
        </button>
      )}
    </div>
  );
}
