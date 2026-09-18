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

/* ─── Funciones helper ─── */

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