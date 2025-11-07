/**
 * Protected Route Component
 * Restricts access to routes based on authentication and user role
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types';
import { ROLES } from '@/constants/roles';
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
  const { isAuthenticated, user, shop, accessToken } = useAuthStore();
  const location = useLocation();

  logger.debug('[ProtectedRoute] Checking access', {
    path: location.pathname,
    isAuthenticated,
    userRole: user?.role,
    hasAccessToken: !!accessToken,
    hasShop: !!shop,
    shopApproved: shop?.is_approved,
    shopActive: shop?.is_active,
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
      user.role === ROLES.ADMIN
        ? ROUTES.ADMIN.DASHBOARD
        : user.role === ROLES.SHOP_OWNER
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

  // Check if this is a shop route (not the registration page itself)
  const isShopRoute = allowedRoles?.includes(ROLES.SHOP_OWNER);
  const isRegistrationPage = location.pathname === ROUTES.SHOP.REGISTER;

  // If shop owner trying to access protected routes, check approval status
  if (isShopRoute && !isRegistrationPage && user?.role === ROLES.SHOP_OWNER) {
    const isApproved = shop?.is_approved === true;
    const isActive = shop?.is_active === true;

    logger.debug('[ProtectedRoute] Shop status check', {
      path: location.pathname,
      isApproved,
      isActive,
      shopId: shop?.id
    });

    // If shop is not approved or not active, redirect to registration page
    if (!isApproved || !isActive) {
      logger.warn('[ProtectedRoute] Shop not approved/active, redirecting to registration', {
        path: location.pathname,
        isApproved,
        isActive,
        shopId: shop?.id
      });
      return <Navigate to={ROUTES.SHOP.REGISTER} replace />;
    }
  }

  logger.debug('[ProtectedRoute] Access granted', {
    path: location.pathname,
    userRole: user?.role
  });

  return <>{children}</>;
};
