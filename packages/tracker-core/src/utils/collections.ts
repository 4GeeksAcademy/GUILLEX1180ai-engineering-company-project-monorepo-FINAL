// ─────────────────────────────────────────────────────────────────────────────
//  Funciones para manipulación de colecciones (arrays)
//  Incluye: filtrado avanzado, ordenamiento multi-campo, paginación.
//  Principio: funciones puras, tipado genérico, responsabilidad única.
// ─────────────────────────────────────────────────────────────────────────────

import type { FilterCriterion, SortCriterion } from "../types/models";

// ═════════════════════════════════════════════════════════════════════════════
//  FILTRADO
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Aplica un único criterio de filtrado sobre un elemento.
 * Soporta operadores: eq, neq, gt, gte, lt, lte, contains, in, between.
 */
export function matchesCriterion<T extends Record<string, unknown>>(
  item: T,
  criterion: FilterCriterion<T>
): boolean {
  const itemValue = item[criterion.field];

  switch (criterion.operator) {
    case "eq":
      return itemValue === criterion.value;

    case "neq":
      return itemValue !== criterion.value;

    case "gt":
      return typeof itemValue === "number" && typeof criterion.value === "number"
        ? itemValue > criterion.value
        : false;

    case "gte":
      return typeof itemValue === "number" && typeof criterion.value === "number"
        ? itemValue >= criterion.value
        : false;

    case "lt":
      return typeof itemValue === "number" && typeof criterion.value === "number"
        ? itemValue < criterion.value
        : false;

    case "lte":
      return typeof itemValue === "number" && typeof criterion.value === "number"
        ? itemValue <= criterion.value
        : false;

    case "contains":
      return typeof itemValue === "string" && typeof criterion.value === "string"
        ? itemValue.toLowerCase().includes(criterion.value.toLowerCase())
        : false;

    case "in":
      return Array.isArray(criterion.value)
        ? criterion.value.includes(itemValue)
        : false;

    case "between": {
      if (
        Array.isArray(criterion.value) &&
        criterion.value.length === 2 &&
        typeof itemValue === "number"
      ) {
        const [min, max] = criterion.value as [number, number];
        return itemValue >= min && itemValue <= max;
      }
      return false;
    }

    default:
      return false;
  }
}

/**
 * Filtra un array aplicando múltiples criterios (AND).
 * Todos los criterios deben cumplirse para que un elemento sea incluido.
 */
export function filterByCriteria<T extends Record<string, unknown>>(
  items: T[],
  criteria: FilterCriterion<T>[]
): T[] {
  if (criteria.length === 0) return [...items];
  return items.filter((item) => criteria.every((c) => matchesCriterion(item, c)));
}

/**
 * Filtra un array con criterios OR (al menos uno debe cumplirse).
 */
export function filterByCriteriaOr<T extends Record<string, unknown>>(
  items: T[],
  criteria: FilterCriterion<T>[]
): T[] {
  if (criteria.length === 0) return [...items];
  return items.filter((item) => criteria.some((c) => matchesCriterion(item, c)));
}

/**
 * Filtra candidatos por estado.
 */
export function filterByStatus<T extends { status: string }>(
  items: T[],
  status: string
): T[] {
  return items.filter((item) => item.status === status);
}

/**
 * Filtra candidatos por etapa del pipeline.
 */
export function filterByStage<T extends { stage: string }>(
  items: T[],
  stage: string
): T[] {
  return items.filter((item) => item.stage === stage);
}

/**
 * Filtra candidatos por rango de años de experiencia.
 */
export function filterByExperienceRange<T extends { years_experience?: number }>(
  items: T[],
  min: number,
  max: number
): T[] {
  return items.filter((item) => {
    if (item.years_experience == null) return false;
    return item.years_experience >= min && item.years_experience <= max;
  });
}

// ═════════════════════════════════════════════════════════════════════════════
//  ORDENAMIENTO
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Ordena un array por un único campo y dirección.
 * Soporta strings (orden alfabético) y números. Casos vacíos van al final.
 */
export function sortByField<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T,
  direction: "asc" | "desc" = "asc"
): T[] {
  return [...items].sort((a, b) => {
    const valA = a[field];
    const valB = b[field];

    // Valores nulos/undefined van al final
    if (valA == null && valB == null) return 0;
    if (valA == null) return 1;
    if (valB == null) return -1;

    // Comparación mixta: números y strings
    let comparison: number;
    if (typeof valA === "number" && typeof valB === "number") {
      comparison = valA - valB;
    } else {
      comparison = String(valA).localeCompare(String(valB));
    }

    return direction === "asc" ? comparison : -comparison;
  });
}

/**
 * Ordena un array aplicando múltiples criterios en secuencia.
 * Ejemplo: sortByMultipleCriteria(candidates, [
 *   { field: "status", direction: "asc" },
 *   { field: "last_name", direction: "asc" },
 * ]);
 */
export function sortByMultipleCriteria<T extends Record<string, unknown>>(
  items: T[],
  criteria: SortCriterion<T>[]
): T[] {
  return [...items].sort((a, b) => {
    for (const criterion of criteria) {
      const valA = a[criterion.field];
      const valB = b[criterion.field];

      if (valA == null && valB == null) continue;
      if (valA == null) return 1;
      if (valB == null) return -1;

      let comparison: number;
      if (typeof valA === "number" && typeof valB === "number") {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }

      if (comparison !== 0) {
        return criterion.direction === "asc" ? comparison : -comparison;
      }
    }
    return 0;
  });
}

// ═════════════════════════════════════════════════════════════════════════════
//  PAGINACIÓN
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Pagina un array. pageIndex empieza en 0.
 */
export function paginate<T>(items: T[], pageSize: number, pageIndex: number): T[] {
  const start = pageIndex * pageSize;
  return items.slice(start, start + pageSize);
}

/**
 * Obtiene el número total de páginas.
 */
export function totalPages(totalItems: number, pageSize: number): number {
  return Math.ceil(totalItems / pageSize);
}