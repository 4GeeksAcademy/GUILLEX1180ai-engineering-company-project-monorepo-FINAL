"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCandidates } from "@/hooks";
import { CandidateCard, CandidateFilters, LoadingSpinner, ErrorMessage } from "@/components";

function CandidateList() {
  const { candidates, state, error, refetch } = useCandidates();
  const searchParams = useSearchParams();

  // Filtros desde query params
  const statusFilter = searchParams.get("status") ?? "";
  const stageFilter  = searchParams.get("stage")  ?? "";
  const query        = searchParams.get("q")      ?? "";

  // Aplicar filtros
  const filtered = candidates.filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (stageFilter && c.stage !== stageFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      const name = `${c.first_name} ${c.last_name}`.toLowerCase();
      const email = (c.email ?? "").toLowerCase();
      if (!name.includes(q) && !email.includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Listado de Candidaturas</h1>
          <p className="text-gray-500 text-sm mt-1">
            {state === "success" && (
              <>
                {filtered.length} de {candidates.length} candidato{candidates.length !== 1 ? "s" : ""}
              </>
            )}
          </p>
        </div>
        <Link
          href="/candidates/new"
          className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium text-sm
                     hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
        >
          <span>＋</span> Nuevo candidato
        </Link>
      </div>

      {/* Filtros (solo se muestran si hay datos) */}
      {state === "success" && candidates.length > 0 && <CandidateFilters />}

      {/* Estado: cargando */}
      {state === "loading" && <LoadingSpinner message="Cargando candidatos…" />}

      {/* Estado: error */}
      {state === "error" && (
        <ErrorMessage
          message={error ?? "Error desconocido"}
        />
      )}

      {/* Estado: sin resultados tras filtros */}
      {state === "success" && filtered.length === 0 && candidates.length > 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500 text-lg mb-2">No se encontraron candidatos con estos filtros.</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Limpiar filtros
          </Link>
        </div>
      )}

      {/* Estado: sin candidatos */}
      {state === "success" && candidates.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500 text-lg mb-4">Aún no hay candidatos registrados.</p>
          <Link
            href="/candidates/new"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-blue-700"
          >
            Crear primer candidato
          </Link>
        </div>
      )}

      {/* Grid de candidatos */}
      {state === "success" && filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Cargando…" />}>
      <CandidateList />
    </Suspense>
  );
}
