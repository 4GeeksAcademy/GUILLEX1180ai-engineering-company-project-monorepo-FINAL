/**
 * Business validation functions for TrackFlow
 * Based on CONTEXT.md specifications - strict validation rules
 */

import {
  LeadFormData,
  ValidationResult,
  ValidationError,
  Country,
  ProductType,
  MonthlyVolume,
  ThreePlStatus,
  ServiceType
} from './types';

// ──────────────────────────────────────────────
// 1. Field-level validators
// ──────────────────────────────────────────────

/** Validate company name */
export function validateCompanyName(name: string): ValidationResult {
  const errors: ValidationError[] = [];
  const trimmed = name.trim();

  if (trimmed.length < 2) {
    errors.push({
      field: 'companyName',
      message: 'El nombre de la empresa debe tener al menos 2 caracteres',
      code: 'MIN_LENGTH'
    });
  }

  if (trimmed.length > 100) {
    errors.push({
      field: 'companyName',
      message: 'El nombre de la empresa no puede exceder 100 caracteres',
      code: 'MAX_LENGTH'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

/** Validate contact person name */
export function validateContactPerson(name: string): ValidationResult {
  const errors: ValidationError[] = [];
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);

  if (words.length < 2) {
    errors.push({
      field: 'contactPerson',
      message: 'Ingresa nombre y apellido del contacto',
      code: 'MIN_WORDS'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

/** Validate email address */
export function validateEmail(email: string): ValidationResult {
  const errors: ValidationError[] = [];
  const trimmed = email.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmed)) {
    errors.push({
      field: 'email',
      message: 'Ingresa un email corporativo válido (ejemplo: nombre@empresa.com)',
      code: 'INVALID_FORMAT'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

/** Validate phone number */
export function validatePhone(phone: string): ValidationResult {
  const errors: ValidationError[] = [];
  const trimmed = phone.trim();
  const phoneRegex = /^\+[0-9]{1,3}[-\s./0-9]{5,20}$/;

  if (!phoneRegex.test(trimmed)) {
    errors.push({
      field: 'phone',
      message: 'El teléfono debe incluir código de país (ejemplo: +1 213 555 0147)',
      code: 'INVALID_FORMAT'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

/** Validate website URL */
export function validateWebsite(website: string): ValidationResult {
  const errors: ValidationError[] = [];
  const trimmed = website.trim();

  if (trimmed.length === 0) {
    return { isValid: true, errors: [], warnings: [] };
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
  } catch (_) {
    errors.push({
      field: 'website',
      message: 'Si incluyes sitio web, debe ser una URL válida',
      code: 'INVALID_URL'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

/** Validate country selection */
export function validateCountry(country: string): ValidationResult {
  const errors: ValidationError[] = [];
  const validCountries: Country[] = ['Estados Unidos', 'España', 'Ambos', 'Otro'];

  if (!validCountries.includes(country as Country)) {
    errors.push({
      field: 'country',
      message: 'Selecciona el país de operación principal',
      code: 'REQUIRED'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

/** Validate product type selection */
export function validateProductType(productType: string): ValidationResult {
  const errors: ValidationError[] = [];
  const validProductTypes: ProductType[] = ['Moda', 'Electrónica', 'Cosmética', 'Alimentación', 'Otro'];

  if (!validProductTypes.includes(productType as ProductType)) {
    errors.push({
      field: 'productType',
      message: 'Selecciona el tipo de producto que manejas',
      code: 'REQUIRED'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

/** Validate monthly volume selection */
export function validateMonthlyVolume(volume: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const validVolumes: MonthlyVolume[] = ['0-100', '101-500', '501-2000', '2000+', 'No estoy seguro'];

  if (!validVolumes.includes(volume as MonthlyVolume)) {
    errors.push({
      field: 'monthlyVolume',
      message: 'Selecciona el volumen mensual estimado',
      code: 'REQUIRED'
    });
  }

  // Warning for low volume
  if (volume === '0-100') {
    warnings.push({
      field: 'monthlyVolume',
      message: 'Volumen reducido: Para volúmenes menores a 100 envíos mensuales, nuestros servicios podrían no ser la solución más eficiente. ¿Seguro que quieres continuar?',
      code: 'LOW_VOLUME_WARNING'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/** Validate 3PL status */
export function validateHas3pl(has3pl: string): ValidationResult {
  const errors: ValidationError[] = [];
  const validStatuses: ThreePlStatus[] = ['Sí', 'No', 'Estoy evaluando opciones'];

  if (!validStatuses.includes(has3pl as ThreePlStatus)) {
    errors.push({
      field: 'has3pl',
      message: 'Indica si actualmente trabajas con otro proveedor logístico',
      code: 'REQUIRED'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

/** Validate services selection */
export function validateServices(services: ReadonlyArray<ServiceType>): ValidationResult {
  const errors: ValidationError[] = [];

  if (!Array.isArray(services) || services.length === 0) {
    errors.push({
      field: 'services',
      message: 'Selecciona al menos un servicio de interés',
      code: 'REQUIRED'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

/** Validate comments */
export function validateComments(comments: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (comments.length === 0) {
    return { isValid: true, errors: [], warnings: [] };
  }

  if (comments.length > 500) {
    const remaining = 500 - comments.length;
    errors.push({
      field: 'comments',
      message: `Los comentarios no pueden exceder 500 caracteres (quedan ${remaining})`,
      code: 'MAX_LENGTH'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

/** Validate privacy policy acceptance */
export function validatePrivacy(accepted: boolean): ValidationResult {
  const errors: ValidationError[] = [];

  if (!accepted) {
    errors.push({
      field: 'privacy',
      message: 'Debes aceptar la política de privacidad para continuar',
      code: 'REQUIRED'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  };
}

// ──────────────────────────────────────────────
// 2. Form-level validation
// ──────────────────────────────────────────────

/** Validate entire lead form */
export function validateForm(formData: LeadFormData): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];

  // Validate each field
  const validations = [
    validateCompanyName(formData.companyName),
    validateContactPerson(formData.contactPerson),
    validateEmail(formData.email),
    validatePhone(formData.phone),
    validateWebsite(formData.website || ''),
    validateCountry(formData.country),
    validateProductType(formData.productType),
    validateMonthlyVolume(formData.monthlyVolume),
    validateHas3pl(formData.has3pl),
    validateServices(formData.services),
    validateComments(formData.comments || ''),
    validatePrivacy(formData.privacy)
  ];

  validations.forEach(result => {
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}

// ──────────────────────────────────────────────
// 3. Validation utilities
// ──────────────────────────────────────────────

/** Get first error for a specific field */
export function getFieldError(errors: ReadonlyArray<ValidationError>, fieldName: string): string | null {
  const error = errors.find(e => e.field === fieldName);
  return error ? error.message : null;
}

/** Check if field has warning */
export function hasWarning(warnings: ReadonlyArray<ValidationError>, fieldName: string): boolean {
  return warnings.some(e => e.field === fieldName);
}

/** Get warning message for a field */
export function getWarningMessage(warnings: ReadonlyArray<ValidationError>, fieldName: string): string | null {
  const warning = warnings.find(e => e.field === fieldName);
  return warning ? warning.message : null;
}

/** Get all errors for a field */
export function getFieldErrors(errors: ReadonlyArray<ValidationError>, fieldName: string): ValidationError[] {
  return errors.filter(e => e.field === fieldName);
}

/** Get all warnings for a field */
export function getFieldWarnings(warnings: ReadonlyArray<ValidationError>, fieldName: string): ValidationError[] {
  return warnings.filter(e => e.field === fieldName);
}

/** Check if form has specific error code */
export function hasErrorCode(errors: ReadonlyArray<ValidationError>, code: string): boolean {
  return errors.some(e => e.code === code);
}

/** Get error message by code */
export function getErrorMessageByCode(errors: ReadonlyArray<ValidationError>, code: string): string | null {
  const error = errors.find(e => e.code === code);
  return error ? error.message : null;
}

/** Validate specific field */
export function validateField(
  field: string,
  value: string | boolean | ReadonlyArray<string>
): ValidationResult {
  switch (field) {
    case 'companyName':
      return validateCompanyName(value as string);
    case 'contactPerson':
      return validateContactPerson(value as string);
    case 'email':
      return validateEmail(value as string);
    case 'phone':
      return validatePhone(value as string);
    case 'website':
      return validateWebsite(value as string);
    case 'country':
      return validateCountry(value as string);
    case 'productType':
      return validateProductType(value as string);
    case 'monthlyVolume':
      return validateMonthlyVolume(value as string);
    case 'has3pl':
      return validateHas3pl(value as string);
    case 'services':
      return validateServices(value as ReadonlyArray<ServiceType>);
    case 'comments':
      return validateComments(value as string);
    case 'privacy':
      return validatePrivacy(value as boolean);
    default:
      return { isValid: true, errors: [], warnings: [] };
  }
}

/** Validate multiple fields at once */
export function validateFields(
  fields: Record<string, string | boolean | ReadonlyArray<string>>
): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];

  Object.entries(fields).forEach(([field, value]) => {
    const result = validateField(field, value);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}