export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateInput(value: string, rules: ValidationRule): ValidationResult {
  const errors: string[] = [];

  if (rules.required && (!value || value.trim().length === 0)) {
    errors.push('This field is required');
  }

  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`Minimum length is ${rules.minLength} characters`);
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(`Maximum length is ${rules.maxLength} characters`);
  }

  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push('Invalid format');
  }

  if (rules.custom) {
    const customResult = rules.custom(value);
    if (customResult !== true) {
      errors.push(typeof customResult === 'string' ? customResult : 'Invalid input');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateEmail(email: string): ValidationResult {
  return validateInput(email, {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value) => value.length <= 254 || 'Email address is too long'
  });
}

export function validateApiKey(apiKey: string): ValidationResult {
  return validateInput(apiKey, {
    required: true,
    minLength: 10,
    maxLength: 500,
    custom: (value) => {
      // Basic check for common API key patterns
      const hasValidChars = /^[a-zA-Z0-9\-_]+$/.test(value.trim());
      return hasValidChars || 'API key contains invalid characters';
    }
  });
}

export function validateUrl(url: string): ValidationResult {
  try {
    new URL(url);
    return { isValid: true, errors: [] };
  } catch {
    return { isValid: false, errors: ['Invalid URL format'] };
  }
}

export function sanitizeInput(input: string): string {
  // Remove dangerous/null control characters while preserving formatting:
  // \x09 (tab), \x0A (newline), \x0D (carriage return) are kept.
  // \x00-\x08, \x0B-\x0C, \x0E-\x1F, \x7F are stripped.
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .slice(0, 10000); // Limit length
}