import type {
  Candidate,
  Note,
  CandidateFormData,
  CandidatePatchPayload,
  CandidatePutPayload,
  NotePostPayload,
} from "./types";

// ─── URL base ──────────────────────────────────────────────────────────
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://playground.4geeks.com/tracker/api/v1";

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
    throw new Error(
      `API ${response.status} ${response.statusText} — ${url}\n${body}`
    );
  }

  // DELETE puede devolver 204 sin body
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

// Normaliza arrays que llegan envueltos en { results } o { data }
function unwrapArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if ("results" in obj && Array.isArray(obj.results)) return obj.results as T[];
    if ("data" in obj && Array.isArray(obj.data)) return obj.data as T[];
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

/** GET /records — obtiene todos los candidatos */
export async function getAllCandidates(): Promise<Candidate[]> {
  const raw = await fetchAPI<unknown>("/records");
  return unwrapArray<Candidate>(raw);
}

/** GET /records/:id — obtiene un candidato */
export async function getCandidateById(id: string): Promise<Candidate> {
  const raw = await fetchAPI<unknown>(`/records/${id}`);
  return unwrapSingle<Candidate>(raw);
}

/** POST /records — crea un candidato nuevo */
export async function createCandidate(
  data: CandidateFormData
): Promise<Candidate> {
  const raw = await fetchAPI<unknown>("/records", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return unwrapSingle<Candidate>(raw);
}

/** PUT /records/:id — actualiza un candidato completo */
export async function updateCandidate(
  id: string,
  data: CandidatePutPayload
): Promise<Candidate> {
  const raw = await fetchAPI<unknown>(`/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return unwrapSingle<Candidate>(raw);
}

/** PATCH /records/:id — actualiza campos parciales (status / stage) */
export async function patchCandidate(
  id: string,
  data: CandidatePatchPayload
): Promise<Candidate> {
  const raw = await fetchAPI<unknown>(`/records/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  return unwrapSingle<Candidate>(raw);
}

// ═══════════════════════════════════════════════════════════════════════
//  NOTAS
// ═══════════════════════════════════════════════════════════════════════

/** GET /records/:id/notes — obtiene las notas de un candidato */
export async function getNotes(candidateId: string): Promise<Note[]> {
  const raw = await fetchAPI<unknown>(`/records/${candidateId}/notes`);
  return unwrapArray<Note>(raw);
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
  return unwrapSingle<Note>(raw);
}

/** DELETE /records/:id/notes/:noteId — elimina una nota */
export async function deleteNote(
  candidateId: string,
  noteId: number
): Promise<void> {
  await fetchAPI<void>(`/records/${candidateId}/notes/${noteId}`, {
    method: "DELETE",
  });
}
