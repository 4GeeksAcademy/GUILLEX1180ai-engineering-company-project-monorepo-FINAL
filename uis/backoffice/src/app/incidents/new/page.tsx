// ──────────────────────────────────────────────
// Página: Formulario de nueva incidencia
// Ruta: /incidents/new — Gestor de Incidencias Centralizado
// ──────────────────────────────────────────────

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { createIncident } from "@/lib/api";
import {
  INCIDENT_CATEGORY_OPTIONS,
  INCIDENT_ORIGIN_OPTIONS,
  BRANCH_OPTIONS,
  humanize,
} from "@/lib/types";
import type { IncidentFormData } from "@/lib/types";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorMessage } from "@/components/ErrorMessage";

interface FieldError {
  field: string;
  message: string;
}

export default function NewIncidentPage() {
  const { isChecking, isAuthenticated } = useAuthGuard();
  const router = useRouter();

  const [form, setForm] = useState<IncidentFormData>({
    title: "",
    description: "",
    category: "Retraso en entrega",
    origin: "customer",
    branch: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const updateField = useCallback(
    <K extends keyof IncidentFormData>(key: K, value: IncidentFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      // Limpiar error del campo al editar
      setErrors((prev) => prev.filter((e) => e.field !== key));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setErrors([]);
      setGlobalError(null);

      // Validación client-side básica
      const newErrors: FieldError[] = [];
      if (!form.title.trim())
        newErrors.push({ field: "title", message: "El título es obligatorio." });
      if (!form.description.trim())
        newErrors.push({
          field: "description",
          message: "La descripción es obligatoria.",
        });
      if (form.origin === "branch" && !form.branch.trim())
        newErrors.push({
          field: "branch",
          message:
            'La sede es obligatoria cuando el origen es "branch" (sucursal).',
        });

      if (newErrors.length > 0) {
        setErrors(newErrors);
        return;
      }

      setLoading(true);
      try {
        const payload: IncidentFormData = {
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          origin: form.origin,
          branch: form.origin === "branch" ? form.branch : "central",
        };
        await createIncident(payload);
        router.push("/incidents");
      } catch (err) {
        // Intentar parsear errores de validación del backend (400)
        if (err instanceof Error && err.message.includes("HTTP 400")) {
          try {
            const bodyStr = err.message.split(": ").slice(1).join(": ");
            const parsed = JSON.parse(bodyStr);
            if (Array.isArray(parsed.detail)) {
              setErrors(parsed.detail as FieldError[]);
              return;
            }
          } catch {
            // No era JSON válido
          }
        }
        setGlobalError(
          err instanceof Error ? err.message : "Error al crear la incidencia"
        );
      } finally {
        setLoading(false);
      }
    },
    [form, router]
  );

  if (isChecking) return <LoadingSpinner message="Verificando sesión…" />;
  if (!isAuthenticated) return null;

  const fieldError = (name: string) =>
    errors.find((e) => e.field === name || e.field?.includes(name));

  const inputClasses =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 transition-colors hover:border-tf-blue focus:border-tf-blue focus:outline-none focus:ring-1 focus:ring-tf-blue";

  const labelClasses = "block text-sm font-medium text-gray-700";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* ─── Encabezado ─── */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/incidents" className="hover:text-tf-blue">
            Incidencias
          </Link>
          <span>/</span>
          <span className="text-gray-800">Nueva incidencia</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-tf-dark">
          ➕ Registrar nueva incidencia
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Completa los campos para registrar una incidencia en el sistema.
        </p>
      </div>

      {/* ─── Errores globales ─── */}
      {globalError && (
        <ErrorMessage title="Error al crear" message={globalError} />
      )}

      {/* ─── Errores de campos (panel superior) ─── */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-800">
            Por favor corrige los siguientes errores:
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-red-700">
            {errors.map((e, i) => (
              <li key={i}>
                <span className="font-medium">{humanize(e.field)}:</span>{" "}
                {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── Formulario ─── */}
      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        {/* Título */}
        <div>
          <label htmlFor="title" className={labelClasses}>
            Título <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
            placeholder="Ej: Paquete arrived damaged in LA warehouse"
            className={`${inputClasses} ${fieldError("title") ? "border-red-400 focus:border-red-500 focus:ring-red-500" : ""}`}
          />
          {fieldError("title") && (
            <p className="mt-1 text-xs text-red-600">
              {fieldError("title")!.message}
            </p>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className={labelClasses}>
            Descripción <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Describe detalladamente la incidencia reportada…"
            rows={4}
            className={`${inputClasses} resize-none ${fieldError("description") ? "border-red-400 focus:border-red-500 focus:ring-red-500" : ""}`}
          />
          {fieldError("description") && (
            <p className="mt-1 text-xs text-red-600">
              {fieldError("description")!.message}
            </p>
          )}
        </div>

        {/* Categoría y Origen en fila */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Categoría */}
          <div>
            <label htmlFor="category" className={labelClasses}>
              Categoría <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value as any)}
              className={inputClasses}
            >
              {INCIDENT_CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Origen */}
          <div>
            <label htmlFor="origin" className={labelClasses}>
              Origen <span className="text-red-500">*</span>
            </label>
            <select
              id="origin"
              value={form.origin}
              onChange={(e) => updateField("origin", e.target.value as any)}
              className={inputClasses}
            >
              {INCIDENT_ORIGIN_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o === "customer" ? "👤 Cliente" : o === "branch" ? "🏢 Sucursal" : "⚙️ Interno"} — {humanize(o)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sede (resaltada cuando origen = branch) */}
        <div
          className={`rounded-lg p-3 transition-colors ${
            form.origin === "branch"
              ? "border-2 border-amber-300 bg-amber-50"
              : "border border-gray-200 bg-gray-50"
          }`}
        >
          <label htmlFor="branch" className={labelClasses}>
            Sede / Warehouse{" "}
            {form.origin === "branch" && (
              <span className="rounded bg-amber-200 px-1.5 py-0.5 text-xs font-semibold text-amber-800">
                Obligatoria cuando origen = branch
              </span>
            )}
          </label>
          <select
            id="branch"
            value={form.branch}
            onChange={(e) => updateField("branch", e.target.value)}
            className={`${inputClasses} ${form.origin === "branch" ? "border-amber-300" : ""}`}
          >
            <option value="">
              Selecciona una sede…
            </option>
            {BRANCH_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          {fieldError("branch") && (
            <p className="mt-1 text-xs text-red-600">
              {fieldError("branch")!.message}
            </p>
          )}
        </div>

        {/* Botones */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/incidents"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-tf-blue px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-50 disabled:cursor-wait"
          >
            {loading ? " Registrando…" : "Registrar incidencia"}
          </button>
        </div>
      </form>
    </div>
  );
}
