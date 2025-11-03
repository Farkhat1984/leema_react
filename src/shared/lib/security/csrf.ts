/**
 * CSRF (Cross-Site Request Forgery) protection utilities
 */

/**
 * Generate a random CSRF token
 */
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Get CSRF token from sessionStorage
 */
export const getCSRFToken = (): string | null => {
  return sessionStorage.getItem('csrf_token');
};

/**
 * Set CSRF token in sessionStorage
 */
export const setCSRFToken = (token: string): void => {
  sessionStorage.setItem('csrf_token', token);
};

/**
 * Initialize CSRF token if not exists
 */
export const initCSRFToken = (): string => {
  let token = getCSRFToken();
  if (!token) {
    token = generateCSRFToken();
    setCSRFToken(token);
  }
  return token;
};

/**
 * Clear CSRF token
 */
export const clearCSRFToken = (): void => {
  sessionStorage.removeItem('csrf_token');
};

/**
 * Validate CSRF token format
 */
export const isValidCSRFToken = (token: string): boolean => {
  return /^[a-f0-9]{64}$/.test(token);
};
