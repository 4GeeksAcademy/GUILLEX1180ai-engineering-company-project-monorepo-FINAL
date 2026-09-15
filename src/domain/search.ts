/**
 * Search algorithms for Lead and related entities
 * Implements linear search (unordered) and binary search (ordered)
 */

import { Lead, SearchResult, SearchOptions } from './types';

// ──────────────────────────────────────────────
// 1. Linear Search (O(n))
// ──────────────────────────────────────────────

/** Linear search through leads array */
export function linearSearch(
  leads: ReadonlyArray<Lead>,
  predicate: (lead: Lead) => boolean,
  options?: SearchOptions
): SearchResult<Lead>[] {
  const results: SearchResult<Lead>[] = [];
  const maxResults = options?.maxResults ?? leads.length;

  for (let i = 0; i < leads.length && results.length < maxResults; i++) {
    const lead = leads[i];
    if (lead !== undefined && predicate(lead)) {
      results.push({
        item: lead,
        index: i
      });
    }
  }

  return results;
}

/** Search leads by company name (linear) */
export function searchByCompanyName(
  leads: ReadonlyArray<Lead>,
  companyName: string,
  caseSensitive: boolean = false
): SearchResult<Lead>[] {
  const query = caseSensitive ? companyName : companyName.toLowerCase();

  return linearSearch(leads, (lead) => {
    const name = caseSensitive ? lead.company.name : lead.company.name.toLowerCase();
    return name.includes(query);
  });
}

/** Search leads by contact name (linear) */
export function searchByContactName(
  leads: ReadonlyArray<Lead>,
  contactName: string,
  caseSensitive: boolean = false
): SearchResult<Lead>[] {
  const query = caseSensitive ? contactName : contactName.toLowerCase();

  return linearSearch(leads, (lead) => {
    const name = caseSensitive ? lead.contact.personName : lead.contact.personName.toLowerCase();
    return name.includes(query);
  });
}

/** Search leads by email (linear) */
export function searchByEmail(
  leads: ReadonlyArray<Lead>,
  email: string,
  caseSensitive: boolean = false
): SearchResult<Lead>[] {
  const query = caseSensitive ? email : email.toLowerCase();

  return linearSearch(leads, (lead) => {
    const leadEmail = caseSensitive ? lead.contact.email : lead.contact.email.toLowerCase();
    return leadEmail.includes(query);
  });
}

/** Search leads by phone (linear) */
export function searchByPhone(
  leads: ReadonlyArray<Lead>,
  phone: string,
  caseSensitive: boolean = false
): SearchResult<Lead>[] {
  const query = caseSensitive ? phone : phone.toLowerCase();

  return linearSearch(leads, (lead) => {
    const leadPhone = caseSensitive ? lead.contact.phone : lead.contact.phone.toLowerCase();
    return leadPhone.includes(query);
  });
}

/** Search leads by multiple fields (linear) */
export function searchLeads(
  leads: ReadonlyArray<Lead>,
  query: string,
  options?: SearchOptions
): SearchResult<Lead>[] {
  const normalizedQuery = options?.caseSensitive ? query : query.toLowerCase();

  return linearSearch(leads, (lead) => {
    const name = options?.caseSensitive ? lead.company.name : lead.company.name.toLowerCase();
    const contact = options?.caseSensitive ? lead.contact.personName : lead.contact.personName.toLowerCase();
    const email = options?.caseSensitive ? lead.contact.email : lead.contact.email.toLowerCase();
    const phone = options?.caseSensitive ? lead.contact.phone : lead.contact.phone.toLowerCase();

    return (
      name.includes(normalizedQuery) ||
      contact.includes(normalizedQuery) ||
      email.includes(normalizedQuery) ||
      phone.includes(normalizedQuery)
    );
  }, options);
}

// ──────────────────────────────────────────────
// 2. Binary Search (O(log n))
// ──────────────────────────────────────────────

/** Binary search on sorted leads array (requires sorted data) */
export function binarySearch(
  sortedLeads: ReadonlyArray<Lead>,
  target: Lead,
  compareFn: (a: Lead, b: Lead) => number
): SearchResult<Lead> | null {
  let left = 0;
  let right = sortedLeads.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const item = sortedLeads[mid];

    if (item === undefined) {
      break;
    }

    const comparison = compareFn(item, target);

    if (comparison === 0) {
      return {
        item,
        index: mid
      };
    } else if (comparison < 0) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return null;
}

/** Binary search by company name (requires leads sorted by company name) */
export function binarySearchByCompanyName(
  sortedLeads: ReadonlyArray<Lead>,
  companyName: string
): SearchResult<Lead> | null {
  const target: Lead = {
    id: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    company: {
      id: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      name: companyName,
      country: 'Otro',
      productType: 'Otro',
      monthlyVolume: 'No estoy seguro',
      has3pl: 'No',
      services: []
    },
    contact: {
      id: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      company: '',
      personName: '',
      email: '',
      phone: ''
    },
    status: 'nuevo',
    privacyAccepted: true
  };

  return binarySearch(sortedLeads, target, (a, b) =>
    a.company.name.localeCompare(b.company.name, 'es', { sensitivity: 'base' })
  );
}

/** Binary search by email (requires leads sorted by email) */
export function binarySearchByEmail(
  sortedLeads: ReadonlyArray<Lead>,
  email: string
): SearchResult<Lead> | null {
  const target: Lead = {
    id: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    company: {
      id: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      name: '',
      country: 'Otro',
      productType: 'Otro',
      monthlyVolume: 'No estoy seguro',
      has3pl: 'No',
      services: []
    },
    contact: {
      id: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      company: '',
      personName: '',
      email: email,
      phone: ''
    },
    status: 'nuevo',
    privacyAccepted: true
  };

  return binarySearch(sortedLeads, target, (a, b) =>
    a.contact.email.localeCompare(b.contact.email, 'es', { sensitivity: 'base' })
  );
}

/** Binary search by creation date (requires leads sorted by date) */
export function binarySearchByDate(
  sortedLeads: ReadonlyArray<Lead>,
  targetDate: Date
): SearchResult<Lead> | null {
  let left = 0;
  let right = sortedLeads.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const item = sortedLeads[mid];

    if (item === undefined) {
      break;
    }

    const comparison = item.createdAt.getTime() - targetDate.getTime();

    if (comparison === 0) {
      return {
        item,
        index: mid
      };
    } else if (comparison < 0) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return null;
}

// ─────────────────────────────────���────────────
// 3. Fuzzy Search
// ──────────────────────────────────────────────

/** Calculate fuzzy match score */
function calculateFuzzyScore(query: string, text: string): number {
  if (query.length === 0) return 1;
  if (text.length === 0) return 0;

  let queryIndex = 0;
  let score = 0;
  let lastMatchIndex = -1;

  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (text[i] === query[queryIndex]) {
      score += 1;

      if (lastMatchIndex === i - 1) {
        score += 0.5;
      }

      if (i === 0 || text[i - 1] === ' ') {
        score += 0.3;
      }

      lastMatchIndex = i;
      queryIndex++;
    }
  }

  if (queryIndex < query.length) {
    return 0;
  }

  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  return score / (query.length + (query.length - 1) * 0.5 + 0.3 * wordCount);
}

/** Fuzzy search with score */
export function fuzzySearch(
  leads: ReadonlyArray<Lead>,
  query: string,
  options?: SearchOptions
): SearchResult<Lead>[] {
  const caseSensitive = options?.caseSensitive ?? false;
  const maxResults = options?.maxResults ?? leads.length;
  const threshold = options?.threshold ?? 0.5;

  const normalizedQuery = caseSensitive ? query : query.toLowerCase();

  return leads
    .map((lead, index) => {
      const companyName = caseSensitive ? lead.company.name : lead.company.name.toLowerCase();
      const contactName = caseSensitive ? lead.contact.personName : lead.contact.personName.toLowerCase();
      const email = caseSensitive ? lead.contact.email : lead.contact.email.toLowerCase();

      const score = Math.max(
        calculateFuzzyScore(normalizedQuery, companyName),
        calculateFuzzyScore(normalizedQuery, contactName),
        calculateFuzzyScore(normalizedQuery, email)
      );

      return { item: lead, index, score: score > 0 ? score : undefined };
    })
    .filter((result): result is SearchResult<Lead> & { score: number } =>
      result.score !== undefined && result.score >= threshold
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

// ──────────────────────────────────────────────
// 4. Search utilities
// ──────────────────────────────────────────────

/** Search with pagination */
export function searchWithPagination(
  leads: ReadonlyArray<Lead>,
  query: string,
  page: number,
  pageSize: number,
  options?: SearchOptions
): {
  items: SearchResult<Lead>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  const results = searchLeads(leads, query, options);
  const total = results.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const items = results.slice(startIndex, startIndex + pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages
  };
}

/** Search with multiple criteria */
export function searchWithCriteria(
  leads: ReadonlyArray<Lead>,
  query: string,
  criteria: {
    country?: string;
    productType?: string;
    status?: string;
  }
): SearchResult<Lead>[] {
  let filtered = leads;

  if (criteria.country) {
    filtered = filtered.filter(lead => lead.company.country === criteria.country);
  }
  if (criteria.productType) {
    filtered = filtered.filter(lead => lead.company.productType === criteria.productType);
  }
  if (criteria.status) {
    filtered = filtered.filter(lead => lead.status === criteria.status);
  }

  return searchLeads(filtered, query);
}