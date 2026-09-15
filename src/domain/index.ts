/**
 * Domain layer index - TrackFlow Logistics Platform
 * Exports all domain types, filters, sorting, search, aggregations, and validations
 */

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
export * from './types';

// ──────────────────────────────────────────────
// Filters
// ──────────────────────────────────────────────
export {
  filterByCountry,
  filterByProductType,
  filterByMonthlyVolume,
  filterByThreePlStatus,
  filterByServiceType,
  filterByStatus,
  filterByDateRange,
  filterBySearchQuery,
  filterLeads,
  createFilterPredicate,
  countLeadsByField,
  getUniqueValues
} from './filters';

// ──────────────────────────────────────────────
// Sorting
// ──────────────────────────────────────────────
export {
  sortByCompanyName,
  sortByContactName,
  sortByEmail,
  sortByCountry,
  sortByCreatedAt,
  sortByStatus,
  sortByCriteria,
  paginateLeads,
  filterAndSort,
  getTopLeads
} from './sorting';

// ──────────────────────────────────────────────
// Search
// ──────────────────────────────────────────────
export {
  linearSearch,
  searchByCompanyName,
  searchByContactName,
  searchByEmail,
  searchByPhone,
  searchLeads,
  binarySearch,
  binarySearchByCompanyName,
  binarySearchByEmail,
  binarySearchByDate,
  fuzzySearch,
  searchWithPagination,
  searchWithCriteria
} from './search';

// ───────────────��──────────────────────────────
// Aggregations
// ──────────────────────────────────────────────
export {
  countLeads,
  getLeadsByStatus,
  getLeadsByCountry,
  getLeadsByProductType,
  getLeadsByServiceType,
  getLeadsByMonthlyVolume,
  calculateAverageProcessingTime,
  calculateConversionRate,
  calculateAverageMonthlyVolume,
  aggregateByField,
  aggregateByCountry,
  aggregateByProductType,
  aggregateByServiceType,
  generateMonthlyReport,
  calculateLeadStatistics,
  getTopLeadsByMetric,
  getLeadsWithMostServices,
  calculatePercentile,
  getNumericStats
} from './aggregations';

// ──────────────────────────────────────────────
// Validations
// ──────────────────────────────────────────────
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
  getWarningMessage,
  getFieldErrors,
  getFieldWarnings,
  hasErrorCode,
  getErrorMessageByCode,
  validateField,
  validateFields
} from './validations';