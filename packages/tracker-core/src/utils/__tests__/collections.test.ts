// ─────────────────────────────────────────────────────────────────────────────
//  Tests: collections.ts
//  Cubre: matchesCriterion, filterByCriteria, filterByCriteriaOr,
//         filterByStatus, filterByStage, filterByExperienceRange,
//         sortByField, sortByMultipleCriteria, paginate, totalPages
// ─────────────────────────────────────────────────────────────────────────────

import {
  matchesCriterion,
  filterByCriteria,
  filterByCriteriaOr,
  filterByStatus,
  filterByStage,
  filterByExperienceRange,
  sortByField,
  sortByMultipleCriteria,
  paginate,
  totalPages,
} from "../collections";

// ─── helpers ─────────────────────────────────────────────────────────────────
interface TestItem {
  name: string;
  age: number;
  active: boolean;
}

const items: TestItem[] = [
  { name: "Alice", age: 30, active: true },
  { name: "Bob", age: 25, active: false },
  { name: "Charlie", age: 35, active: true },
  { name: "Diana", age: 28, active: false },
];

// ═════════════════════════════════════════════════════════════════════════════
//  matchesCriterion
// ═════════════════════════════════════════════════════════════════════════════

describe("matchesCriterion", () => {
  it("eq — valor igual", () => {
    expect(matchesCriterion(items[0], { field: "name", operator: "eq", value: "Alice" })).toBe(true);
    expect(matchesCriterion(items[0], { field: "name", operator: "eq", value: "Bob" })).toBe(false);
  });

  it("neq — valor distinto", () => {
    expect(matchesCriterion(items[0], { field: "name", operator: "neq", value: "Bob" })).toBe(true);
    expect(matchesCriterion(items[0], { field: "name", operator: "neq", value: "Alice" })).toBe(false);
  });

  it("gt — mayor que (numérico)", () => {
    expect(matchesCriterion(items[2], { field: "age", operator: "gt", value: 30 })).toBe(true);
    expect(matchesCriterion(items[1], { field: "age", operator: "gt", value: 30 })).toBe(false);
  });

  it("gt — false si no es numérico", () => {
    expect(matchesCriterion(items[0], { field: "name", operator: "gt", value: "Alice" })).toBe(false);
  });

  it("gte — mayor o igual", () => {
    expect(matchesCriterion(items[0], { field: "age", operator: "gte", value: 30 })).toBe(true);
    expect(matchesCriterion(items[3], { field: "age", operator: "gte", value: 30 })).toBe(false);
  });

  it("lt — menor que", () => {
    expect(matchesCriterion(items[1], { field: "age", operator: "lt", value: 30 })).toBe(true);
    expect(matchesCriterion(items[0], { field: "age", operator: "lt", value: 30 })).toBe(false);
  });

  it("lte — menor o igual", () => {
    expect(matchesCriterion(items[3], { field: "age", operator: "lte", value: 28 })).toBe(true);
    expect(matchesCriterion(items[2], { field: "age", operator: "lte", value: 30 })).toBe(false);
  });

  it("lte — false si no es numérico", () => {
    expect(matchesCriterion(items[0], { field: "name", operator: "lte", value: "Alice" })).toBe(false);
  });

  it("contains — substring case-insensitive", () => {
    expect(matchesCriterion(items[0], { field: "name", operator: "contains", value: "lic" })).toBe(true);
    expect(matchesCriterion(items[0], { field: "name", operator: "contains", value: "LICE" })).toBe(true);
    expect(matchesCriterion(items[0], { field: "name", operator: "contains", value: "xyz" })).toBe(false);
  });

  it("contains — false si no es string", () => {
    expect(matchesCriterion(items[0], { field: "age", operator: "contains", value: "30" })).toBe(false);
  });

  it("in — valor dentro del array", () => {
    expect(matchesCriterion(items[0], { field: "name", operator: "in", value: ["Alice", "Bob"] })).toBe(true);
    expect(matchesCriterion(items[0], { field: "name", operator: "in", value: ["Charlie"] })).toBe(false);
  });

  it("in — false si value no es array", () => {
    expect(matchesCriterion(items[0], { field: "age", operator: "in", value: 30 })).toBe(false);
  });

  it("between — rango numérico inclusivo", () => {
    const criterion = { field: "age" as keyof TestItem, operator: "between" as const, value: [25, 30] };
    expect(matchesCriterion(items[0], criterion)).toBe(true);
    expect(matchesCriterion(items[1], criterion)).toBe(true);
    expect(matchesCriterion(items[2], criterion)).toBe(false);
  });

  it("between — false si value no es array de 2 elementos", () => {
    expect(matchesCriterion(items[0], { field: "age", operator: "between", value: [25] })).toBe(false);
    expect(matchesCriterion(items[0], { field: "age", operator: "between", value: "abc" })).toBe(false);
  });

  it("default — operador no reconocido retorna false", () => {
    expect(matchesCriterion(items[0], { field: "age", operator: "eq" as any, value: 30 })).toBe(true);
    expect(matchesCriterion(items[0], { field: "age", operator: "invalid" as any, value: 30 })).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  filterByCriteria
// ═════════════════════════════════════════════════════════════════════════════

describe("filterByCriteria", () => {
  it("filtra con un criterio AND", () => {
    const result = filterByCriteria(items, [{ field: "active", operator: "eq", value: true }]);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.name)).toEqual(["Alice", "Charlie"]);
  });

  it("filtra con múltiples criterios AND", () => {
    const result = filterByCriteria(items, [
      { field: "active", operator: "eq", value: true },
      { field: "age", operator: "gt", value: 30 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Charlie");
  });

  it("retorna copia del array si criteria está vacío", () => {
    const result = filterByCriteria(items, []);
    expect(result).toEqual(items);
    expect(result).not.toBe(items);
  });

  it("retorna vacío si ningún item cumple", () => {
    const result = filterByCriteria(items, [{ field: "age", operator: "gt", value: 100 }]);
    expect(result).toHaveLength(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  filterByCriteriaOr
// ═════════════════════════════════════════════════════════════════════════════

describe("filterByCriteriaOr", () => {
  it("filtra con criterios OR", () => {
    const result = filterByCriteriaOr(items, [
      { field: "name", operator: "eq", value: "Alice" },
      { field: "name", operator: "eq", value: "Diana" },
    ]);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.name)).toEqual(["Alice", "Diana"]);
  });

  it("retorna copia si criteria vacío", () => {
    const result = filterByCriteriaOr(items, []);
    expect(result).toEqual(items);
    expect(result).not.toBe(items);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  filterByStatus / filterByStage / filterByExperienceRange
// ═════════════════════════════════════════════════════════════════════════════

interface CandidateLike {
  status: string;
  stage: string;
  years_experience?: number;
}

const candidates: CandidateLike[] = [
  { status: "applied", stage: "new", years_experience: 2 },
  { status: "interview", stage: "technical", years_experience: 5 },
  { status: "hired", stage: "hired", years_experience: 3 },
  { status: "applied", stage: "review", years_experience: undefined },
];

describe("filterByStatus", () => {
  it("filtra por estado exacto", () => {
    expect(filterByStatus(candidates, "applied")).toHaveLength(2);
    expect(filterByStatus(candidates, "hired")).toHaveLength(1);
    expect(filterByStatus(candidates, "nonexistent")).toHaveLength(0);
  });
});

describe("filterByStage", () => {
  it("filtra por etapa exacta", () => {
    expect(filterByStage(candidates, "technical")).toHaveLength(1);
    expect(filterByStage(candidates, "new")).toHaveLength(1);
    expect(filterByStage(candidates, "nonexistent")).toHaveLength(0);
  });
});

describe("filterByExperienceRange", () => {
  it("filtra por rango de experiencia", () => {
    const result = filterByExperienceRange(candidates, 2, 4);
    expect(result).toHaveLength(2); // applied(2) y hired(3)
  });

  it("excluye candidatos sin experiencia definida", () => {
    const result = filterByExperienceRange(candidates, 0, 1);
    expect(result).toHaveLength(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  sortByField
// ═════════════════════════════════════════════════════════════════════════════

describe("sortByField", () => {
  it("ordena asc por string", () => {
    const result = sortByField(items, "name", "asc");
    expect(result.map((r) => r.name)).toEqual(["Alice", "Bob", "Charlie", "Diana"]);
  });

  it("ordena desc por string", () => {
    const result = sortByField(items, "name", "desc");
    expect(result.map((r) => r.name)).toEqual(["Diana", "Charlie", "Bob", "Alice"]);
  });

  it("ordena asc por número", () => {
    const result = sortByField(items, "age", "asc");
    expect(result.map((r) => r.age)).toEqual([25, 28, 30, 35]);
  });

  it("ordena desc por número", () => {
    const result = sortByField(items, "age", "desc");
    expect(result.map((r) => r.age)).toEqual([35, 30, 28, 25]);
  });

  it("por defecto ordena asc", () => {
    const result = sortByField(items, "age");
    expect(result.map((r) => r.age)).toEqual([25, 28, 30, 35]);
  });

  it("no muta el array original", () => {
    const copy = [...items];
    sortByField(items, "age");
    expect(items).toEqual(copy);
  });

  it("valores null/undefined van al final", () => {
    const withNull = [...items, { name: "Eve", age: null as any, active: true }];
    const result = sortByField(withNull, "age");
    expect(result[result.length - 1].name).toBe("Eve");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  sortByMultipleCriteria
// ═════════════════════════════════════════════════════════════════════════════

interface MultiItem {
  group: string;
  name: string;
}

const multiItems: MultiItem[] = [
  { group: "A", name: "Zara" },
  { group: "A", name: "Anna" },
  { group: "B", name: "Bob" },
  { group: "B", name: "Carl" },
];

describe("sortByMultipleCriteria", () => {
  it("ordena por grupo asc, luego nombre asc", () => {
    const result = sortByMultipleCriteria(multiItems, [
      { field: "group", direction: "asc" },
      { field: "name", direction: "asc" },
    ]);
    expect(result.map((r) => `${r.group}-${r.name}`)).toEqual([
      "A-Anna",
      "A-Zara",
      "B-Bob",
      "B-Carl",
    ]);
  });

  it("ordena por grupo asc, luego nombre desc", () => {
    const result = sortByMultipleCriteria(multiItems, [
      { field: "group", direction: "asc" },
      { field: "name", direction: "desc" },
    ]);
    expect(result.map((r) => `${r.group}-${r.name}`)).toEqual([
      "A-Zara",
      "A-Anna",
      "B-Carl",
      "B-Bob",
    ]);
  });

  it("valores null van al final", () => {
    const withNull: MultiItem[] = [
      { group: "A", name: "Anna" },
      { group: null as any, name: "Null" },
      { group: "B", name: "Bob" },
    ];
    const result = sortByMultipleCriteria(withNull, [
      { field: "group", direction: "asc" },
    ]);
    expect(result[result.length - 1].name).toBe("Null");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  paginate / totalPages
// ═════════════════════════════════════════════════════════════════════════════

describe("paginate", () => {
  it("retorna primera página", () => {
    expect(paginate(items, 2, 0)).toHaveLength(2);
  });

  it("retorna segunda página", () => {
    expect(paginate(items, 2, 1)).toHaveLength(2);
  });

  it("retorna página parcial (última)", () => {
    expect(paginate(items, 3, 1)).toHaveLength(1);
  });

  it("retorna vacío si pageIndex fuera de rango", () => {
    expect(paginate(items, 10, 99)).toHaveLength(0);
  });
});

describe("totalPages", () => {
  it("calcula páginas exactas", () => {
    expect(totalPages(10, 5)).toBe(2);
  });

  it("redondea hacia arriba", () => {
    expect(totalPages(11, 5)).toBe(3);
  });

  it("0 items = 0 páginas", () => {
    expect(totalPages(0, 10)).toBe(0);
  });
});