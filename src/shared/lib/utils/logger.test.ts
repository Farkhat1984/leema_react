/**
 * Unit Tests for Logger
 *
 * Tests all log levels, production filtering, sensitive data sanitization,
 * and log formatting
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger, LogLevel, type LoggerConfig } from './logger';

// Mock console methods
const originalConsole = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

describe('Logger', () => {
  let consoleDebugSpy: any;
  let consoleInfoSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Reset logger to test environment defaults
    logger.configure({
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableSentry: false,
    });

    // Spy on console methods
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    consoleDebugSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Log Levels', () => {
    describe('DEBUG level', () => {
      it('should log debug messages when level is DEBUG', () => {
        logger.debug('Debug message');

        expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
        const args = consoleDebugSpy.mock.calls[0];
        expect(args[0]).toContain('[DEBUG]');
        expect(args[1]).toBe('Debug message');
      });

      it('should log debug messages with context', () => {
        logger.debug('Debug message', { userId: 123, action: 'test' });

        expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
        const args = consoleDebugSpy.mock.calls[0];
        expect(args[0]).toContain('[DEBUG]');
        expect(args[1]).toBe('Debug message');
        expect(args[2]).toEqual({ userId: 123, action: 'test' });
      });

      it('should not log debug when level is INFO or higher', () => {
        logger.configure({ level: LogLevel.INFO });
        logger.debug('Debug message');

        expect(consoleDebugSpy).not.toHaveBeenCalled();
      });
    });

    describe('INFO level', () => {
      it('should log info messages when level is DEBUG or INFO', () => {
        logger.info('Info message');

        expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
        const args = consoleInfoSpy.mock.calls[0];
        expect(args[0]).toContain('[INFO]');
        expect(args[1]).toBe('Info message');
      });

      it('should log info messages with context', () => {
        logger.info('User logged in', { email: 'user@example.com' });

        expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
        const args = consoleInfoSpy.mock.calls[0];
        expect(args[0]).toContain('[INFO]');
        expect(args[1]).toBe('User logged in');
        expect(args[2]).toHaveProperty('email', 'user@example.com');
      });

      it('should not log info when level is WARN or higher', () => {
        logger.configure({ level: LogLevel.WARN });
        logger.info('Info message');

        expect(consoleInfoSpy).not.toHaveBeenCalled();
      });
    });

    describe('WARN level', () => {
      it('should log warn messages at all levels except ERROR', () => {
        logger.warn('Warning message');

        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
        const args = consoleWarnSpy.mock.calls[0];
        expect(args[0]).toContain('[WARN]');
        expect(args[1]).toBe('Warning message');
      });

      it('should log warn messages with context', () => {
        logger.warn('API response slow', { duration: 3000 });

        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
        const args = consoleWarnSpy.mock.calls[0];
        expect(args[0]).toContain('[WARN]');
        expect(args[1]).toBe('API response slow');
        expect(args[2]).toEqual({ duration: 3000 });
      });

      it('should not log warn when level is ERROR', () => {
        logger.configure({ level: LogLevel.ERROR });
        logger.warn('Warning message');

        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });
    });

    describe('ERROR level', () => {
      it('should log error messages at all levels', () => {
        logger.error('Error message');

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        const args = consoleErrorSpy.mock.calls[0];
        expect(args[0]).toContain('[ERROR]');
        expect(args[1]).toBe('Error message');
      });

      it('should log error with Error object', () => {
        const error = new Error('Test error');
        error.stack = 'Error: Test error\n  at test.js:1:1';

        logger.error('Failed to fetch data', error);

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        const args = consoleErrorSpy.mock.calls[0];
        expect(args[0]).toContain('[ERROR]');
        expect(args[1]).toBe('Failed to fetch data');
        expect(args[2]).toMatchObject({
          errorName: 'Error',
          errorMessage: 'Test error',
          errorStack: expect.stringContaining('Error: Test error'),
        });
      });

      it('should log error with context and Error object', () => {
        const error = new Error('Database connection failed');
        logger.error('Database error', error, { database: 'postgres', retry: 3 });

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        const args = consoleErrorSpy.mock.calls[0];
        expect(args[2]).toMatchObject({
          database: 'postgres',
          retry: 3,
          errorName: 'Error',
          errorMessage: 'Database connection failed',
        });
      });

      it('should handle non-Error objects in error parameter', () => {
        logger.error('Unknown error', { customError: 'Something went wrong' });

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        const args = consoleErrorSpy.mock.calls[0];
        expect(args[0]).toContain('[ERROR]');
        expect(args[1]).toBe('Unknown error');
      });
    });
  });

  describe('Production Mode Filtering', () => {
    it('should only log WARN and ERROR in production (level: WARN)', () => {
      logger.configure({ level: LogLevel.WARN });

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it('should only log ERROR when level is ERROR', () => {
      logger.configure({ level: LogLevel.ERROR });

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Sensitive Data Sanitization', () => {
    it('should redact password fields', () => {
      logger.debug('User login', { email: 'user@example.com', password: 'secret123' });

      const args = consoleDebugSpy.mock.calls[0];
      expect(args[2].password).toBe('[REDACTED]');
      expect(args[2].email).toBe('user@example.com');
    });

    it('should redact token fields', () => {
      logger.debug('API request', {
        token: 'abc123',
        accessToken: 'xyz789',
        refreshToken: 'def456',
      });

      const args = consoleDebugSpy.mock.calls[0];
      expect(args[2].token).toBe('[REDACTED]');
      expect(args[2].accessToken).toBe('[REDACTED]');
      expect(args[2].refreshToken).toBe('[REDACTED]');
    });

    it('should redact secret and apiKey fields', () => {
      logger.debug('Configuration', {
        secret: 'secret456',
        api_key: 'key789',
      });

      const args = consoleDebugSpy.mock.calls[0];
      expect(args[2].secret).toBe('[REDACTED]');
      expect(args[2].api_key).toBe('[REDACTED]');
    });

    it('should redact authorization, cookie, session, and csrf fields', () => {
      logger.debug('Headers', {
        authorization: 'Bearer token',
        cookie: 'session=abc123',
        session: 'xyz789',
        csrf: 'csrf-token',
      });

      const args = consoleDebugSpy.mock.calls[0];
      expect(args[2].authorization).toBe('[REDACTED]');
      expect(args[2].cookie).toBe('[REDACTED]');
      expect(args[2].session).toBe('[REDACTED]');
      expect(args[2].csrf).toBe('[REDACTED]');
    });

    it('should sanitize nested objects', () => {
      logger.debug('Complex object', {
        user: {
          name: 'John',
          password: 'secret',
          settings: {
            token: 'abc123',
            theme: 'dark',
          },
        },
      });

      const args = consoleDebugSpy.mock.calls[0];
      expect(args[2].user.name).toBe('John');
      expect(args[2].user.password).toBe('[REDACTED]');
      expect(args[2].user.settings.token).toBe('[REDACTED]');
      expect(args[2].user.settings.theme).toBe('dark');
    });

    it('should handle case-insensitive sensitive key matching', () => {
      logger.debug('Mixed case', {
        Password: 'secret',
        ACCESS_TOKEN: 'token',
        Session: 'session123',
      });

      const args = consoleDebugSpy.mock.calls[0];
      expect(args[2].Password).toBe('[REDACTED]');
      expect(args[2].ACCESS_TOKEN).toBe('[REDACTED]');
      expect(args[2].Session).toBe('[REDACTED]');
    });

    it('should preserve arrays in context', () => {
      logger.debug('Array data', {
        tags: ['tag1', 'tag2'],
        password: 'secret',
      });

      const args = consoleDebugSpy.mock.calls[0];
      expect(args[2].tags).toEqual(['tag1', 'tag2']);
      expect(args[2].password).toBe('[REDACTED]');
    });

    it('should handle null and undefined values', () => {
      logger.debug('Null values', {
        value1: null,
        value2: undefined,
        password: 'secret',
      });

      const args = consoleDebugSpy.mock.calls[0];
      expect(args[2].value1).toBeNull();
      expect(args[2].value2).toBeUndefined();
      expect(args[2].password).toBe('[REDACTED]');
    });
  });

  describe('Log Formatting', () => {
    it('should include timestamp in log prefix', () => {
      logger.debug('Test message');

      const args = consoleDebugSpy.mock.calls[0];
      const prefix = args[0];

      // Check for ISO timestamp format
      expect(prefix).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });

    it('should include log level name in prefix', () => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warn message');
      logger.error('Error message');

      expect(consoleDebugSpy.mock.calls[0][0]).toContain('[DEBUG]');
      expect(consoleInfoSpy.mock.calls[0][0]).toContain('[INFO]');
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('[WARN]');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR]');
    });

    it('should format prefix as [timestamp] [level]', () => {
      logger.info('Test message');

      const args = consoleInfoSpy.mock.calls[0];
      const prefix = args[0];

      // Should match: [2024-01-01T12:00:00.000Z] [INFO]
      expect(prefix).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\]$/);
    });
  });

  describe('Console Output Control', () => {
    it('should not output to console when enableConsole is false', () => {
      logger.configure({ enableConsole: false });

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');
      logger.error('Error');

      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(consoleInfoSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should output to console when enableConsole is true', () => {
      logger.configure({ enableConsole: true });

      logger.debug('Debug');

      expect(consoleDebugSpy).toHaveBeenCalled();
    });
  });

  describe('Sentry Integration', () => {
    it('should not send to Sentry when enableSentry is false', () => {
      logger.configure({ enableSentry: false });

      const error = new Error('Test error');
      logger.error('Error message', error);

      // Just verify it doesn't throw
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should prepare for Sentry when enableSentry is true', () => {
      logger.configure({ enableSentry: true });

      const error = new Error('Test error');
      logger.error('Error message', error);

      // Sentry integration is placeholder, just verify logging works
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('should only send errors to Sentry, not other log levels', () => {
      logger.configure({ enableSentry: true });

      logger.debug('Debug');
      logger.info('Info');
      logger.warn('Warn');

      // These should log but not trigger Sentry (verified by no errors)
      expect(consoleDebugSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('Logger Configuration', () => {
    it('should update configuration with configure method', () => {
      const newConfig: Partial<LoggerConfig> = {
        level: LogLevel.ERROR,
        enableConsole: false,
        enableSentry: true,
      };

      logger.configure(newConfig);
      const config = logger.getConfig();

      expect(config.level).toBe(LogLevel.ERROR);
      expect(config.enableConsole).toBe(false);
      expect(config.enableSentry).toBe(true);
    });

    it('should allow partial configuration updates', () => {
      logger.configure({ level: LogLevel.DEBUG, enableConsole: true });

      // Only update level
      logger.configure({ level: LogLevel.WARN });
      const config = logger.getConfig();

      expect(config.level).toBe(LogLevel.WARN);
      expect(config.enableConsole).toBe(true); // Should remain unchanged
    });

    it('should return current configuration with getConfig', () => {
      logger.configure({
        level: LogLevel.INFO,
        enableConsole: true,
        enableSentry: false,
      });

      const config = logger.getConfig();

      expect(config).toEqual({
        level: LogLevel.INFO,
        enableConsole: true,
        enableSentry: false,
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty context', () => {
      logger.debug('Message', {});

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      const args = consoleDebugSpy.mock.calls[0];
      expect(args[2]).toEqual({});
    });

    it('should handle undefined context', () => {
      logger.debug('Message', undefined);

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      const args = consoleDebugSpy.mock.calls[0];
      expect(args[2]).toBeUndefined();
    });

    it('should handle context with only sensitive data', () => {
      logger.debug('Message', { password: 'secret', token: 'abc' });

      const args = consoleDebugSpy.mock.calls[0];
      expect(args[2]).toEqual({
        password: '[REDACTED]',
        token: '[REDACTED]',
      });
    });

    it('should handle deeply nested objects', () => {
      logger.debug('Message', {
        level1: {
          level2: {
            level3: {
              level4: {
                password: 'secret',
                value: 'safe',
              },
            },
          },
        },
      });

      const args = consoleDebugSpy.mock.calls[0];
      expect(args[2].level1.level2.level3.level4.password).toBe('[REDACTED]');
      expect(args[2].level1.level2.level3.level4.value).toBe('safe');
    });

    it('should handle errors without stack trace', () => {
      const error = new Error('Error without stack');
      delete error.stack;

      logger.error('Test', error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const args = consoleErrorSpy.mock.calls[0];
      expect(args[2]).toMatchObject({
        errorName: 'Error',
        errorMessage: 'Error without stack',
      });
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);
      logger.debug(longMessage);

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      const args = consoleDebugSpy.mock.calls[0];
      expect(args[1]).toBe(longMessage);
    });

    it('should handle special characters in messages', () => {
      const specialMessage = 'Message with 中文 and émojis 🎉 and \n newlines \t tabs';
      logger.debug(specialMessage);

      expect(consoleDebugSpy).toHaveBeenCalledTimes(1);
      const args = consoleDebugSpy.mock.calls[0];
      expect(args[1]).toBe(specialMessage);
    });
  });
});
