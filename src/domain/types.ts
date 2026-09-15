/**
 * Domain types for TrackFlow logistics platform
 * Based on CONTEXT.md specifications - strict typing, no `any`
 */

// ──────────────────────────────────────────────
// 1. Core Domain Types
// ──────────────────────────────────────────────

/** Unique identifier for any domain entity */
export type Id = string;

/** Base entity with audit fields */
export interface BaseEntity {
  readonly id: Id;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ──────────────────────────────────────────────
// 2. Enums / Literal Unions
// ──────────────────────────────────────────────

/** Countries where TrackFlow operates */
export type Country = 'Estados Unidos' | 'España' | 'Ambos' | 'Otro';

/** Product categories handled by TrackFlow clients */
export type ProductType = 'Moda' | 'Electrónica' | 'Cosmética' | 'Alimentación' | 'Otro';

/** Monthly shipment volume ranges */
export type MonthlyVolume = '0-100' | '101-500' | '501-2000' | '2000+' | 'No estoy seguro';

/** 3PL partnership status */
export type ThreePlStatus = 'Sí' | 'No' | 'Estoy evaluando opciones';

/** Service types offered by TrackFlow */
export type ServiceType = 'Almacenaje' | 'Última milla' | 'Logística inversa';

/** Lead status in the pipeline */
export type LeadStatus = 'nuevo' | 'en_seguimiento' | 'calificado' | 'convertido' | 'descartado';

// ──────────────────────────────────────────────
// 3. Company & Contact (Lead Entities)
// ──────────────────────────────────────────────

/** Company entity representing a potential client */
export interface Company extends BaseEntity {
  readonly name: string;
  readonly website?: string;
  readonly country: Country;
  readonly productType: ProductType;
  readonly monthlyVolume: MonthlyVolume;
  readonly has3pl: ThreePlStatus;
  readonly services: ReadonlyArray<ServiceType>;
}

/** Contact person associated with a company */
export interface Contact extends BaseEntity {
  readonly company: Id;
  readonly personName: string;
  readonly email: string;
  readonly phone: string;
}

/** Complete lead data from the form submission */
export interface LeadFormData {
  readonly companyName: string;
  readonly contactPerson: string;
  readonly email: string;
  readonly phone: string;
  readonly website?: string;
  readonly country: Country;
  readonly productType: ProductType;
  readonly monthlyVolume: MonthlyVolume;
  readonly has3pl: ThreePlStatus;
  readonly services: ReadonlyArray<ServiceType>;
  readonly comments?: string;
  readonly privacy: boolean;
}

/** Processed lead after form validation */
export interface Lead extends BaseEntity {
  readonly company: Company;
  readonly contact: Contact;
  readonly status: LeadStatus;
  readonly comments?: string;
  readonly privacyAccepted: boolean;
  readonly processedAt?: Date;
}

// ──────────────────────────────────────────────
// 4. Service Entities
// ──────────────────────────────────────────────

/** Service offered by TrackFlow */
export interface Service extends BaseEntity {
  readonly type: ServiceType;
  readonly name: string;
  readonly description: string;
  readonly availableCountries: ReadonlyArray<Country>;
}

// ──────────────────────────────────────────────
// 5. Location Entities
// ──────────────────────────────────────────────

/** Physical location (warehouse or office) */
export interface Location extends BaseEntity {
  readonly city: string;
  readonly region: string;
  readonly country: Country;
  readonly isWarehouse: boolean;
  readonly carrierPartners: ReadonlyArray<string>;
}

// ──────────────────────────────────────────────
// 6. Validation Result Types
// ──────────────────────────────────────────────

/** Individual validation error */
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

/** Result of a validation operation */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: ReadonlyArray<ValidationError>;
  readonly warnings: ReadonlyArray<ValidationError>;
}

// ──────────────────────────────────────────────
// 7. Search & Filter Types
// ──────────────────────────────────────────────

/** Search result with index */
export interface SearchResult<T> {
  readonly item: T;
  readonly index: number;
  readonly score?: number;
}

/** Search configuration */
export interface SearchOptions {
  readonly caseSensitive?: boolean;
  readonly maxResults?: number;
  readonly threshold?: number;
}

/** Filter criteria for querying leads */
export interface LeadFilterCriteria {
  readonly country?: Country | ReadonlyArray<Country>;
  readonly productType?: ProductType | ReadonlyArray<ProductType>;
  readonly monthlyVolume?: MonthlyVolume | ReadonlyArray<MonthlyVolume>;
  readonly has3pl?: ThreePlStatus | ReadonlyArray<ThreePlStatus>;
  readonly services?: ServiceType | ReadonlyArray<ServiceType>;
  readonly status?: LeadStatus | ReadonlyArray<LeadStatus>;
  readonly dateRange?: {
    readonly from?: Date;
    readonly to?: Date;
  };
  readonly searchQuery?: string;
}

/** Sort configuration */
export interface SortConfig<T> {
  readonly field: keyof T;
  readonly direction: 'asc' | 'desc';
}

// ──────────────────────────────────────────────
// 8. Report & Aggregation Types
// ──────────────────────────────────────────────

/** Monthly report statistics */
export interface MonthlyReport {
  readonly month: string;
  readonly year: number;
  readonly totalLeads: number;
  readonly leadsByCountry: Readonly<Record<Country, number>>;
  readonly leadsByProductType: Readonly<Record<ProductType, number>>;
  readonly averageVolume: number;
  readonly conversionRate: number;
}

/** Lead statistics summary */
export interface LeadStatistics {
  readonly totalLeads: number;
  readonly leadsByService: Readonly<Record<ServiceType, number>>;
  readonly leadsByVolume: Readonly<Record<MonthlyVolume, number>>;
  readonly topCountries: ReadonlyArray<Country>;
  readonly averageProcessingTime: number;
}

/** Aggregated metric */
export interface AggregatedMetric<T> {
  readonly key: string;
  readonly count: number;
  readonly total: number;
  readonly average: number;
  readonly min: number;
  readonly max: number;
  readonly items: ReadonlyArray<T>;
}

// ──────────────────────────────────────────────
// 9. Form Configuration Types
// ──────────────────────────────────────────────

/** Form field configuration */
export interface FormFieldConfig {
  readonly id: string;
  readonly label: string;
  readonly type: 'text' | 'email' | 'tel' | 'url' | 'select' | 'checkbox' | 'radio' | 'textarea';
  readonly required: boolean;
  readonly validationRules: ReadonlyArray<ValidationRule>;
}

/** Validation rule for a form field */
export interface ValidationRule {
  readonly type: 'minLength' | 'maxLength' | 'pattern' | 'minWords' | 'custom';
  readonly value?: number | string;
  readonly message: string;
}

/** Form configuration */
export interface FormConfig {
  readonly fields: ReadonlyArray<FormFieldConfig>;
  readonly submitButtonText: string;
  readonly successMessage: string;
}