/**
 * Login Page - Fashion AI Platform
 * Supports Google OAuth login for shop owners and admins
 * Redirects users to mobile app download page
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ROUTES } from '@/shared/constants/config';
import { Button } from '@/shared/components/ui/Button';
import { logger } from '@/shared/lib/utils/logger';
import authService from '../services/authService';

type AccountType = 'shop' | 'admin';

/**
 * Google SVG Icon Component
 */
const GoogleIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

/**
 * Mobile App Icon Component
 */
const MobileAppIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Redirect if already authenticated
   */
  useEffect(() => {
    logger.debug('[LoginPage] Auth state changed', {
      isAuthenticated,
      userRole: user?.role,
      currentPath: window.location.pathname
    });

    if (isAuthenticated && user) {
      const redirectPath = getRedirectPath(user.role);
      logger.debug('[LoginPage] User is authenticated, redirecting from login page', {
        userRole: user.role,
        redirectPath,
        currentPath: window.location.pathname
      });
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  /**
   * Get redirect path based on user role
   */
  const getRedirectPath = (role: string) => {
    switch (role) {
      case 'admin':
        return ROUTES.ADMIN.DASHBOARD;
      case 'shop_owner':
        return ROUTES.SHOP.DASHBOARD;
      default:
        return ROUTES.ADMIN.DASHBOARD;
    }
  };

  /**
   * Handle Google OAuth login for shop/admin
   * Uses backend API to generate secure OAuth URL with state and nonce
   */
  const handleGoogleLogin = async (accountType: AccountType) => {
    setIsLoading(true);

    try {
      // Store requested account type for callback
      localStorage.setItem('requestedAccountType', accountType);

      // Get secure OAuth URL from backend with state and nonce
      const { authorization_url } = await authService.getGoogleAuthUrl(accountType, 'web');

      logger.debug('[LoginPage] Redirecting to Google OAuth', {
        accountType,
        url: authorization_url.substring(0, 100) + '...'
      });

      // Redirect to Google OAuth
      window.location.href = authorization_url;
    } catch (error) {
      logger.error('[LoginPage] Failed to get Google auth URL', error);
      setIsLoading(false);
    }
  };

  /**
   * Handle user app redirect
   */
  const handleUserAppRedirect = () => {
    window.location.href = 'https://www.app.leema.kz';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Fashion AI Platform
            </h1>
            <p className="text-gray-600">Выберите как вы хотите войти</p>
          </div>

          {/* Login Buttons */}
          <div className="space-y-4">
            {/* User App Download */}
            <Button
              onClick={handleUserAppRedirect}
              variant="outline"
              className="w-full h-12 text-gray-700 border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
            >
              <MobileAppIcon />
              <span className="ml-3">Войти как пользователь</span>
            </Button>

            {/* Shop Login */}
            <Button
              onClick={() => handleGoogleLogin('shop')}
              disabled={isLoading}
              variant="primary"
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white transition-all duration-200"
            >
              <GoogleIcon />
              <span className="ml-3">Войти как магазин</span>
            </Button>

            {/* Admin Login */}
            <Button
              onClick={() => handleGoogleLogin('user')}
              disabled={isLoading}
              className="w-full h-12 bg-gray-800 hover:bg-gray-900 text-white transition-all duration-200"
            >
              <GoogleIcon />
              <span className="ml-3">Войти как админ</span>
            </Button>
          </div>

          {/* Footer Info */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p className="mb-2">Магазины и админы используют Google OAuth</p>
            <p>Пользователи - скачайте мобильное приложение</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
