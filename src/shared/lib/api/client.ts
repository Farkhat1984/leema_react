/**
 * API Client with axios
 * Handles authentication, token refresh, and error handling
 */

import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { CONFIG, ROUTES } from '@/shared/constants/config';
import { useAuthStore } from '@/features/auth/store/authStore';
import { isValidJWT, sanitizeRequestBody } from '../security/sanitize';
import { getCSRFToken, initCSRFToken } from '../security/csrf';
import { setAccessToken as setStorageToken } from '../security/storage';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { SECURITY_HEADERS } from '../security';
import { logger } from '../utils/logger';
import { handleError, ErrorCode, createError, type AppError } from '../utils/error-handler';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 30000;

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay with jitter
 */
const calculateRetryDelay = (attempt: number): number => {
  const exponentialDelay = RETRY_DELAY_MS * Math.pow(2, attempt);
  const cappedDelay = Math.min(exponentialDelay, MAX_RETRY_DELAY_MS);
  // Add jitter (0-1000ms) to prevent thundering herd
  const jitter = Math.random() * 1000;
  return cappedDelay + jitter;
};

/**
 * Determine if request should be retried
 */
const shouldRetryRequest = (error: AxiosError, attempt: number): boolean => {
  if (attempt >= MAX_RETRIES) return false;

  const status = error.response?.status;

  // Don't retry if no response (handled separately as network error)
  if (!error.response && error.request) {
    // Network error - retry
    return true;
  }

  // Don't retry auth errors or client errors (except rate limiting)
  if (status && status < 500 && status !== 429 && status !== 408) {
    return false;
  }

  // Retry on 5xx errors
  if (status && status >= 500) return true;

  // Retry on rate limiting (429)
  if (status === 429) return true;

  // Retry on request timeout (408)
  if (status === 408) return true;

  return false;
};

// Create axios instance
export const apiClient = axios.create({
  baseURL: CONFIG.API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for HttpOnly cookies
});

// Track if we're currently refreshing the token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

/**
 * Process queued requests after token refresh
 */
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

// Initialize CSRF token on startup
initCSRFToken();

/**
 * Request interceptor: Add authentication token and security headers
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;

    logger.debug('[API Request]', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      isValidToken: token ? isValidJWT(token) : false
    });

    // Validate token before adding it
    if (token && isValidJWT(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (token) {
      logger.warn('[API Request] Invalid JWT token detected', { url: config.url });
    }

    // Add CSRF token for state-changing requests
    if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        config.headers[SECURITY_HEADERS.CSRF_HEADER] = csrfToken;
      }
    }

    // Sanitize request body to prevent XSS (skip FormData for file uploads)
    if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
      config.data = sanitizeRequestBody(config.data as Record<string, unknown>);
    }

    // For FormData, let browser set Content-Type with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // Add security headers
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    config.headers['X-Client-Version'] = '1.0.0'; // Can be dynamic

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor: Handle 401 errors, token refresh, and retries
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };

    // Initialize retry count if not set
    if (!originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }

    // Check if we should retry this request
    if (
      error.response?.status !== 401 &&
      shouldRetryRequest(error, originalRequest._retryCount)
    ) {
      originalRequest._retryCount += 1;
      const delay = calculateRetryDelay(originalRequest._retryCount - 1);

      // Get retry-after header if present (for 429 responses)
      const retryAfter = error.response?.headers['retry-after'];
      const retryDelay = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : delay;

      logger.info(
        `[API] Retrying request (attempt ${originalRequest._retryCount}/${MAX_RETRIES})`,
        {
          url: originalRequest?.url,
          method: originalRequest?.method,
          status: error.response?.status,
          delay: retryDelay,
        }
      );

      // Show toast for rate limiting
      if (error.response?.status === 429) {
        toast.loading(`Rate limit reached. Retrying in ${Math.ceil(retryDelay / 1000)}s...`, {
          duration: retryDelay,
        });
      }

      await sleep(retryDelay);

      // Retry the request
      return apiClient(originalRequest);
    }

    // Use centralized error handler for non-401 errors that won't be retried
    if (error.response?.status !== 401) {
      // Handle error with centralized handler
      handleError(error, {
        showToast: true,
        logError: true,
        context: {
          url: originalRequest?.url,
          method: originalRequest?.method,
          retryCount: originalRequest._retryCount,
        },
        reportToService: error.response?.status ? error.response.status >= 500 : false,
      });

      return Promise.reject(error);
    }

    // Handle network errors (no response)
    if (!error.response && error.request) {
      handleError(createError.network.connectionError({
        url: originalRequest?.url
      }), {
        showToast: true,
        logError: true,
      });
      return Promise.reject(error);
    }

    // If error is not 401 or request already retried, reject
    if (!originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If we're already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject: (err: Error) => {
            reject(err);
          },
        });
      });
    }

    // Mark request as retried
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      logger.debug('[API] Attempting token refresh', {
        url: originalRequest?.url
      });

      // Try to refresh the token using HttpOnly cookie
      // Note: Refresh token is automatically sent via HttpOnly cookie (withCredentials: true)
      const response = await axios.post(
        `${CONFIG.API_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
        {}, // Empty body - refresh token is sent as HttpOnly cookie
        { withCredentials: true }
      );

      const { accessToken } = response.data;

      logger.debug('[API] Token refresh successful', {
        hasNewToken: !!accessToken
      });

      // Update token in store and sessionStorage
      setStorageToken(accessToken);
      useAuthStore.getState().setAccessToken(accessToken);

      // Update authorization header
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      // Process queued requests
      processQueue(null, accessToken);

      // Retry original request
      return apiClient(originalRequest);
    } catch (refreshError) {
      logger.error('[API] Token refresh failed, logging out user', {
        url: originalRequest?.url,
        error: refreshError
      });

      // Token refresh failed, logout user
      processQueue(refreshError as Error, null);
      useAuthStore.getState().logout();

      // Handle session expiration with centralized handler
      handleError(createError.auth.sessionExpired(), {
        showToast: true,
        logError: true,
        reportToService: false,
      });

      // Redirect to login
      if (typeof window !== 'undefined') {
        logger.warn('[API] Redirecting to login page');
        window.location.href = ROUTES.PUBLIC.LOGIN;
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

/**
 * Generic API request handler
 * Note: Error handling is done by the interceptor
 * This function just propagates errors to the caller
 */
export const apiRequest = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
  data?: unknown,
  params?: Record<string, unknown>,
  options?: { responseType?: 'blob' | 'json' }
): Promise<T> => {
  try {
    const response = await apiClient.request<T>({
      url: endpoint,
      method,
      data,
      params,
      ...options,
    });

    return response.data;
  } catch (error) {
    // Error is already handled by interceptor
    // Just log and re-throw for handling by the caller (e.g., React Query)
    logger.debug(`API request failed: ${method} ${endpoint}`, {
      method,
      endpoint,
      // Don't log full error here as it's already logged by interceptor
    });

    // Re-throw for handling by the caller
    throw error;
  }
};

export default apiClient;
