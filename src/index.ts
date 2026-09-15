/**
 * TrackFlow Source Index
 * Main entry point for all TypeScript modules
 */

// ──────────────────────────────────────────────
// Domain Layer (Business Logic) - Primary exports
// ──────────────────────────────────────────────
export * from './domain';

// ──────────────────────────────────────────────
// Utility Layer (Generic utilities)
// ──────────────────────────────────────────────

// Collections utilities (no conflicts with domain)
export * from './utils/collections';

// Search utilities - avoid conflicts with domain/search
export {
  binarySearchInsertionPoint,
  multiCriteriaSearch,
  searchByDateRange,
  paginatedSearch
} from './utils/search';

// Transformation utilities - avoid conflicts with domain/aggregations
export {
  transformForChart,
  calculateConversionFunnel,
  generateGeographicReport,
  generateServiceReport,
  aggregateByTimePeriod,
  calculateGrowthRate,
  movingAverage,
  normalize
} from './utils/transformations';
