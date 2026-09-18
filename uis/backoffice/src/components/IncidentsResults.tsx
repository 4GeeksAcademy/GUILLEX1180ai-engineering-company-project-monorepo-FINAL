// ──────────────────────────────────────────────
// IncidentsResults — Visualización de métricas
// de análisis de incidencias
// Backoffice TrackFlow
// ──────────────────────────────────────────────

"use client";

import type { AnalisisResponse, ErrorDetail } from "@/hooks/useIncidents";

interface IncidentsResultsProps {
  result: AnalisisResponse;
  onDownload: () => void;
  onReset: () => void;
}

/* ─── KPI Card ─── */

function KpiCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className={`rounded-lg border ${color} bg-white p-4 shadow-sm`}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-tf-dark">{value}</p>
    </div>
  );
}

/* ─── Barra de progreso simple ─── */

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 text-sm text-gray-600">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-tf-blue transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-16 text-right text-sm font-medium text-tf-dark">
        {value}
      </span>
      <span className="w-12 text-right text-xs text-gray-400">
        ({pct.toFixed(1)}%)
      </span>
    </div>
  );
}

/* ─── Componente principal ─── */

export function IncidentsResults({
  result,
  onDownload,
  onReset,
}: IncidentsResultsProps) {
  const validPct =
    result.total_registros > 0
      ? ((result.registros_validos / result.total_registros) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-8">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total registros"
          value={result.total_registros}
          color="border-gray-200"
        />
        <KpiCard
          label="Válidos"
          value={`${result.registros_validos} (${validPct}%)`}
          color="border-green-300"
        />
        <KpiCard
          label="Inválidos"
          value={result.registros_invalidos}
          color="border-red-300"
        />
        <KpiCard
          label="Satisfacción media"
          value={
            result.satisfaccion_media !== null
              ? `${result.satisfaccion_media.toFixed(2)} ⭐`
              : "N/A"
          }
          color="border-yellow-300"
        />
      </div>

      {/* ── Errores por tipo ── */}
      {result.errores_por_tipo.length > 0 && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-red-800">
            ⚠️ Registros inválidos — Desglose
          </h3>
          <div className="space-y-2">
            {result.errores_por_tipo.map((err: ErrorDetail) => (
              <div
                key={err.tipo}
                className="flex items-center justify-between rounded bg-white px-4 py-2 text-sm"
              >
                <span className="text-gray-700">{err.tipo}</span>
                <span className="font-semibold text-red-600">
                  {err.cantidad}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-red-600">
            Se encontraron {result.registros_invalidos} registro
           {result.registros_invalidos !== 1 ? "s" : ""} inválido
           {result.registros_invalidos !== 1 ? "s" : ""} que ha
           {result.registros_invalidos === 1 ? " sido" : "n sido"} excluido
           {result.registros_invalidos !== 1 ? "s" : ""} del análisis.
          </p>
        </section>
      )}

      {/* ── Por categoría ── */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
          📦 Incidencias por categoría
        </h3>
        <div className="space-y-3">
          {Object.entries(result.categorias).map(([cat, count]) => (
            <ProgressBar
              key={cat}
              label={cat}
              value={count}
              max={result.registros_validos}
            />
          ))}
        </div>
      </section>

      {/* ── Por estado ── */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
          🔵 Incidencias por estado
        </h3>
        <div className="space-y-3">
          {Object.entries(result.estados).map(([est, count]) => (
            <ProgressBar
              key={est}
              label={est}
              value={count}
              max={result.registros_validos}
            />
          ))}
        </div>
      </section>

      {/* ── Satisfacción ── */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
          ⭐ Índice de satisfacción
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-tf-dark">
            {result.satisfaccion_media !== null
              ? result.satisfaccion_media.toFixed(2)
              : "—"}
          </span>
          <span className="text-sm text-gray-500">
            / 5 · basado en {result.total_cerrados_con_puntuacion} registro
            {result.total_cerrados_con_puntuacion !== 1 ? "s" : ""} cerrado
            {result.total_cerrados_con_puntuacion !== 1 ? "s" : ""} con
            puntuación
          </span>
        </div>
      </section>

      {/* ── Acciones ── */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onDownload}
          className="rounded-lg bg-tf-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-tf-blue-dark transition-colors"
        >
          ⬇ Descargar resultados (CSV)
        </button>
        <button
          onClick={onReset}
          className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          🔄 Analizar otro archivo
        </button>
      </div>

      <p className="text-xs text-gray-400">
        Analizado el {new Date(result.analizado_en).toLocaleString("es-ES")}
      </p>
    </div>
  );
}