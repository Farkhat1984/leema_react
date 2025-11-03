/**
 * Secure storage utilities
 *
 * IMPORTANT: This implementation uses sessionStorage for access tokens
 * and relies on HttpOnly cookies for refresh tokens (set by backend).
 *
 * Security benefits:
 * - Access tokens in sessionStorage (cleared on tab close)
 * - Refresh tokens in HttpOnly cookies (not accessible to JS, prevents XSS)
 * - Short-lived access tokens (typically 15-30 minutes)
 * - Long-lived refresh tokens (7-30 days) safely stored in cookies
 */

import { isValidJWT } from './sanitize';
import { logger } from '../utils/logger';

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  USER_DATA: 'user_data',
  PREFERENCES: 'user_preferences',
} as const;

/**
 * Store access token in sessionStorage (short-lived, cleared on tab close)
 */
export const setAccessToken = (token: string): void => {
  if (!isValidJWT(token)) {
    logger.error('Invalid JWT token format');
    return;
  }
  sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
};

/**
 * Get access token from sessionStorage
 */
export const getAccessToken = (): string | null => {
  return sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * Remove access token
 */
export const removeAccessToken = (): void => {
  sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * Store user data in localStorage (non-sensitive data only)
 */
export const setUserData = (data: Record<string, unknown>): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
  } catch (error) {
    logger.error('Failed to store user data', error);
  }
};

/**
 * Get user data from localStorage
 */
export const getUserData = <T = Record<string, unknown>>(): T | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Failed to retrieve user data', error);
    return null;
  }
};

/**
 * Remove user data
 */
export const removeUserData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
};

/**
 * Store user preferences (theme, language, etc.)
 */
export const setPreferences = (preferences: Record<string, unknown>): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    logger.error('Failed to store preferences', error);
  }
};

/**
 * Get user preferences
 */
export const getPreferences = <T = Record<string, unknown>>(): T | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Failed to retrieve preferences', error);
    return null;
  }
};

/**
 * Clear all auth-related storage
 */
export const clearAuthStorage = (): void => {
  removeAccessToken();
  removeUserData();
  // Note: HttpOnly refresh token cookie will be cleared by backend on logout
};

/**
 * Clear all storage (including preferences)
 */
export const clearAllStorage = (): void => {
  sessionStorage.clear();
  localStorage.clear();
};

/**
 * Check if user is authenticated (has valid access token)
 */
export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  return token !== null && isValidJWT(token);
};

/**
 * Decode JWT token payload (without verification - for display purposes only)
 */
export const decodeJWT = <T = Record<string, unknown>>(token: string): T | null => {
  try {
    if (!isValidJWT(token)) {
      return null;
    }

    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    logger.error('Failed to decode JWT', error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT<{ exp?: number }>(token);
  if (!payload || !payload.exp) {
    return true;
  }

  // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
  return Date.now() >= payload.exp * 1000;
};
