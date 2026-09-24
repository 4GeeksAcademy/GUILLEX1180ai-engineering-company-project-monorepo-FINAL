// ─────────────────────────────────────────────────────────────────────────────
//  Tests: shared types (types/index.ts)
//  Verifica que los tipos BaseEntity e Id sean utilizables en runtime.
//  Aunque los tipos se borran en compilación, validamos el barrel export.
// ─────────────────────────────────────────────────────────────────────────────

import type { BaseEntity, Id } from "../index";

// ─── Pruebas de tipo Id ─────────────────────────────────────────────────────

describe("Id (type)", () => {
  it("Id es un string en runtime", () => {
    const example: Id = "abc-123";
    expect(typeof example).toBe("string");
  });
});

// ─── Pruebas de tipo BaseEntity ────────────────────────────────────────────

describe("BaseEntity (interface)", () => {
  it("instancia con solo id requerido", () => {
    const entity: BaseEntity = { id: "ent-1" };
    expect(entity.id).toBe("ent-1");
    expect(entity.createdAt).toBeUndefined();
    expect(entity.updatedAt).toBeUndefined();
  });

  it("instancia con todos los campos", () => {
    const entity: BaseEntity = {
      id: "ent-2",
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-06-15T12:00:00Z",
    };
    expect(entity.id).toBe("ent-2");
    expect(entity.createdAt).toBeDefined();
    expect(entity.updatedAt).toBeDefined();
  });

  it("acepta timestamps opcionales", () => {
    const entity: BaseEntity = { id: "ent-3" };
    // createdAt y updatedAt son opcionales
    expect(entity).toEqual({ id: "ent-3" });
  });
});