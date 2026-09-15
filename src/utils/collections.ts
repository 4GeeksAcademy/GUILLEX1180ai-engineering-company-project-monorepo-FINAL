/**
 * Utility functions for array and collection operations
 * Provides common array manipulations and transformations
 */

/**
 * Groups array elements by a key function
 */
export function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Removes duplicate elements from an array
 */
export function unique<T>(array: T[], keyFn?: (item: T) => any): T[] {
  if (!keyFn) {
    return [...new Set(array)];
  }
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Chunks an array into smaller arrays of specified size
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Flattens a nested array (one level deep)
 */
export function flatten<T>(array: T[][]): T[] {
  return array.reduce((acc, curr) => acc.concat(curr), []);
}

/**
 * Deep flattens a nested array (all levels)
 */
export function deepFlatten(array: any[]): any[] {
  return array.reduce((acc, curr) => {
    return acc.concat(Array.isArray(curr) ? deepFlatten(curr) : curr);
  }, []);
}

/**
 * Returns intersection of two arrays
 */
export function intersection<T>(array1: T[], array2: T[], keyFn?: (item: T) => any): T[] {
  if (!keyFn) {
    return array1.filter(item => array2.includes(item));
  }
  const keys2 = new Set(array2.map(keyFn));
  return array1.filter(item => keys2.has(keyFn(item)));
}

/**
 * Returns difference between two arrays (elements in first array not in second)
 */
export function difference<T>(array1: T[], array2: T[], keyFn?: (item: T) => any): T[] {
  if (!keyFn) {
    return array1.filter(item => !array2.includes(item));
  }
  const keys2 = new Set(array2.map(keyFn));
  return array1.filter(item => !keys2.has(keyFn(item)));
}

/**
 * Partitions array into two arrays based on predicate
 */
export function partition<T>(array: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];
  
  array.forEach(item => {
    if (predicate(item)) {
      truthy.push(item);
    } else {
      falsy.push(item);
    }
  });
  
  return [truthy, falsy];
}

/**
 * Returns the sum of numeric values in array
 */
export function sum(array: number[]): number {
  return array.reduce((acc, curr) => acc + curr, 0);
}

/**
 * Returns the average of numeric values in array
 */
export function average(array: number[]): number {
  if (array.length === 0) return 0;
  return sum(array) / array.length;
}

/**
 * Returns the minimum value in array
 */
export function min<T>(array: T[], compareFn?: (a: T, b: T) => number): T | undefined {
  if (array.length === 0) return undefined;
  
  if (compareFn) {
    return array.reduce((min, curr) => compareFn(curr, min) < 0 ? curr : min);
  }
  
  return array.reduce((min, curr) => (curr < min ? curr : min));
}

/**
 * Returns the maximum value in array
 */
export function max<T>(array: T[], compareFn?: (a: T, b: T) => number): T | undefined {
  if (array.length === 0) return undefined;
  
  if (compareFn) {
    return array.reduce((max, curr) => compareFn(curr, max) > 0 ? curr : max);
  }
  
  return array.reduce((max, curr) => (curr > max ? curr : max));
}

/**
 * Sorts array by multiple criteria
 */
export function sortBy<T>(array: T[], ...criteria: ((item: T) => any)[]): T[] {
  return [...array].sort((a, b) => {
    for (const criterion of criteria) {
      const aVal = criterion(a);
      const bVal = criterion(b);
      
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }
    return 0;
  });
}

/**
 * Counts occurrences of each element
 */
export function countBy<T>(array: T[], keyFn: (item: T) => string): Record<string, number> {
  return array.reduce((counts, item) => {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
}

/**
 * Maps array to object with keys from key function
 */
export function keyBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T> {
  return array.reduce((obj, item) => {
    const key = keyFn(item);
    obj[key] = item;
    return obj;
  }, {} as Record<string, T>);
}

/**
 * Takes first n elements from array
 */
export function take<T>(array: T[], n: number): T[] {
  return array.slice(0, n);
}

/**
 * Takes last n elements from array
 */
export function takeRight<T>(array: T[], n: number): T[] {
  return array.slice(-n);
}

/**
 * Returns array without falsy values
 */
export function compact<T>(array: (T | falsy | null | undefined)[]): T[] {
  return array.filter(Boolean) as T[];
}

type falsy = false | 0 | '' | null | undefined;
