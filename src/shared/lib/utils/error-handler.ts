/**
 * Centralized Error Handler
 *
 * Provides standardized error handling with:
 * - Error codes for different scenarios
 * - User-friendly error messages
 * - Integration with logger
 * - Preparation for Sentry/LogRocket
 * - Toast notifications
 */

import toast from 'react-hot-toast';
import { logger } from './logger';
import {
  getErrorMessage,
  getErrorStatus,
  isClientError,
  isServerError,
  type ApiErrorResponse
} from '@/shared/types/errors';

/**
 * Application error codes
 */
export enum ErrorCode {
  // Authentication & Authorization
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN = 'AUTH_FORBIDDEN',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',

  // Network & API
  NETWORK_ERROR = 'NETWORK_ERROR',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  API_SERVER_ERROR = 'API_SERVER_ERROR',
  API_NOT_FOUND = 'API_NOT_FOUND',
  API_BAD_REQUEST = 'API_BAD_REQUEST',
  API_RATE_LIMIT = 'API_RATE_LIMIT',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',

  // Business Logic
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',

  // File Operations
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  FILE_DOWNLOAD_ERROR = 'FILE_DOWNLOAD_ERROR',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_INVALID_TYPE = 'FILE_INVALID_TYPE',

  // WebSocket
  WEBSOCKET_CONNECTION_ERROR = 'WEBSOCKET_CONNECTION_ERROR',
  WEBSOCKET_DISCONNECTED = 'WEBSOCKET_DISCONNECTED',

  // Payment & Billing
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',

  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Severity levels for errors
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Application error class with enhanced information
 */
export class AppError extends Error {
  code: ErrorCode;
  severity: ErrorSeverity;
  statusCode?: number;
  originalError?: unknown;
  context?: Record<string, unknown>;
  timestamp: Date;
  userMessage: string;

  constructor(
    code: ErrorCode,
    message: string,
    userMessage: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    statusCode?: number,
    originalError?: unknown,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date();
    this.userMessage = userMessage;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * User-friendly error messages mapping
 */
const USER_FRIENDLY_MESSAGES: Record<ErrorCode, string> = {
  // Authentication
  [ErrorCode.AUTH_UNAUTHORIZED]: 'Необходима авторизация. Пожалуйста, войдите в систему',
  [ErrorCode.AUTH_FORBIDDEN]: 'У вас нет доступа к этому ресурсу',
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Сессия истекла. Пожалуйста, войдите снова',
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Неверный логин или пароль',
  [ErrorCode.AUTH_SESSION_EXPIRED]: 'Ваша сессия истекла. Пожалуйста, войдите снова',

  // Network & API
  [ErrorCode.NETWORK_ERROR]: 'Проблема с подключением к серверу. Проверьте интернет-соединение',
  [ErrorCode.NETWORK_TIMEOUT]: 'Превышено время ожидания ответа от сервера',
  [ErrorCode.API_SERVER_ERROR]: 'Ошибка сервера. Пожалуйста, попробуйте позже',
  [ErrorCode.API_NOT_FOUND]: 'Запрошенный ресурс не найден',
  [ErrorCode.API_BAD_REQUEST]: 'Некорректный запрос. Пожалуйста, проверьте данные',
  [ErrorCode.API_RATE_LIMIT]: 'Слишком много запросов. Пожалуйста, подождите',

  // Validation
  [ErrorCode.VALIDATION_ERROR]: 'Ошибка валидации данных. Проверьте введенные данные',
  [ErrorCode.VALIDATION_REQUIRED_FIELD]: 'Пожалуйста, заполните все обязательные поля',
  [ErrorCode.VALIDATION_INVALID_FORMAT]: 'Неверный формат данных',

  // Business Logic
  [ErrorCode.BUSINESS_LOGIC_ERROR]: 'Не удалось выполнить операцию',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'Недостаточно прав для выполнения операции',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Запрошенный ресурс не найден',
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 'Такой ресурс уже существует',

  // File Operations
  [ErrorCode.FILE_UPLOAD_ERROR]: 'Ошибка при загрузке файла',
  [ErrorCode.FILE_DOWNLOAD_ERROR]: 'Ошибка при скачивании файла',
  [ErrorCode.FILE_TOO_LARGE]: 'Файл слишком большой',
  [ErrorCode.FILE_INVALID_TYPE]: 'Неподдерживаемый тип файла',

  // WebSocket
  [ErrorCode.WEBSOCKET_CONNECTION_ERROR]: 'Ошибка подключения к серверу в реальном времени',
  [ErrorCode.WEBSOCKET_DISCONNECTED]: 'Соединение с сервером потеряно',

  // Payment & Billing
  [ErrorCode.PAYMENT_ERROR]: 'Ошибка при обработке платежа',
  [ErrorCode.PAYMENT_FAILED]: 'Платеж не прошел. Пожалуйста, попробуйте снова',
  [ErrorCode.INSUFFICIENT_BALANCE]: 'Недостаточно средств на балансе',

  // Generic
  [ErrorCode.UNKNOWN_ERROR]: 'Произошла неизвестная ошибка',
  [ErrorCode.INTERNAL_ERROR]: 'Внутренняя ошибка приложения',
};

/**
 * Map HTTP status codes to error codes
 */
function mapStatusToErrorCode(status?: number): ErrorCode {
  if (!status) return ErrorCode.UNKNOWN_ERROR;

  switch (status) {
    case 400:
      return ErrorCode.API_BAD_REQUEST;
    case 401:
      return ErrorCode.AUTH_UNAUTHORIZED;
    case 403:
      return ErrorCode.AUTH_FORBIDDEN;
    case 404:
      return ErrorCode.API_NOT_FOUND;
    case 429:
      return ErrorCode.API_RATE_LIMIT;
    case 500:
    case 502:
    case 503:
    case 504:
      return ErrorCode.API_SERVER_ERROR;
    default:
      if (status >= 400 && status < 500) {
        return ErrorCode.API_BAD_REQUEST;
      }
      if (status >= 500) {
        return ErrorCode.API_SERVER_ERROR;
      }
      return ErrorCode.UNKNOWN_ERROR;
  }
}

/**
 * Determine error severity based on error code and status
 */
function determineErrorSeverity(code: ErrorCode, status?: number): ErrorSeverity {
  // Critical errors
  if (
    code === ErrorCode.INTERNAL_ERROR ||
    code === ErrorCode.API_SERVER_ERROR ||
    (status && status >= 500)
  ) {
    return ErrorSeverity.CRITICAL;
  }

  // High severity
  if (
    code === ErrorCode.AUTH_UNAUTHORIZED ||
    code === ErrorCode.AUTH_FORBIDDEN ||
    code === ErrorCode.PAYMENT_FAILED ||
    code === ErrorCode.WEBSOCKET_CONNECTION_ERROR
  ) {
    return ErrorSeverity.HIGH;
  }

  // Low severity
  if (
    code === ErrorCode.VALIDATION_ERROR ||
    code === ErrorCode.API_NOT_FOUND
  ) {
    return ErrorSeverity.LOW;
  }

  // Default to medium
  return ErrorSeverity.MEDIUM;
}

/**
 * Options for error handling
 */
export interface HandleErrorOptions {
  /** Show toast notification to user */
  showToast?: boolean;
  /** Custom user message (overrides default) */
  customMessage?: string;
  /** Additional context for logging */
  context?: Record<string, unknown>;
  /** Whether to log the error */
  logError?: boolean;
  /** Callback after error is handled */
  onError?: (error: AppError) => void;
  /** Report to external service (Sentry, etc.) */
  reportToService?: boolean;
}

/**
 * Main error handler function
 * Converts any error to AppError and handles it consistently
 */
export function handleError(
  error: unknown,
  options: HandleErrorOptions = {}
): AppError {
  const {
    showToast = true,
    customMessage,
    context,
    logError = true,
    onError,
    reportToService = false,
  } = options;

  let appError: AppError;

  // If it's already an AppError, use it
  if (error instanceof AppError) {
    appError = error;
  } else {
    // Extract information from unknown error
    const message = getErrorMessage(error);
    const status = getErrorStatus(error);
    const code = mapStatusToErrorCode(status);
    const severity = determineErrorSeverity(code, status);
    const userMessage = customMessage || USER_FRIENDLY_MESSAGES[code];

    // Create AppError
    appError = new AppError(
      code,
      message,
      userMessage,
      severity,
      status,
      error,
      context
    );
  }

  // Log error based on severity
  if (logError) {
    const logContext = {
      code: appError.code,
      severity: appError.severity,
      statusCode: appError.statusCode,
      timestamp: appError.timestamp,
      ...appError.context,
    };

    switch (appError.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        logger.error(appError.message, appError.originalError as Error, logContext);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(appError.message, logContext);
        break;
      case ErrorSeverity.LOW:
        logger.info(appError.message, logContext);
        break;
    }
  }

  // Show toast notification
  if (showToast) {
    const toastMessage = customMessage || appError.userMessage;

    switch (appError.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        toast.error(toastMessage, { duration: 5000 });
        break;
      case ErrorSeverity.MEDIUM:
        toast.error(toastMessage);
        break;
      case ErrorSeverity.LOW:
        toast(toastMessage);
        break;
    }
  }

  // Report to external service (Sentry, LogRocket, etc.)
  if (reportToService && appError.severity >= ErrorSeverity.HIGH) {
    reportErrorToService(appError);
  }

  // Execute callback
  if (onError) {
    onError(appError);
  }

  return appError;
}

/**
 * Report error to external monitoring service
 * Currently a placeholder for Sentry/LogRocket integration
 */
function reportErrorToService(error: AppError): void {
  // TODO: Integrate with Sentry or LogRocket
  // Example with Sentry:
  // Sentry.captureException(error.originalError || error, {
  //   level: error.severity,
  //   tags: {
  //     errorCode: error.code,
  //     statusCode: error.statusCode?.toString(),
  //   },
  //   extra: error.context,
  // });

  logger.debug('Error ready for external service reporting', {
    code: error.code,
    severity: error.severity,
    message: error.message,
  });
}

/**
 * Create a standardized error for specific scenarios
 */
export const createError = {
  /** Authentication errors */
  auth: {
    unauthorized: (context?: Record<string, unknown>) =>
      new AppError(
        ErrorCode.AUTH_UNAUTHORIZED,
        'User is not authenticated',
        USER_FRIENDLY_MESSAGES[ErrorCode.AUTH_UNAUTHORIZED],
        ErrorSeverity.HIGH,
        401,
        undefined,
        context
      ),

    forbidden: (context?: Record<string, unknown>) =>
      new AppError(
        ErrorCode.AUTH_FORBIDDEN,
        'User does not have permission',
        USER_FRIENDLY_MESSAGES[ErrorCode.AUTH_FORBIDDEN],
        ErrorSeverity.HIGH,
        403,
        undefined,
        context
      ),

    sessionExpired: (context?: Record<string, unknown>) =>
      new AppError(
        ErrorCode.AUTH_SESSION_EXPIRED,
        'Session has expired',
        USER_FRIENDLY_MESSAGES[ErrorCode.AUTH_SESSION_EXPIRED],
        ErrorSeverity.HIGH,
        401,
        undefined,
        context
      ),
  },

  /** Network errors */
  network: {
    connectionError: (context?: Record<string, unknown>) =>
      new AppError(
        ErrorCode.NETWORK_ERROR,
        'Network connection error',
        USER_FRIENDLY_MESSAGES[ErrorCode.NETWORK_ERROR],
        ErrorSeverity.MEDIUM,
        undefined,
        undefined,
        context
      ),

    timeout: (context?: Record<string, unknown>) =>
      new AppError(
        ErrorCode.NETWORK_TIMEOUT,
        'Request timeout',
        USER_FRIENDLY_MESSAGES[ErrorCode.NETWORK_TIMEOUT],
        ErrorSeverity.MEDIUM,
        undefined,
        undefined,
        context
      ),
  },

  /** Validation errors */
  validation: {
    invalidFormat: (field: string, context?: Record<string, unknown>) =>
      new AppError(
        ErrorCode.VALIDATION_INVALID_FORMAT,
        `Invalid format for field: ${field}`,
        USER_FRIENDLY_MESSAGES[ErrorCode.VALIDATION_INVALID_FORMAT],
        ErrorSeverity.LOW,
        400,
        undefined,
        { field, ...context }
      ),

    requiredField: (field: string, context?: Record<string, unknown>) =>
      new AppError(
        ErrorCode.VALIDATION_REQUIRED_FIELD,
        `Required field missing: ${field}`,
        USER_FRIENDLY_MESSAGES[ErrorCode.VALIDATION_REQUIRED_FIELD],
        ErrorSeverity.LOW,
        400,
        undefined,
        { field, ...context }
      ),
  },

  /** File operation errors */
  file: {
    uploadError: (filename: string, context?: Record<string, unknown>) =>
      new AppError(
        ErrorCode.FILE_UPLOAD_ERROR,
        `File upload failed: ${filename}`,
        USER_FRIENDLY_MESSAGES[ErrorCode.FILE_UPLOAD_ERROR],
        ErrorSeverity.MEDIUM,
        undefined,
        undefined,
        { filename, ...context }
      ),

    tooLarge: (filename: string, maxSize: number, context?: Record<string, unknown>) =>
      new AppError(
        ErrorCode.FILE_TOO_LARGE,
        `File too large: ${filename} (max: ${maxSize})`,
        `${USER_FRIENDLY_MESSAGES[ErrorCode.FILE_TOO_LARGE]}. Максимальный размер: ${maxSize / 1024 / 1024}MB`,
        ErrorSeverity.LOW,
        400,
        undefined,
        { filename, maxSize, ...context }
      ),
  },

  /** WebSocket errors */
  websocket: {
    connectionError: (context?: Record<string, unknown>) =>
      new AppError(
        ErrorCode.WEBSOCKET_CONNECTION_ERROR,
        'WebSocket connection failed',
        USER_FRIENDLY_MESSAGES[ErrorCode.WEBSOCKET_CONNECTION_ERROR],
        ErrorSeverity.HIGH,
        undefined,
        undefined,
        context
      ),

    disconnected: (context?: Record<string, unknown>) =>
      new AppError(
        ErrorCode.WEBSOCKET_DISCONNECTED,
        'WebSocket disconnected',
        USER_FRIENDLY_MESSAGES[ErrorCode.WEBSOCKET_DISCONNECTED],
        ErrorSeverity.MEDIUM,
        undefined,
        undefined,
        context
      ),
  },

  /** Payment errors */
  payment: {
    failed: (reason: string, context?: Record<string, unknown>) =>
      new AppError(
        ErrorCode.PAYMENT_FAILED,
        `Payment failed: ${reason}`,
        USER_FRIENDLY_MESSAGES[ErrorCode.PAYMENT_FAILED],
        ErrorSeverity.HIGH,
        undefined,
        undefined,
        { reason, ...context }
      ),

    insufficientBalance: (context?: Record<string, unknown>) =>
      new AppError(
        ErrorCode.INSUFFICIENT_BALANCE,
        'Insufficient balance',
        USER_FRIENDLY_MESSAGES[ErrorCode.INSUFFICIENT_BALANCE],
        ErrorSeverity.MEDIUM,
        400,
        undefined,
        context
      ),
  },
};

/**
 * Utility to check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const status = getErrorStatus(error);

  // Retry on network errors and 5xx errors
  if (!status || status >= 500) {
    return true;
  }

  // Retry on rate limiting
  if (status === 429) {
    return true;
  }

  // Don't retry client errors (4xx except 429)
  return false;
}

/**
 * Get user-friendly message for error code
 */
export function getUserMessage(code: ErrorCode): string {
  return USER_FRIENDLY_MESSAGES[code] || USER_FRIENDLY_MESSAGES[ErrorCode.UNKNOWN_ERROR];
}
