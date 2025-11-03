/**
 * API Security Middleware
 * Additional security layers for API requests
 */

import { AxiosError } from 'axios';
import { RateLimiter } from '../security';
import { logger } from '../utils/logger';

// Create rate limiter instance
const rateLimiter = new RateLimiter(60, 60000); // 60 requests per minute

/**
 * Rate limiting check before making requests
 */
export const checkRateLimit = (endpoint: string): boolean => {
  // Create a key based on endpoint
  const key = endpoint.split('?')[0]; // Remove query params for consistent keys

  if (!rateLimiter.canMakeRequest(key)) {
    logger.warn(`Rate limit exceeded for endpoint: ${endpoint}`);
    return false;
  }

  return true;
};

/**
 * Reset rate limit for specific endpoint
 */
export const resetRateLimit = (endpoint: string): void => {
  const key = endpoint.split('?')[0];
  rateLimiter.reset(key);
};

/**
 * Enhanced error handler with security considerations
 */
export const handleApiError = (error: unknown): Error => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    // Don't expose internal server errors to users
    if (status && status >= 500) {
      return new Error('A server error occurred. Please try again later.');
    }

    // Handle specific security-related errors
    switch (status) {
      case 401:
        return new Error('Authentication required. Please log in.');
      case 403:
        return new Error('Access denied. You do not have permission.');
      case 429:
        return new Error('Too many requests. Please slow down.');
      default:
        return new Error(message);
    }
  }

  // Generic error fallback
  return error instanceof Error ? error : new Error('An unexpected error occurred');
};

/**
 * Log security events (for monitoring)
 */
export const logSecurityEvent = (
  event: string,
  details: Record<string, unknown>
): void => {
  // In production, this would send to a security monitoring service
  if (import.meta.env.DEV) {
    logger.warn(`[Security Event] ${event}`, details);
  }

  // TODO: Send to monitoring service in production
  // Example: sendToSentry({ event, details, timestamp: Date.now() });
};

/**
 * Detect and prevent common attack patterns
 */
export const detectSuspiciousActivity = (
  endpoint: string,
  data?: unknown
): boolean => {
  const suspicious: string[] = [];

  // Check for SQL injection patterns
  if (data && typeof data === 'object') {
    const jsonString = JSON.stringify(data);
    if (/(\bSELECT\b|\bUNION\b|\bDROP\b|\bINSERT\b)/i.test(jsonString)) {
      suspicious.push('Potential SQL injection detected');
    }

    // Check for script injection
    if (/<script|javascript:|onerror=/i.test(jsonString)) {
      suspicious.push('Potential XSS attempt detected');
    }

    // Check for path traversal
    if (/\.\.(\/|\\)/g.test(jsonString)) {
      suspicious.push('Potential path traversal detected');
    }
  }

  // Check endpoint for suspicious patterns
  if (/\.\.(\/|\\)/g.test(endpoint)) {
    suspicious.push('Suspicious endpoint pattern');
  }

  if (suspicious.length > 0) {
    logSecurityEvent('suspicious_activity', {
      endpoint,
      patterns: suspicious,
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  return false;
};

/**
 * Validate API response structure
 */
export const validateResponse = <T>(
  response: unknown,
  requiredFields?: string[]
): response is T => {
  if (!response || typeof response !== 'object') {
    return false;
  }

  if (requiredFields) {
    return requiredFields.every((field) => field in response);
  }

  return true;
};
