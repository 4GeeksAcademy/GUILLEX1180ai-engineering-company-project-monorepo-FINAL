// ─────────────────────────────────────────────────────────────────────────────
//  Tests: transformations.ts
//  Cubre: count, sum, avg, max, min, aggregate, groupBy, countBy, distinct,
//         reportByStatus, reportByStage, reportExperience
// ─────────────────────────────────────────────────────────────────────────────

import {
  count,
  sum,
  avg,
  max,
  min,
  aggregate,
  groupBy,
  countBy,
  distinct,
  reportByStatus,
  reportByStage,
  reportExperience,
} from "../transformations";

// ═════════════════════════════════════════════════════════════════════════════
//  count
// ═════════════════════════════════════════════════════════════════════════════

describe("count", () => {
  it("retorna 0 para array vacío", () => expect(count([])).toBe(0));
  it("retorna length del array", () => expect(count([1, 2, 3])).toBe(3));
});

// ═════════════════════════════════════════════════════════════════════════════
//  sum
// ═════════════════════════════════════════════════════════════════════════════

describe("sum", () => {
  it("suma campo numérico", () => {
    expect(sum([{ v: 1 }, { v: 2 }, { v: 3 }], "v")).toBe(6);
  });

  it("retorna 0 para array vacío", () => {
    expect(sum([], "v" as any)).toBe(0);
  });

  it("ignora valores no numéricos", () => {
    expect(sum([{ v: 1 }, { v: "x" as any }], "v")).toBe(1);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  avg
// ═════════════════════════════════════════════════════════════════════════════

describe("avg", () => {
  it("calcula promedio", () => {
    expect(avg([{ v: 10 }, { v: 20 }, { v: 30 }], "v")).toBe(20);
  });

  it("retorna 0 para array vacío", () => {
    expect(avg([], "v" as any)).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  max
// ═════════════════════════════════════════════════════════════════════════════

describe("max", () => {
  it("encuentra el valor máximo", () => {
    expect(max([{ v: 5 }, { v: 10 }, { v: 3 }], "v")).toBe(10);
  });

  it("retorna undefined si no hay valores numéricos", () => {
    expect(max([{ v: "a" as any }], "v")).toBeUndefined();
  });

  it("retorna undefined para array vacío", () => {
    expect(max([], "v" as any)).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  min
// ═════════════════════════════════════════════════════════════════════════════

describe("min", () => {
  it("encuentra el valor mínimo", () => {
    expect(min([{ v: 5 }, { v: 10 }, { v: 3 }], "v")).toBe(3);
  });

  it("retorna undefined si no hay valores numéricos", () => {
    expect(min([{ v: "a" as any }], "v")).toBeUndefined();
  });

  it("retorna undefined para array vacío", () => {
    expect(min([], "v" as any)).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  aggregate
// ═════════════════════════════════════════════════════════════════════════════

describe("aggregate", () => {
  const data = [{ v: 10 }, { v: 20 }, { v: 30 }];

  it("calcula todas las métricas", () => {
    const result = aggregate(data, "v");
    expect(result).toEqual({
      count: 3,
      sum: 60,
      avg: 20,
      min: 10,
      max: 30,
    });
  });

  it("maneja array vacío", () => {
    const result = aggregate([], "v" as any);
    expect(result).toEqual({
      count: 0,
      sum: 0,
      avg: 0,
      min: undefined,
      max: undefined,
    });
  });

  it("filtra valores no numéricos", () => {
    const result = aggregate([{ v: "x" as any }, { v: 10 }], "v");
    expect(result).toEqual({
      count: 1,
      sum: 10,
      avg: 10,
      min: 10,
      max: 10,
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  groupBy
// ═════════════════════════════════════════════════════════════════════════════

interface CatItem {
  type: string;
  name: string;
}

describe("groupBy", () => {
  const data: CatItem[] = [
    { type: "dog", name: "Rex" },
    { type: "cat", name: "Mimi" },
    { type: "dog", name: "Max" },
  ];

  it("agrupa por campo", () => {
    const result = groupBy(data, "type");
    expect(result["dog"]).toHaveLength(2);
    expect(result["cat"]).toHaveLength(1);
    expect(result["dog"].map((r) => r.name)).toEqual(["Rex", "Max"]);
  });

  it("convierte clave a string", () => {
    const numItems = [{ k: 1 }, { k: 2 }, { k: 1 }] as Record<string, unknown>[];
    const result = groupBy(numItems, "k");
    expect(result["1"]).toHaveLength(2);
    expect(result["2"]).toHaveLength(1);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  countBy
// ═════════════════════════════════════════════════════════════════════════════

describe("countBy", () => {
  const data: CatItem[] = [
    { type: "dog", name: "Rex" },
    { type: "cat", name: "Mimi" },
    { type: "dog", name: "Max" },
  ];

  it("cuenta ocurrencias por campo", () => {
    expect(countBy(data, "type")).toEqual({ dog: 2, cat: 1 });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  distinct
// ═════════════════════════════════════════════════════════════════════════════

describe("distinct", () => {
  it("retorna valores únicos", () => {
    const data = [{ x: 1 }, { x: 2 }, { x: 1 }, { x: 3 }];
    expect(distinct(data, "x").sort()).toEqual([1, 2, 3]);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  reportByStatus
// ═════════════════════════════════════════════════════════════════════════════

describe("reportByStatus", () => {
  const data = [
    { status: "applied" },
    { status: "hired" },
    { status: "applied" },
    { status: "interview" },
  ];

  it("genera reporte con conteo y porcentaje", () => {
    const result = reportByStatus(data);
    expect(result).toEqual([
      { status: "applied", count: 2, percentage: 50 },
      { status: "hired", count: 1, percentage: 25 },
      { status: "interview", count: 1, percentage: 25 },
    ]);
  });

  it("retorna vacío si no hay items", () => {
    expect(reportByStatus([])).toEqual([]);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  reportByStage
// ═════════════════════════════════════════════════════════════════════════════

describe("reportByStage", () => {
  const data = [
    { stage: "new" },
    { stage: "technical" },
    { stage: "new" },
  ];

  it("genera reporte por etapa", () => {
    const result = reportByStage(data);
    expect(result).toContainEqual({ stage: "new", count: 2, percentage: 67 });
    expect(result).toContainEqual({ stage: "technical", count: 1, percentage: 33 });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  reportExperience
// ═════════════════════════════════════════════════════════════════════════════

describe("reportExperience", () => {
  const data = [
    { years_experience: 2 },
    { years_experience: 5 },
    { years_experience: undefined },
    { years_experience: 3 },
  ];

  it("genera reporte de experiencia", () => {
    const result = reportExperience(data);
    expect(result).toEqual({
      average_years: 10 / 3, // (2 + 5 + 3) / 3 ≈ 3.333...
      min_years: 2,
      max_years: 5,
      total_candidates_with_data: 3,
    });
  });

  it("maneja array vacío", () => {
    const result = reportExperience([]);
    expect(result.average_years).toBe(0);
    expect(result.total_candidates_with_data).toBe(0);
  });
});