// ──────────────────────────────────────────────
// Detalle de lead
// Ruta: /candidates/[id]
// ──────────────────────────────────────────────

"use client";

import { use, useCallback, useState } from "react";
import Link from "next/link";
import { useLead } from "@/hooks/useLead";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { StatusBadge } from "@/components/StatusBadge";
import { patchLead } from "@/lib/api";
import { LEAD_STATUS_OPTIONS, LEAD_STAGE_OPTIONS, humanize } from "@/lib/types";
import type { LeadStatus, LeadStage } from "@/lib/types";

function StatusStageControl({
  leadId,
  initialStatus,
  initialStage,
  onUpdate,
}: {
  leadId: number;
  initialStatus: LeadStatus;
  initialStage: LeadStage;
  onUpdate: (status: LeadStatus, stage: LeadStage) => void;
}) {
  const [status, setStatus] = useState<LeadStatus>(initialStatus);
  const [stage, setStage] = useState<LeadStage>(initialStage);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingStage, setSavingStage] = useState(false);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    const prev = status;
    setStatus(newStatus);
    setSavingStatus(true);
    try {
      await patchLead(leadId, { status: newStatus });
      onUpdate(newStatus, stage);
    } catch {
      setStatus(prev);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleStageChange = async (newStage: LeadStage) => {
    const prev = stage;
    setStage(newStage);
    setSavingStage(true);
    try {
      await patchLead(leadId, { stage: newStage });
      onUpdate(status, newStage);
    } catch {
      setStage(prev);
    } finally {
      setSavingStage(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Estado {savingStatus && <span className="text-tf-blue animate-pulse">(guardando…)</span>}
        </label>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
        >
          {LEAD_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{humanize(s)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Etapa {savingStage && <span className="text-tf-blue animate-pulse">(guardando…)</span>}
        </label>
        <select
          value={stage}
          onChange={(e) => handleStageChange(e.target.value as LeadStage)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
        >
          {LEAD_STAGE_OPTIONS.map((s) => (
            <option key={s} value={s}>{humanize(s)}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const leadId = Number(id);
  const { isChecking, isAuthenticated } = useAuthGuard();
  const { lead, state, error, refetch, setLead } = useLead(leadId);

  if (isChecking) return <LoadingSpinner message="Verificando sesión…" />;
  if (!isAuthenticated) return null;

  const handleUpdate = useCallback(
    (newStatus: LeadStatus, newStage: LeadStage) => {
      if (lead) {
        setLead({ ...lead, status: newStatus, stage: newStage });
      }
    },
    [lead, setLead]
  );

  if (state === "loading") {
    return <LoadingSpinner message="Cargando lead…" />;
  }

  if (state === "error") {
    return (
      <ErrorMessage
        title="Error al cargar el lead"
        message={error ?? "No se pudo obtener la información del lead."}
        showBack
      />
    );
  }

  if (!lead) {
    return (
      <ErrorMessage
        title="Lead no encontrado"
        message="El lead solicitado no existe o ha sido eliminado."
        showBack
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabecera */}
      <div className="rounded-xl bg-gradient-to-r from-tf-blue to-tf-blue-dark p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{lead.company_name}</h1>
            <p className="mt-1 text-tf-blue-light">
              {lead.contact_person} · Lead #{lead.id}
            </p>
          </div>
          <div className="flex gap-2">
            <StatusBadge value={lead.status} type="status" />
            <StatusBadge value={lead.stage} type="stage" />
          </div>
        </div>
      </div>

      {/* Controles rápidos */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Controles rápidos
        </h2>
        <StatusStageControl
          leadId={lead.id}
          initialStatus={lead.status}
          initialStage={lead.stage}
          onUpdate={handleUpdate}
        />
      </div>

      {/* Información del lead */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Información de la Empresa
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Empresa</dt>
              <dd className="font-medium text-tf-dark">{lead.company_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Contacto</dt>
              <dd className="font-medium text-tf-dark">{lead.contact_person}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium text-tf-dark">{lead.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Teléfono</dt>
              <dd className="font-medium text-tf-dark">{lead.phone}</dd>
            </div>
            {lead.website && (
              <div className="flex justify-between">
                <dt className="text-gray-500">Web</dt>
                <dd className="font-medium text-tf-dark truncate max-w-[200px]">
                  {lead.website}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Detalles Operativos
          </h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">País</dt>
              <dd className="font-medium text-tf-dark">{lead.country}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Producto</dt>
              <dd className="font-medium text-tf-dark">{lead.product_type}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Volumen mensual</dt>
              <dd className="font-medium text-tf-dark">{lead.monthly_volume}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Servicios</dt>
              <dd className="font-medium text-tf-dark">
                {lead.services.join(", ")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">3PL actual</dt>
              <dd className="font-medium text-tf-dark">{lead.has_3pl}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Comentarios */}
      {lead.comments && (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Comentarios
          </h2>
          <p className="text-sm text-gray-700">{lead.comments}</p>
        </div>
      )}

      {/* Fechas */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <dl className="flex gap-8 text-sm">
          <div>
            <dt className="text-gray-500">Creado</dt>
            <dd className="font-medium text-tf-dark">
              {new Date(lead.created_at).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </dd>
          </div>
          {lead.updated_at && (
            <div>
              <dt className="text-gray-500">Actualizado</dt>
              <dd className="font-medium text-tf-dark">
                {new Date(lead.updated_at).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Acciones */}
      <div className="flex gap-4">
        <Link
          href="/"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          ← Volver al listado
        </Link>
        <Link
          href={`/candidates/${lead.id}/edit`}
          className="rounded-lg bg-tf-blue px-4 py-2 text-sm text-white hover:bg-tf-blue-dark transition-colors"
        >
          Editar lead
        </Link>
      </div>
    </div>
  );
}