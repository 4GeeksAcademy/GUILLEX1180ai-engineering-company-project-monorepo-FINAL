// ──────────────────────────────────────────────
// API Service — Application TrackFlow
// Fetch nativo centralizado
// ──────────────────────────────────────────────

import type {
  Supplier,
  SupplierFormData,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

async function fetchAPI<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} — ${res.statusText}${body ? `: ${body}` : ""}`);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

function unwrapArray<T>(raw: T[] | { results?: T[]; data?: T }): T[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && "results" in raw && Array.isArray(raw.results)) return raw.results!;
  if (raw && typeof raw === "object" && "data" in raw) {
    const d = raw.data;
    return Array.isArray(d) ? d : (d !== undefined ? [d] : []);
  }
  return [];
}

function unwrapSingle<T>(raw: T | { data?: T }): T | null {
  if (raw && typeof raw === "object" && "data" in raw) return raw.data as T;
  return raw as T;
}

/* ─── Suppliers ─── */

export async function getAllSuppliers(
  pais?: string,
  categoria?: string
): Promise<Supplier[]> {
  const params = new URLSearchParams();
  if (pais) params.set("pais", pais);
  if (categoria) params.set("categoria", categoria);
  const qs = params.toString();
  const raw = await fetchAPI<Supplier[] | { results?: Supplier[]; data?: Supplier }>(`/suppliers${qs ? `?${qs}` : ""}`);
  return unwrapArray(raw);
}

export async function getSupplierById(id: number): Promise<Supplier | null> {
  const raw = await fetchAPI<Supplier | { data?: Supplier }>(`/suppliers/${id}`);
  return unwrapSingle(raw);
}

export async function createSupplier(data: SupplierFormData): Promise<Supplier> {
  return fetchAPI<Supplier>("/suppliers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSupplierRate(
  id: number,
  tarifa: number
): Promise<Supplier> {
  return fetchAPI<Supplier>(`/suppliers/${id}/rate`, {
    method: "PATCH",
    body: JSON.stringify({ tarifa }),
  });
}

export async function updateSupplierStatus(
  id: number,
  status: string
): Promise<Supplier> {
  return fetchAPI<Supplier>(`/suppliers/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteSupplier(id: number): Promise<void> {
  await fetchAPI<void>(`/suppliers/${id}`, {
    method: "DELETE",
  });
}