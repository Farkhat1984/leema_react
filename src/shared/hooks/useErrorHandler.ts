/**
 * useErrorHandler Hook
 *
 * Provides standardized error handling utilities for components
 * Integrates with centralized error handler
 */

import { useCallback } from 'react';
import { handleError, createError, type AppError, type HandleErrorOptions } from '@/shared/lib/utils/error-handler';

/**
 * Hook for standardized error handling in components
 */
export function useErrorHandler() {
  /**
   * Handle any error with options
   */
  const handleComponentError = useCallback(
    (error: unknown, options?: HandleErrorOptions): AppError => {
      return handleError(error, {
        showToast: true,
        logError: true,
        ...options,
      });
    },
    []
  );

  /**
   * Create error handler function for async operations
   * Useful for try-catch blocks
   */
  const createAsyncErrorHandler = useCallback(
    (options?: HandleErrorOptions) => {
      return (error: unknown): AppError => {
        return handleComponentError(error, options);
      };
    },
    [handleComponentError]
  );

  /**
   * Wrap async function with error handling
   * Returns a safe function that won't throw
   */
  const wrapAsync = useCallback(
    <T, Args extends unknown[]>(
      fn: (...args: Args) => Promise<T>,
      options?: HandleErrorOptions
    ): ((...args: Args) => Promise<T | null>) => {
      return async (...args: Args): Promise<T | null> => {
        try {
          return await fn(...args);
        } catch (error) {
          handleComponentError(error, options);
          return null;
        }
      };
    },
    [handleComponentError]
  );

  return {
    handleError: handleComponentError,
    createErrorHandler: createAsyncErrorHandler,
    wrapAsync,
    createError,
  };
}

/**
 * Simpler hook for mutation error handling
 * Designed for React Query mutations
 */
export function useMutationErrorHandler() {
  const { handleError } = useErrorHandler();

  /**
   * Standard error handler for mutations
   * Can be used directly in React Query's onError
   */
  const onMutationError = useCallback(
    (error: unknown, context?: Record<string, unknown>) => {
      handleError(error, {
        showToast: true,
        logError: true,
        context,
        reportToService: true,
      });
    },
    [handleError]
  );

  return { onMutationError };
}
