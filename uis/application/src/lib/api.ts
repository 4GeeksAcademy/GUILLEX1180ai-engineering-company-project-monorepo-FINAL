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
    // Sanitizar mensaje de error: no exponer detalles técnicos al usuario
    let detail = "";
    try {
      const parsed = JSON.parse(body);
      detail = parsed?.detail ?? "";
    } catch {
      // Si no es JSON, no incluir el body en el mensaje de error
    }
    
    const userMessage = getHumanReadableError(res.status, detail);
    throw new Error(userMessage);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

/**
 * Convierte códigos HTTP en mensajes de error amigables para el usuario.
 * No expone información técnica sensible.
 */
function getHumanReadableError(status: number, detail: string): string {
  const baseMessage = detail || "Ocurrió un error inesperado";
  
  switch (status) {
    case 400:
      return `Solicitud inválida: ${baseMessage}`;
    case 401:
      return "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.";
    case 403:
      return "No tienes permisos para realizar esta acción.";
    case 404:
      return "El recurso solicitado no fue encontrado.";
    case 409:
      return `Conflicto: ${baseMessage}`;
    case 422:
      return `Datos inválidos: ${baseMessage}`;
    case 429:
      return "Demasiadas solicitudes. Por favor, espera un momento e intenta de nuevo.";
    case 500:
      return "Error interno del servidor. Por favor, intenta de nuevo más tarde.";
    case 502:
      return "El servidor no está disponible temporalmente. Por favor, intenta de nuevo más tarde.";
    case 503:
      return "El servicio está temporalmente no disponible. Por favor, intenta de nuevo más tarde.";
    default:
      return `Error (${status}): ${baseMessage}`;
  }
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