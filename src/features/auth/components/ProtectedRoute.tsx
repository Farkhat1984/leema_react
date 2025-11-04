/**
 * Protected Route Component
 * Restricts access to routes based on authentication and user role
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types';
import { ROUTES } from '@/shared/constants/config';
import { logger } from '@/shared/lib/utils/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({
  children,
  allowedRoles,
}: ProtectedRouteProps) => {
  const { isAuthenticated, user, accessToken } = useAuthStore();
  const location = useLocation();

  logger.debug('[ProtectedRoute] Checking access', {
    path: location.pathname,
    isAuthenticated,
    userRole: user?.role,
    hasAccessToken: !!accessToken,
    allowedRoles
  });

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    logger.warn('[ProtectedRoute] Not authenticated, redirecting to login', {
      path: location.pathname
    });
    return <Navigate to={ROUTES.PUBLIC.LOGIN} state={{ from: location }} replace />;
  }

  // If roles are specified and user doesn't have required role, redirect to home
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect based on user role
    const redirectPath =
      user.role === 'admin'
        ? ROUTES.ADMIN.DASHBOARD
        : user.role === 'shop_owner'
          ? ROUTES.SHOP.DASHBOARD
          : ROUTES.PUBLIC.LOGIN; // Regular users redirected to login (which redirects to mobile app)

    logger.warn('[ProtectedRoute] Role mismatch, redirecting', {
      path: location.pathname,
      userRole: user.role,
      allowedRoles,
      redirectPath
    });

    return <Navigate to={redirectPath} replace />;
  }

  logger.debug('[ProtectedRoute] Access granted', {
    path: location.pathname,
    userRole: user?.role
  });

  return <>{children}</>;
};
