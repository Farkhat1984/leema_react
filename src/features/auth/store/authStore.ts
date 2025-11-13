/**
 * Authentication Store using Zustand
 * Manages user authentication state, tokens, and shop data
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthStore, User, Shop } from '../types';
import { setAccessToken as setStorageToken, removeAccessToken, clearAuthStorage } from '@/shared/lib/security/storage';
import { logger } from '@/shared/lib/utils/logger';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      shop: null,
      accessToken: null,
      refreshToken: null, // Add refresh token to state
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: (user: User, accessToken: string, refreshToken?: string, shop?: Shop) => {
        logger.debug('User login', {
          userId: user?.id,
          userRole: user?.role,
          hasShop: !!shop,
        });

        if (!accessToken) {
          logger.error('Login called without accessToken');
          return;
        }

        // Store token in sessionStorage
        setStorageToken(accessToken);

        set({
          user,
          shop: shop || null,
          accessToken,
          refreshToken: refreshToken || null, // Store refresh token
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        // Clear all auth storage (access token from sessionStorage)
        clearAuthStorage();

        set({
          user: null,
          shop: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setAccessToken: (token: string) => {
        logger.debug('Access token updated');
        if (!token) {
          logger.error('setAccessToken called without token');
          return;
        }
        // Store token in sessionStorage
        setStorageToken(token);
        set({ accessToken: token });
      },

      setUser: (user: User) => {
        set({ user });
      },

      setShop: (shop: Shop | null) => {
        set({ shop });
      },

      updateShop: (shop: Shop) => {
        set({ shop });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },
    }),
    {
      name: 'auth-storage',
      // Use sessionStorage instead of localStorage for security
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
      // Persist user, shop, auth state, access token, and refresh token
      // Note: Access token is also stored in sessionStorage separately for API client
      partialize: (state) => ({
        user: state.user,
        shop: state.shop,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
