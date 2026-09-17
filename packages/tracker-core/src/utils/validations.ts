// ─────────────────────────────────────────────────────────────────────────────
//  Validaciones de negocio
//  Verifica reglas de negocio antes de procesar objetos del dominio.
//  Principio: funciones puras, mensajes de error descriptivos, tipado estricto.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Candidate,
  CandidateFormData,
  CandidateStage,
  NotePostPayload,
  ValidationResult,
} from "../types/models";

// ═════════════════════════════════════════════════════════════════════════════
//  VALIDACIONES DE CANDIDATO
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Valida los campos obligatorios de un candidato antes de crearlo.
 * Reglas:
 *  - first_name: requerido, mínimo 2 caracteres
 *  - last_name: requerido, mínimo 2 caracteres
 *  - email: requerido, formato válido
 *  - phone: opcional, pero si se provee debe tener al menos 7 caracteres
 *  - job_title: requerido, mínimo 2 caracteres
 */
export function validateCandidateForm(data: CandidateFormData): ValidationResult {
  const errors: string[] = [];

  // Nombre
  if (!data.first_name || data.first_name.trim().length < 2) {
    errors.push("El nombre debe tener al menos 2 caracteres.");
  }

  // Apellido
  if (!data.last_name || data.last_name.trim().length < 2) {
    errors.push("El apellido debe tener al menos 2 caracteres.");
  }

  // Email
  if (!data.email || !data.email.trim()) {
    errors.push("El email es obligatorio.");
  } else if (!isValidEmail(data.email)) {
    errors.push("El email no tiene un formato válido.");
  }

  // Teléfono (opcional)
  if (data.phone && data.phone.trim().length > 0 && data.phone.trim().length < 7) {
    errors.push("El teléfono debe tener al menos 7 caracteres.");
  }

  // Puesto
  if (!data.job_title || data.job_title.trim().length < 2) {
    errors.push("El puesto debe tener al menos 2 caracteres.");
  }

  // Años de experiencia (si es número y no string vacío)
  if (typeof data.years_experience === "number" && data.years_experience < 0) {
    errors.push("Los años de experiencia no pueden ser negativos.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida que un candidato existente tenga datos mínimos para ser considerado
 * "completo". Útil para reportes y exportaciones.
 */
export function validateCandidateComplete(candidate: Candidate): ValidationResult {
  const errors: string[] = [];

  if (!candidate.first_name || !candidate.last_name) {
    errors.push("El candidato debe tener nombre y apellido.");
  }
  if (!candidate.email) {
    errors.push("El candidato debe tener un email registrado.");
  }
  if (!candidate.job_title) {
    errors.push("El candidato debe tener un puesto asignado.");
  }
  if (!candidate.status) {
    errors.push("El candidato debe tener un estado asignado.");
  }
  if (!candidate.stage) {
    errors.push("El candidato debe tener una etapa asignada.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  VALIDACIONES DE NOTAS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Valida el contenido de una nota antes de crearla.
 */
export function validateNote(payload: NotePostPayload): ValidationResult {
  const errors: string[] = [];

  if (!payload.content || payload.content.trim().length === 0) {
    errors.push("La nota no puede estar vacía.");
  } else if (payload.content.trim().length > 500) {
    errors.push("La nota no puede exceder los 500 caracteres.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  VALIDACIONES DE NEGOCIO AVANZADAS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Verifica si un candidato puede avanzar a la etapa de "entrevista técnica".
 * Requisitos: debe tener email, teléfono y al menos 1 año de experiencia.
 */
export function canAdvanceToTechnical(candidate: Candidate): ValidationResult {
  const errors: string[] = [];

  if (!candidate.email) {
    errors.push("El candidato necesita un email registrado.");
  }
  if (!candidate.phone) {
    errors.push("El candidato necesita un teléfono de contacto.");
  }
  if (candidate.years_experience == null || candidate.years_experience < 1) {
    errors.push("El candidato necesita al menos 1 año de experiencia.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Verifica si un candidato está listo para recibir una oferta.
 * Requisitos: etapa "final_interview" completada y estado no "rejected".
 */
export function canReceiveOffer(candidate: Candidate): ValidationResult {
  const errors: string[] = [];

  if (candidate.stage !== "final_interview") {
    errors.push("El candidato debe haber completado la entrevista final.");
  }
  if (candidate.stage === "offer") {
    errors.push("El candidato ya está en etapa de oferta.");
  }
  if (candidate.status === "rejected") {
    errors.push("El candidato ha sido rechazado y no puede recibir una oferta.");
  }
  if (candidate.status === "hired") {
    errors.push("El candidato ya ha sido contratado.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Verifica si el pipeline tiene un flujo correcto de etapas.
 * Un candidato no debería saltarse etapas críticas.
 * Si se proporciona `previousStage`, verifica que no haya saltos.
 */
export function validatePipelineFlow(
  candidate: Candidate,
  previousStage?: CandidateStage
): ValidationResult {
  const errors: string[] = [];
  const orderedStages: readonly CandidateStage[] = [
    "new",
    "review",
    "phone_screen",
    "technical",
    "final_interview",
    "offer",
    "hired",
  ];

  const currentIndex = orderedStages.indexOf(candidate.stage);

  // "rejected" es un estado terminal válido desde cualquier etapa
  if (candidate.status === "rejected") {
    return { valid: true, errors: [] };
  }

  if (currentIndex === -1) {
    errors.push(`La etapa "${candidate.stage}" no es reconocida en el flujo del pipeline.`);
    return { valid: false, errors };
  }

  // Si tenemos etapa anterior, verificar que no haya saltos
  if (previousStage) {
    const prevIndex = orderedStages.indexOf(previousStage);
    if (prevIndex !== -1 && currentIndex > prevIndex + 1) {
      errors.push(
        `No se puede saltar de "${previousStage}" a "${candidate.stage}". ` +
        `La etapa esperada era "${orderedStages[prevIndex + 1]}".`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  HELPERS DE VALIDACIÓN
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Verifica si una cadena tiene formato de email válido.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Verifica si una cadena es una URL válida (http/https).
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Verifica si un valor es un número de teléfono válido (solo dígitos, +, -, espacios).
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-\+\(\)]/g, "");
  return cleaned.length >= 7 && /^\d+$/.test(cleaned);
}

/**
 * Verifica si un valor numérico está dentro de un rango.
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}