"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCandidate,
  updateCandidate,
} from "@/lib/api";
import {
  STATUS_OPTIONS,
  STAGE_OPTIONS,
  type CandidateFormData,
  type Candidate,
} from "@/lib/types";

// ─── Valores por defecto del formulario ────────────────────────────────
const EMPTY_FORM: CandidateFormData = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  job_title: "",
  status: "applied",
  stage: "new",
  linkedin: "",
  cv_link: "",
  years_experience: "",
};

// ─── Props ─────────────────────────────────────────────────────────────
interface CandidateFormProps {
  /** Si se pasa un candidate, el formulario es de edición */
  candidate?: Candidate;
  /** Ruta a la que se navega tras éxito (default: "/") */
  redirectTo?: string;
}

// ─── Helper de campo ───────────────────────────────────────────────────
function Field({
  label,
  name,
  type = "text",
  required = false,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  value: string | number;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
  );
}

// ─── Componente principal ──────────────────────────────────────────────
export default function CandidateForm({ candidate, redirectTo = "/" }: CandidateFormProps) {
  const router = useRouter();
  const isEdit = !!candidate;

  const [form, setForm] = useState<CandidateFormData>(() => {
    if (candidate) {
      return {
        first_name: candidate.first_name ?? "",
        last_name: candidate.last_name ?? "",
        email: candidate.email ?? "",
        phone: candidate.phone ?? "",
        job_title: candidate.job_title ?? "",
        status: candidate.status ?? "applied",
        stage: candidate.stage ?? "new",
        linkedin: candidate.linkedin ?? "",
        cv_link: candidate.cv_link ?? "",
        years_experience: candidate.years_experience ?? "",
      };
    }
    return EMPTY_FORM;
  });

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "years_experience" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Validación básica
    if (!form.first_name.trim() || !form.email.trim()) {
      setFeedback({ type: "err", msg: "El nombre y el email son obligatorios." });
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && candidate) {
        await updateCandidate(String(candidate.id), {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone,
          job_title: form.job_title,
          status: form.status,
          stage: form.stage,
          linkedin: form.linkedin,
          cv_link: form.cv_link,
          years_experience: typeof form.years_experience === "number" ? form.years_experience : undefined,
        });
        setFeedback({ type: "ok", msg: "Candidato actualizado correctamente." });
      } else {
        await createCandidate(form);
        setFeedback({ type: "ok", msg: "Candidato creado correctamente." });
        setForm(EMPTY_FORM);
      }
      // Navegar tras breve pausa para que el usuario vea el mensaje
      setTimeout(() => router.push(redirectTo), 800);
    } catch (err) {
      setFeedback({
        type: "err",
        msg: err instanceof Error ? err.message : "Error al guardar.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Feedback */}
      {feedback && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            feedback.type === "ok"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {/* Grid de campos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nombre" name="first_name" required value={form.first_name} onChange={handleChange} placeholder="John" />
        <Field label="Apellido" name="last_name" value={form.last_name} onChange={handleChange} placeholder="Doe" />
        <Field label="Email" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="john@example.com" />
        <Field label="Teléfono" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+1 555 000" />
        <Field label="Puesto" name="job_title" value={form.job_title} onChange={handleChange} placeholder="Frontend Developer" />
        <Field label="Años de experiencia" name="years_experience" type="number" value={form.years_experience} onChange={handleChange} placeholder="3" />
      </div>

      {/* Selects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select name="status" value={form.status} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Etapa</label>
          <select name="stage" value={form.stage} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
            {STAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="LinkedIn" name="linkedin" value={form.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
        <Field label="Enlace CV" name="cv_link" value={form.cv_link} onChange={handleChange} placeholder="https://..." />
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium text-sm
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting
            ? "Guardando…"
            : isEdit
            ? "Actualizar candidato"
            : "Crear candidato"}
        </button>
        <button
          type="button"
          onClick={() => router.push(redirectTo)}
          className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium text-sm
                     hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
