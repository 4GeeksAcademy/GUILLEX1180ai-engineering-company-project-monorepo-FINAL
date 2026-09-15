/**
 * Pure sorting functions for Lead and related entities
 * Supports ascending, descending, and multi-field sorting
 */

import { Lead, SortConfig } from './types';

// ──────────────────────────────────────────────
// 1. Core comparison functions
// ──────────────────────────────────────────────

/** Compare two dates for sorting */
function compareDates(
  a: Date | undefined,
  b: Date | undefined,
  direction: 'asc' | 'desc'
): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const result = a.getTime() - b.getTime();
  return direction === 'asc' ? result : -result;
}

/** Compare two strings for sorting (case-insensitive) */
function compareStrings(
  a: string | undefined,
  b: string | undefined,
  direction: 'asc' | 'desc'
): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  const result = a.localeCompare(b, 'es', { sensitivity: 'base' });
  return direction === 'asc' ? result : -result;
}

// ──────────────────────────────────────────────
// 2. Sort by single field
// ──────────────────────────────────────────────

/** Sort leads by company name */
export function sortByCompanyName(
  leads: Lead[],
  direction: 'asc' | 'desc' = 'asc'
): Lead[] {
  return [...leads].sort((a, b) =>
    compareStrings(a.company.name, b.company.name, direction)
  );
}

/** Sort leads by contact name */
export function sortByContactName(
  leads: Lead[],
  direction: 'asc' | 'desc' = 'asc'
): Lead[] {
  return [...leads].sort((a, b) =>
    compareStrings(a.contact.personName, b.contact.personName, direction)
  );
}

/** Sort leads by email */
export function sortByEmail(
  leads: Lead[],
  direction: 'asc' | 'desc' = 'asc'
): Lead[] {
  return [...leads].sort((a, b) =>
    compareStrings(a.contact.email, b.contact.email, direction)
  );
}

/** Sort leads by country */
export function sortByCountry(
  leads: Lead[],
  direction: 'asc' | 'desc' = 'asc'
): Lead[] {
  return [...leads].sort((a, b) =>
    compareStrings(a.company.country, b.company.country, direction)
  );
}

/** Sort leads by creation date */
export function sortByCreatedAt(
  leads: Lead[],
  direction: 'asc' | 'desc' = 'asc'
): Lead[] {
  return [...leads].sort((a, b) =>
    compareDates(a.createdAt, b.createdAt, direction)
  );
}

/** Sort leads by status */
export function sortByStatus(
  leads: Lead[],
  direction: 'asc' | 'desc' = 'asc'
): Lead[] {
  const statusOrder: Record<string, number> = {
    'nuevo': 1,
    'en_seguimiento': 2,
    'calificado': 3,
    'convertido': 4,
    'descartado': 5
  };

  return [...leads].sort((a, b) => {
    const orderA = statusOrder[a.status] ?? 0;
    const orderB = statusOrder[b.status] ?? 0;
    return direction === 'asc' ? orderA - orderB : orderB - orderA;
  });
}

// ──────────────────────────────────────────────
// 3. Multi-field sorting
// ──────────────────────────────────────────────

/** Get value from lead for a specific field */
function getLeadFieldValue(lead: Lead, field: keyof Lead | keyof Lead['company']): unknown {
  if (field === 'country' || field === 'productType' || field === 'monthlyVolume' || field === 'has3pl' || field === 'services') {
    return (lead.company as unknown as Record<string, unknown>)[field];
  }
  return (lead as unknown as Record<string, unknown>)[field];
}

/** Sort leads by multiple criteria */
export function sortByCriteria(
  leads: Lead[],
  criteria: SortConfig<Lead>[],
  getFieldValue?: (lead: Lead, field: keyof Lead) => unknown
): Lead[] {
  return [...leads].sort((a, b) => {
    for (const criterion of criteria) {
      const fieldA = getFieldValue ? getFieldValue(a, criterion.field) : getLeadFieldValue(a, criterion.field);
      const fieldB = getFieldValue ? getFieldValue(b, criterion.field) : getLeadFieldValue(b, criterion.field);

      let comparison: number;

      if (fieldA instanceof Date && fieldB instanceof Date) {
        comparison = fieldA.getTime() - fieldB.getTime();
      } else if (typeof fieldA === 'string' && typeof fieldB === 'string') {
        comparison = fieldA.localeCompare(fieldB, 'es', { sensitivity: 'base' });
      } else if (typeof fieldA === 'number' && typeof fieldB === 'number') {
        comparison = fieldA - fieldB;
      } else {
        comparison = 0;
      }

      if (comparison !== 0) {
        return criterion.direction === 'asc' ? comparison : -comparison;
      }
    }
    return 0;
  });
}

// ──────────────────────────────────────────────
// 4. Pagination
// ──────────────────────────────────────────────

/** Paginate leads */
export function paginateLeads(
  leads: Lead[],
  page: number,
  pageSize: number
): {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  const total = leads.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const items = leads.slice(startIndex, startIndex + pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages
  };
}

// ──────────────────────────────────────────────
// 5. Sorting with filtering
// ──────────────────────────────────────────────

/** Filter and sort leads in one operation */
export function filterAndSort(
  leads: Lead[],
  filterPredicate: (lead: Lead) => boolean,
  sortCriteria: SortConfig<Lead>[]
): Lead[] {
  const filtered = leads.filter(filterPredicate);
  return sortByCriteria(filtered, sortCriteria);
}

/** Get top N leads by a specific criteria */
export function getTopLeads(
  leads: Lead[],
  criteria: SortConfig<Lead>[],
  n: number
): Lead[] {
  return sortByCriteria(leads, criteria).slice(0, n);
}