// ──────────────────────────────────────────────
// NewLeadForm — Formulario extraído para lazy loading
// Componente pesado con múltiples fieldsets,
// separado del page.tsx para code-splitting con next/dynamic.
// ──────────────────────────────────────────────

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LEAD_STATUS_OPTIONS, LEAD_STAGE_OPTIONS, humanize } from "@/lib/types";
import type { LeadFormData, LeadStatus, LeadStage } from "@/lib/types";

const INITIAL_FORM: LeadFormData = {
  company_name: "",
  contact_person: "",
  email: "",
  phone: "",
  website: "",
  country: "",
  product_type: "",
  monthly_volume: "",
  services: [],
  has_3pl: "",
  comments: "",
};

const SERVICE_OPTIONS = ["Almacenaje", "Última milla", "Logística inversa"];

export interface NewLeadFormProps {
  onCreated?: () => void;
  onError?: (message: string) => void;
  sending: boolean;
  setSending: (v: boolean) => void;
}

export function NewLeadForm({
  onCreated,
  onError,
  sending,
  setSending,
}: NewLeadFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<LeadFormData>(INITIAL_FORM);
  const [status, setStatus] = useState<LeadStatus>("new");
  const [stage, setStage] = useState<LeadStage>("inbound");

  const updateField = (field: keyof LeadFormData, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleService = (service: string) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name || !form.contact_person || !form.email || !form.phone) {
      onError?.("Completa los campos obligatorios: empresa, contacto, email y teléfono.");
      return;
    }
    setSending(true);
    try {
      // En un entorno real se crearía el lead aquí.
      // Por ahora simulamos éxito y redirigimos.
      onCreated?.();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Error al crear lead");
    } finally {
      setSending(false);
    }
  };

  return (
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
              placeholder="Nombre de la empresa"
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
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none focus:ring-1 focus:ring-tf-blue-light"
                placeholder="Nombre y apellido"
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
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none focus:ring-1 focus:ring-tf-blue-light"
                placeholder="correo@empresa.com"
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
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none focus:ring-1 focus:ring-tf-blue-light"
                placeholder="+1 213 555 0147"
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
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none focus:ring-1 focus:ring-tf-blue-light"
                placeholder="https://"
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
        <div className="mt-3 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                País de operación
              </label>
              <select
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
              >
                <option value="">Seleccionar…</option>
                <option value="Estados Unidos">Estados Unidos</option>
                <option value="España">España</option>
                <option value="Ambos">Ambos</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo de producto
              </label>
              <select
                value={form.product_type}
                onChange={(e) => updateField("product_type", e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
              >
                <option value="">Seleccionar…</option>
                <option value="Moda">Moda</option>
                <option value="Electrónica">Electrónica</option>
                <option value="Cosmética">Cosmética</option>
                <option value="Alimentación">Alimentación</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Volumen mensual estimado
            </label>
            <select
              value={form.monthly_volume}
              onChange={(e) => updateField("monthly_volume", e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
            >
              <option value="">Seleccionar…</option>
              <option value="0-100">0 – 100 envíos/mes</option>
              <option value="101-500">101 – 500 envíos/mes</option>
              <option value="501-2000">501 – 2000 envíos/mes</option>
              <option value="2000+">Más de 2000 envíos/mes</option>
              <option value="no-estoy-seguro">No estoy seguro</option>
            </select>
          </div>
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
        <div className="mt-3">
          <textarea
            value={form.comments ?? ""}
            onChange={(e) => updateField("comments", e.target.value)}
            maxLength={500}
            rows={4}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none focus:ring-1 focus:ring-tf-blue-light"
            placeholder="Necesidades específicas, observaciones…"
          />
          <p className="mt-1 text-xs text-gray-400">
            {form.comments?.length ?? 0}/500 caracteres
          </p>
        </div>
      </fieldset>

      {/* Estado y etapa (asignación interna) */}
      <fieldset className="rounded-lg border border-gray-200 bg-white p-5">
        <legend className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
          Asignación Interna
        </legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Estado inicial</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LeadStatus)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
            >
              {LEAD_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{humanize(s)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Etapa inicial</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as LeadStage)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-tf-blue-light focus:outline-none"
            >
              {LEAD_STAGE_OPTIONS.map((s) => (
                <option key={s} value={s}>{humanize(s)}</option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={sending}
          className="rounded-lg bg-tf-blue px-6 py-3 text-sm font-medium text-white hover:bg-tf-blue-dark disabled:opacity-50 transition-colors"
        >
          {sending ? "Creando…" : "Crear Lead"}
        </button>
        <Link
          href="/"
          className="rounded-lg border border-gray-300 px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
