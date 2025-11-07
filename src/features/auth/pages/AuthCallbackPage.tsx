/**
 * Auth Callback Page - Handles OAuth callback from Google/Apple
 * Processes the authorization code and redirects to appropriate dashboard
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import authService from '../services/authService';
import { ROUTES } from '@/shared/constants/config';
import { ROLES } from '@/constants/roles';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { logger } from '@/shared/lib/utils/logger';

type AuthError = {
  title: string;
  message: string;
};

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [error, setError] = useState<AuthError | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double execution (React StrictMode in dev causes double mount)
    if (hasProcessed.current) {
      logger.debug('[AuthCallback] Already processed, skipping duplicate call');
      return;
    }

    hasProcessed.current = true;
    handleCallback();
  }, []);

  /**
   * Handle OAuth callback
   */
  const handleCallback = async () => {
    try {
      logger.info('[AuthCallback] Starting callback processing', {
        url: window.location.href,
        search: window.location.search
      });

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      logger.debug('[AuthCallback] Parsed URL params', {
        hasCode: !!code,
        codeLength: code?.length
      });

      if (!code) {
        logger.error('[AuthCallback] No authorization code in URL');
        throw new Error('Отсутствует код авторизации');
      }

      // Get requested login type from localStorage (admin, shop, or user)
      const requestedLoginType = localStorage.getItem('requestedLoginType') || 'user';

      logger.debug('[AuthCallback] Login type', {
        requestedLoginType,
        fromLocalStorage: !!localStorage.getItem('requestedLoginType')
      });

      // Backend only supports 'user' and 'shop' account types
      // Admin is a user role, not an account type
      const accountType = requestedLoginType === 'shop' ? 'shop' : 'user';

      // Authenticate with backend
      const response = await authService.googleLogin(code, accountType as 'user' | 'shop', 'web');

      logger.debug('[AuthCallback] Backend response received', {
        hasUser: !!response.user,
        hasShop: !!response.shop,
        hasAccessToken: !!response.accessToken,
        hasRefreshToken: !!response.refreshToken,
        accountType,
        requestedLoginType
      });

      // Clear stored data
      localStorage.removeItem('requestedLoginType');
      localStorage.removeItem('oauth_state');

      // Determine final account type and redirect path
      let finalAccountType: 'user' | 'shop' | 'admin' = 'user';
      let redirectPath: string = 'https://www.app.leema.kz'; // Default to mobile app

      if (response.shop) {
        // User logged in as shop owner
        finalAccountType = 'shop';

        // Check if shop is approved and active
        const shopData: any = response.shop;
        const isApproved = shopData.is_approved === true;
        const isActive = shopData.is_active === true;

        logger.debug('[AuthCallback] Shop status check', {
          is_approved: isApproved,
          is_active: isActive,
          shop_id: shopData.id
        });

        // If shop is not approved or not active, redirect to registration page
        if (!isApproved || !isActive) {
          redirectPath = ROUTES.SHOP.REGISTER;
          logger.info('[AuthCallback] Shop not approved/active, redirecting to registration');
        } else {
          redirectPath = ROUTES.SHOP.DASHBOARD;
        }

        // Create minimal user object for shop (shop acts as user)
        const shopAsUser: any = {
          id: String(shopData.id),
          email: shopData.email || '',
          name: shopData.shop_name || shopData.name || 'Shop Owner',
          phone: shopData.phone || shopData.whatsapp_phone || undefined,
          role: ROLES.SHOP_OWNER,
          accountType: 'shop' as const,
          avatar: shopData.avatar_url || shopData.logo || undefined,
          createdAt: shopData.created_at || shopData.createdAt || new Date().toISOString(),
          updatedAt: shopData.updated_at || shopData.updatedAt || undefined,
        };

        // Store shop data as user
        const accessToken = response.accessToken || response.access_token;
        if (!accessToken) {
          throw new Error('No access token received from server');
        }

        login(
          shopAsUser,
          accessToken,
          response.shop
        );
      } else if (response.user) {
        // Determine account type based on user role
        if (response.user.role === 'admin') {
          finalAccountType = 'admin';
          redirectPath = ROUTES.ADMIN.DASHBOARD;
        } else if (response.user.role === 'shop_owner') {
          finalAccountType = 'shop';
          redirectPath = ROUTES.SHOP.DASHBOARD;
        } else {
          // Regular users should use mobile app
          finalAccountType = 'user';
          redirectPath = 'https://www.app.leema.kz';
        }

        // Store user data only if not regular user
        if (finalAccountType !== 'user') {
          const accessToken = response.accessToken || response.access_token;
          if (!accessToken) {
            throw new Error('No access token received from server');
          }

          login(response.user!, accessToken);
        }
      } else {
        throw new Error('Некорректный ответ от сервера: отсутствуют данные пользователя');
      }

      // Check access permissions
      if (requestedLoginType === 'admin' && finalAccountType !== 'admin') {
        setError({
          title: 'Нет прав доступа',
          message: 'У вас нет прав администратора. Попробуйте войти как пользователь или владелец магазина.',
        });

        // Clear auth data
        useAuthStore.getState().logout();
        return;
      }

      if (requestedLoginType === 'shop' && finalAccountType !== 'shop') {
        setError({
          title: 'Ошибка авторизации',
          message: 'Не удалось войти как владелец магазина. Попробуйте войти как пользователь.',
        });

        // Clear auth data
        useAuthStore.getState().logout();
        return;
      }

      // Success - redirect to dashboard
      // Wait for Zustand persist to complete before navigation
      const currentUser = useAuthStore.getState().user;
      logger.debug('[AuthCallback] Redirecting to dashboard', {
        redirectPath,
        finalAccountType,
        userRole: currentUser?.role,
        isAuthenticated: useAuthStore.getState().isAuthenticated,
        hasAccessToken: !!useAuthStore.getState().accessToken
      });

      // Use longer delay to ensure Zustand persist middleware completes
      // and sessionStorage is fully written before navigation
      setTimeout(() => {
        // Verify auth state is still valid before navigation
        const state = useAuthStore.getState();
        logger.debug('[AuthCallback] Executing navigation to', {
          redirectPath,
          isAuthenticated: state.isAuthenticated,
          hasUser: !!state.user,
          hasToken: !!state.accessToken
        });

        navigate(redirectPath, { replace: true });
      }, 500); // Increased delay to 500ms to ensure persistence completes
    } catch (err: any) {
      logger.error('[AuthCallback] Auth callback error', {
        error: err,
        message: err.message,
        stack: err.stack,
        response: err.response?.data
      });
      setError({
        title: 'Ошибка авторизации',
        message: err.message || 'Произошла ошибка при авторизации',
      });
    }
  };

  /**
   * Handle return to login
   */
  const handleReturnToLogin = () => {
    navigate(ROUTES.PUBLIC.LOGIN, { replace: true });
  };

  // Show error if any
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-lg border border-red-200">
          <h2 className="text-2xl font-bold mb-4 text-red-600">{error.title}</h2>
          <p className="text-gray-700 mb-6">{error.message}</p>
          <button
            onClick={handleReturnToLogin}
            className="w-full px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-base font-medium"
          >
            Вернуться к входу
          </button>
        </div>
      </div>
    );
  }

  // Show loading spinner
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Spinner className="w-12 h-12 text-purple-600 mx-auto mb-5" />
        <p className="text-lg text-gray-700">Завершаем авторизацию...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
