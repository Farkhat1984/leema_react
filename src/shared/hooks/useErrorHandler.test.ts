import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useErrorHandler, useMutationErrorHandler } from './useErrorHandler';
import * as errorHandlerModule from '@/shared/lib/utils/error-handler';

// Mock the error handler module
vi.mock('@/shared/lib/utils/error-handler', () => ({
  handleError: vi.fn((error: unknown) => ({
    code: 'UNKNOWN',
    severity: 'error',
    message: 'Test error',
    userMessage: 'Test error',
    statusCode: 500,
  })),
  createError: {
    validation: {
      required: vi.fn(() => ({
        code: 'VALIDATION_REQUIRED',
        severity: 'warning',
        message: 'Field is required',
        userMessage: 'Поле обязательно',
      })),
    },
    network: {
      connectionError: vi.fn(() => ({
        code: 'NETWORK_CONNECTION_ERROR',
        severity: 'error',
        message: 'Network connection failed',
        userMessage: 'Ошибка соединения',
      })),
    },
  },
}));

describe('useErrorHandler Hook', () => {
  it('should return error handling utilities', () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(result.current).toHaveProperty('handleError');
    expect(result.current).toHaveProperty('createErrorHandler');
    expect(result.current).toHaveProperty('wrapAsync');
    expect(result.current).toHaveProperty('createError');

    expect(typeof result.current.handleError).toBe('function');
    expect(typeof result.current.createErrorHandler).toBe('function');
    expect(typeof result.current.wrapAsync).toBe('function');
    expect(typeof result.current.createError).toBe('object');
  });

  it('should handle errors with default options', () => {
    const { result } = renderHook(() => useErrorHandler());
    const testError = new Error('Test error');

    result.current.handleError(testError);

    expect(errorHandlerModule.handleError).toHaveBeenCalledWith(testError, {
      showToast: true,
      logError: true,
    });
  });

  it('should handle errors with custom options', () => {
    const { result } = renderHook(() => useErrorHandler());
    const testError = new Error('Test error');
    const customOptions = {
      showToast: false,
      logError: true,
      context: { operation: 'testOperation' },
    };

    result.current.handleError(testError, customOptions);

    expect(errorHandlerModule.handleError).toHaveBeenCalledWith(testError, {
      showToast: false,
      logError: true,
      context: { operation: 'testOperation' },
    });
  });

  it('should create async error handler', () => {
    const { result } = renderHook(() => useErrorHandler());
    const errorHandler = result.current.createErrorHandler();

    expect(typeof errorHandler).toBe('function');

    const testError = new Error('Async error');
    errorHandler(testError);

    expect(errorHandlerModule.handleError).toHaveBeenCalledWith(testError, {
      showToast: true,
      logError: true,
    });
  });

  it('should create async error handler with custom options', () => {
    const { result } = renderHook(() => useErrorHandler());
    const errorHandler = result.current.createErrorHandler({
      reportToService: true,
      context: { source: 'api' },
    });

    const testError = new Error('API error');
    errorHandler(testError);

    expect(errorHandlerModule.handleError).toHaveBeenCalledWith(testError, {
      showToast: true,
      logError: true,
      reportToService: true,
      context: { source: 'api' },
    });
  });

  it('should wrap async function successfully', async () => {
    const { result } = renderHook(() => useErrorHandler());
    const successFn = vi.fn(async (value: number) => value * 2);
    const wrappedFn = result.current.wrapAsync(successFn);

    const returnValue = await wrappedFn(21);

    expect(returnValue).toBe(42);
    expect(successFn).toHaveBeenCalledWith(21);
  });

  it('should return wrapAsync function', () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(typeof result.current.wrapAsync).toBe('function');

    const testFn = vi.fn(async () => 'result');
    const wrapped = result.current.wrapAsync(testFn);

    expect(typeof wrapped).toBe('function');
  });

  it('should preserve createError utility', () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(result.current.createError).toBe(errorHandlerModule.createError);
  });

  it('should memoize handleError callback', () => {
    const { result, rerender } = renderHook(() => useErrorHandler());
    const firstHandleError = result.current.handleError;

    rerender();

    expect(result.current.handleError).toBe(firstHandleError);
  });

  it('should memoize createErrorHandler callback', () => {
    const { result, rerender } = renderHook(() => useErrorHandler());
    const firstCreateErrorHandler = result.current.createErrorHandler;

    rerender();

    expect(result.current.createErrorHandler).toBe(firstCreateErrorHandler);
  });

  it('should memoize wrapAsync callback', () => {
    const { result, rerender } = renderHook(() => useErrorHandler());
    const firstWrapAsync = result.current.wrapAsync;

    rerender();

    expect(result.current.wrapAsync).toBe(firstWrapAsync);
  });
});

describe('useMutationErrorHandler Hook', () => {
  it('should return mutation error handler', () => {
    const { result } = renderHook(() => useMutationErrorHandler());

    expect(result.current).toHaveProperty('onMutationError');
    expect(typeof result.current.onMutationError).toBe('function');
  });

  it('should handle mutation errors with default options', () => {
    const { result } = renderHook(() => useMutationErrorHandler());
    const testError = new Error('Mutation failed');

    result.current.onMutationError(testError);

    expect(errorHandlerModule.handleError).toHaveBeenCalledWith(testError, {
      showToast: true,
      logError: true,
      context: undefined,
      reportToService: true,
    });
  });

  it('should handle mutation errors with context', () => {
    const { result } = renderHook(() => useMutationErrorHandler());
    const testError = new Error('Mutation failed');
    const context = { mutationType: 'create', resource: 'product' };

    result.current.onMutationError(testError, context);

    expect(errorHandlerModule.handleError).toHaveBeenCalledWith(testError, {
      showToast: true,
      logError: true,
      context,
      reportToService: true,
    });
  });

  it('should memoize onMutationError callback', () => {
    const { result, rerender } = renderHook(() => useMutationErrorHandler());
    const firstHandler = result.current.onMutationError;

    rerender();

    expect(result.current.onMutationError).toBe(firstHandler);
  });
});
