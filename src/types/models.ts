/**
 * Domain models and interfaces for TrackFlow logistics platform
 * Based on Documentos_Hito1.md specifications
 */

// Base types
export type Id = string;

export interface BaseEntity {
  id: Id;
  createdAt?: string;
  updatedAt?: string;
}

// Company and Contact types
export interface Company extends BaseEntity {
  name: string;
  website?: string;
  country: Country;
  productType: ProductType;
  monthlyVolume: MonthlyVolume;
  has3pl: ThreePlStatus;
}

export interface Contact extends BaseEntity {
  personName: string;
  email: string;
  phone: string;
  companyId: Id;
}

// Enums and union types
export type Country = 'Estados Unidos' | 'España' | 'Ambos' | 'Otro';

export type ProductType = 'Moda' | 'Electrónica' | 'Cosmética' | 'Alimentación' | 'Otro';

export type MonthlyVolume = '0-100' | '101-500' | '501-2000' | '2000+' | 'no-estoy-seguro';

export type ThreePlStatus = 'si' | 'no' | 'evaluando';

export type ServiceType = 'almacenaje' | 'ultima-milla' | 'logistica-inversa';

// Form data types
export interface LeadFormData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  website?: string;
  country: Country;
  productType: ProductType;
  monthlyVolume: MonthlyVolume;
  has3pl: ThreePlStatus;
  services: ServiceType[];
  comments?: string;
  privacy: boolean;
}

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Service types
export interface Service extends BaseEntity {
  name: string;
  type: ServiceType;
  description: string;
  availableCountries: Country[];
}

// Location types
export interface Location extends BaseEntity {
  city: string;
  region: string;
  country: Country;
  isWarehouse: boolean;
}

// Reporting types
export interface MonthlyReport {
  month: string;
  year: number;
  totalLeads: number;
  leadsByCountry: Record<Country, number>;
  leadsByProductType: Record<ProductType, number>;
  averageVolume: number;
  conversionRate: number;
}

export interface LeadStatistics {
  totalLeads: number;
  leadsByService: Record<ServiceType, number>;
  leadsByVolume: Record<MonthlyVolume, number>;
  topCountries: Country[];
  averageProcessingTime: number;
}

// Search types
export interface SearchResult<T> {
  item: T;
  index: number;
  score?: number;
}

export interface SearchOptions {
  caseSensitive?: boolean;
  maxResults?: number;
  threshold?: number;
}
