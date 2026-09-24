// ──────────────────────────────────────────────
// Tipos compartidos para el Backoffice de TrackFlow
// Alineados con CONTEXT.md y packages/tracker-core/
// ──────────────────────────────────────────────

/* ─── Estados ─── */

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "on_hold"
  | "converted"
  | "lost";

export type LeadStage =
  | "inbound"
  | "discovery"
  | "demo"
  | "contract"
  | "onboarding"
  | "active";

export type LoadingState = "idle" | "loading" | "success" | "error";

/* ─── Entidades ─── */

export interface Lead {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  website?: string;
  country: string;
  product_type: string;
  monthly_volume: string;
  services: string[];
  has_3pl: string;
  comments?: string;
  status: LeadStatus;
  stage: LeadStage;
  created_at: string;
  updated_at?: string;
}

export interface Note {
  id: number;
  lead_id: number;
  content: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

/* ─── Payloads ─── */

export interface LeadFormData {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  website?: string;
  country: string;
  product_type: string;
  monthly_volume: string;
  services: string[];
  has_3pl: string;
  comments?: string;
}

export type LeadPatchPayload = Partial<Pick<Lead, "status" | "stage">>;

export type NotePostPayload = { content: string };

/* ─── API Response ─── */

export interface ApiResponse<T> {
  results?: T[];
  data?: T;
}

/* ─── Constantes ─── */

export const LEAD_STATUS_OPTIONS: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "on_hold",
  "converted",
  "lost",
];

export const LEAD_STAGE_OPTIONS: LeadStage[] = [
  "inbound",
  "discovery",
  "demo",
  "contract",
  "onboarding",
  "active",
];

/* ─── Supplier ─── */

export type SupplierStatus = "activo" | "suspendido";

export type ProductCategory =
  | "Moda"
  | "Electrónica"
  | "Cosmética"
  | "Alimentación";

export type Country = "Estados Unidos" | "España";

export interface Supplier {
  id: number;
  nombre: string;
  pais: Country;
  categorias: ProductCategory[];
  tarifa: number;
  status: SupplierStatus;
  updated_at: string;
}

export interface SupplierFormData {
  nombre: string;
  pais: Country;
  categorias: ProductCategory[];
  tarifa: number;
  status: SupplierStatus;
}

export const SUPPLIER_STATUS_OPTIONS: SupplierStatus[] = ["activo", "suspendido"];

export const PRODUCT_CATEGORY_OPTIONS: ProductCategory[] = [
  "Moda",
  "Electrónica",
  "Cosmética",
  "Alimentación",
];

export const COUNTRY_OPTIONS: Country[] = ["Estados Unidos", "España"];

/* ─── Autenticación ─── */

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  address?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  user?: {
    id: number;
    email: string;
    name?: string;
  };
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ValidationErrorResponse {
  detail: string | FieldError[];
}

/* ─── Funciones helper ─── */

/* ─── Perfil de usuario ─── */

export interface UserProfile {
  id: number;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at?: string;
}

export interface ProfileUpdatePayload {
  name?: string;
  phone?: string;
  address?: string;
}

/* ─── Auth — Password Recovery (AUTH-03) ─── */

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  remaining_requests: number;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export function humanize(snake: string): string {
  return snake
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function statusColor(status: LeadStatus): string {
  const map: Record<LeadStatus, string> = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-indigo-100 text-indigo-800",
    qualified: "bg-teal-100 text-teal-800",
    proposal: "bg-amber-100 text-amber-800",
    negotiation: "bg-orange-100 text-orange-800",
    on_hold: "bg-gray-100 text-gray-800",
    converted: "bg-green-100 text-green-800",
    lost: "bg-red-100 text-red-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-800";
}

export function stageColor(stage: LeadStage): string {
  const map: Record<LeadStage, string> = {
    inbound: "bg-gray-100 text-gray-800",
    discovery: "bg-cyan-100 text-cyan-800",
    demo: "bg-violet-100 text-violet-800",
    contract: "bg-purple-100 text-purple-800",
    onboarding: "bg-pink-100 text-pink-800",
    active: "bg-green-100 text-green-800",
  };
  return map[stage] ?? "bg-gray-100 text-gray-800";
}

export function supplierStatusColor(status: string): string {
  return status === "activo"
    ? "bg-green-100 text-green-800 border border-green-300"
    : "bg-red-100 text-red-800 border border-red-300";
}

/* ─── Incidentes ─── */

export type IncidentStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "discarded";

export type IncidentOrigin = "customer" | "branch" | "internal";

export type IncidentCategory =
  | "Retraso en entrega"
  | "Producto dañado"
  | "Devolución incorrecta"
  | "Error de picking"
  | "Problema de inventario";

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  status: IncidentStatus;
  origin: IncidentOrigin;
  branch: string;
  created_at: string;
  updated_at: string;
}

export interface IncidentFormData {
  title: string;
  description: string;
  category: IncidentCategory;
  origin: IncidentOrigin;
  branch: string;
}

export interface IncidentSummary {
  total: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  by_origin: Record<string, number>;
  by_branch: Record<string, number>;
}

export const INCIDENT_STATUS_OPTIONS: IncidentStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "discarded",
];

export const INCIDENT_ORIGIN_OPTIONS: IncidentOrigin[] = [
  "customer",
  "branch",
  "internal",
];

export const INCIDENT_CATEGORY_OPTIONS: IncidentCategory[] = [
  "Retraso en entrega",
  "Producto dañado",
  "Devolución incorrecta",
  "Error de picking",
  "Problema de inventario",
];

/** Sedes de TrackFlow según CONTEXT.md (EE.UU. + España) + central. */
export const BRANCH_OPTIONS: string[] = [
  "Los Ángeles",
  "Zaragoza",
  "central",
];

/** Transiciones válidas del ciclo de vida de una incidencia. */
export const VALID_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  open: ["in_progress", "discarded"],
  in_progress: ["resolved", "discarded"],
  resolved: [],
  discarded: [],
};

export const FINAL_STATUSES: IncidentStatus[] = ["resolved", "discarded"];

export function incidentStatusColor(status: string): string {
  const map: Record<string, string> = {
    open: "bg-blue-100 text-blue-800",
    in_progress: "bg-amber-100 text-amber-800",
    resolved: "bg-green-100 text-green-800",
    discarded: "bg-gray-100 text-gray-500",
  };
  return map[status] ?? "bg-gray-100 text-gray-800";
}

export function incidentOriginColor(origin: string): string {
  const map: Record<string, string> = {
    customer: "bg-violet-100 text-violet-800",
    branch: "bg-cyan-100 text-cyan-800",
    internal: "bg-orange-100 text-orange-800",
  };
  return map[origin] ?? "bg-gray-100 text-gray-800";
}