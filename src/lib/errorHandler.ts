import { NextResponse } from 'next/server';

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: any;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

export const handleApiError = (error: unknown): NextResponse => {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    },
    { status: 500 }
  );
};

export const createErrorResponse = (
  message: string,
  statusCode: number = 500,
  code: string = 'INTERNAL_ERROR',
  details?: any
): NextResponse => {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
      details,
    },
    { status: statusCode }
  );
};

export const validateRequired = (value: any, fieldName: string): void => {
  if (value === undefined || value === null || value === '') {
    throw new AppError(`${fieldName} is required`, 400, 'MISSING_REQUIRED_FIELD', { field: fieldName });
  }
};

export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Invalid email format', 400, 'INVALID_EMAIL_FORMAT', { email });
  }
};

export const validateStringLength = (value: string, fieldName: string, min: number, max: number): void => {
  if (value.length < min) {
    throw new AppError(`${fieldName} must be at least ${min} characters long`, 400, 'STRING_TOO_SHORT', {
      field: fieldName,
      min,
      actual: value.length
    });
  }
  if (value.length > max) {
    throw new AppError(`${fieldName} must not exceed ${max} characters`, 400, 'STRING_TOO_LONG', {
      field: fieldName,
      max,
      actual: value.length
    });
  }
};

export const validateEnum = <T extends Record<string, string | number>>(
  value: string,
  enumObject: T,
  fieldName: string
): void => {
  const validValues = Object.values(enumObject);
  if (!validValues.includes(value as T[keyof T])) {
    throw new AppError(`Invalid ${fieldName}. Must be one of: ${validValues.join(', ')}`, 400, 'INVALID_ENUM_VALUE', {
      field: fieldName,
      value,
      validValues
    });
  }
};

// Common error types
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'You are not authorized to perform this action',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database operation failed',
  EXTERNAL_API_ERROR: 'External service unavailable',
} as const;
