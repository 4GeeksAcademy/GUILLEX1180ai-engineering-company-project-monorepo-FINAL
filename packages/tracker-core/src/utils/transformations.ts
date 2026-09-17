// ─────────────────────────────────────────────────────────────────────────────
//  Funciones de agregación y reportes
//  Incluye: conteos, sumas, promedios, máximos, mínimos, agrupaciones.
//  Principio: funciones puras, tipado genérico, manejo de arrays vacíos.
// ─────────────────────────────────────────────────────────────────────────────

import type { AggregateResult } from "../types/models";

// ═════════════════════════════════════════════════════════════════════════════
//  AGREGACIONES BÁSICAS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Cuenta el número total de elementos en un array.
 */
export function count<T>(items: T[]): number {
  return items.length;
}

/**
 * Suma los valores de un campo numérico.
 * Retorna 0 si el array está vacío.
 */
export function sum<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T
): number {
  return items.reduce((acc, item) => {
    const val = item[field];
    return acc + (typeof val === "number" ? val : 0);
  }, 0);
}

/**
 * Calcula el promedio (media aritmética) de un campo numérico.
 * Retorna 0 si el array está vacío.
 */
export function avg<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T
): number {
  if (items.length === 0) return 0;
  return sum(items, field) / items.length;
}

/**
 * Encuentra el valor máximo de un campo numérico.
 * Retorna `undefined` si el array está vacío o no hay valores numéricos.
 */
export function max<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T
): number | undefined {
  let maxVal: number | undefined = undefined;

  for (const item of items) {
    const val = item[field];
    if (typeof val === "number") {
      if (maxVal === undefined || val > maxVal) {
        maxVal = val;
      }
    }
  }

  return maxVal;
}

/**
 * Encuentra el valor mínimo de un campo numérico.
 * Retorna `undefined` si el array está vacío o no hay valores numéricos.
 */
export function min<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T
): number | undefined {
  let minVal: number | undefined = undefined;

  for (const item of items) {
    const val = item[field];
    if (typeof val === "number") {
      if (minVal === undefined || val < minVal) {
        minVal = val;
      }
    }
  }

  return minVal;
}

/**
 * Calcula todas las métricas de agregación de una sola vez.
 * Retorna un objeto con count, sum, avg, min, max.
 */
export function aggregate<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T
): AggregateResult {
  const vals: number[] = [];

  for (const item of items) {
    const val = item[field];
    if (typeof val === "number") {
      vals.push(val);
    }
  }

  const count = vals.length;
  const sum = vals.reduce((a, b) => a + b, 0);

  return {
    count,
    sum,
    avg: count > 0 ? sum / count : 0,
    min: count > 0 ? Math.min(...vals) : undefined,
    max: count > 0 ? Math.max(...vals) : undefined,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
//  AGRUPACIONES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Agrupa elementos por el valor de un campo.
 * Retorna un objeto donde las claves son los valores del campo.
 */
export function groupBy<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T
): Record<string, T[]> {
  const result: Record<string, T[]> = {};

  for (const item of items) {
    const key = String(item[field]);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }

  return result;
}

/**
 * Cuenta cuántos elementos hay por cada valor de un campo.
 * Ej: contar candidatos por estado -> { applied: 5, hired: 3, ... }
 */
export function countBy<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const item of items) {
    const key = String(item[field]);
    result[key] = (result[key] || 0) + 1;
  }

  return result;
}

/**
 * Obtiene los valores únicos de un campo.
 */
export function distinct<T extends Record<string, unknown>, K extends keyof T>(
  items: T[],
  field: K
): T[K][] {
  const seen = new Set<T[K]>();
  for (const item of items) {
    seen.add(item[field]);
  }
  return Array.from(seen);
}

// ═════════════════════════════════════════════════════════════════════════════
//  REPORTES ESPECÍFICOS PARA CANDIDATOS
// ═════════════════════════════════════════════════════════════════════════════

export interface StatusReport {
  status: string;
  count: number;
  percentage: number;
}

export interface StageReport {
  stage: string;
  count: number;
  percentage: number;
}

export interface ExperienceReport {
  average_years: number;
  min_years: number | undefined;
  max_years: number | undefined;
  total_candidates_with_data: number;
}

/**
 * Genera un reporte detallado por estado de candidatura.
 */
export function reportByStatus<T extends { status: string }>(
  items: T[]
): StatusReport[] {
  const grouped = countBy(items, "status" as keyof T);
  const total = items.length;

  return Object.entries(grouped)
    .map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Genera un reporte detallado por etapa del pipeline.
 */
export function reportByStage<T extends { stage: string }>(
  items: T[]
): StageReport[] {
  const grouped = countBy(items, "stage" as keyof T);
  const total = items.length;

  return Object.entries(grouped)
    .map(([stage, count]) => ({
      stage,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Genera un reporte de experiencia de los candidatos.
 */
export function reportExperience<T extends { years_experience?: number }>(
  items: T[]
): ExperienceReport {
  const withData = items.filter((c) => c.years_experience != null);
  const years = withData.map((c) => c.years_experience as number);

  return {
    average_years: years.length > 0 ? years.reduce((a, b) => a + b, 0) / years.length : 0,
    min_years: years.length > 0 ? Math.min(...years) : undefined,
    max_years: years.length > 0 ? Math.max(...years) : undefined,
    total_candidates_with_data: years.length,
  };
}