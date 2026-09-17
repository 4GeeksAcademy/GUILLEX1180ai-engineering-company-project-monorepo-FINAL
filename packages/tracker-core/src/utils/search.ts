// ─────────────────────────────────────────────────────────────────────────────
//  Algoritmos de búsqueda
//  Incluye: búsqueda lineal (arrays desordenados), búsqueda binaria (arrays
//  ordenados) y búsqueda por múltiples campos.
//  Principio: tipado genérico, manejo de casos vacíos, código puro.
// ─────────────────────────────────────────────────────────────────────────────

// ═════════════════════════════════════════════════════════════════════════════
//  BÚSQUEDA LINEAL — O(n)
//  Funciona sobre arrays desordenados. Recorre elemento por elemento.
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Busca el primer elemento cuyo campo coincida exactamente con el valor dado.
 * Retorna el elemento o `undefined` si no se encuentra.
 * Complejidad: O(n).
 */
export function linearSearchByIdentity<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T,
  value: unknown
): T | undefined {
  for (const item of items) {
    if (item[field] === value) {
      return item;
    }
  }
  return undefined;
}

/**
 * Búsqueda lineal que retorna TODAS las coincidencias.
 * Útil cuando puede haber múltiples elementos con el mismo valor.
 */
export function linearSearchAll<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T,
  value: unknown
): T[] {
  const results: T[] = [];
  for (const item of items) {
    if (item[field] === value) {
      results.push(item);
    }
  }
  return results;
}

/**
 * Búsqueda lineal por coincidencia parcial (substring case-insensitive).
 * Retorna todos los elementos cuyo campo contenga el texto buscado.
 */
export function linearSearchByText<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T,
  query: string
): T[] {
  const lowerQuery = query.toLowerCase();
  const results: T[] = [];
  for (const item of items) {
    const fieldValue = item[field];
    if (typeof fieldValue === "string" && fieldValue.toLowerCase().includes(lowerQuery)) {
      results.push(item);
    }
  }
  return results;
}

/**
 * Búsqueda lineal multi-campo (OR). Retorna items donde ALGÚN campo coincida
 * exactamente con el valor buscado. Útil para búsquedas globales (ej: nombre o email).
 */
export function linearSearchMultiField<T extends Record<string, unknown>>(
  items: T[],
  fields: (keyof T)[],
  value: unknown
): T[] {
  const results: T[] = [];
  for (const item of items) {
    for (const field of fields) {
      if (item[field] === value) {
        results.push(item);
        break; // Evita duplicados si múltiples campos coinciden
      }
    }
  }
  return results;
}

// ═════════════════════════════════════════════════════════════════════════════
//  BÚSQUEDA BINARIA — O(log n)
//  REQUIERE que el array esté ordenado por el campo de búsqueda.
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Búsqueda binaria para arrays ordenados ascendentemente.
 * Retorna el índice del elemento encontrado, o -1 si no existe.
 * Complejidad: O(log n).
 */
export function binarySearchIndex<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T,
  value: unknown
): number {
  let left = 0;
  let right = items.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = items[mid][field];

    if (midValue === value) return mid;

    // Si alguno es null/undefined, no podemos comparar
    if (midValue == null || value == null) {
      if (midValue == null && value == null) return mid;
      if (midValue == null) {
        left = mid + 1; // asumimos nulls al final
      } else {
        right = mid - 1;
      }
      continue;
    }

    // Comparación segura: números o strings
    if (typeof midValue === "number" && typeof value === "number") {
      if (midValue < value) left = mid + 1;
      else right = mid - 1;
    } else {
      const strMid = String(midValue);
      const strVal = String(value);
      if (strMid < strVal) left = mid + 1;
      else right = mid - 1;
    }
  }

  return -1;
}

/**
 * Búsqueda binaria que retorna el elemento directamente.
 */
export function binarySearch<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T,
  value: unknown
): T | undefined {
  const index = binarySearchIndex(items, field, value);
  return index !== -1 ? items[index] : undefined;
}

/**
 * Búsqueda binaria en un array ordenado por un campo numérico.
 * Versión optimizada para números (evita comparaciones mixtas).
 * REQUIERE: el array debe estar ordenado ascendentemente por `field`,
 * con todos los valores numéricos ANTES que los null/undefined.
 */
export function binarySearchNumber<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T,
  value: number
): T | undefined {
  let left = 0;
  let right = items.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = items[mid][field];

    if (typeof midValue !== "number") {
      // En un array ordenado asc, los no-números están al final. Ir a la izquierda.
      right = mid - 1;
      continue;
    }

    if (midValue === value) return items[mid];
    if (midValue < value) left = mid + 1;
    else right = mid - 1;
  }

  return undefined;
}

/**
 * Búsqueda binaria para rango [min, max] en arrays ordenados numéricamente.
 * Retorna todos los elementos dentro del rango.
 */
export function binarySearchRange<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T,
  min: number,
  max: number
): T[] {
  // Encontrar el primer índice >= min
  let left = 0;
  let right = items.length - 1;
  let startIdx = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const midValue = items[mid][field];

    if (typeof midValue !== "number") {
      // En un array ordenado asc, los no-números están al final. Ir a la izquierda.
      right = mid - 1;
      continue;
    }

    if (midValue >= min) {
      startIdx = mid;
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }

  if (startIdx === -1) return [];

  // Recoger todos los elementos hasta que superen max
  const results: T[] = [];
  for (let i = startIdx; i < items.length; i++) {
    const val = items[i][field];
    if (typeof val === "number" && val <= max) {
      results.push(items[i]);
    } else if (typeof val === "number" && val > max) {
      break; // Como está ordenado, podemos parar
    }
  }

  return results;
}