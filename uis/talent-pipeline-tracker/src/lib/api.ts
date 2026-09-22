import type {
  Candidate,
  Note,
  CandidateFormData,
  CandidatePatchPayload,
  CandidatePutPayload,
  NotePostPayload,
  RawCandidate,
  RawNote,
} from "./types";

// ─── URL base ──────────────────────────────────────────────────────────
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://playground.4geeks.com/tracker/api/v1";

// ─── Transformación de raw → Candidate ────────────────────────────────
function toCandidate(raw: RawCandidate): Candidate {
  const names = (raw.full_name ?? "").split(" ");
  const first_name = names[0] ?? raw.full_name;
  const last_name = names.slice(1).join(" ") || "—";

  return {
    id: raw.id,
    first_name,
    last_name,
    email: raw.email ?? "",
    phone: raw.phone ?? "",
    job_title: raw.position ?? "",
    status: normalizeStatus(raw.status),
    stage: normalizeStage(raw.stage),
    linkedin: raw.linkedin_url ?? "",
    cv_link: raw.cv_url ?? "",
    years_experience: raw.experience_years,
    application_date: raw.applied_at,
    updated_at: raw.updated_at,
    notes_count: raw.notes_count ?? 0,
  };
}

function normalizeStatus(s: string): Candidate["status"] {
  const map: Record<string, Candidate["status"]> = {
    received: "applied",
    in_progress: "screening",
    discarded: "rejected",
  };
  return map[s] || "applied";
}

function normalizeStage(s: string): Candidate["stage"] {
  const map: Record<string, Candidate["stage"]> = {
    pending: "new",
    personal_interview: "phone_screen",
    technical_interview: "technical",
    review: "review",
  };
  return map[s] || "new";
}

// ─── Helper genérico ───────────────────────────────────────────────────
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    // Sanitizar mensaje de error: no exponer detalles técnicos al usuario
    let detail = "";
    try {
      const parsed = JSON.parse(body);
      detail = parsed?.detail ?? "";
    } catch {
      // Si no es JSON, no incluir el body en el mensaje de error
    }
    
    const userMessage = getHumanReadableError(response.status, detail);
    throw new Error(userMessage);
  }

  // DELETE puede devolver 204 sin body
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
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

// Normaliza arrays que llegan envueltos en { results }, { data } o { data: [] }
function unwrapArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if ("data" in obj && Array.isArray(obj.data)) return obj.data as T[];
    if ("results" in obj && Array.isArray(obj.results)) return obj.results as T[];
  }
  return [];
}

function unwrapSingle<T>(raw: unknown): T {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    if ("data" in obj && obj.data && typeof obj.data === "object") return obj.data as T;
  }
  return raw as T;
}

// ═══════════════════════════════════════════════════════════════════════
//  CANDIDATOS
// ═══════════════════════════════════════════════════════════════════════

/** GET /records — obtiene todos los candidatos (maneja paginación) */
export async function getAllCandidates(): Promise<Candidate[]> {
  const raw = await fetchAPI<unknown>("/records?limit=500");
  const list = unwrapArray<RawCandidate>(raw);
  return list.map(toCandidate);
}

/** GET /records/:id — obtiene un candidato */
export async function getCandidateById(id: string): Promise<Candidate> {
  const raw = await fetchAPI<unknown>(`/records/${id}`);
  return toCandidate(unwrapSingle<RawCandidate>(raw));
}

/** POST /records — crea un candidato nuevo */
export async function createCandidate(
  data: CandidateFormData
): Promise<Candidate> {
  const body = {
    full_name: `${data.first_name} ${data.last_name}`.trim(),
    email: data.email,
    phone: data.phone,
    position: data.job_title,
    status: denormalizeStatus(data.status),
    stage: denormalizeStage(data.stage),
    linkedin_url: data.linkedin,
    cv_url: data.cv_link,
    experience_years: typeof data.years_experience === "number" ? data.years_experience : 0,
  };
  const raw = await fetchAPI<unknown>("/records", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return toCandidate(unwrapSingle<RawCandidate>(raw));
}

/** PUT /records/:id — actualiza un candidato completo */
export async function updateCandidate(
  id: string,
  data: CandidatePutPayload
): Promise<Candidate> {
  const body = {
    full_name: `${data.first_name} ${data.last_name}`.trim(),
    email: data.email,
    phone: data.phone,
    position: data.job_title,
    status: denormalizeStatus(data.status),
    stage: denormalizeStage(data.stage),
    linkedin_url: data.linkedin,
    cv_url: data.cv_link,
    experience_years: typeof data.years_experience === "number" ? data.years_experience : 0,
  };
  const raw = await fetchAPI<unknown>(`/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return toCandidate(unwrapSingle<RawCandidate>(raw));
}

/** PATCH /records/:id — actualiza campos parciales (status / stage) */
export async function patchCandidate(
  id: string,
  data: CandidatePatchPayload
): Promise<Candidate> {
  const body: Record<string, string> = {};
  if (data.status) body.status = denormalizeStatus(data.status);
  if (data.stage) body.stage = denormalizeStage(data.stage);
  const raw = await fetchAPI<unknown>(`/records/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return toCandidate(unwrapSingle<RawCandidate>(raw));
}

function denormalizeStatus(s: Candidate["status"]): string {
  const map: Record<string, string> = {
    applied: "received",
    screening: "in_progress",
    rejected: "discarded",
  };
  return map[s] || s;
}

function denormalizeStage(s: Candidate["stage"]): string {
  const map: Record<string, string> = {
    new: "pending",
    phone_screen: "personal_interview",
    technical: "technical_interview",
  };
  return map[s] || s;
}

// ─── Transformación de nota raw → Note ────────────────────────────────
function toNote(raw: RawNote): Note {
  return {
    id: raw.id,
    record_id: raw.record_id,
    content: raw.content,
    created_at: raw.created_at,
  };
}

// ═══════════════════════════════════════════════════════════════════════
//  NOTAS
// ═══════════════════════════════════════════════════════════════════════

/** GET /records/:id/notes — obtiene las notas de un candidato */
export async function getNotes(candidateId: string): Promise<Note[]> {
  const raw = await fetchAPI<unknown>(`/records/${candidateId}/notes`);
  return unwrapArray<RawNote>(raw).map(toNote);
}

/** POST /records/:id/notes — añade una nota */
export async function addNote(
  candidateId: string,
  payload: NotePostPayload
): Promise<Note> {
  const raw = await fetchAPI<unknown>(`/records/${candidateId}/notes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return toNote(unwrapSingle<RawNote>(raw));
}

/** DELETE /records/:id/notes/:noteId — elimina una nota */
export async function deleteNote(
  candidateId: string,
  noteId: string
): Promise<void> {
  await fetchAPI<void>(`/records/${candidateId}/notes/${noteId}`, {
    method: "DELETE",
  });
}
