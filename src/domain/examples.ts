/**
 * Example usage script for TrackFlow Domain Layer
 * Demonstrates all domain functions with sample data
 * Based on CONTEXT.md specifications
 */

import {
  // Types (used in type annotations and as value types in this file)
  Lead,
  Company,
  Contact,
  LeadFormData,

  // Filters
  filterByCountry,
  filterByProductType,
  filterLeads,
  countLeadsByField,
  getUniqueValues,

  // Sorting
  sortByCompanyName,
  sortByCreatedAt,
  sortByCriteria,
  paginateLeads,
  filterAndSort,
  getTopLeads,

  // Search
  searchByCompanyName,
  searchByContactName,
  fuzzySearch,

  // Aggregations
  countLeads,
  getLeadsByCountry,
  getLeadsByProductType,
  calculateConversionRate,
  generateMonthlyReport,
  calculateLeadStatistics,

  // Validations
  validateCompanyName,
  validateEmail,
  validatePhone,
  validateForm,
  getFieldError,
  hasWarning,
  getWarningMessage
} from './index';

// ──────────────────────────────────────────────
// 1. Sample Data
// ──────────────────────────────────────────────

const sampleCompanies: Company[] = [
  {
    id: 'company-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    name: 'TechStore USA',
    website: 'https://techstoreusa.com',
    country: 'Estados Unidos',
    productType: 'Electrónica',
    monthlyVolume: '501-2000',
    has3pl: 'No',
    services: ['Almacenaje', 'Última milla']
  },
  {
    id: 'company-2',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
    name: 'Moda Española S.L.',
    website: 'https://modaespanola.es',
    country: 'España',
    productType: 'Moda',
    monthlyVolume: '101-500',
    has3pl: 'Sí',
    services: ['Logística inversa']
  },
  {
    id: 'company-3',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-05'),
    name: 'Belleza Natural',
    website: 'https://bellezanatural.es',
    country: 'España',
    productType: 'Cosmética',
    monthlyVolume: '2000+',
    has3pl: 'No',
    services: ['Almacenaje', 'Última milla', 'Logística inversa']
  },
  {
    id: 'company-4',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-01'),
    name: 'FoodExpress',
    website: 'https://foodexpress.com',
    country: 'Estados Unidos',
    productType: 'Alimentación',
    monthlyVolume: '0-100',
    has3pl: 'Estoy evaluando opciones',
    services: ['Almacenaje']
  }
];

const sampleContacts: Contact[] = [
  {
    id: 'contact-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    company: 'company-1',
    personName: 'John Smith',
    email: 'john@techstoreusa.com',
    phone: '+1 213 555 0147'
  },
  {
    id: 'contact-2',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
    company: 'company-2',
    personName: 'María García',
    email: 'maria@modaespanola.es',
    phone: '+34 612 345 678'
  },
  {
    id: 'contact-3',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-05'),
    company: 'company-3',
    personName: 'Ana Martínez',
    email: 'ana@bellezanatural.es',
    phone: '+34 623 456 789'
  },
  {
    id: 'contact-4',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-01'),
    company: 'company-4',
    personName: 'Robert Johnson',
    email: 'robert@foodexpress.com',
    phone: '+1 310 555 0198'
  }
];

const sampleLeads: Lead[] = [
  {
    id: 'lead-1',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    company: sampleCompanies[0]!,
    contact: sampleContacts[0]!,
    status: 'convertido',
    comments: 'Interesado en almacenaje y última milla',
    privacyAccepted: true,
    processedAt: new Date('2024-01-20')
  },
  {
    id: 'lead-2',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
    company: sampleCompanies[1]!,
    contact: sampleContacts[1]!,
    status: 'en_seguimiento',
    comments: 'Requiere logística inversa',
    privacyAccepted: true
  },
  {
    id: 'lead-3',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-05'),
    company: sampleCompanies[2]!,
    contact: sampleContacts[2]!,
    status: 'calificado',
    comments: 'Necesita solución completa',
    privacyAccepted: true
  },
  {
    id: 'lead-4',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-01'),
    company: sampleCompanies[3]!,
    contact: sampleContacts[3]!,
    status: 'nuevo',
    comments: '',
    privacyAccepted: true
  }
];

// ──────────────────────────────────────────────
// 2. Example: Filtering
// ──────────────────────────────────────────────

console.log('=== Example 1: Filtering Leads ===');

// Filter by country
const usLeads = filterByCountry(sampleLeads, 'Estados Unidos');
console.log(`US Leads: ${usLeads.length}`);

// Filter by product type
const modaLeads = filterByProductType(sampleLeads, 'Moda');
console.log(`Moda Leads: ${modaLeads.length}`);

// Filter by multiple criteria
const filteredLeads = filterLeads(sampleLeads, {
  country: 'España',
  productType: 'Cosmética',
  services: ['Almacenaje']
});
console.log(`Filtered Leads (España, Cosmética, Almacenaje): ${filteredLeads.length}`);

// ──────────────────────────────────────────────
// 3. Example: Sorting
// ──────────────────────────────────────────────

console.log('\n=== Example 2: Sorting Leads ===');

// Sort by company name (ascending)
const sortedByName = sortByCompanyName(sampleLeads, 'asc');
console.log('Sorted by company name (asc):', sortedByName.map(l => l.company.name));

// Sort by creation date (descending)
const sortedByDate = sortByCreatedAt(sampleLeads, 'desc');
console.log('Sorted by date (desc):', sortedByDate.map(l => l.createdAt.toISOString().split('T')[0]));

// Multi-field sorting
const multiSorted = sortByCriteria(sampleLeads, [
  { field: 'status', direction: 'asc' },
  { field: 'createdAt', direction: 'desc' }
]);
console.log('Multi-sorted (status asc, date desc):', multiSorted.map(l => `${l.company.name} (${l.status})`));

// ──────────────────────────────────────────────
// 4. Example: Search
// ──────────────────────────────────────────────

console.log('\n=== Example 3: Searching Leads ===');

// Search by company name
const searchResults = searchByCompanyName(sampleLeads, 'Tech');
console.log(`Search for "Tech": ${searchResults.length} results`);

// Search by contact name
const contactSearch = searchByContactName(sampleLeads, 'María');
console.log(`Search for "María": ${contactSearch.length} results`);

// Fuzzy search
const fuzzyResults = fuzzySearch(sampleLeads, 'moda');
console.log(`Fuzzy search for "moda": ${fuzzyResults.length} results`);

// ──────────────────────────────────────────────
// 5. Example: Aggregations
// ──────────────────────────────────────────────

console.log('\n=== Example 4: Aggregations ===');

// Count by status
const statusCounts = countLeads(sampleLeads);
console.log('Lead counts by status:', statusCounts);

// Get leads by country
const leadsByCountry = getLeadsByCountry(sampleLeads);
console.log('Leads by country:', leadsByCountry);

// Get leads by product type
const leadsByProduct = getLeadsByProductType(sampleLeads);
console.log('Leads by product type:', leadsByProduct);

// Calculate conversion rate
const conversionRate = calculateConversionRate(sampleLeads);
console.log(`Conversion rate: ${(conversionRate * 100).toFixed(1)}%`);

// Generate monthly report
const monthlyReport = generateMonthlyReport(sampleLeads, 'Enero', 2024);
console.log('Monthly report:', monthlyReport);

// Calculate lead statistics
const stats = calculateLeadStatistics(sampleLeads);
console.log('Lead statistics:', stats);

// ──────────────────────────────────────────────
// 6. Example: Validations
// ──────────────────────────────────────────────

console.log('\n=== Example 5: Validations ===');

// Validate company name
const companyValidation = validateCompanyName('TechStore USA');
console.log('Company name validation:', companyValidation.isValid ? 'Valid' : 'Invalid');

// Validate email
const emailValidation = validateEmail('invalid-email');
console.log('Email validation (invalid):', emailValidation.isValid ? 'Valid' : 'Invalid');

// Validate phone
const phoneValidation = validatePhone('+1 213 555 0147');
console.log('Phone validation (valid):', phoneValidation.isValid ? 'Valid' : 'Invalid');

// Validate complete form
const formData: LeadFormData = {
  companyName: 'Test Company',
  contactPerson: 'John Doe',
  email: 'john@test.com',
  phone: '+1 213 555 0147',
  website: 'https://test.com',
  country: 'Estados Unidos',
  productType: 'Electrónica',
  monthlyVolume: '501-2000',
  has3pl: 'No',
  services: ['Almacenaje', 'Última milla'],
  comments: 'Test comment',
  privacy: true
};

const formValidation = validateForm(formData);
console.log('Form validation:', formValidation.isValid ? 'Valid' : 'Invalid');
console.log('Errors:', formValidation.errors);
console.log('Warnings:', formValidation.warnings);

// ──────────────────────────────────────────────
// 7. Example: Pagination
// ──────────────────────────���───────────────────

console.log('\n=== Example 6: Pagination ===');

// Paginate leads
const paginated = paginateLeads(sampleLeads, 1, 2);
console.log('Paginated leads:', paginated);
console.log(`Page ${paginated.page} of ${paginated.totalPages}`);

// ──────────────────────────────────────────────
// 8. Example: Combined Operations
// ──────────────────────────────────────────────

console.log('\n=== Example 7: Combined Operations ===');

// Filter and sort in one operation
const filteredAndSorted = filterAndSort(
  sampleLeads,
  (lead) => lead.status !== 'descartado',
  [{ field: 'status', direction: 'asc' }, { field: 'createdAt', direction: 'desc' }]
);
console.log('Filtered and sorted leads:', filteredAndSorted.map(l => `${l.company.name} (${l.status})`));

// Get top 3 leads
const topLeads = getTopLeads(
  sampleLeads,
  [{ field: 'createdAt', direction: 'desc' }],
  3
);
console.log('Top 3 leads by date:', topLeads.map(l => l.company.name));

// ──────────────────────────────────────────────
// 9. Example: Utility Functions
// ──────────────────────────────────────────────

console.log('\n=== Example 8: Utility Functions ===');

// Count leads by field
const countryCounts = countLeadsByField(sampleLeads, 'country');
console.log('Leads by country:', countryCounts);

// Get unique values
const uniqueCountries = getUniqueValues(sampleLeads, 'country');
console.log('Unique countries:', uniqueCountries);

// ──────────────────────────────────────────────
// 10. Example: Validation Utilities
// ──────────────────────────────────────────────

console.log('\n=== Example 9: Validation Utilities ===');

// Get field error
const fieldError = getFieldError(formValidation.errors, 'email');
console.log('Field error for email:', fieldError);

// Check if field has warning
const fieldWarning = hasWarning(formValidation.warnings, 'monthlyVolume');
console.log('Has warning for monthlyVolume:', fieldWarning);

// Get warning message
const warningMsg = getWarningMessage(formValidation.warnings, 'monthlyVolume');
console.log('Warning message:', warningMsg);

console.log('\n=== All examples completed successfully! ===');