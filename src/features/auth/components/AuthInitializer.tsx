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
      // Skip initialization if on auth callback page - let callback handle it
      const isAuthCallbackPage = window.location.pathname === '/auth/callback';
      if (isAuthCallbackPage) {
        logger.debug('Skipping auth initialization on callback page');
        return;
      }

      const tokenInSessionStorage = getAccessToken();
      const { isAuthenticated, user, accessToken } = useAuthStore.getState();

      logger.debug('Initializing authentication', {
        hasTokenInSessionStorage: !!tokenInSessionStorage,
        hasTokenInStore: !!accessToken,
        isAuthenticated,
        hasUser: !!user,
        currentPath: window.location.pathname
      });

      // Determine which token to use (prefer store token from Zustand persist)
      const activeToken = accessToken || tokenInSessionStorage;

      // Case 1: User is authenticated and has valid token
      if (activeToken && isAuthenticated && !isTokenExpired(activeToken)) {
        logger.debug('Valid token found, syncing storage', {
          userRole: user?.role,
          hasShop: !!useAuthStore.getState().shop
        });
        // Ensure token is in both sessionStorage and store
        useAuthStore.getState().setAccessToken(activeToken);
      }
      // Case 2: User is authenticated but no token available
      else if (!activeToken && isAuthenticated) {
        // Token was lost - logout user
        logger.warn('Access token missing - logging out user', {
          userRole: user?.role,
          fromPath: window.location.pathname
        });
        useAuthStore.getState().logout();
      }
      // Case 3: Token exists but is expired
      else if (activeToken && isTokenExpired(activeToken)) {
        logger.warn('Access token expired - logging out user', {
          userRole: user?.role,
          fromPath: window.location.pathname
        });
        useAuthStore.getState().logout();
      }
      // Case 4: Token exists in sessionStorage but user not authenticated in store
      // This can happen after Zustand persist rehydration, but give it a moment
      else if (tokenInSessionStorage && !isAuthenticated) {
        // Wait a bit for Zustand persist to rehydrate before clearing
        setTimeout(() => {
          const state = useAuthStore.getState();
          if (!state.isAuthenticated && !state.user) {
            // Still no user data - clear orphaned token
            logger.warn('Orphaned token in sessionStorage - clearing after delay', {
              fromPath: window.location.pathname
            });
            useAuthStore.getState().logout();
          } else {
            logger.debug('User data loaded after delay - keeping token');
          }
        }, 100);
      }
    };

    initializeAuth();
  }, []);

  return <>{children}</>;
};
