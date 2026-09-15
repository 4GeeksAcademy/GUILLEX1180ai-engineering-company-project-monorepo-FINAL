/**
 * Pure filtering functions for Lead and related entities
 * Supports multi-criteria filtering with composable predicates
 */

import {
  Lead,
  LeadFilterCriteria,
  Country,
  ProductType,
  MonthlyVolume,
  ThreePlStatus,
  ServiceType,
  LeadStatus
} from './types';

// ──────────────────────────────────────────────
// 1. Predicate builders (composable)
// ──────────────────────────────────────────────

/** Check if a value matches a single or multiple criteria */
function matchesCriteria<T>(
  value: T,
  criteria: T | ReadonlyArray<T>
): boolean {
  if (Array.isArray(criteria)) {
    return criteria.includes(value);
  }
  return value === criteria;
}

/** Check if any element in array matches criteria */
function matchesAnyInArray<T>(
  values: ReadonlyArray<T>,
  criteria: T | ReadonlyArray<T>
): boolean {
  if (Array.isArray(criteria)) {
    return values.some(v => criteria.includes(v));
  }
  return values.includes(criteria as T);
}

/** Check if a date is within a range */
function isDateInRange(
  date: Date | undefined,
  from?: Date,
  to?: Date
): boolean {
  if (!date) return true;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

// ──────────────────────────────────────────────
// 2. Core filter functions (pure)
// ──────────────────────────────────────────────

/** Filter leads by country */
export function filterByCountry(
  leads: ReadonlyArray<Lead>,
  countries: Country | ReadonlyArray<Country>
): Lead[] {
  return leads.filter(lead => matchesCriteria(lead.company.country, countries));
}

/** Filter leads by product type */
export function filterByProductType(
  leads: ReadonlyArray<Lead>,
  productTypes: ProductType | ReadonlyArray<ProductType>
): Lead[] {
  return leads.filter(lead => matchesCriteria(lead.company.productType, productTypes));
}

/** Filter leads by monthly volume */
export function filterByMonthlyVolume(
  leads: ReadonlyArray<Lead>,
  volumes: MonthlyVolume | ReadonlyArray<MonthlyVolume>
): Lead[] {
  return leads.filter(lead => matchesCriteria(lead.company.monthlyVolume, volumes));
}

/** Filter leads by 3PL status */
export function filterByThreePlStatus(
  leads: ReadonlyArray<Lead>,
  statuses: ThreePlStatus | ReadonlyArray<ThreePlStatus>
): Lead[] {
  return leads.filter(lead => matchesCriteria(lead.company.has3pl, statuses));
}

/** Filter leads by service type */
export function filterByServiceType(
  leads: ReadonlyArray<Lead>,
  serviceTypes: ServiceType | ReadonlyArray<ServiceType>
): Lead[] {
  return leads.filter(lead =>
    matchesAnyInArray(lead.company.services, serviceTypes)
  );
}

/** Filter leads by status */
export function filterByStatus(
  leads: ReadonlyArray<Lead>,
  statuses: LeadStatus | ReadonlyArray<LeadStatus>
): Lead[] {
  return leads.filter(lead => matchesCriteria(lead.status, statuses));
}

/** Filter leads by date range */
export function filterByDateRange(
  leads: ReadonlyArray<Lead>,
  from?: Date,
  to?: Date
): Lead[] {
  return leads.filter(lead => isDateInRange(lead.createdAt, from, to));
}

/** Filter leads by search query (name, email, company) */
export function filterBySearchQuery(
  leads: ReadonlyArray<Lead>,
  query: string
): Lead[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [...leads];

  return leads.filter(lead => {
    const companyName = lead.company.name.toLowerCase();
    const contactName = lead.contact.personName.toLowerCase();
    const email = lead.contact.email.toLowerCase();

    return (
      companyName.includes(normalizedQuery) ||
      contactName.includes(normalizedQuery) ||
      email.includes(normalizedQuery)
    );
  });
}

// ──────────────────────────────────────────────
// 3. Composite filter (multi-criteria)
// ──────────────────────────────────────────────

/** Apply multiple filter criteria to leads */
export function filterLeads(
  leads: ReadonlyArray<Lead>,
  criteria: LeadFilterCriteria
): Lead[] {
  let result = [...leads];

  // Apply each criterion if present
  if (criteria.country) {
    result = filterByCountry(result, criteria.country);
  }
  if (criteria.productType) {
    result = filterByProductType(result, criteria.productType);
  }
  if (criteria.monthlyVolume) {
    result = filterByMonthlyVolume(result, criteria.monthlyVolume);
  }
  if (criteria.has3pl) {
    result = filterByThreePlStatus(result, criteria.has3pl);
  }
  if (criteria.services) {
    result = filterByServiceType(result, criteria.services);
  }
  if (criteria.status) {
    result = filterByStatus(result, criteria.status);
  }
  if (criteria.dateRange) {
    result = filterByDateRange(result, criteria.dateRange.from, criteria.dateRange.to);
  }
  if (criteria.searchQuery) {
    result = filterBySearchQuery(result, criteria.searchQuery);
  }

  return result;
}

// ──────────────────────────────────────────────
// 4. Filter utilities
// ──────────────────────────────────────────────

/** Create a reusable filter predicate */
export function createFilterPredicate(
  criteria: LeadFilterCriteria
): (lead: Lead) => boolean {
  return (lead: Lead): boolean => {
    if (criteria.country && !matchesCriteria(lead.company.country, criteria.country)) {
      return false;
    }
    if (criteria.productType && !matchesCriteria(lead.company.productType, criteria.productType)) {
      return false;
    }
    if (criteria.monthlyVolume && !matchesCriteria(lead.company.monthlyVolume, criteria.monthlyVolume)) {
      return false;
    }
    if (criteria.has3pl && !matchesCriteria(lead.company.has3pl, criteria.has3pl)) {
      return false;
    }
    if (criteria.services && !matchesAnyInArray(lead.company.services, criteria.services)) {
      return false;
    }
    if (criteria.status && !matchesCriteria(lead.status, criteria.status)) {
      return false;
    }
    if (criteria.dateRange) {
      if (!isDateInRange(lead.createdAt, criteria.dateRange.from, criteria.dateRange.to)) {
        return false;
      }
    }
    if (criteria.searchQuery) {
      const query = criteria.searchQuery.toLowerCase();
      const companyName = lead.company.name.toLowerCase();
      const contactName = lead.contact.personName.toLowerCase();
      const email = lead.contact.email.toLowerCase();
      if (
        !companyName.includes(query) &&
        !contactName.includes(query) &&
        !email.includes(query)
      ) {
        return false;
      }
    }
    return true;
  };
}

/** Count leads by a specific field */
export function countLeadsByField<T extends keyof Lead | keyof Lead['company']>(
  leads: ReadonlyArray<Lead>,
  field: T
): Record<string, number> {
  return leads.reduce((acc, lead) => {
    let key: string;

    if (field === 'country' || field === 'productType' || field === 'monthlyVolume' || field === 'has3pl' || field === 'services') {
      key = String((lead.company as unknown as Record<string, unknown>)[field]);
    } else {
      key = String((lead as unknown as Record<string, unknown>)[field]);
    }

    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/** Get unique values from a field */
export function getUniqueValues<T extends keyof Lead | keyof Lead['company']>(
  leads: ReadonlyArray<Lead>,
  field: T
): string[] {
  const values = leads.map(lead => {
    if (field === 'country' || field === 'productType' || field === 'monthlyVolume' || field === 'has3pl' || field === 'services') {
      return String((lead.company as unknown as Record<string, unknown>)[field]);
    }
    return String((lead as unknown as Record<string, unknown>)[field]);
  });

  return [...new Set(values)];
}