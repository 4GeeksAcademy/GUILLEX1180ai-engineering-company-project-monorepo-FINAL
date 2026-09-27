// ──────────────────────────────────────────────
// Página: Dashboard de métricas de incidencias
// Ruta: /incidents/summary — Gestor de Incidencias Centralizado
// ──────────────────────────────────────────────

"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useIncidentSummary } from "@/hooks/useIncidentsList";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { humanize, incidentStatusColor, incidentOriginColor } from "@/lib/types";

// Lazy loading: el dashboard pesado se carga solo cuando hay datos disponibles
const IncidentDashboard = dynamic(
  () => import("./IncidentDashboard").then((m) => m.IncidentDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-gray-200 bg-gray-50" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg border border-gray-200 bg-gray-50" />
          ))}
        </div>
      </div>
    ),
  }
);

/* ─── Página principal ─── */

export default function IncidentsSummaryPage() {
  const { isChecking, isAuthenticated } = useAuthGuard();
  const { summary, state, error, refetch } = useIncidentSummary();

  if (isChecking) return <LoadingSpinner message="Verificando sesión…" />;
  if (!isAuthenticated) return null;

  return (
    <div className="space-y-8">
      {/* ─── Encabezado ─── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/incidents" className="hover:text-tf-blue">
              Incidencias
            </Link>
            <span>/</span>
            <span className="text-gray-800">Resumen</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-tf-dark">
            📊 Resumen de incidencias
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Métricas agregadas del estado actual de todas las incidencias
            registradas.
          </p>
        </div>
        <Link
          href="/incidents"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          ← Volver al listado
        </Link>
      </div>

      {/* ─── Carga / Error ─── */}
      {state === "loading" && <LoadingSpinner message="Cargando métricas…" fullPage />}
      {state === "error" && (
        <ErrorMessage
          title="Error al cargar resumen"
          message={error ?? "Ocurrió un error inesperado al cargar las métricas."}
          onRetry={refetch}
          fullPage
        />
      )}

      {/* ─── Dashboard (lazy loaded — solo se descarga cuando hay datos) ─── */}
      {state === "success" && summary && (
        <IncidentDashboard summary={summary} />
      )}
    </div>
  );
}
