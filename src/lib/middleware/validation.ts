/**
 * Request validation middleware and utilities
 */

export interface ValidationRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[] | number[];
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string[] };
}

/**
 * Validate request data against schema
 */
export function validateRequest(data: any, schema: ValidationSchema): ValidationResult {
  const errors: { [key: string]: string[] } = {};
  let isValid = true;

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    const fieldErrors: string[] = [];

    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      fieldErrors.push(`${field} is required`);
      isValid = false;
      continue;
    }

    // Skip validation if field is not provided and not required
    if (value === undefined || value === null) {
      continue;
    }

    // Type validation
    if (rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        fieldErrors.push(`${field} must be of type ${rules.type}`);
        isValid = false;
        continue;
      }
    }

    // String validations
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        fieldErrors.push(`${field} must be at least ${rules.minLength} characters long`);
        isValid = false;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        fieldErrors.push(`${field} cannot exceed ${rules.maxLength} characters`);
        isValid = false;
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        fieldErrors.push(`${field} format is invalid`);
        isValid = false;
      }
    }

    // Number validations
    if (rules.type === 'number' && typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        fieldErrors.push(`${field} must be at least ${rules.min}`);
        isValid = false;
      }
      if (rules.max !== undefined && value > rules.max) {
        fieldErrors.push(`${field} cannot exceed ${rules.max}`);
        isValid = false;
      }
    }

    // Array validations
    if (rules.type === 'array' && Array.isArray(value)) {
      if (rules.minLength && value.length < rules.minLength) {
        fieldErrors.push(`${field} must have at least ${rules.minLength} items`);
        isValid = false;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        fieldErrors.push(`${field} cannot have more than ${rules.maxLength} items`);
        isValid = false;
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      fieldErrors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
      isValid = false;
    }

    // Custom validation
    if (rules.custom) {
      const customResult = rules.custom(value);
      if (customResult !== true) {
        fieldErrors.push(typeof customResult === 'string' ? customResult : `${field} is invalid`);
        isValid = false;
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  }

  return { isValid, errors };
}

/**
 * Sanitize input data
 */
export function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    return data.trim();
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeInput);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  email: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
  url: /^https?:\/\/.+/,
  imageUrl: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i,
  phone: /^[+]?[\d\s\-\(\)]{10,15}$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  slug: /^[a-z0-9-]+$/,
  mongoId: /^[0-9a-fA-F]{24}$/,
  trackingId: /^[a-zA-Z0-9-_]{10,50}$/,
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  ipv6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
};

/**
 * Validate MongoDB ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return ValidationPatterns.mongoId.test(id);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return ValidationPatterns.email.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  return ValidationPatterns.url.test(url);
}

/**
 * Validate image URL format
 */
export function isValidImageUrl(url: string): boolean {
  return ValidationPatterns.imageUrl.test(url);
}

/**
 * Common validation schemas
 */
export const CommonSchemas = {
  pagination: {
    page: { type: 'number' as const, min: 1 },
    limit: { type: 'number' as const, min: 1, max: 100 },
    sortBy: { type: 'string' as const },
    sortOrder: { type: 'string' as const, enum: ['asc', 'desc'] }
  },
  
  affiliatePartner: {
    name: { required: true, type: 'string' as const, maxLength: 100 },
    type: { required: true, type: 'string' as const, enum: ['loan', 'credit_card', 'broker'] },
    logoUrl: { required: true, type: 'string' as const, pattern: ValidationPatterns.imageUrl },
    description: { required: true, type: 'string' as const, maxLength: 1000 },
    website: { required: true, type: 'string' as const, pattern: ValidationPatterns.url },
    contactEmail: { required: true, type: 'string' as const, pattern: ValidationPatterns.email },
    commissionStructure: { required: true, type: 'object' as const },
    trackingConfig: { required: true, type: 'object' as const }
  },
  
  product: {
    name: { required: true, type: 'string' as const, maxLength: 150 },
    type: { 
      required: true, 
      type: 'string' as const, 
      enum: ['personal_loan', 'home_loan', 'car_loan', 'business_loan', 'credit_card', 'broker_account'] 
    },
    features: { required: true, type: 'array' as const, minLength: 1 },
    eligibility: { required: true, type: 'array' as const, minLength: 1 },
    applicationUrl: { required: true, type: 'string' as const, pattern: ValidationPatterns.url },
    description: { required: true, type: 'string' as const, maxLength: 1000 },
    termsAndConditions: { required: true, type: 'string' as const, maxLength: 5000 },
    processingTime: { required: true, type: 'string' as const, maxLength: 100 }
  }
};