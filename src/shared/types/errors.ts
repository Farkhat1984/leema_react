/**
 * Error Type Definitions
 *
 * Centralized error types for type-safe error handling across the application
 */

/**
 * Base error interface for all API errors
 */
export interface ApiErrorResponse {
  message: string;
  status?: number;
  statusText?: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * HTTP Response error interface
 */
export interface HttpError {
  response?: {
    status: number;
    statusText?: string;
    data?: {
      message?: string;
      error?: string;
      details?: Record<string, unknown>;
    };
  };
  message: string;
  code?: string;
}

/**
 * Type guard to check if an error is an HttpError
 */
export function isHttpError(error: unknown): error is HttpError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as HttpError).message === 'string'
  );
}

/**
 * Type guard to check if error has response property
 */
export function hasErrorResponse(error: unknown): error is { response: { status: number } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response: unknown }).response === 'object' &&
    (error as { response: unknown }).response !== null &&
    'status' in (error as { response: { status: unknown } }).response &&
    typeof (error as { response: { status: unknown } }).response.status === 'number'
  );
}

/**
 * Extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (isHttpError(error)) {
    return error.response?.data?.message || error.response?.data?.error || error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }

  return 'An unknown error occurred';
}

/**
 * Extract error status code from unknown error
 */
export function getErrorStatus(error: unknown): number | undefined {
  if (hasErrorResponse(error)) {
    return error.response.status;
  }

  if (isHttpError(error)) {
    return error.response?.status;
  }

  return undefined;
}

/**
 * Check if error is a 4xx client error
 */
export function isClientError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status !== undefined && status >= 400 && status < 500;
}

/**
 * Check if error is a 5xx server error
 */
export function isServerError(error: unknown): boolean {
  const status = getErrorStatus(error);
  return status !== undefined && status >= 500 && status < 600;
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Type guard for validation errors
 */
export function isValidationError(error: unknown): error is { errors: ValidationError[] } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'errors' in error &&
    Array.isArray((error as { errors: unknown }).errors)
  );
}
