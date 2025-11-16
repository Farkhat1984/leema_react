/**
 * Centralized Logging Utility
 *
 * Provides structured logging with multiple severity levels.
 * In production, only WARN and ERROR logs are emitted.
 * Integrates with error tracking services (Sentry, LogRocket, etc.)
 *
 * @example
 * import { logger } from '@/shared/lib/utils/logger'
 *
 * logger.debug('Debugging info', { userId: 123 })
 * logger.info('User logged in', { email: 'user@example.com' })
 * logger.warn('API response slow', { duration: 3000 })
 * logger.error('Failed to fetch data', error)
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  [key: string]: unknown;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableSentry: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    // In production, only show ERROR (suppress all other logs)
    // In development, show all logs
    const isDevelopment = import.meta.env.DEV;
    const isTest = import.meta.env.MODE === 'test';

    this.config = {
      level: isDevelopment || isTest ? LogLevel.DEBUG : LogLevel.ERROR,
      enableConsole: !isTest, // Disable console in tests
      enableSentry: !isDevelopment && !isTest, // Enable Sentry in production only
    };
  }

  /**
   * Debug-level logging (development only)
   * Use for detailed debugging information
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Info-level logging (development only)
   * Use for general informational messages
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Warning-level logging (development + production)
   * Use for potentially harmful situations
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Error-level logging (development + production)
   * Use for error events that might still allow the app to continue
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
      ...(error instanceof Error && {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      }),
    };

    this.log(LogLevel.ERROR, message, errorContext);

    // Send to error tracking service in production
    if (this.config.enableSentry && error instanceof Error) {
      this.sendToSentry(error, message, errorContext);
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    // Check if this log level should be emitted
    if (level < this.config.level) {
      return;
    }

    // Skip console output in tests
    if (!this.config.enableConsole) {
      return;
    }

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const prefix = `[${timestamp}] [${levelName}]`;

    // Sanitize context to prevent logging sensitive data
    const sanitizedContext = this.sanitizeContext(context);

    switch (level) {
      case LogLevel.DEBUG:
        // eslint-disable-next-line no-console
        console.debug(prefix, message, sanitizedContext);
        break;
      case LogLevel.INFO:
        // eslint-disable-next-line no-console
        console.info(prefix, message, sanitizedContext);
        break;
      case LogLevel.WARN:
         
        console.warn(prefix, message, sanitizedContext);
        break;
      case LogLevel.ERROR:
         
        console.error(prefix, message, sanitizedContext);
        break;
    }
  }

  /**
   * Sanitize context to prevent logging sensitive data
   * Removes tokens, passwords, and other sensitive fields
   */
  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;

    const sensitiveKeys = [
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'access_token',
      'refresh_token',
      'secret',
      'apiKey',
      'api_key',
      'authorization',
      'cookie',
      'session',
      'csrf',
    ];

    const sanitized: LogContext = {};

    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some((sensitive) =>
        lowerKey.includes(sensitive)
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeContext(value as LogContext);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Send error to Sentry or other error tracking service
   * TODO: Integrate with actual error tracking service
   */
  private sendToSentry(
    error: Error,
    message: string,
    context?: LogContext
  ): void {
    // TODO: Integrate with Sentry SDK
    // Example:
    // import * as Sentry from '@sentry/react'
    // Sentry.captureException(error, {
    //   tags: { source: 'logger' },
    //   contexts: { custom: context },
    //   level: 'error',
    // })

    // For now, just track that we would send to Sentry
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[Sentry]', 'Would send error:', message, error, context);
    }
  }

  /**
   * Update logger configuration at runtime
   * Useful for testing or dynamic configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current logger configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const logger = new Logger();
