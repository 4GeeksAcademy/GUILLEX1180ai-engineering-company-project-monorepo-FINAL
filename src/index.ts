/**
 * TrackFlow Source Index
 * Main entry point for all TypeScript modules
 */

// Export all types and models
export * from './types/models';

// Export all utility functions
export * from './utils/collections';
export * from './utils/search';
export * from './utils/transformations';
export * from './utils/validations';

// Re-export specific items for convenience
export {
  // Types
  Id,
  BaseEntity,
  Company,
  Contact,
  Country,
  ProductType,
  MonthlyVolume,
  ThreePlStatus,
  ServiceType,
  LeadFormData,
  ValidationResult,
  ValidationError,
  Service,
  Location,
  MonthlyReport,
  LeadStatistics,
  SearchResult,
  SearchOptions
} from './types/models';

// Collections utilities
export {
  groupBy,
  unique,
  chunk,
  flatten,
  deepFlatten,
  intersection,
  difference,
  partition,
  sum,
  average,
  min,
  max,
  sortBy,
  countBy,
  keyBy,
  take,
  takeRight,
  compact
} from './utils/collections';

// Search utilities
export {
  linearSearch,
  binarySearch,
  binarySearchInsertionPoint,
  fuzzySearch,
  multiCriteriaSearch,
  searchByDateRange,
  paginatedSearch
} from './utils/search';

// Transformation utilities
export {
  generateMonthlyReport,
  calculateLeadStatistics,
  transformForChart,
  calculateConversionFunnel,
  generateGeographicReport,
  generateServiceReport,
  aggregateByTimePeriod,
  calculateGrowthRate,
  movingAverage,
  normalize
} from './utils/transformations';

// Validation utilities
export {
  validateCompanyName,
  validateContactPerson,
  validateEmail,
  validatePhone,
  validateWebsite,
  validateCountry,
  validateProductType,
  validateMonthlyVolume,
  validateHas3pl,
  validateServices,
  validateComments,
  validatePrivacy,
  validateForm,
  getFieldError,
  hasWarning,
  getWarningMessage
} from './utils/validations';
