// ─────────────────────────────────────────────────────────────────────────────
//  Tests: search.ts
//  Cubre: linearSearchByIdentity, linearSearchAll, linearSearchByText,
//         linearSearchMultiField, binarySearchIndex, binarySearch,
//         binarySearchNumber, binarySearchRange
// ─────────────────────────────────────────────────────────────────────────────

import {
  linearSearchByIdentity,
  linearSearchAll,
  linearSearchByText,
  linearSearchMultiField,
  binarySearchIndex,
  binarySearch,
  binarySearchNumber,
  binarySearchRange,
} from "../search";

interface TestItem {
  id: number;
  name: string;
  age: number;
}

const items: TestItem[] = [
  { id: 1, name: "Alice", age: 30 },
  { id: 2, name: "Bob", age: 25 },
  { id: 3, name: "Charlie", age: 35 },
  { id: 4, name: "Diana", age: 28 },
  { id: 5, name: "Alice", age: 22 },
];

// ═════════════════════════════════════════════════════════════════════════════
//  linearSearchByIdentity
// ═════════════════════════════════════════════════════════════════════════════

describe("linearSearchByIdentity", () => {
  it("encuentra primer elemento que coincide", () => {
    expect(linearSearchByIdentity(items, "id", 3)?.name).toBe("Charlie");
  });

  it("retorna undefined si no encuentra", () => {
    expect(linearSearchByIdentity(items, "id", 99)).toBeUndefined();
  });

  it("retorna vacío para array vacío", () => {
    expect(linearSearchByIdentity([], "id" as any, 1)).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  linearSearchAll
// ═════════════════════════════════════════════════════════════════════════════

describe("linearSearchAll", () => {
  it("encuentra todas las coincidencias", () => {
    const result = linearSearchAll(items, "name", "Alice");
    expect(result).toHaveLength(2);
  });

  it("retorna vacío si no hay coincidencias", () => {
    expect(linearSearchAll(items, "name", "Nobody")).toEqual([]);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  linearSearchByText
// ═════════════════════════════════════════════════════════════════════════════

describe("linearSearchByText", () => {
  it("busca substring case-insensitive", () => {
    const result = linearSearchByText(items, "name", "li");
    expect(result.map((r) => r.name)).toEqual(["Alice", "Charlie", "Alice"]);
  });

  it("retorna vacío si no hay match", () => {
    expect(linearSearchByText(items, "name", "xyz")).toEqual([]);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  linearSearchMultiField
// ═════════════════════════════════════════════════════════════════════════════

describe("linearSearchMultiField", () => {
  it("busca en múltiples campos (OR)", () => {
    const result = linearSearchMultiField(items, ["name", "id" as any], 2);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Bob");
  });

  it("devuelve vacío si ningún campo coincide", () => {
    expect(linearSearchMultiField(items, ["name"], 99)).toEqual([]);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  binarySearchIndex
// ═════════════════════════════════════════════════════════════════════════════

const sortedByName: TestItem[] = [
  { id: 1, name: "Alice", age: 30 },
  { id: 2, name: "Bob", age: 25 },
  { id: 3, name: "Charlie", age: 35 },
  { id: 4, name: "Diana", age: 28 },
];

describe("binarySearchIndex", () => {
  it("encuentra índice de elemento existente (string)", () => {
    expect(binarySearchIndex(sortedByName, "name", "Charlie")).toBe(2);
  });

  it("retorna -1 si no existe", () => {
    expect(binarySearchIndex(sortedByName, "name", "Eve")).toBe(-1);
  });

  it("encuentra por campo numérico", () => {
    const sortedByAge = [...sortedByName].sort((a, b) => a.age - b.age);
    expect(binarySearchIndex(sortedByAge, "age", 28)).toBe(1);
  });

  it("maneja valores null", () => {
    const withNull = [
      { id: 1, name: null as any, age: 30 },
      { id: 2, name: "Alice", age: 25 },
    ];
    expect(binarySearchIndex(withNull, "name", null)).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  binarySearch
// ═════════════════════════════════════════════════════════════════════════════

describe("binarySearch", () => {
  it("retorna el elemento encontrado", () => {
    expect(binarySearch(sortedByName, "name", "Bob")?.id).toBe(2);
  });

  it("retorna undefined si no existe", () => {
    expect(binarySearch(sortedByName, "name", "Nobody")).toBeUndefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  binarySearchNumber
// ═════════════════════════════════════════════════════════════════════════════

const sortedByAgeAsc: TestItem[] = [
  { id: 2, name: "Bob", age: 25 },
  { id: 4, name: "Diana", age: 28 },
  { id: 1, name: "Alice", age: 30 },
  { id: 3, name: "Charlie", age: 35 },
];

describe("binarySearchNumber", () => {
  it("encuentra elemento numérico", () => {
    expect(binarySearchNumber(sortedByAgeAsc, "age", 30)?.name).toBe("Alice");
  });

  it("retorna undefined si no existe", () => {
    expect(binarySearchNumber(sortedByAgeAsc, "age", 99)).toBeUndefined();
  });

  it("maneja array con valores no-numéricos al final", () => {
    const withNonNumeric = [
      ...sortedByAgeAsc,
      { id: 6, name: "Eve", age: null as any },
    ];
    expect(binarySearchNumber(withNonNumeric, "age", 30)?.name).toBe("Alice");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
//  binarySearchRange
// ═════════════════════════════════════════════════════════════════════════════

describe("binarySearchRange", () => {
  it("encuentra elementos en rango", () => {
    const result = binarySearchRange(sortedByAgeAsc, "age", 28, 30);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.name)).toEqual(["Diana", "Alice"]);
  });

  it("retorna vacío si no hay elementos en rango", () => {
    expect(binarySearchRange(sortedByAgeAsc, "age", 100, 200)).toEqual([]);
  });

  it("retorna vacío para array vacío", () => {
    expect(binarySearchRange([], "age" as any, 0, 10)).toEqual([]);
  });
});