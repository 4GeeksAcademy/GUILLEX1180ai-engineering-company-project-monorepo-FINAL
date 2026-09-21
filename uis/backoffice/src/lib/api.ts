// ──────────────────────────────────────────────
// API Service — Backoffice TrackFlow
// Fetch nativo centralizado (sin axios)
// ──────────────────────────────────────────────

import type {
  Lead,
  LeadFormData,
  LeadPatchPayload,
  Note,
  NotePostPayload,
  Supplier,
  SupplierFormData,
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  UserProfile,
  ProfileUpdatePayload,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
  ChangePasswordPayload,
  ChangePasswordResponse,
  ApiResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

/* ─── Helper genérico ─── */

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

  if (res.status === 204) return undefined as unknown as T; // DELETE
  return res.json() as Promise<T>;
}

/* ─── Normalizadores de respuesta ─── */

function unwrapArray<T>(raw: T[] | ApiResponse<T>): T[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && "results" in raw && Array.isArray((raw as ApiResponse<T>).results)) return (raw as ApiResponse<T>).results!;
  if (raw && typeof raw === "object" && "data" in raw) {
    const d = (raw as ApiResponse<T>).data;
    return Array.isArray(d) ? d : (d !== undefined ? [d] : []);
  }
  return [];
}

function unwrapSingle<T>(raw: T | ApiResponse<T>): T | null {
  if (raw && typeof raw === "object" && "data" in raw) return (raw as ApiResponse<T>).data as T;
  return raw as T;
}

/* ─── Endpoints ─── */

export async function getAllLeads(): Promise<Lead[]> {
  const raw = await fetchAPI<Lead[] | ApiResponse<Lead>>("/records?limit=500");
  return unwrapArray(raw);
}

export async function getLeadById(id: number): Promise<Lead | null> {
  const raw = await fetchAPI<Lead | ApiResponse<Lead>>(`/records/${id}`);
  return unwrapSingle(raw);
}

export async function createLead(data: LeadFormData): Promise<Lead> {
  return fetchAPI<Lead>("/records", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateLead(id: number, data: LeadFormData): Promise<Lead> {
  return fetchAPI<Lead>(`/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function patchLead(id: number, data: LeadPatchPayload): Promise<Lead> {
  return fetchAPI<Lead>(`/records/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function getNotes(leadId: number): Promise<Note[]> {
  const raw = await fetchAPI<Note[] | ApiResponse<Note>>(`/records/${leadId}/notes`);
  return unwrapArray(raw);
}

export async function addNote(leadId: number, payload: NotePostPayload): Promise<Note> {
  return fetchAPI<Note>(`/records/${leadId}/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteNote(leadId: number, noteId: number): Promise<void> {
  await fetchAPI<void>(`/records/${leadId}/notes/${noteId}`, {
    method: "DELETE",
  });
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
  const raw = await fetchAPI<Supplier[] | ApiResponse<Supplier>>(`/suppliers${qs ? `?${qs}` : ""}`);
  return unwrapArray(raw);
}

export async function getSupplierById(id: number): Promise<Supplier | null> {
  const raw = await fetchAPI<Supplier | ApiResponse<Supplier>>(`/suppliers/${id}`);
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

/* ─── Autenticación ─── */

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return fetchAPI<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function register(payload: RegisterPayload): Promise<{ id: number; email: string }> {
  return fetchAPI<{ id: number; email: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ─── Auth — Password Recovery (AUTH-03) ─── */

export async function forgotPassword(
  payload: ForgotPasswordPayload
): Promise<ForgotPasswordResponse> {
  return fetchAPI<ForgotPasswordResponse>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(
  payload: ResetPasswordPayload
): Promise<ResetPasswordResponse> {
  return fetchAPI<ResetPasswordResponse>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function changePassword(
  payload: ChangePasswordPayload
): Promise<ChangePasswordResponse> {
  return authFetch<ChangePasswordResponse>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


/* ─── Token helpers (solo cliente) ─── */

export function storeToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("tf_access_token", token);
  }
}

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("tf_access_token");
  }
  return null;
}

export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("tf_access_token");
  }
}

/* ─── Cliente fetch protegido (Bearer token automático) ─── */

async function authFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = getToken();

  if (!token) {
    redirectToLogin();
    throw new Error("No autenticado — redirigiendo a login");
  }

  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  // 401 → token inválido/expirado → limpiar y redirigir
  if (res.status === 401) {
    removeToken();
    redirectToLogin();
    throw new Error("HTTP 401 — Token inválido. Sesión cerrada.");
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `HTTP ${res.status} — ${res.statusText}${body ? `: ${body}` : ""}`
    );
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

function redirectToLogin(): void {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

/* ─── Perfil de usuario ─── */

export async function getProfile(): Promise<UserProfile> {
  return authFetch<UserProfile>("/auth/me");
}

export async function updateProfile(
  data: ProfileUpdatePayload
): Promise<UserProfile> {
  return authFetch<UserProfile>("/profiles/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/* ─── Logout ─── */

export function logout(): void {
  removeToken();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}