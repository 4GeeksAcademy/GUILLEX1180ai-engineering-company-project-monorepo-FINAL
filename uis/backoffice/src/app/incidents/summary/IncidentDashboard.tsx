// ──────────────────────────────────────────────
// IncidentDashboard — Panel de métricas de incidencias
// Extraído para lazy loading desde /incidents/summary
// Incluye useMemo para cálculos de categorías ordenadas
// ──────────────────────────────────────────────

"use client";

import { useMemo } from "react";
import { humanize, incidentStatusColor, incidentOriginColor } from "@/lib/types";
import type { IncidentSummary } from "@/lib/types";

/* ─── Props ─── */

interface IncidentDashboardProps {
  summary: IncidentSummary;
}

/* ─── Card de métricas ─── */

function MetricCard({
  label,
  value,
  colorClass,
  icon,
}: {
  label: string;
  value: number;
  colorClass?: string;
  icon?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${colorClass ?? ""}`}
    >
      <div className="flex items-center gap-3">
        {icon && <span className="text-2xl">{icon}</span>}
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-tf-dark">{value}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Barra de progreso ─── */

function ProgressBar({
  items,
  total,
}: {
  items: { key: string; count: number; colorClass: string }[];
  total: number;
}) {
  if (total === 0) return null;
  return (
    <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
      {items.map((item) => {
        const pct = (item.count / total) * 100;
        if (item.count === 0) return null;
        return (
          <div
            key={item.key}
            style={{ width: `${pct}%` }}
            className={`${item.colorClass} transition-all`}
            title={`${humanize(item.key)}: ${item.count} (${pct.toFixed(1)}%)`}
          />
        );
      })}
    </div>
  );
}

/* ─── Mapas de colores para barras ─── */

const STATUS_BAR_COLORS: Record<string, string> = {
  open: "bg-blue-500",
  in_progress: "bg-amber-500",
  resolved: "bg-green-500",
  discarded: "bg-gray-400",
};

const ORIGIN_BAR_COLORS: Record<string, string> = {
  customer: "bg-violet-500",
  branch: "bg-cyan-500",
  internal: "bg-orange-500",
};

/* ─── Componente principal ─── */

export function IncidentDashboard({ summary }: IncidentDashboardProps) {
  // useMemo: ordenamiento + cálculo de porcentajes de categorías
  // Solo se recalcula cuando summary.by_category o summary.total cambian
  const sortedCategories = useMemo(() => {
    return Object.entries(summary.by_category)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        percentage: summary.total > 0 ? (count / summary.total) * 100 : 0,
      }));
  }, [summary.by_category, summary.total]);

  // useMemo: ordenamiento + cálculo de porcentajes de sedes
  const sortedBranches = useMemo(() => {
    const icons: Record<string, string> = {
      "Los Ángeles": "🇺🇸",
      Zaragoza: "🇪🇸",
      central: "🏢",
    };
    return Object.entries(summary.by_branch)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({
        name,
        count,
        percentage: summary.total > 0 ? (count / summary.total) * 100 : 0,
        icon: icons[name] ?? "📍",
      }));
  }, [summary.by_branch, summary.total]);

  return (
    <>
      {/* ── Tarjetas resumen ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          label="Total"
          value={summary.total}
          icon="📋"
          colorClass="border-t-4 border-tf-blue"
        />
        <MetricCard
          label="Abiertas"
          value={summary.by_status["open"] ?? 0}
          icon="🔵"
          colorClass="border-t-4 border-blue-400"
        />
        <MetricCard
          label="En progreso"
          value={summary.by_status["in_progress"] ?? 0}
          icon="🟡"
          colorClass="border-t-4 border-amber-400"
        />
        <MetricCard
          label="Resueltas"
          value={summary.by_status["resolved"] ?? 0}
          icon="🟢"
          colorClass="border-t-4 border-green-400"
        />
      </div>

      {/* ── Secciones de métricas ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ─── Por Estado ─── */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-tf-dark">
            Por estado
          </h2>
          <ProgressBar
            total={summary.total}
            items={Object.entries(summary.by_status).map(([k, v]) => ({
              key: k,
              count: v,
              colorClass: STATUS_BAR_COLORS[k] ?? "bg-gray-400",
            }))}
          />
          <div className="mt-4 grid grid-cols-2 gap-2">
            {Object.entries(summary.by_status).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between rounded bg-gray-50 px-3 py-2"
              >
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${incidentStatusColor(k)}`}
                >
                  {humanize(k)}
                </span>
                <span className="text-sm font-bold text-tf-dark">{v}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Por Origen ─── */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-tf-dark">
            Por origen
          </h2>
          <ProgressBar
            total={summary.total}
            items={Object.entries(summary.by_origin).map(([k, v]) => ({
              key: k,
              count: v,
              colorClass: ORIGIN_BAR_COLORS[k] ?? "bg-gray-400",
            }))}
          />
          <div className="mt-4 grid grid-cols-1 gap-2">
            {Object.entries(summary.by_origin).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between rounded bg-gray-50 px-3 py-2"
              >
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${incidentOriginColor(k)}`}
                >
                  {humanize(k)}
                </span>
                <span className="text-sm font-bold text-tf-dark">{v}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Por Categoría (datos memoizados) ─── */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-tf-dark">
            Por categoría
          </h2>
          <div className="space-y-2">
            {sortedCategories.map(({ name, count, percentage }) => (
              <div key={name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{name}</span>
                  <span className="font-bold text-tf-dark">
                    {count}{" "}
                    <span className="font-normal text-gray-400">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-tf-blue transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Por Sede (datos memoizados) ─── */}
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-tf-dark">
            Por sede
          </h2>
          <div className="space-y-3">
            {sortedBranches.map(({ name, count, percentage, icon }) => (
              <div
                key={name}
                className="flex items-center gap-3 rounded bg-gray-50 px-4 py-3"
              >
                <span className="text-xl">{icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">{name}</span>
                    <span className="font-bold text-tf-dark">{count}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-tf-accent transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
