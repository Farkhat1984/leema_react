/**
 * Security utilities barrel export
 */

// Sanitization
export {
  sanitizeHTML,
  sanitizeInput,
  sanitizeUrl,
  isValidUrl,
  isValidEmail,
  isValidPhone,
  isValidJWT,
  sanitizeRequestBody,
} from './sanitize';

// CSRF Protection
export {
  generateCSRFToken,
  getCSRFToken,
  setCSRFToken,
  initCSRFToken,
  clearCSRFToken,
  isValidCSRFToken,
} from './csrf';

// Secure Storage
export {
  setAccessToken,
  getAccessToken,
  removeAccessToken,
  setUserData,
  getUserData,
  removeUserData,
  setPreferences,
  getPreferences,
  clearAuthStorage,
  clearAllStorage,
  isAuthenticated,
  decodeJWT,
  isTokenExpired,
} from './storage';

// Content Security Policy (CSP)
export {
  getCSPDirectives,
  generateCSPHeader,
  generateCSPMetaContent,
  validateCSP,
  setupCSPViolationReporting,
  initializeCSP,
} from './csp';
export type { CSPDirectives } from './csp';

// Security constants
export const SECURITY_HEADERS = {
  CSRF_HEADER: 'X-CSRF-Token',
  CONTENT_TYPE: 'application/json',
} as const;

// Rate limiting helper (client-side)
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];

    // Remove old requests outside the time window
    const validRequests = requests.filter((time) => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}
