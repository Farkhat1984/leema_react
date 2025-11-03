/**
 * Unit Tests for Error Handler
 *
 * Tests handleError function, error code mapping, user-friendly messages,
 * logger integration, and error creation utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  handleError,
  ErrorCode,
  ErrorSeverity,
  AppError,
  createError,
  isRetryableError,
  getUserMessage,
  type HandleErrorOptions,
} from './error-handler';
import { logger } from './logger';
import toast from 'react-hot-toast';

// Mock logger
vi.mock('./logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock toast
vi.mock('react-hot-toast', () => {
  const toastFn = vi.fn();
  toastFn.error = vi.fn();
  toastFn.success = vi.fn();
  toastFn.loading = vi.fn();
  return {
    default: toastFn,
  };
});

describe('Error Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AppError Class', () => {
    it('should create AppError with all properties', () => {
      const error = new AppError(
        ErrorCode.API_BAD_REQUEST,
        'Technical message',
        'User-friendly message',
        ErrorSeverity.MEDIUM,
        400,
        new Error('Original error'),
        { url: '/api/test' }
      );

      expect(error.name).toBe('AppError');
      expect(error.code).toBe(ErrorCode.API_BAD_REQUEST);
      expect(error.message).toBe('Technical message');
      expect(error.userMessage).toBe('User-friendly message');
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.statusCode).toBe(400);
      expect(error.originalError).toBeInstanceOf(Error);
      expect(error.context).toEqual({ url: '/api/test' });
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should create AppError with minimal properties', () => {
      const error = new AppError(
        ErrorCode.UNKNOWN_ERROR,
        'Something went wrong',
        'Unknown error occurred'
      );

      expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(error.message).toBe('Something went wrong');
      expect(error.severity).toBe(ErrorSeverity.MEDIUM); // Default
      expect(error.statusCode).toBeUndefined();
      expect(error.originalError).toBeUndefined();
      expect(error.context).toBeUndefined();
    });

    it('should maintain stack trace', () => {
      const error = new AppError(
        ErrorCode.INTERNAL_ERROR,
        'Internal error',
        'Internal error occurred'
      );

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  describe('handleError Function', () => {
    describe('Error conversion', () => {
      it('should handle AppError instances', () => {
        const appError = new AppError(
          ErrorCode.API_NOT_FOUND,
          'Resource not found',
          'The requested resource was not found'
        );

        const result = handleError(appError, { showToast: false, logError: false });

        expect(result).toBe(appError);
        expect(result.code).toBe(ErrorCode.API_NOT_FOUND);
      });

      it('should convert Error objects to AppError', () => {
        const error = new Error('Standard error');

        const result = handleError(error, { showToast: false, logError: false });

        expect(result).toBeInstanceOf(AppError);
        expect(result.message).toBe('Standard error');
        expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
      });

      it('should convert HTTP errors with status codes', () => {
        const httpError = {
          response: {
            status: 404,
            data: { message: 'Not found' },
          },
          message: 'Request failed with status code 404',
        };

        const result = handleError(httpError, { showToast: false, logError: false });

        expect(result.code).toBe(ErrorCode.API_NOT_FOUND);
        expect(result.statusCode).toBe(404);
      });

      it('should convert string errors to AppError', () => {
        const result = handleError('Simple error string', { showToast: false, logError: false });

        expect(result).toBeInstanceOf(AppError);
        expect(result.message).toBe('Simple error string');
      });

      it('should handle unknown error types', () => {
        const result = handleError({ unknown: 'object' }, { showToast: false, logError: false });

        expect(result).toBeInstanceOf(AppError);
        expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
      });
    });

    describe('Error code mapping from HTTP status', () => {
      it('should map 400 to API_BAD_REQUEST', () => {
        const error = { response: { status: 400 }, message: 'Bad request' };
        const result = handleError(error, { showToast: false, logError: false });

        expect(result.code).toBe(ErrorCode.API_BAD_REQUEST);
      });

      it('should map 401 to AUTH_UNAUTHORIZED', () => {
        const error = { response: { status: 401 }, message: 'Unauthorized' };
        const result = handleError(error, { showToast: false, logError: false });

        expect(result.code).toBe(ErrorCode.AUTH_UNAUTHORIZED);
      });

      it('should map 403 to AUTH_FORBIDDEN', () => {
        const error = { response: { status: 403 }, message: 'Forbidden' };
        const result = handleError(error, { showToast: false, logError: false });

        expect(result.code).toBe(ErrorCode.AUTH_FORBIDDEN);
      });

      it('should map 404 to API_NOT_FOUND', () => {
        const error = { response: { status: 404 }, message: 'Not found' };
        const result = handleError(error, { showToast: false, logError: false });

        expect(result.code).toBe(ErrorCode.API_NOT_FOUND);
      });

      it('should map 429 to API_RATE_LIMIT', () => {
        const error = { response: { status: 429 }, message: 'Too many requests' };
        const result = handleError(error, { showToast: false, logError: false });

        expect(result.code).toBe(ErrorCode.API_RATE_LIMIT);
      });

      it('should map 500 to API_SERVER_ERROR', () => {
        const error = { response: { status: 500 }, message: 'Server error' };
        const result = handleError(error, { showToast: false, logError: false });

        expect(result.code).toBe(ErrorCode.API_SERVER_ERROR);
      });

      it('should map 502 to API_SERVER_ERROR', () => {
        const error = { response: { status: 502 }, message: 'Bad gateway' };
        const result = handleError(error, { showToast: false, logError: false });

        expect(result.code).toBe(ErrorCode.API_SERVER_ERROR);
      });

      it('should map other 4xx to API_BAD_REQUEST', () => {
        const error = { response: { status: 422 }, message: 'Unprocessable entity' };
        const result = handleError(error, { showToast: false, logError: false });

        expect(result.code).toBe(ErrorCode.API_BAD_REQUEST);
      });

      it('should map other 5xx to API_SERVER_ERROR', () => {
        const error = { response: { status: 503 }, message: 'Service unavailable' };
        const result = handleError(error, { showToast: false, logError: false });

        expect(result.code).toBe(ErrorCode.API_SERVER_ERROR);
      });
    });

    describe('Error severity determination', () => {
      it('should assign CRITICAL severity to server errors', () => {
        const error = { response: { status: 500 }, message: 'Server error' };
        const result = handleError(error, { showToast: false, logError: false });

        expect(result.severity).toBe(ErrorSeverity.CRITICAL);
      });

      it('should assign HIGH severity to auth errors', () => {
        const error = { response: { status: 401 }, message: 'Unauthorized' };
        const result = handleError(error, { showToast: false, logError: false });

        expect(result.severity).toBe(ErrorSeverity.HIGH);
      });

      it('should assign LOW severity to validation errors', () => {
        const error = { response: { status: 404 }, message: 'Not found' };
        const result = handleError(error, { showToast: false, logError: false });

        expect(result.severity).toBe(ErrorSeverity.LOW);
      });

      it('should assign MEDIUM severity to other errors', () => {
        const error = new Error('Some error');
        const result = handleError(error, { showToast: false, logError: false });

        expect(result.severity).toBe(ErrorSeverity.MEDIUM);
      });
    });

    describe('Logging integration', () => {
      it('should log CRITICAL errors with logger.error', () => {
        const error = { response: { status: 500 }, message: 'Server error' };
        handleError(error, { showToast: false, logError: true });

        expect(logger.error).toHaveBeenCalled();
      });

      it('should log HIGH severity errors with logger.error', () => {
        const error = { response: { status: 401 }, message: 'Unauthorized' };
        handleError(error, { showToast: false, logError: true });

        expect(logger.error).toHaveBeenCalled();
      });

      it('should log MEDIUM severity errors with logger.warn', () => {
        const error = new Error('Medium error');
        handleError(error, { showToast: false, logError: true });

        expect(logger.warn).toHaveBeenCalled();
      });

      it('should log LOW severity errors with logger.info', () => {
        const error = { response: { status: 404 }, message: 'Not found' };
        handleError(error, { showToast: false, logError: true });

        expect(logger.info).toHaveBeenCalled();
      });

      it('should not log when logError is false', () => {
        const error = new Error('Test error');
        handleError(error, { showToast: false, logError: false });

        expect(logger.error).not.toHaveBeenCalled();
        expect(logger.warn).not.toHaveBeenCalled();
        expect(logger.info).not.toHaveBeenCalled();
      });

      it('should include context in log', () => {
        const error = new Error('Test error');
        handleError(error, {
          showToast: false,
          logError: true,
          context: { userId: 123, action: 'test' },
        });

        expect(logger.warn).toHaveBeenCalledWith(
          'Test error',
          expect.objectContaining({
            userId: 123,
            action: 'test',
          })
        );
      });
    });

    describe('Toast notifications', () => {
      it('should show error toast for CRITICAL errors', () => {
        const error = { response: { status: 500 }, message: 'Server error' };
        handleError(error, { showToast: true, logError: false });

        expect(toast.error).toHaveBeenCalledWith(
          expect.any(String),
          { duration: 5000 }
        );
      });

      it('should show error toast for HIGH severity errors', () => {
        const error = { response: { status: 401 }, message: 'Unauthorized' };
        handleError(error, { showToast: true, logError: false });

        expect(toast.error).toHaveBeenCalledWith(
          expect.any(String),
          { duration: 5000 }
        );
      });

      it('should show error toast for MEDIUM severity errors', () => {
        const error = new Error('Medium error');
        handleError(error, { showToast: true, logError: false });

        expect(toast.error).toHaveBeenCalledWith(expect.any(String));
      });

      it('should not show toast when showToast is false', () => {
        const error = new Error('Test error');
        handleError(error, { showToast: false, logError: false });

        expect(toast.error).not.toHaveBeenCalled();
      });

      it('should use custom message when provided', () => {
        const error = new Error('Technical error');
        handleError(error, {
          showToast: true,
          logError: false,
          customMessage: 'Custom user message',
        });

        expect(toast.error).toHaveBeenCalledWith('Custom user message');
      });

      it('should use default user-friendly message', () => {
        const error = { response: { status: 404 }, message: 'Not found' };
        handleError(error, { showToast: true, logError: false });

        expect(toast).toHaveBeenCalledWith('Запрошенный ресурс не найден');
      });
    });

    describe('Error callback', () => {
      it('should execute onError callback', () => {
        const onError = vi.fn();
        const error = new Error('Test error');

        handleError(error, { showToast: false, logError: false, onError });

        expect(onError).toHaveBeenCalledWith(expect.any(AppError));
      });

      it('should pass AppError to callback', () => {
        const onError = vi.fn();
        const error = new Error('Test error');

        handleError(error, { showToast: false, logError: false, onError });

        const callArg = onError.mock.calls[0][0];
        expect(callArg).toBeInstanceOf(AppError);
        expect(callArg.message).toBe('Test error');
      });
    });

    describe('External service reporting', () => {
      it('should prepare for reporting HIGH severity errors', () => {
        const error = { response: { status: 401 }, message: 'Unauthorized' };
        handleError(error, { showToast: false, logError: false, reportToService: true });

        expect(logger.debug).toHaveBeenCalledWith(
          'Error ready for external service reporting',
          expect.any(Object)
        );
      });

      it('should not report LOW severity errors', () => {
        const error = { response: { status: 404 }, message: 'Not found' };
        handleError(error, { showToast: false, logError: false, reportToService: true });

        // LOW severity shouldn't trigger reporting
        expect(logger.debug).not.toHaveBeenCalledWith(
          'Error ready for external service reporting',
          expect.any(Object)
        );
      });

      it('should not report when reportToService is false', () => {
        const error = { response: { status: 500 }, message: 'Server error' };
        handleError(error, { showToast: false, logError: false, reportToService: false });

        expect(logger.debug).not.toHaveBeenCalledWith(
          'Error ready for external service reporting',
          expect.any(Object)
        );
      });
    });
  });

  describe('createError Utility', () => {
    describe('Auth errors', () => {
      it('should create unauthorized error', () => {
        const error = createError.auth.unauthorized({ userId: 123 });

        expect(error.code).toBe(ErrorCode.AUTH_UNAUTHORIZED);
        expect(error.severity).toBe(ErrorSeverity.HIGH);
        expect(error.statusCode).toBe(401);
        expect(error.context).toEqual({ userId: 123 });
      });

      it('should create forbidden error', () => {
        const error = createError.auth.forbidden();

        expect(error.code).toBe(ErrorCode.AUTH_FORBIDDEN);
        expect(error.severity).toBe(ErrorSeverity.HIGH);
        expect(error.statusCode).toBe(403);
      });

      it('should create session expired error', () => {
        const error = createError.auth.sessionExpired();

        expect(error.code).toBe(ErrorCode.AUTH_SESSION_EXPIRED);
        expect(error.severity).toBe(ErrorSeverity.HIGH);
        expect(error.statusCode).toBe(401);
      });
    });

    describe('Network errors', () => {
      it('should create connection error', () => {
        const error = createError.network.connectionError({ url: '/api/test' });

        expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
        expect(error.severity).toBe(ErrorSeverity.MEDIUM);
        expect(error.context).toEqual({ url: '/api/test' });
      });

      it('should create timeout error', () => {
        const error = createError.network.timeout();

        expect(error.code).toBe(ErrorCode.NETWORK_TIMEOUT);
        expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      });
    });

    describe('Validation errors', () => {
      it('should create invalid format error', () => {
        const error = createError.validation.invalidFormat('email');

        expect(error.code).toBe(ErrorCode.VALIDATION_INVALID_FORMAT);
        expect(error.severity).toBe(ErrorSeverity.LOW);
        expect(error.statusCode).toBe(400);
        expect(error.context).toEqual({ field: 'email' });
      });

      it('should create required field error', () => {
        const error = createError.validation.requiredField('password');

        expect(error.code).toBe(ErrorCode.VALIDATION_REQUIRED_FIELD);
        expect(error.severity).toBe(ErrorSeverity.LOW);
        expect(error.statusCode).toBe(400);
        expect(error.context).toEqual({ field: 'password' });
      });
    });

    describe('File errors', () => {
      it('should create upload error', () => {
        const error = createError.file.uploadError('image.jpg');

        expect(error.code).toBe(ErrorCode.FILE_UPLOAD_ERROR);
        expect(error.severity).toBe(ErrorSeverity.MEDIUM);
        expect(error.context).toEqual({ filename: 'image.jpg' });
      });

      it('should create file too large error', () => {
        const error = createError.file.tooLarge('video.mp4', 10485760);

        expect(error.code).toBe(ErrorCode.FILE_TOO_LARGE);
        expect(error.severity).toBe(ErrorSeverity.LOW);
        expect(error.statusCode).toBe(400);
        expect(error.context).toEqual({ filename: 'video.mp4', maxSize: 10485760 });
        expect(error.userMessage).toContain('10MB');
      });
    });

    describe('WebSocket errors', () => {
      it('should create connection error', () => {
        const error = createError.websocket.connectionError();

        expect(error.code).toBe(ErrorCode.WEBSOCKET_CONNECTION_ERROR);
        expect(error.severity).toBe(ErrorSeverity.HIGH);
      });

      it('should create disconnected error', () => {
        const error = createError.websocket.disconnected();

        expect(error.code).toBe(ErrorCode.WEBSOCKET_DISCONNECTED);
        expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      });
    });

    describe('Payment errors', () => {
      it('should create payment failed error', () => {
        const error = createError.payment.failed('Insufficient funds');

        expect(error.code).toBe(ErrorCode.PAYMENT_FAILED);
        expect(error.severity).toBe(ErrorSeverity.HIGH);
        expect(error.context).toEqual({ reason: 'Insufficient funds' });
      });

      it('should create insufficient balance error', () => {
        const error = createError.payment.insufficientBalance({ balance: 1000 });

        expect(error.code).toBe(ErrorCode.INSUFFICIENT_BALANCE);
        expect(error.severity).toBe(ErrorSeverity.MEDIUM);
        expect(error.statusCode).toBe(400);
        expect(error.context).toEqual({ balance: 1000 });
      });
    });
  });

  describe('isRetryableError Utility', () => {
    it('should return true for 5xx errors', () => {
      const error = { response: { status: 500 } };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for 429 Rate Limit', () => {
      const error = { response: { status: 429 } };
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for network errors (no status)', () => {
      const error = new Error('Network error');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for 4xx client errors (except 429)', () => {
      expect(isRetryableError({ response: { status: 400 } })).toBe(false);
      expect(isRetryableError({ response: { status: 401 } })).toBe(false);
      expect(isRetryableError({ response: { status: 403 } })).toBe(false);
      expect(isRetryableError({ response: { status: 404 } })).toBe(false);
    });

    it('should return true for errors without response', () => {
      expect(isRetryableError({})).toBe(true);
      expect(isRetryableError(null)).toBe(true);
    });
  });

  describe('getUserMessage Utility', () => {
    it('should return user message for valid error code', () => {
      const message = getUserMessage(ErrorCode.AUTH_UNAUTHORIZED);
      expect(message).toBe('Необходима авторизация. Пожалуйста, войдите в систему');
    });

    it('should return default message for unknown error code', () => {
      const message = getUserMessage('INVALID_CODE' as ErrorCode);
      expect(message).toBe('Произошла неизвестная ошибка');
    });

    it('should return messages for all error codes', () => {
      // Test a few key error codes
      expect(getUserMessage(ErrorCode.NETWORK_ERROR)).toContain('Проблема с подключением');
      expect(getUserMessage(ErrorCode.API_NOT_FOUND)).toContain('не найден');
      expect(getUserMessage(ErrorCode.VALIDATION_ERROR)).toContain('валидации');
      expect(getUserMessage(ErrorCode.PAYMENT_FAILED)).toContain('Платеж не прошел');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null error', () => {
      const result = handleError(null, { showToast: false, logError: false });

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
    });

    it('should handle undefined error', () => {
      const result = handleError(undefined, { showToast: false, logError: false });

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe(ErrorCode.UNKNOWN_ERROR);
    });

    it('should handle error with nested response data', () => {
      const error = {
        response: {
          status: 400,
          data: {
            message: 'Validation failed',
            errors: { email: 'Invalid email' },
          },
        },
        message: 'Request failed',
      };

      const result = handleError(error, { showToast: false, logError: false });

      expect(result.code).toBe(ErrorCode.API_BAD_REQUEST);
      expect(result.statusCode).toBe(400);
    });

    it('should handle errors with circular references in context', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      const error = new Error('Circular error');

      // Should not throw
      expect(() => {
        handleError(error, { showToast: false, logError: false, context: circular });
      }).not.toThrow();
    });

    it('should handle very large error objects', () => {
      const largeContext = {
        data: new Array(10000).fill('x').join(''),
      };

      const error = new Error('Large error');

      const result = handleError(error, {
        showToast: false,
        logError: false,
        context: largeContext,
      });

      expect(result).toBeInstanceOf(AppError);
    });
  });
});
