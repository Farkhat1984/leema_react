/**
 * Authentication Domain Logic Layer
 *
 * This layer handles business logic and orchestration for authentication operations.
 * It sits between the UI components and the service layer, providing:
 * - Testable business logic independent of UI
 * - Reusable operations across components
 * - Clear separation of concerns
 * - Coordinated side effects (notifications, logging, state updates)
 *
 * @created 2025-11-06 - Phase 2 improvements
 */

import { toast } from '@/shared/components/ui/Toast';
import { logger } from '@/shared/lib/utils/logger';
import { handleError } from '@/shared/lib/utils/error-handler';
import authService, {
  type AccountType,
  type ClientPlatform,
  type GoogleAuthResponse,
  type AppleAuthResponse
} from '../services/authService';
import type { User } from '../types';

/**
 * Result type for domain operations
 * Provides a consistent return type for success/failure scenarios
 */
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  message?: string;
}

/**
 * Authentication Operations
 * Contains all business logic for authentication flows
 */
export class AuthOperations {
  /**
   * Handle Google OAuth login flow
   *
   * This operation:
   * 1. Initiates Google login via service layer
   * 2. Validates response
   * 3. Shows success/error notifications
   * 4. Logs authentication event
   *
   * @param code - Google authorization code
   * @param accountType - Type of account to create
   * @param platform - Platform making the request
   * @returns Operation result with auth response
   */
  static async loginWithGoogle(
    code: string,
    accountType: AccountType = 'user',
    platform: ClientPlatform = 'web'
  ): Promise<OperationResult<GoogleAuthResponse>> {
    try {
      logger.info('[AuthOperations] Initiating Google login', {
        accountType,
        platform
      });

      // Validate inputs
      if (!code || code.trim().length === 0) {
        const error = new Error('Authorization code is required');
        toast.error('Ошибка авторизации: отсутствует код');
        return { success: false, error, message: 'Invalid authorization code' };
      }

      // Call service layer
      const response = await authService.googleLogin(code, accountType, platform);

      // Validate response
      if (!response.accessToken) {
        const error = new Error('No access token in response');
        logger.error('[AuthOperations] Login failed: no access token', { response });
        toast.error('Ошибка авторизации: токен не получен');
        return { success: false, error, message: 'No access token received' };
      }

      // Success notification
      const accountTypeLabel = accountType === 'shop' ? 'магазина' :
                               accountType === 'admin' ? 'администратора' :
                               'пользователя';
      toast.success(`Добро пожаловать! Вход выполнен как ${accountTypeLabel}`);

      logger.info('[AuthOperations] Google login successful', {
        accountType,
        userId: response.user?.id,
        shopId: response.shop?.id
      });

      return {
        success: true,
        data: response,
        message: 'Login successful'
      };

    } catch (error) {
      logger.error('[AuthOperations] Google login failed', error);
      handleError(error, {
        context: {
          operation: 'googleLogin',
          accountType,
          platform
        }
      });

      return {
        success: false,
        error: error as Error,
        message: 'Login failed'
      };
    }
  }

  /**
   * Handle Apple Sign-In flow
   *
   * @param code - Apple authorization code
   * @param accountType - Type of account to create
   * @returns Operation result with auth response
   */
  static async loginWithApple(
    code: string,
    accountType: AccountType = 'user'
  ): Promise<OperationResult<AppleAuthResponse>> {
    try {
      logger.info('[AuthOperations] Initiating Apple login', { accountType });

      if (!code || code.trim().length === 0) {
        const error = new Error('Authorization code is required');
        toast.error('Ошибка авторизации: отсутствует код');
        return { success: false, error, message: 'Invalid authorization code' };
      }

      const response = await authService.appleLogin(code, accountType);

      if (!response.accessToken) {
        const error = new Error('No access token in response');
        logger.error('[AuthOperations] Apple login failed: no access token', { response });
        toast.error('Ошибка авторизации: токен не получен');
        return { success: false, error, message: 'No access token received' };
      }

      const accountTypeLabel = accountType === 'shop' ? 'магазина' :
                               accountType === 'admin' ? 'администратора' :
                               'пользователя';
      toast.success(`Добро пожаловать! Вход выполнен как ${accountTypeLabel}`);

      logger.info('[AuthOperations] Apple login successful', {
        accountType,
        userId: response.user?.id
      });

      return {
        success: true,
        data: response,
        message: 'Login successful'
      };

    } catch (error) {
      logger.error('[AuthOperations] Apple login failed', error);
      handleError(error, {
        context: {
          operation: 'appleLogin',
          accountType
        }
      });

      return {
        success: false,
        error: error as Error,
        message: 'Login failed'
      };
    }
  }

  /**
   * Handle user logout
   *
   * This operation:
   * 1. Calls logout service
   * 2. Shows confirmation notification
   * 3. Logs logout event
   *
   * @returns Operation result
   */
  static async logout(): Promise<OperationResult<void>> {
    try {
      logger.info('[AuthOperations] Initiating logout');

      await authService.logout();

      toast.success('Вы успешно вышли из системы');
      logger.info('[AuthOperations] Logout successful');

      return {
        success: true,
        message: 'Logout successful'
      };

    } catch (error) {
      logger.error('[AuthOperations] Logout failed', error);

      // Don't show error to user - logout should always succeed on client
      // Even if server call fails, we clear local state

      return {
        success: true,
        message: 'Logout completed (with errors)'
      };
    }
  }

  /**
   * Refresh user authentication token
   *
   * This is typically called automatically by the API client
   * when a 401 response is received.
   *
   * @returns Operation result with new access token
   */
  static async refreshAuthentication(): Promise<OperationResult<{ accessToken: string }>> {
    try {
      logger.debug('[AuthOperations] Refreshing authentication token');

      const response = await authService.refreshToken();

      if (!response.accessToken) {
        const error = new Error('No access token in refresh response');
        logger.error('[AuthOperations] Token refresh failed: no access token');
        return { success: false, error, message: 'Token refresh failed' };
      }

      logger.debug('[AuthOperations] Token refresh successful');

      return {
        success: true,
        data: response,
        message: 'Token refreshed'
      };

    } catch (error) {
      logger.error('[AuthOperations] Token refresh failed', error);

      // Don't show toast - this is handled by API client
      return {
        success: false,
        error: error as Error,
        message: 'Token refresh failed'
      };
    }
  }

  /**
   * Get current user profile
   *
   * @returns Operation result with user data
   */
  static async getCurrentUser(): Promise<OperationResult<User>> {
    try {
      logger.debug('[AuthOperations] Fetching current user');

      const user = await authService.getCurrentUser();

      logger.debug('[AuthOperations] User fetched successfully', { userId: user.id });

      return {
        success: true,
        data: user,
        message: 'User fetched successfully'
      };

    } catch (error) {
      logger.error('[AuthOperations] Failed to fetch user', error);
      handleError(error, {
        context: {
          operation: 'getCurrentUser'
        }
      });

      return {
        success: false,
        error: error as Error,
        message: 'Failed to fetch user'
      };
    }
  }

  /**
   * Update user profile
   *
   * @param updates - Profile fields to update
   * @returns Operation result with updated user
   */
  static async updateProfile(updates: Partial<User>): Promise<OperationResult<User>> {
    try {
      logger.info('[AuthOperations] Updating user profile', { updates });

      // Validate updates
      if (!updates || Object.keys(updates).length === 0) {
        const error = new Error('No updates provided');
        toast.error('Нет данных для обновления');
        return { success: false, error, message: 'No updates provided' };
      }

      const updatedUser = await authService.updateProfile(updates);

      toast.success('Профиль успешно обновлен');
      logger.info('[AuthOperations] Profile updated successfully', { userId: updatedUser.id });

      return {
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully'
      };

    } catch (error) {
      logger.error('[AuthOperations] Failed to update profile', error);
      handleError(error, {
        context: {
          operation: 'updateProfile',
          updates
        }
      });

      return {
        success: false,
        error: error as Error,
        message: 'Failed to update profile'
      };
    }
  }

  /**
   * Validate authentication state
   *
   * Checks if current auth state is valid for the given role
   *
   * @param user - Current user
   * @param requiredRole - Required role for access
   * @returns Whether user has access
   */
  static validateAccess(
    user: User | null,
    requiredRole?: 'admin' | 'shop_owner' | 'user'
  ): boolean {
    if (!user) {
      logger.debug('[AuthOperations] Access denied: no user');
      return false;
    }

    if (!requiredRole) {
      logger.debug('[AuthOperations] Access granted: no role requirement');
      return true;
    }

    const hasAccess = user.role === requiredRole;

    if (!hasAccess) {
      logger.warn('[AuthOperations] Access denied: insufficient permissions', {
        userId: user.id,
        userRole: user.role,
        requiredRole
      });
    }

    return hasAccess;
  }
}

export default AuthOperations;
