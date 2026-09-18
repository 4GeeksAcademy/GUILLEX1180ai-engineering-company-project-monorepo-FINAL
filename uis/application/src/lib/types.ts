// ──────────────────────────────────────────────
// Tipos compartidos para la aplicación de TrackFlow
// ──────────────────────────────────────────────

export type LoadingState = "idle" | "loading" | "success" | "error";

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

export function supplierStatusColor(status: string): string {
  return status === "activo"
    ? "bg-green-100 text-green-800 border border-green-300"
    : "bg-red-100 text-red-800 border border-red-300";
}