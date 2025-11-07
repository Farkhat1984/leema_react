/**
 * Sentry Error Monitoring Configuration
 *
 * Configures Sentry for error tracking, performance monitoring, and user feedback
 *
 * @created 2025-11-06 - Phase 2 improvements
 */

import * as Sentry from '@sentry/react';
import React from 'react';
import { CONFIG } from '@/shared/constants/config';
import { logger } from '@/shared/lib/utils/logger';

/**
 * Sentry configuration options
 */
interface SentryConfig {
  dsn: string;
  environment: string;
  enabled: boolean;
  sampleRate?: number;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
}

/**
 * Get Sentry configuration from environment
 */
function getSentryConfig(): SentryConfig {
  return {
    dsn: import.meta.env.VITE_SENTRY_DSN || '',
    environment: CONFIG.ENV,
    enabled: CONFIG.IS_PROD && !!import.meta.env.VITE_SENTRY_DSN,
    sampleRate: 1.0, // Capture 100% of errors
    tracesSampleRate: CONFIG.IS_PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  };
}

/**
 * Initialize Sentry error monitoring
 *
 * Should be called as early as possible in the application lifecycle
 */
export function initSentry(): void {
  const config = getSentryConfig();

  if (!config.enabled) {
    logger.info('[Sentry] Monitoring disabled (not in production or DSN not configured)');
    return;
  }

  try {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,

      // Error tracking
      sampleRate: config.sampleRate,

      // Performance monitoring
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Performance tracing
      tracesSampleRate: config.tracesSampleRate,

      // Session replay
      replaysSessionSampleRate: config.replaysSessionSampleRate,
      replaysOnErrorSampleRate: config.replaysOnErrorSampleRate,

      // Release tracking
      release: import.meta.env.VITE_APP_VERSION || 'unknown',

      // Ignore specific errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',
        // Network errors that are expected
        'NetworkError',
        'Failed to fetch',
        'Network request failed',
        // User cancelled actions
        'AbortError',
        'User cancelled',
        // ResizeObserver errors (common and harmless)
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
      ],

      // Filter out specific URLs
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^moz-extension:\/\//i,
        // Social media widgets
        /graph\.facebook\.com/i,
        /connect\.facebook\.net/i,
        /platform\.twitter\.com/i,
      ],

      // Before send hook - last chance to modify or filter events
      beforeSend(event, hint) {
        // Filter out errors in development
        if (!CONFIG.IS_PROD) {
          logger.debug('[Sentry] Event captured (dev mode)', {
            message: event.message,
            level: event.level,
          });
          return null; // Don't send in development
        }

        // Don't send events for expected errors
        const error = hint.originalException;
        if (error instanceof Error) {
          // Filter out authentication errors (these are expected)
          if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            return null;
          }

          // Filter out network errors during development
          if (error.message.includes('ERR_CONNECTION_REFUSED')) {
            return null;
          }
        }

        return event;
      },

      // Before breadcrumb hook - filter sensitive data
      beforeBreadcrumb(breadcrumb) {
        // Don't log console messages as breadcrumbs
        if (breadcrumb.category === 'console') {
          return null;
        }

        // Filter sensitive data from breadcrumbs
        if (breadcrumb.data) {
          // Remove tokens and sensitive fields
          const sensitiveKeys = ['token', 'password', 'accessToken', 'refreshToken', 'authorization'];
          sensitiveKeys.forEach((key) => {
            if (breadcrumb.data && key in breadcrumb.data) {
              breadcrumb.data[key] = '[FILTERED]';
            }
          });
        }

        return breadcrumb;
      },
    });

    logger.info('[Sentry] Monitoring initialized', {
      environment: config.environment,
      release: import.meta.env.VITE_APP_VERSION,
    });

  } catch (error) {
    logger.error('[Sentry] Failed to initialize', error);
  }
}

/**
 * Capture an exception in Sentry
 *
 * @param error - Error to capture
 * @param context - Additional context
 */
export function captureException(
  error: Error,
  context?: {
    level?: Sentry.SeverityLevel;
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    user?: {
      id?: string;
      email?: string;
      username?: string;
    };
  }
): string | undefined {
  const config = getSentryConfig();

  if (!config.enabled) {
    return undefined;
  }

  try {
    return Sentry.captureException(error, {
      level: context?.level || 'error',
      tags: context?.tags,
      contexts: {
        extra: context?.extra,
      },
      user: context?.user,
    });
  } catch (err) {
    logger.error('[Sentry] Failed to capture exception', err);
    return undefined;
  }
}

/**
 * Capture a message in Sentry
 *
 * @param message - Message to capture
 * @param level - Severity level
 * @param context - Additional context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): string | undefined {
  const config = getSentryConfig();

  if (!config.enabled) {
    return undefined;
  }

  try {
    return Sentry.captureMessage(message, {
      level,
      tags: context?.tags,
      contexts: {
        extra: context?.extra,
      },
    });
  } catch (err) {
    logger.error('[Sentry] Failed to capture message', err);
    return undefined;
  }
}

/**
 * Set user context for Sentry
 *
 * @param user - User information
 */
export function setUser(user: {
  id?: string | number;
  email?: string;
  username?: string;
  role?: string;
} | null): void {
  const config = getSentryConfig();

  if (!config.enabled) {
    return;
  }

  try {
    if (user) {
      Sentry.setUser({
        id: user.id?.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
      } as Sentry.User);
    } else {
      Sentry.setUser(null);
    }
  } catch (err) {
    logger.error('[Sentry] Failed to set user', err);
  }
}

/**
 * Add breadcrumb to Sentry
 *
 * @param breadcrumb - Breadcrumb data
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, unknown>;
}): void {
  const config = getSentryConfig();

  if (!config.enabled) {
    return;
  }

  try {
    Sentry.addBreadcrumb(breadcrumb);
  } catch (err) {
    logger.error('[Sentry] Failed to add breadcrumb', err);
  }
}

/**
 * Set context in Sentry
 *
 * @param name - Context name
 * @param context - Context data
 */
export function setContext(name: string, context: Record<string, unknown> | null): void {
  const config = getSentryConfig();

  if (!config.enabled) {
    return;
  }

  try {
    Sentry.setContext(name, context);
  } catch (err) {
    logger.error('[Sentry] Failed to set context', err);
  }
}

/**
 * Set tag in Sentry
 *
 * @param key - Tag key
 * @param value - Tag value
 */
export function setTag(key: string, value: string): void {
  const config = getSentryConfig();

  if (!config.enabled) {
    return;
  }

  try {
    Sentry.setTag(key, value);
  } catch (err) {
    logger.error('[Sentry] Failed to set tag', err);
  }
}

/**
 * Start a new transaction for performance monitoring
 *
 * @param name - Transaction name
 * @param op - Operation name
 * @returns Transaction
 */
export function startTransaction(
  name: string,
  op: string
): Sentry.Transaction | undefined {
  const config = getSentryConfig();

  if (!config.enabled) {
    return undefined;
  }

  try {
    return Sentry.startTransaction({ name, op });
  } catch (err) {
    logger.error('[Sentry] Failed to start transaction', err);
    return undefined;
  }
}

/**
 * Wrap a component with Sentry error boundary
 *
 * @param component - Component to wrap
 * @param options - Error boundary options
 * @returns Wrapped component
 */
export function withSentryErrorBoundary<P extends Record<string, unknown>>(
  component: React.ComponentType<P>,
  options?: Sentry.ErrorBoundaryProps
): React.ComponentType<P> {
  const config = getSentryConfig();

  if (!config.enabled) {
    return component;
  }

  return Sentry.withErrorBoundary(component, {
    fallback: options?.fallback || <div>An error occurred. Please refresh the page.</div>,
    showDialog: options?.showDialog !== false,
    ...options,
  });
}

/**
 * Create Sentry ErrorBoundary component
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Export Sentry for direct use
 */
export { Sentry };
