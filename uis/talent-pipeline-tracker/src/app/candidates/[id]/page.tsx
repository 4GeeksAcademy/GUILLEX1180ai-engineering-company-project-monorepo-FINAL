"use client";

import { use } from "react";
import Link from "next/link";
import { useCandidate } from "@/hooks";
import {
  LoadingSpinner,
  ErrorMessage,
  StatusBadge,
  StatusStageControl,
  NotesSection,
} from "@/components";

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { candidate, state, error, setCandidate } = useCandidate(id);

  // ─── Loading ─────────────────────────────────────────────────────────
  if (state === "loading") return <LoadingSpinner message="Cargando candidato…" />;

  // ─── Error / no encontrado ──────────────────────────────────────────
  if (state === "error" || !candidate) {
    return (
      <ErrorMessage
        message={error ?? "Candidato no encontrado"}
        showBack
      />
    );
  }

  // ─── Actualización optimista del candidato en memoria ────────────────
  const handleUpdate = (patch: { status?: string; stage?: string }) => {
    setCandidate((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">
      {/* Navegación */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          ← Volver al listado
        </Link>
        <Link
          href={`/candidates/${candidate.id}/edit`}
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium
                     hover:bg-gray-50 transition-colors"
        >
          ✏️ Editar
        </Link>
      </div>

      {/* ─── Cabecera ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-t-xl px-8 py-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {candidate.first_name} {candidate.last_name}
            </h1>
            {candidate.job_title && (
              <p className="text-blue-100 text-lg mt-1">💼 {candidate.job_title}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-blue-200 text-sm">ID</span>
            <p className="text-2xl font-mono font-bold">#{candidate.id}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <StatusBadge value={candidate.status} type="status" />
          <StatusBadge value={candidate.stage} type="stage" />
        </div>
      </div>

      {/* ─── Cuerpo ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl px-8 py-6 space-y-8">

        {/* Controles de estado / etapa */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Controls rápidos
          </h2>
          <StatusStageControl
            candidateId={candidate.id}
            initialStatus={candidate.status}
            initialStage={candidate.stage}
            onUpdate={handleUpdate}
          />
        </section>

        {/* Información personal */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Información del candidato
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <InfoField icon="📧" label="Email" value={candidate.email} />
            <InfoField icon="📱" label="Teléfono" value={candidate.phone} />
            <InfoField icon="💼" label="Puesto" value={candidate.job_title} />
            <InfoField
              icon="⏳"
              label="Experiencia"
              value={
                candidate.years_experience != null
                  ? `${candidate.years_experience} años`
                  : undefined
              }
            />
            <InfoField
              icon="📅"
              label="Fecha de aplicación"
              value={
                candidate.application_date
                  ? new Date(candidate.application_date).toLocaleDateString("es-ES")
                  : undefined
              }
            />
            {candidate.linkedin && (
              <InfoField
                icon="🔗"
                label="LinkedIn"
                value={candidate.linkedin}
                href={candidate.linkedin}
              />
            )}
            {candidate.cv_link && (
              <InfoField
                icon="📄"
                label="CV"
                value="Ver CV"
                href={candidate.cv_link}
              />
            )}
          </div>
        </section>

        {/* Fechas */}
        <section className="border-t pt-4 text-xs text-gray-400 flex gap-6">
          {candidate.created_at && (
            <span>Creado: {new Date(candidate.created_at).toLocaleString("es-ES")}</span>
          )}
          {candidate.updated_at && (
            <span>Actualizado: {new Date(candidate.updated_at).toLocaleString("es-ES")}</span>
          )}
        </section>

        {/* Notas */}
        <NotesSection candidateId={candidate.id} />
      </div>
    </div>
  );
}

// ─── Sub-componente: campo de información ──────────────────────────────
function InfoField({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value?: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium underline break-all"
          >
            {value}
          </a>
        ) : (
          <p className="text-sm text-gray-900 font-medium break-words">
            {value || <span className="text-gray-400 italic">No proporcionado</span>}
          </p>
        )}
      </div>
    </div>
  );
}
