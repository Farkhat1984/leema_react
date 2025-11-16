/**
 * Authentication Service
 * Handles all authentication-related API calls including Google and Apple OAuth
 *
 * @updated 2025-11-03 - Added complete OAuth support for user/shop/admin roles
 */

import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { setAccessToken as setStorageToken } from '@/shared/lib/security/storage';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
} from '../types';

// Extended types for OAuth
export type AccountType = 'user' | 'shop' | 'admin';
export type ClientPlatform = 'web' | 'mobile';

export interface GoogleAuthResponse {
  access_token?: string;
  accessToken?: string;
  refresh_token?: string;
  refreshToken?: string;
  user?: User;
  shop?: unknown;
  account_type: AccountType;
  platform: ClientPlatform;
}

export interface AppleAuthResponse {
  access_token?: string;
  accessToken?: string;
  refresh_token?: string;
  refreshToken?: string;
  user?: User;
  shop?: unknown;
  account_type: AccountType;
}

/**
 * Get Google OAuth authorization URL
 * @param accountType - Type of account (user, shop, admin)
 * @param platform - Platform type (web, mobile)
 * @returns Authorization URL
 */
export const getGoogleAuthUrl = async (
  accountType: AccountType = 'user',
  platform: ClientPlatform = 'web'
): Promise<{ authorization_url: string; account_type: AccountType; platform: ClientPlatform }> => {
  return apiRequest<{ authorization_url: string; account_type: AccountType; platform: ClientPlatform }>(
    API_ENDPOINTS.AUTH.GOOGLE_URL,
    'GET',
    null,
    { account_type: accountType, platform }
  );
};

/**
 * Login with Google OAuth (web flow with authorization code)
 * @param code - Google authorization code
 * @param accountType - Type of account (user, shop, admin)
 * @param platform - Platform type (web, mobile)
 * @returns Authentication response
 */
export const googleLogin = async (
  code: string,
  accountType: AccountType = 'user',
  platform: ClientPlatform = 'web'
): Promise<GoogleAuthResponse> => {
  const response = await apiRequest<GoogleAuthResponse>(
    API_ENDPOINTS.AUTH.GOOGLE_LOGIN,
    'POST',
    {
      code,
      account_type: accountType,
      platform,
    }
  );

  // Store access token only (refresh token is in HttpOnly cookie from backend)
  const accessToken = response.access_token || response.accessToken;
  const refreshToken = response.refresh_token || response.refreshToken;

  if (accessToken) {
    setStorageToken(accessToken);
  }
  // Note: refresh token is automatically stored in HttpOnly cookie by backend

  // Normalize response to include both formats
  return {
    ...response,
    accessToken,
    refreshToken,
  };
};

/**
 * Login with Google ID token (mobile flow)
 * @param idToken - Google ID token from mobile SDK
 * @param accountType - Type of account (user, shop, admin)
 * @returns Authentication response
 */
export const googleLoginMobile = async (
  idToken: string,
  accountType: AccountType = 'user'
): Promise<GoogleAuthResponse> => {
  const response = await apiRequest<GoogleAuthResponse>(
    API_ENDPOINTS.AUTH.GOOGLE_LOGIN,
    'POST',
    {
      id_token: idToken,
      account_type: accountType,
      platform: 'mobile',
    }
  );

  // Store access token only (refresh token is in HttpOnly cookie from backend)
  const accessToken = response.access_token || response.accessToken;
  const refreshToken = response.refresh_token || response.refreshToken;

  if (accessToken) {
    setStorageToken(accessToken);
  }
  // Note: refresh token is automatically stored in HttpOnly cookie by backend

  return {
    ...response,
    accessToken,
    refreshToken,
  };
};

/**
 * Login with Apple Sign-In
 * @param code - Apple authorization code
 * @param accountType - Type of account (user, shop, admin)
 * @returns Authentication response
 */
export const appleLogin = async (
  code: string,
  accountType: AccountType = 'user'
): Promise<AppleAuthResponse> => {
  const response = await apiRequest<AppleAuthResponse>(
    API_ENDPOINTS.AUTH.APPLE_LOGIN,
    'POST',
    {
      code,
      account_type: accountType,
    }
  );

  // Store access token only (refresh token is in HttpOnly cookie from backend)
  const accessToken = response.access_token || response.accessToken;
  const refreshToken = response.refresh_token || response.refreshToken;

  if (accessToken) {
    setStorageToken(accessToken);
  }
  // Note: refresh token is automatically stored in HttpOnly cookie by backend

  return {
    ...response,
    accessToken,
    refreshToken,
  };
};

/**
 * Login with email and password (legacy/fallback)
 * @deprecated Use OAuth methods instead
 */
export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  const response = await apiRequest<AuthResponse>(
    API_ENDPOINTS.AUTH.LOGIN,
    'POST',
    credentials
  );

  // Store access token only (refresh token is in HttpOnly cookie from backend)
  if (response.accessToken) {
    setStorageToken(response.accessToken);
  }
  // Note: refresh token is automatically stored in HttpOnly cookie by backend

  return response;
};

/**
 * Register new user (legacy/fallback)
 * @deprecated Use OAuth methods instead
 */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await apiRequest<AuthResponse>(
    API_ENDPOINTS.AUTH.REGISTER,
    'POST',
    data
  );

  // Store access token only (refresh token is in HttpOnly cookie from backend)
  if (response.accessToken) {
    setStorageToken(response.accessToken);
  }
  // Note: refresh token is automatically stored in HttpOnly cookie by backend

  return response;
};

/**
 * Logout current user
 * Clears tokens and notifies backend
 */
export const logout = async (): Promise<void> => {
  try {
    await apiRequest(API_ENDPOINTS.AUTH.LOGOUT, 'POST');
  } finally {
    // Note: HttpOnly refresh token cookie is cleared by backend
    // Access token is cleared by the auth store automatically
  }
};

/**
 * Refresh access token using HttpOnly cookie
 * @returns New access token
 * @note Refresh token is automatically sent via HttpOnly cookie with withCredentials: true
 */
export const refreshToken = async (): Promise<{ accessToken: string }> => {
  // No need to send refresh token explicitly - it's automatically sent as HttpOnly cookie
  const response = await apiRequest<{ access_token?: string; accessToken?: string }>(
    API_ENDPOINTS.AUTH.REFRESH,
    'POST'
  );

  // Normalize response
  const accessToken = response.access_token || response.accessToken;

  if (!accessToken) {
    throw new Error('No access token in refresh response');
  }

  return { accessToken };
};

/**
 * Get current user profile
 * @returns User profile data
 */
export const getCurrentUser = async (): Promise<User> => {
  return apiRequest<User>(API_ENDPOINTS.AUTH.ME, 'GET');
};

/**
 * Update user profile
 * @param data - Profile update data
 * @returns Updated user profile
 */
export const updateProfile = async (data: Partial<User>): Promise<User> => {
  return apiRequest<User>(API_ENDPOINTS.AUTH.UPDATE_PROFILE, 'PUT', data);
};

/**
 * Login with Google OAuth (backward compatibility)
 * @deprecated Use googleLogin() instead
 */
export const loginWithGoogle = async (
  code: string,
  accountType: 'user' | 'shop' = 'user'
): Promise<AuthResponse> => {
  return googleLogin(code, accountType, 'web') as Promise<AuthResponse>;
};

/**
 * Auth Service - Centralized authentication methods
 */
const authService = {
  // OAuth methods (recommended)
  getGoogleAuthUrl,
  googleLogin,
  googleLoginMobile,
  appleLogin,

  // Token management
  logout,
  refreshToken,

  // User profile
  getCurrentUser,
  updateProfile,

  // Legacy methods (deprecated)
  login,
  register,
  loginWithGoogle,
};

export default authService;
