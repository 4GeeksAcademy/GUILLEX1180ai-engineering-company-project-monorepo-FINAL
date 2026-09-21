// ──────────────────────────────────────────────
// Página: Análisis de Incidencias Postventa
// Ruta: /incidents (Backoffice TrackFlow)
// ──────────────────────────────────────────────

"use client";

import { useCallback } from "react";
import { useIncidents } from "@/hooks/useIncidents";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { CsvUpload } from "@/components/CsvUpload";
import { IncidentsResults } from "@/components/IncidentsResults";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";

export default function IncidentsPage() {
  const { isChecking, isAuthenticated } = useAuthGuard();
  const { result, state, error, analyze, downloadCsv, reset } =
    useIncidents();

  if (isChecking) return <LoadingSpinner message="Verificando sesión…" />;
  if (!isAuthenticated) return null;

  const handleFileSelected = useCallback(
    (file: File) => {
      analyze(file);
    },
    [analyze]
  );

  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-tf-dark">
          📊 Análisis de Incidencias Postventa
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Carga un archivo CSV con incidencias del departamento de atención
          postventa para obtener métricas detalladas.
        </p>
      </div>

      {/* Carga de archivo */}
      {state !== "success" && (
        <CsvUpload
          onFileSelected={handleFileSelected}
          loading={state === "loading"}
        />
      )}

      {/* Estado de carga */}
      {state === "loading" && (
        <LoadingSpinner message="Analizando incidencias…" />
      )}

      {/* Error */}
      {state === "error" && (
        <div className="space-y-4">
          <ErrorMessage
            title="Error al analizar"
            message={error ?? "Ocurrió un error inesperado durante el análisis."}
          />
          <div className="text-center">
            <button
              onClick={reset}
              className="rounded-lg bg-tf-blue px-4 py-2 text-sm text-white hover:bg-tf-blue-dark transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      )}

      {/* Resultados */}
      {state === "success" && result && (
        <IncidentsResults
          result={result}
          onDownload={downloadCsv}
          onReset={reset}
        />
      )}
    </div>
  );
}