// ─────────────────────────────────────────────────────────────────────────────
//  Tests: validations.ts
//  Cubre: validateCandidateForm, validateCandidateComplete, validateNote,
//         canAdvanceToTechnical, canReceiveOffer, validatePipelineFlow,
//         isValidEmail, isValidUrl, isValidPhone, isInRange
// ─────────────────────────────────────────────────────────────────────────────

import {
  validateCandidateForm,
  validateCandidateComplete,
  validateNote,
  canAdvanceToTechnical,
  canReceiveOffer,
  validatePipelineFlow,
  isValidEmail,
  isValidUrl,
  isValidPhone,
  isInRange,
} from "../validations";
import type { Candidate, CandidateFormData, NotePostPayload } from "../../types/models";

// ═════════════════════════════════════════════════════════════════════════════
//  isValidEmail
// ═════════════════════════════════════════════════════════════════════════════

describe("isValidEmail", () => {
  it("acepta emails válidos", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("user.name@domain.co")).toBe(true);
    expect(isValidEmail("user+tag@domain.org")).toBe(true);
  });

  it("rechaza emails inválidos", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("notanemail")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("user@.com")).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  isValidUrl
// ═════════════════════════════════════════════════════════════════════════════

describe("isValidUrl", () => {
  it("acepta URLs http/https", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
    expect(isValidUrl("http://example.com/path?q=1")).toBe(true);
  });

  it("rechaza otros protocolos o strings no-URL", () => {
    expect(isValidUrl("ftp://example.com")).toBe(false);
    expect(isValidUrl("not a url")).toBe(false);
    expect(isValidUrl("")).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  isValidPhone
// ═════════════════════════════════════════════════════════════════════════════

describe("isValidPhone", () => {
  it("acepta números con dígitos, espacios, +, -", () => {
    expect(isValidPhone("+34 612 345 678")).toBe(true);
    expect(isValidPhone("612345678")).toBe(true);
    expect(isValidPhone("+1-555-1234")).toBe(true);
  });

  it("rechaza números demasiado cortos", () => {
    expect(isValidPhone("12")).toBe(false);
    expect(isValidPhone("")).toBe(false);
  });

  it("rechaza con letras", () => {
    expect(isValidPhone("612abc345")).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  isInRange
// ═════════════════════════════════════════════════════════════════════════════

describe("isInRange", () => {
  it("retorna true si está en el rango", () => {
    expect(isInRange(5, 0, 10)).toBe(true);
    expect(isInRange(0, 0, 10)).toBe(true);
    expect(isInRange(10, 0, 10)).toBe(true);
  });

  it("retorna false si está fuera del rango", () => {
    expect(isInRange(-1, 0, 10)).toBe(false);
    expect(isInRange(11, 0, 10)).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  validateCandidateForm
// ═════════════════════════════════════════════════════════════════════════════

describe("validateCandidateForm", () => {
  const validForm: CandidateFormData = {
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
    phone: "+123456789",
    job_title: "Engineer",
    status: "applied",
    stage: "new",
    linkedin: "",
    cv_link: "",
    years_experience: 3,
  };

  it("válido con todos los campos correctos", () => {
    const result = validateCandidateForm(validForm);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("inválido si nombre es muy corto", () => {
    const result = validateCandidateForm({ ...validForm, first_name: "A" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("El nombre debe tener al menos 2 caracteres.");
  });

  it("inválido si apellido es muy corto", () => {
    const result = validateCandidateForm({ ...validForm, last_name: "B" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("El apellido debe tener al menos 2 caracteres.");
  });

  it("inválido si email está vacío", () => {
    const result = validateCandidateForm({ ...validForm, email: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("El email es obligatorio.");
  });

  it("inválido si email tiene formato incorrecto", () => {
    const result = validateCandidateForm({ ...validForm, email: "bad-email" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("El email no tiene un formato válido.");
  });

  it("inválido si teléfono es muy corto", () => {
    const result = validateCandidateForm({ ...validForm, phone: "12" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("El teléfono debe tener al menos 7 caracteres.");
  });

  it("teléfono vacío es válido (opcional)", () => {
    const result = validateCandidateForm({ ...validForm, phone: "" });
    expect(result.valid).toBe(true);
  });

  it("inválido si job_title es muy corto", () => {
    const result = validateCandidateForm({ ...validForm, job_title: "A" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("El puesto debe tener al menos 2 caracteres.");
  });

  it("inválido si years_experience es negativo", () => {
    const result = validateCandidateForm({ ...validForm, years_experience: -1 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Los años de experiencia no pueden ser negativos.");
  });

  it("years_experience string vacío es válido", () => {
    const result = validateCandidateForm({ ...validForm, years_experience: "" as any });
    expect(result.valid).toBe(true);
  });

  it("acumula múltiples errores", () => {
    const result = validateCandidateForm({ ...validForm, first_name: "A", last_name: "B", email: "" });
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  validateCandidateComplete
// ═════════════════════════════════════════════════════════════════════════════

describe("validateCandidateComplete", () => {
  const complete: Candidate = {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "john@doe.com",
    phone: "123456789",
    job_title: "Engineer",
    status: "applied",
    stage: "new",
  };

  it("válido si completo", () => {
    expect(validateCandidateComplete(complete).valid).toBe(true);
  });

  it("inválido si falta nombre", () => {
    expect(validateCandidateComplete({ ...complete, first_name: "" }).valid).toBe(false);
  });

  it("inválido si falta email", () => {
    expect(validateCandidateComplete({ ...complete, email: "" }).valid).toBe(false);
  });

  it("inválido si falta status", () => {
    expect(validateCandidateComplete({ ...complete, status: "" as any }).valid).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  validateNote
// ═════════════════════════════════════════════════════════════════════════════

describe("validateNote", () => {
  it("válida si tiene contenido", () => {
    expect(validateNote({ content: "Una nota válida" }).valid).toBe(true);
  });

  it("inválida si está vacía", () => {
    expect(validateNote({ content: "" }).valid).toBe(false);
    expect(validateNote({ content: "   " }).valid).toBe(false);
  });

  it("inválida si excede 500 caracteres", () => {
    expect(validateNote({ content: "x".repeat(501) }).valid).toBe(false);
  });

  it("válida con exactamente 500 caracteres", () => {
    expect(validateNote({ content: "x".repeat(500) }).valid).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  canAdvanceToTechnical
// ═════════════════════════════════════════════════════════════════════════════

describe("canAdvanceToTechnical", () => {
  const candidate: Candidate = {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "john@doe.com",
    phone: "123456789",
    job_title: "Engineer",
    status: "interview",
    stage: "technical",
    years_experience: 3,
  };

  it("puede avanzar si cumple requisitos", () => {
    expect(canAdvanceToTechnical(candidate).valid).toBe(true);
  });

  it("no puede avanzar sin email", () => {
    expect(canAdvanceToTechnical({ ...candidate, email: "" }).valid).toBe(false);
  });

  it("no puede avanzar sin teléfono", () => {
    expect(canAdvanceToTechnical({ ...candidate, phone: "" }).valid).toBe(false);
  });

  it("no puede avanzar sin experiencia suficiente", () => {
    expect(canAdvanceToTechnical({ ...candidate, years_experience: 0 }).valid).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  canReceiveOffer
// ═════════════════════════════════════════════════════════════════════════════

describe("canReceiveOffer", () => {
  const candidate: Candidate = {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "j@d.com",
    phone: "123",
    job_title: "Eng",
    status: "interview",
    stage: "final_interview",
  };

  it("puede recibir oferta si está en final_interview y no rejected", () => {
    expect(canReceiveOffer(candidate).valid).toBe(true);
  });

  it("no puede si no está en final_interview", () => {
    expect(canReceiveOffer({ ...candidate, stage: "new" }).valid).toBe(false);
  });

  it("no puede si está rejected", () => {
    expect(canReceiveOffer({ ...candidate, status: "rejected" }).valid).toBe(false);
  });

  it("no puede si ya está hired", () => {
    expect(canReceiveOffer({ ...candidate, status: "hired" }).valid).toBe(false);
  });

  it("no puede si ya está en stage offer", () => {
    expect(canReceiveOffer({ ...candidate, stage: "offer" }).valid).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  validatePipelineFlow
// ═════════════════════════════════════════════════════════════════════════════

describe("validatePipelineFlow", () => {
  const candidate: Candidate = {
    id: 1,
    first_name: "John",
    last_name: "Doe",
    email: "j@d.com",
    phone: "123",
    job_title: "Eng",
    status: "interview",
    stage: "technical",
  };

  it("válido si etapas son consecutivas", () => {
    const result = validatePipelineFlow(candidate, "phone_screen");
    expect(result.valid).toBe(true);
  });

  it("inválido si se salta una etapa", () => {
    const result = validatePipelineFlow(candidate, "new");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejected es un estado terminal válido desde cualquier etapa", () => {
    const result = validatePipelineFlow({ ...candidate, status: "rejected" }, "new");
    expect(result.valid).toBe(true);
  });

  it("inválido si la etapa no es reconocida", () => {
    const result = validatePipelineFlow({ ...candidate, stage: "unknown" as any });
    expect(result.valid).toBe(false);
  });

  it("válido si no hay previousStage", () => {
    const result = validatePipelineFlow(candidate);
    expect(result.valid).toBe(true);
  });

  it("válido si previousStage es el inmediatamente anterior", () => {
    const result = validatePipelineFlow(candidate, "phone_screen");
    expect(result.valid).toBe(true);
  });
});