/**
 * Auth Initializer Component
 * Initializes auth state from sessionStorage on app load
 */

import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getAccessToken, isTokenExpired } from '@/shared/lib/security';
import { logger } from '@/shared/lib/utils/logger';

export const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const initializeAuth = () => {
      const token = getAccessToken();
      const { isAuthenticated, user, accessToken } = useAuthStore.getState();

      logger.debug('Initializing authentication', {
        hasTokenInStorage: !!token,
        isAuthenticated,
        hasUser: !!user,
        tokensMatch: token === accessToken,
      });

      // Case 1: User is authenticated and has valid token in sessionStorage
      if (token && isAuthenticated && !isTokenExpired(token)) {
        logger.debug('Valid token found, updating store');
        // Update store with token from sessionStorage if different
        if (token !== accessToken) {
          useAuthStore.getState().setAccessToken(token);
        }
      }
      // Case 2: User is authenticated but no token in sessionStorage
      else if (!token && isAuthenticated) {
        // Token was lost (page refresh) - logout user
        logger.warn('Access token missing - logging out user');
        useAuthStore.getState().logout();
      }
      // Case 3: Token exists but is expired
      else if (token && isTokenExpired(token)) {
        logger.warn('Access token expired - logging out user');
        useAuthStore.getState().logout();
      }
    };

    initializeAuth();
  }, []);

  return <>{children}</>;
};
