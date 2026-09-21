// ──────────────────────────────────────────────
// Editar lead
// Ruta: /candidates/[id]/edit
// ──────────────────────────────────────────────

"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLead } from "@/hooks/useLead";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { updateLead } from "@/lib/api";
import { LEAD_STATUS_OPTIONS, LEAD_STAGE_OPTIONS, humanize } from "@/lib/types";
import type { LeadFormData, LeadStatus, LeadStage } from "@/lib/types";

const SERVICE_OPTIONS = ["Almacenaje", "Última milla", "Logística inversa"];

export default function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const leadId = Number(id);
  const router = useRouter();
  const { isChecking, isAuthenticated } = useAuthGuard();
  const { lead, state, error } = useLead(leadId);

  if (isChecking) return <LoadingSpinner message="Verificando sesión…" />;
  if (!isAuthenticated) return null;

  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState<LeadFormData | null>(null);
  const [status, setStatus] = useState<LeadStatus>("new");
  const [stage, setStage] = useState<LeadStage>("inbound");

  // Inicializar formulario cuando se carga el lead
  if (lead && !form) {
    setForm({
      company_name: lead.company_name,
      contact_person: lead.contact_person,
      email: lead.email,
      phone: lead.phone,
      website: lead.website ?? "",
      country: lead.country,
      product_type: lead.product_type,
      monthly_volume: lead.monthly_volume,
      services: lead.services,
      has_3pl: lead.has_3pl,
      comments: lead.comments ?? "",
    });
    setStatus(lead.status);
    setStage(lead.stage);
  }

  const updateField = (field: keyof LeadFormData, value: string | string[]) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const toggleService = (service: string) => {
    if (!form) return;
    setForm({
      ...form,
      services: form.services.includes(service)
        ? form.services.filter((s) => s !== service)
        : [...form.services, service],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSending(true);
    setFormError(null);
    try {
      await updateLead(leadId, form);
      setSuccess(true);
      setTimeout(() => router.push(`/candidates/${leadId}`), 800);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSending(false);
    }
  };

  if (state === "loading") return <LoadingSpinner message="Cargando lead…" />;
  if (state === "error") return <ErrorMessage title="Error" message={error ?? ""} showBack />;
  if (!lead) return <ErrorMessage title="Lead no encontrado" message="No existe." showBack />;
  if (!form) return <LoadingSpinner message="Preparando formulario…" />;

  if (success) {
    return (
      <div className="text-center py-20">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <span className="text-2xl text-green-600">✓</span>
        </div>
        <h2 className="text-xl font-semibold text-tf-dark">Lead actualizado</h2>
        <p className="mt-2 text-gray-500">Redirigiendo al detalle…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/candidates/${leadId}`}
          className="text-sm text-tf-blue hover:underline"
        >
          ← Volver al detalle
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-tf-dark">Editar Lead</h1>
        <p className="text-sm text-gray-500">{lead.company_name}</p>
      </div>

      {formError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos de la empresa */}
        <fieldset className="rounded-lg border border-gray-200 bg-white p-5">
          <legend className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
            Datos de la Empresa
          </legend>
          <div className="mt-3 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Empresa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => updateField("company_name", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none focus:ring-1 focus:ring-tf-blue-light"
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contacto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.contact_person}
                  onChange={(e) => updateField("contact_person", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Sitio web
                </label>
                <input
                  type="url"
                  value={form.website ?? ""}
                  onChange={(e) => updateField("website", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
                />
              </div>
            </div>
          </div>
        </fieldset>

        {/* Detalles operativos */}
        <fieldset className="rounded-lg border border-gray-200 bg-white p-5">
          <legend className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
            Detalles Operativos
          </legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">País</label>
              <select
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
              >
                <option value="Estados Unidos">Estados Unidos</option>
                <option value="España">España</option>
                <option value="Ambos">Ambos</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Producto</label>
              <select
                value={form.product_type}
                onChange={(e) => updateField("product_type", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
              >
                <option value="Moda">Moda</option>
                <option value="Electrónica">Electrónica</option>
                <option value="Cosmética">Cosmética</option>
                <option value="Alimentación">Alimentación</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Volumen mensual</label>
            <select
              value={form.monthly_volume}
              onChange={(e) => updateField("monthly_volume", e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
            >
              <option value="0-100">0 – 100</option>
              <option value="101-500">101 – 500</option>
              <option value="501-2000">501 – 2000</option>
              <option value="2000+">2000+</option>
              <option value="no-estoy-seguro">No estoy seguro</option>
            </select>
          </div>
        </fieldset>

        {/* Servicios */}
        <fieldset className="rounded-lg border border-gray-200 bg-white p-5">
          <legend className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
            Servicios de Interés
          </legend>
          <div className="mt-3 flex flex-wrap gap-4">
            {SERVICE_OPTIONS.map((service) => (
              <label key={service} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.services.includes(service)}
                  onChange={() => toggleService(service)}
                  className="rounded border-gray-300 text-tf-blue focus:ring-tf-blue-light"
                />
                {service}
              </label>
            ))}
          </div>
        </fieldset>

        {/* 3PL */}
        <fieldset className="rounded-lg border border-gray-200 bg-white p-5">
          <legend className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
            ¿Trabaja con otro 3PL?
          </legend>
          <div className="mt-3 flex flex-wrap gap-6">
            {["Sí", "No", "Estoy evaluando opciones"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="has3pl"
                  value={opt.toLowerCase()}
                  checked={form.has_3pl === opt.toLowerCase()}
                  onChange={(e) => updateField("has_3pl", e.target.value)}
                  className="border-gray-300 text-tf-blue focus:ring-tf-blue-light"
                />
                {opt}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Comentarios */}
        <fieldset className="rounded-lg border border-gray-200 bg-white p-5">
          <legend className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
            Comentarios
          </legend>
          <div>
            <textarea
              value={form.comments ?? ""}
              onChange={(e) => updateField("comments", e.target.value)}
              maxLength={500}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              {form.comments?.length ?? 0}/500
            </p>
          </div>
        </fieldset>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-tf-blue px-6 py-3 text-sm font-medium text-white hover:bg-tf-blue-dark disabled:opacity-50 transition-colors"
          >
            {sending ? "Guardando…" : "Guardar cambios"}
          </button>
          <Link
            href={`/candidates/${leadId}`}
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}