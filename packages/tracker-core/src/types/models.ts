// ─────────────────────────────────────────────────────────────────────────────
//  Tipos y modelos centralizados para el Talent Pipeline Tracker
//  Principios: tipos explícitos, interfaces extendibles, código puro.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Estados posibles de una candidatura ─────────────────────────────────────
export type CandidateStatus =
  | "applied"
  | "screening"
  | "interview"
  | "hired"
  | "rejected"
  | "on_hold";

// ─── Etapas del pipeline ────────────────────────────────────────────────────
export type CandidateStage =
  | "new"
  | "review"
  | "phone_screen"
  | "technical"
  | "final_interview"
  | "offer"
  | "hired"
  | "rejected";

// ─── Modelo principal de Candidato ───────────────────────────────────────────
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

// ─── Modelo de Nota asociada a un candidato ─────────────────────────────────
export interface Note {
  id: number;
  record_id: number;
  content: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

// ─── Modelo de usuario / reclutador ──────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "recruiter" | "viewer";
}

// ─── Entidad base (para extender en otras entidades genéricas) ──────────────
export interface BaseEntity {
  id: number;
  created_at?: string;
  updated_at?: string;
}

// ─── Tipos de datos para formularios ────────────────────────────────────────
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

// ─── Payloads para operaciones CRUD ─────────────────────────────────────────
export type CandidatePatchPayload = Partial<Pick<Candidate, "status" | "stage">>;

export type CandidatePutPayload = Omit<Candidate, "id" | "created_at" | "updated_at">;

export type CandidatePostPayload = CandidateFormData;

export interface NotePostPayload {
  content: string;
}

// ─── Tipos genéricos de respuesta API ───────────────────────────────────────
export type ApiResponse<T> =
  | T
  | { results: T }
  | { data: T };

// ─── Estados de carga para la UI ────────────────────────────────────────────
export type LoadingState = "idle" | "loading" | "success" | "error";

// ─── Criterios de ordenamiento ──────────────────────────────────────────────
export interface SortCriterion<T = Record<string, unknown>> {
  field: keyof T;
  direction: "asc" | "desc";
}

// ─── Criterios de filtrado ──────────────────────────────────────────────────
export interface FilterCriterion<T = Record<string, unknown>> {
  field: keyof T;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "in" | "between";
  value: unknown;
}

// ─── Opciones para búsqueda binaria ─────────────────────────────────────────
export interface BinarySearchOptions<T> {
  field: keyof T;
  value: unknown;
  order: "asc" | "desc";
}

// ─── Resultado de agregación ────────────────────────────────────────────────
export interface AggregateResult {
  count: number;
  sum: number;
  avg: number;
  min: number | undefined;
  max: number | undefined;
}

// ─── Resultado de una validación ────────────────────────────────────────────
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ─── Constantes para selects y filtros ──────────────────────────────────────
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