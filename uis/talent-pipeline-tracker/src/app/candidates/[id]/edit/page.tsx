"use client";

import { use } from "react";
import Link from "next/link";
import { useCandidate } from "@/hooks";
import { CandidateForm, LoadingSpinner, ErrorMessage } from "@/components";

export default function EditCandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { candidate, state, error } = useCandidate(id);

  if (state === "loading") return <LoadingSpinner message="Cargando candidato…" />;
  if (state === "error" || !candidate) {
    return <ErrorMessage message={error ?? "Candidato no encontrado"} showBack />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={`/candidates/${candidate.id}`}
        className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors"
      >
        ← Volver al detalle
      </Link>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Editar candidato</h1>
        <p className="text-sm text-gray-500 mb-6">
          Modifica los datos de la candidatura #{candidate.id}.
        </p>

        <CandidateForm
          candidate={candidate}
          redirectTo={`/candidates/${candidate.id}`}
        />
      </div>
    </div>
  );
}
