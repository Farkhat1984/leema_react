/**
 * Auth Callback Page - Handles OAuth callback from Google/Apple
 * Processes the authorization code and redirects to appropriate dashboard
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import authService from '../services/authService';
import { ROUTES } from '@/shared/constants/config';
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

  useEffect(() => {
    handleCallback();
  }, []);

  /**
   * Handle OAuth callback
   */
  const handleCallback = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (!code) {
        throw new Error('Отсутствует код авторизации');
      }

      // Get requested account type from localStorage
      const requestedType = localStorage.getItem('requestedAccountType') || 'user';

      // For API: admin -> user, shop -> shop
      const accountType = requestedType === 'admin' ? 'user' : requestedType;

      // Authenticate with backend
      const response = await authService.loginWithGoogle(code, accountType as 'user' | 'shop');

      logger.debug('[AuthCallback] Backend response received', {
        hasUser: !!response.user,
        hasShop: !!response.shop,
        hasAccessToken: !!response.accessToken,
        hasRefreshToken: !!response.refreshToken,
        accountType
      });

      // Clear stored data
      localStorage.removeItem('requestedAccountType');
      localStorage.removeItem('oauth_state');

      // Determine final account type and redirect path
      let finalAccountType: 'user' | 'shop' | 'admin' = 'user';
      let redirectPath: string = ROUTES.USER.DASHBOARD;

      if (response.shop) {
        // User logged in as shop owner
        finalAccountType = 'shop';
        redirectPath = ROUTES.SHOP.DASHBOARD;

        // Create minimal user object for shop (shop acts as user)
        const shopData: any = response.shop;
        const shopAsUser: any = {
          id: shopData.id,
          email: shopData.email || '',
          name: shopData.shop_name || shopData.name || 'Shop Owner',
          role: 'shop_owner' as const,
          accountType: 'shop' as const,
          avatar: shopData.avatar_url || shopData.logo,
          avatar_url: shopData.avatar_url || shopData.logo,
          balance: shopData.balance || 0,
          free_generations_left: 0,
          free_try_ons_left: 0,
          createdAt: shopData.created_at || shopData.createdAt,
          created_at: shopData.created_at || shopData.createdAt,
          updatedAt: shopData.updated_at || shopData.updatedAt,
          updated_at: shopData.updated_at || shopData.updatedAt,
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
          finalAccountType = 'user';
          redirectPath = ROUTES.USER.DASHBOARD;
        }

        // Store user data
        const accessToken = response.accessToken || response.access_token;
        if (!accessToken) {
          throw new Error('No access token received from server');
        }

        login(response.user!, accessToken);
      } else {
        throw new Error('Некорректный ответ от сервера: отсутствуют данные пользователя');
      }

      // Check access permissions
      if (requestedType === 'admin' && finalAccountType !== 'admin') {
        setError({
          title: 'Нет прав доступа',
          message: 'У вас нет прав администратора. Попробуйте войти как пользователь или владелец магазина.',
        });

        // Clear auth data
        useAuthStore.getState().logout();
        return;
      }

      if (requestedType === 'shop' && finalAccountType !== 'shop') {
        setError({
          title: 'Ошибка авторизации',
          message: 'Не удалось войти как владелец магазина. Попробуйте войти как пользователь.',
        });

        // Clear auth data
        useAuthStore.getState().logout();
        return;
      }

      // Success - redirect to dashboard
      navigate(redirectPath, { replace: true });
    } catch (err: any) {
      logger.error('Auth callback error', err);
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
