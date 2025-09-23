import { toast } from 'react-hot-toast';

export interface ClientError {
  message: string;
  code?: string;
  details?: any;
}

export const handleClientError = (error: unknown, fallbackMessage: string = 'An unexpected error occurred'): void => {
  console.error('Client Error:', error);

  if (error instanceof Error) {
    toast.error(error.message || fallbackMessage);
  } else if (typeof error === 'string') {
    toast.error(error);
  } else if (isApiError(error)) {
    toast.error(error.message || fallbackMessage);
  } else {
    toast.error(fallbackMessage);
  }
};

export const isApiError = (error: unknown): error is ClientError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ClientError).message === 'string'
  );
};

export const showSuccess = (message: string): void => {
  toast.success(message);
};

export const showError = (message: string): void => {
  toast.error(message);
};

export const showInfo = (message: string): void => {
  toast(message, {
    icon: 'ℹ️',
  });
};

export const showLoading = (message: string = 'Loading...'): string => {
  return toast.loading(message);
};

export const dismissToast = (toastId: string): void => {
  toast.dismiss(toastId);
};

export const updateToast = (toastId: string, message: string, type: 'success' | 'error' | 'loading' = 'success'): void => {
  toast[type](message, { id: toastId });
};

// Error boundary helper
export const logError = (error: Error, errorInfo: any): void => {
  console.error('Error caught by error boundary:', error, errorInfo);
};

// Validation helpers
export const validateForm = (formData: Record<string, any>, rules: Record<string, ValidationRule>): ValidationResult => {
  const errors: Record<string, string> = {};
  const validatedData: Record<string, any> = {};

  for (const [field, rule] of Object.entries(rules)) {
    const value = formData[field];

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
      continue;
    }

    // Skip validation if field is empty and not required
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Check string length
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = `${field} must be at least ${rule.minLength} characters`;
      continue;
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `${field} must not exceed ${rule.maxLength} characters`;
      continue;
    }

    // Check email format
    if (rule.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors[field] = 'Please enter a valid email address';
        continue;
      }
    }

    // Check custom validation
    if (rule.validate && !rule.validate(value)) {
      errors[field] = rule.errorMessage || `${field} is invalid`;
      continue;
    }

    validatedData[field] = value;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: validatedData,
  };
};

export interface ValidationRule {
  required?: boolean;
  type?: 'email' | 'string' | 'number';
  minLength?: number;
  maxLength?: number;
  validate?: (value: any) => boolean;
  errorMessage?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  data: Record<string, any>;
}
