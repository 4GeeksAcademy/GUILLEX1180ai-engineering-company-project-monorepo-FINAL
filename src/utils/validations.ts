/**
 * Business validation functions
 * Based on Documentos_Hito1.md form validation specifications
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
} from '../types/models';

/**
 * Validate company name
 */
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
    errors
  };
}

/**
 * Validate contact person name
 */
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
    errors
  };
}

/**
 * Validate email address
 */
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
    errors
  };
}

/**
 * Validate phone number
 */
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
    errors
  };
}

/**
 * Validate website URL
 */
export function validateWebsite(website: string): ValidationResult {
  const errors: ValidationError[] = [];
  const trimmed = website.trim();
  
  // Website is optional, so empty value is valid
  if (trimmed.length === 0) {
    return { isValid: true, errors: [] };
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
    errors
  };
}

/**
 * Validate country selection
 */
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
    errors
  };
}

/**
 * Validate product type selection
 */
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
    errors
  };
}

/**
 * Validate monthly volume selection
 */
export function validateMonthlyVolume(volume: string): ValidationResult {
  const errors: ValidationError[] = [];
  const validVolumes: MonthlyVolume[] = ['0-100', '101-500', '501-2000', '2000+', 'no-estoy-seguro'];
  
  if (!validVolumes.includes(volume as MonthlyVolume)) {
    errors.push({
      field: 'monthlyVolume',
      message: 'Selecciona el volumen mensual estimado',
      code: 'REQUIRED'
    });
  }
  
  // Warning for low volume (0-100)
  if (volume === '0-100') {
    errors.push({
      field: 'monthlyVolume',
      message: 'Volumen reducido: Para volúmenes menores a 100 envíos mensuales, nuestros servicios podrían no ser la solución más eficiente. ¿Seguro que quieres continuar?',
      code: 'LOW_VOLUME_WARNING'
    });
  }
  
  return {
    isValid: errors.filter(e => e.code !== 'LOW_VOLUME_WARNING').length === 0,
    errors
  };
}

/**
 * Validate 3PL status
 */
export function validateHas3pl(has3pl: string): ValidationResult {
  const errors: ValidationError[] = [];
  const validStatuses: ThreePlStatus[] = ['si', 'no', 'evaluando'];
  
  if (!validStatuses.includes(has3pl as ThreePlStatus)) {
    errors.push({
      field: 'has3pl',
      message: 'Indica si actualmente trabajas con otro proveedor logístico',
      code: 'REQUIRED'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate services selection
 */
export function validateServices(services: ServiceType[]): ValidationResult {
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
    errors
  };
}

/**
 * Validate comments
 */
export function validateComments(comments: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Comments are optional
  if (comments.length === 0) {
    return { isValid: true, errors: [] };
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
    errors
  };
}

/**
 * Validate privacy policy acceptance
 */
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
    errors
  };
}

/**
 * Validate entire form
 */
export function validateForm(formData: LeadFormData): ValidationResult {
  const allErrors: ValidationError[] = [];
  
  // Validate each field
  const companyNameResult = validateCompanyName(formData.companyName);
  allErrors.push(...companyNameResult.errors);
  
  const contactPersonResult = validateContactPerson(formData.contactPerson);
  allErrors.push(...contactPersonResult.errors);
  
  const emailResult = validateEmail(formData.email);
  allErrors.push(...emailResult.errors);
  
  const phoneResult = validatePhone(formData.phone);
  allErrors.push(...phoneResult.errors);
  
  const websiteResult = validateWebsite(formData.website || '');
  allErrors.push(...websiteResult.errors);
  
  const countryResult = validateCountry(formData.country);
  allErrors.push(...countryResult.errors);
  
  const productTypeResult = validateProductType(formData.productType);
  allErrors.push(...productTypeResult.errors);
  
  const monthlyVolumeResult = validateMonthlyVolume(formData.monthlyVolume);
  allErrors.push(...monthlyVolumeResult.errors);
  
  const has3plResult = validateHas3pl(formData.has3pl);
  allErrors.push(...has3plResult.errors);
  
  const servicesResult = validateServices(formData.services);
  allErrors.push(...servicesResult.errors);
  
  const commentsResult = validateComments(formData.comments || '');
  allErrors.push(...commentsResult.errors);
  
  const privacyResult = validatePrivacy(formData.privacy);
  allErrors.push(...privacyResult.errors);
  
  // Filter out warnings from validation errors
  const validationErrors = allErrors.filter(e => e.code !== 'LOW_VOLUME_WARNING');
  
  return {
    isValid: validationErrors.length === 0,
    errors: allErrors
  };
}

/**
 * Get first error for a specific field
 */
export function getFieldError(errors: ValidationError[], fieldName: string): string | null {
  const error = errors.find(e => e.field === fieldName);
  return error ? error.message : null;
}

/**
 * Check if field has warning
 */
export function hasWarning(errors: ValidationError[], fieldName: string): boolean {
  return errors.some(e => e.field === fieldName && e.code.endsWith('_WARNING'));
}

/**
 * Get warning message for a field
 */
export function getWarningMessage(errors: ValidationError[], fieldName: string): string | null {
  const warning = errors.find(e => e.field === fieldName && e.code.endsWith('_WARNING'));
  return warning ? warning.message : null;
}
