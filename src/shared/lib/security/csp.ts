/**
 * Content Security Policy (CSP) Configuration
 *
 * Defines CSP directives to protect against XSS, clickjacking, and other injection attacks.
 * CSP is applied via meta tag in index.html and HTTP headers in nginx configuration.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
 */

import { CONFIG } from '@/shared/constants/config';
import { logger } from '@/shared/lib/utils/logger';

/**
 * CSP Directives
 * Each directive controls where resources can be loaded from
 */
export interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'connect-src': string[];
  'font-src': string[];
  'object-src': string[];
  'media-src': string[];
  'frame-src': string[];
  'base-uri': string[];
  'form-action': string[];
  'frame-ancestors': string[];
  'upgrade-insecure-requests'?: boolean;
}

/**
 * Base CSP configuration for all environments
 * Restrictive by default, loosened only where necessary
 */
const baseDirectives: CSPDirectives = {
  // Default fallback for all resource types
  'default-src': ["'self'"],

  // Scripts: Allow self + Google OAuth + inline scripts (for Vite HMR in dev)
  'script-src': [
    "'self'",
    'https://accounts.google.com',
    'https://apis.google.com',
  ],

  // Styles: Allow self + inline styles (TailwindCSS requires this)
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],

  // Images: Allow self, data URIs, and HTTPS sources (for product images from API)
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],

  // API and WebSocket connections
  'connect-src': ["'self'"],

  // Fonts: Allow self + Google Fonts
  'font-src': ["'self'", 'https://fonts.gstatic.com'],

  // Block all object/embed/applet elements
  'object-src': ["'none'"],

  // Media: Allow self only
  'media-src': ["'self'"],

  // Frames/iframes: Allow Google OAuth
  'frame-src': ['https://accounts.google.com'],

  // Restrict base tag to prevent base tag hijacking
  'base-uri': ["'self'"],

  // Forms can only submit to same origin
  'form-action': ["'self'"],

  // Prevent being embedded in iframes (clickjacking protection)
  'frame-ancestors': ["'none'"],
};

/**
 * Development-specific CSP directives
 * Looser restrictions to allow Vite HMR, eval, etc.
 */
const developmentOverrides: Partial<CSPDirectives> = {
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Vite HMR
    "'unsafe-eval'", // Vite dev server
    'https://accounts.google.com',
    'https://apis.google.com',
  ],
  'connect-src': [
    "'self'",
    'ws://localhost:5173', // Vite HMR WebSocket
    'http://localhost:5173', // Vite dev server
    'ws://localhost:*', // Allow any local WebSocket port
  ],
};

/**
 * Production-specific CSP directives
 * Strict configuration with API URL from environment
 */
const productionOverrides: Partial<CSPDirectives> = {
  'connect-src': [
    "'self'",
    CONFIG.API_URL,
    CONFIG.WS_URL,
  ],
  'upgrade-insecure-requests': true, // Force HTTPS
};

/**
 * Get CSP directives based on current environment
 */
export function getCSPDirectives(): CSPDirectives {
  const directives = { ...baseDirectives };

  if (CONFIG.IS_DEV) {
    // Merge development overrides
    Object.assign(directives, developmentOverrides);
  } else {
    // Merge production overrides
    Object.assign(directives, productionOverrides);
  }

  return directives;
}

/**
 * Convert CSP directives object to CSP header string
 * Format: "directive1 value1 value2; directive2 value3;"
 */
export function generateCSPHeader(directives: CSPDirectives): string {
  const policies: string[] = [];

  for (const [directive, values] of Object.entries(directives)) {
    if (directive === 'upgrade-insecure-requests' && values === true) {
      policies.push('upgrade-insecure-requests');
    } else if (Array.isArray(values)) {
      policies.push(`${directive} ${values.join(' ')}`);
    }
  }

  return policies.join('; ');
}

/**
 * Generate CSP meta tag content for index.html
 */
export function generateCSPMetaContent(): string {
  const directives = getCSPDirectives();
  return generateCSPHeader(directives);
}

/**
 * Validate CSP configuration at startup
 * Logs warnings if configuration is too permissive
 */
export function validateCSP(): void {
  const directives = getCSPDirectives();

  // Check for unsafe directives
  const unsafeDirectives: string[] = [];

  if (directives['script-src'].includes("'unsafe-eval'")) {
    unsafeDirectives.push("script-src 'unsafe-eval'");
  }
  if (directives['script-src'].includes("'unsafe-inline'")) {
    unsafeDirectives.push("script-src 'unsafe-inline'");
  }
  if (directives['style-src'].includes("'unsafe-inline'")) {
    unsafeDirectives.push("style-src 'unsafe-inline'");
  }

  if (unsafeDirectives.length > 0 && !CONFIG.IS_DEV) {
    logger.warn('CSP contains unsafe directives in production', {
      unsafeDirectives,
      environment: CONFIG.ENV,
    });
  }

  if (CONFIG.IS_DEV && unsafeDirectives.length > 0) {
    logger.debug('CSP relaxed for development', {
      unsafeDirectives,
      note: 'This is expected for Vite HMR and development tools',
    });
  }

  // Log CSP configuration
  logger.debug('CSP Configuration', {
    environment: CONFIG.ENV,
    cspHeader: generateCSPHeader(directives),
  });
}

/**
 * Report CSP violations (for production monitoring)
 * Can be extended to send violations to analytics/logging service
 */
export function setupCSPViolationReporting(): void {
  if (typeof window === 'undefined') return;

  // Listen for CSP violations
  document.addEventListener('securitypolicyviolation', (event) => {
    logger.warn('CSP Violation detected', {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
    });

    // TODO: Send to error tracking service in production
    // if (CONFIG.IS_PROD) {
    //   sendCSPViolationToMonitoring(event);
    // }
  });

  logger.debug('CSP violation reporting enabled');
}

/**
 * Initialize CSP (validate and setup reporting)
 * Call this in main.tsx at app startup
 */
export function initializeCSP(): void {
  validateCSP();
  setupCSPViolationReporting();
}
