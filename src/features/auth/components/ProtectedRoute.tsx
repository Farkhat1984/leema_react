/**
 * Protected Route Component
 * Restricts access to routes based on authentication and user role
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types';
import { ROUTES } from '@/shared/constants/config';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({
  children,
  allowedRoles,
}: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
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
          : ROUTES.USER.DASHBOARD;

    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};
