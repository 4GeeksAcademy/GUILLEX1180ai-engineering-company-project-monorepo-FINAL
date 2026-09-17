// ─── Estados posibles de una candidatura ────────────────────────────────
export type CandidateStatus =
  | "applied"
  | "screening"
  | "interview"
  | "hired"
  | "rejected"
  | "on_hold";

// ─── Etapas del pipeline ───────────────────────────────────────────────
export type CandidateStage =
  | "new"
  | "review"
  | "phone_screen"
  | "technical"
  | "final_interview"
  | "offer"
  | "hired"
  | "rejected";

// ─── Modelo de Candidato ───────────────────────────────────────────────
export interface Candidate {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_title: string;
  status: CandidateStatus;
  stage: CandidateStage;
  linkedin?: string;
  cv_link?: string;
  years_experience?: number;
  application_date?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Modelo de Nota ────────────────────────────────────────────────────
export interface Note {
  id: number;
  record_id: number;
  content: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Formulario de Candidato (Crear / Editar) ──────────────────────────
export interface CandidateFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_title: string;
  status: CandidateStatus;
  stage: CandidateStage;
  linkedin: string;
  cv_link: string;
  years_experience: number | "";
}

// ─── Payload para PATCH (actualización parcial) ────────────────────────
export type CandidatePatchPayload = Partial<
  Pick<Candidate, "status" | "stage">
>;

// ─── Payload para PUT (actualización completa) ──────────────────────────
export type CandidatePutPayload = Omit<Candidate, "id" | "created_at" | "updated_at">;

// ─── Payload para POST (crear candidato) ───────────────────────────────
export type CandidatePostPayload = CandidateFormData;

// ─── Payload para crear nota ───────────────────────────────────────────
export interface NotePostPayload {
  content: string;
}

// ─── Respuesta genérica de la API ──────────────────────────────────────
export type ApiResponse<T> =
  | T
  | { results: T }
  | { data: T };

// ─── Estados de carga de UI ────────────────────────────────────────────
export type LoadingState = "idle" | "loading" | "success" | "error";

// ─── Constantes para filtros ───────────────────────────────────────────
export const STATUS_OPTIONS: { value: CandidateStatus; label: string }[] = [
  { value: "applied",    label: "Aplicado" },
  { value: "screening",  label: "En revisión" },
  { value: "interview",  label: "Entrevista" },
  { value: "on_hold",    label: "En espera" },
  { value: "hired",      label: "Contratado" },
  { value: "rejected",   label: "Rechazado" },
];

export const STAGE_OPTIONS: { value: CandidateStage; label: string }[] = [
  { value: "new",            label: "Nuevo" },
  { value: "review",         label: "Revisión" },
  { value: "phone_screen",   label: "Filtro telefónico" },
  { value: "technical",      label: "Entrevista técnica" },
  { value: "final_interview",label: "Entrevista final" },
  { value: "offer",          label: "Oferta" },
  { value: "hired",          label: "Contratado" },
  { value: "rejected",       label: "Rechazado" },
];
