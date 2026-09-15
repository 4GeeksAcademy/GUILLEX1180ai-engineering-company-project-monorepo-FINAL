/**
 * Search algorithms implementation
 * Includes linear search and binary search for various use cases
 */

import { SearchResult, SearchOptions } from '../types/models';

/**
 * Linear search - O(n) complexity
 * Searches through array sequentially
 */
export function linearSearch<T>(
  array: T[],
  predicate: (item: T) => boolean,
  options?: SearchOptions
): SearchResult<T>[] {
  const results: SearchResult<T>[] = [];
  const maxResults = options?.maxResults ?? array.length;
  
  for (let i = 0; i < array.length && results.length < maxResults; i++) {
    const item = array[i];
    if (item !== undefined && predicate(item)) {
      results.push({
        item,
        index: i
      });
    }
  }
  
  return results;
}

/**
 * Binary search - O(log n) complexity
 * Requires sorted array
 */
export function binarySearch<T>(
  array: T[],
  target: T,
  compareFn: (a: T, b: T) => number = defaultCompare
): SearchResult<T> | null {
  let left = 0;
  let right = array.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const item = array[mid];
    
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

/**
 * Binary search for insertion point
 */
export function binarySearchInsertionPoint<T>(
  array: T[],
  target: T,
  compareFn: (a: T, b: T) => number = defaultCompare
): number {
  let left = 0;
  let right = array.length;
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    const item = array[mid];
    
    if (item !== undefined && compareFn(item, target) < 0) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  
  return left;
}

/**
 * Fuzzy search with score
 */
export function fuzzySearch<T>(
  array: T[],
  query: string,
  getSearchableText: (item: T) => string,
  options?: SearchOptions
): SearchResult<T>[] {
  const caseSensitive = options?.caseSensitive ?? false;
  const maxResults = options?.maxResults ?? array.length;
  const threshold = options?.threshold ?? 0.5;
  
  const normalizedQuery = caseSensitive ? query : query.toLowerCase();
  
  return array
    .map((item, index) => {
      const text = caseSensitive ? getSearchableText(item) : getSearchableText(item).toLowerCase();
      const score = calculateFuzzyScore(normalizedQuery, text);
      return { item, index, score: score ?? undefined };
    })
    .filter((result): result is SearchResult<T> & { score: number } => 
      result.score !== undefined && result.score >= threshold
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Calculate fuzzy match score between query and text
 */
function calculateFuzzyScore(query: string, text: string): number | null {
  if (query.length === 0) return 1;
  if (text.length === 0) return null;
  
  let queryIndex = 0;
  let score = 0;
  let lastMatchIndex = -1;
  
  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (text[i] === query[queryIndex]) {
      score += 1;
      
      // Bonus for consecutive matches
      if (lastMatchIndex === i - 1) {
        score += 0.5;
      }
      
      // Bonus for match at start of word
      if (i === 0 || text[i - 1] === ' ') {
        score += 0.3;
      }
      
      lastMatchIndex = i;
      queryIndex++;
    }
  }
  
  // All query characters must be found
  if (queryIndex < query.length) {
    return null;
  }
  
  // Normalize score
  return score / (query.length + (query.length - 1) * 0.5 + 0.3 * countWords(text));
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Default comparison function for numbers
 */
function defaultCompare<T>(a: T, b: T): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Search with multiple criteria
 */
export function multiCriteriaSearch<T>(
  array: T[],
  criteria: Array<{
    field: keyof T;
    value: any;
    operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';
  }>
): T[] {
  return array.filter(item => {
    return criteria.every(criterion => {
      const fieldValue = item[criterion.field];
      const operator = criterion.operator ?? 'equals';
      
      switch (operator) {
        case 'equals':
          return fieldValue === criterion.value;
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(criterion.value).toLowerCase());
        case 'startsWith':
          return String(fieldValue).toLowerCase().startsWith(String(criterion.value).toLowerCase());
        case 'endsWith':
          return String(fieldValue).toLowerCase().endsWith(String(criterion.value).toLowerCase());
        case 'gt':
          return fieldValue > criterion.value;
        case 'lt':
          return fieldValue < criterion.value;
        case 'gte':
          return fieldValue >= criterion.value;
        case 'lte':
          return fieldValue <= criterion.value;
        default:
          return true;
      }
    });
  });
}

/**
 * Search within date range
 */
export function searchByDateRange<T>(
  array: T[],
  dateField: keyof T,
  startDate: Date,
  endDate: Date
): T[] {
  return array.filter(item => {
    const itemDate = new Date(item[dateField] as string);
    return itemDate >= startDate && itemDate <= endDate;
  });
}

/**
 * Paginated search
 */
export function paginatedSearch<T>(
  array: T[],
  page: number,
  pageSize: number,
  predicate?: (item: T) => boolean
): {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
} {
  const filteredArray = predicate ? array.filter(predicate) : array;
  const total = filteredArray.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const items = filteredArray.slice(startIndex, startIndex + pageSize);
  
  return {
    items,
    total,
    page,
    pageSize,
    totalPages
  };
}
