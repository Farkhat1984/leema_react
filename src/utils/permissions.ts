/**
 * Permission Utilities
 * Helper functions for role-based access control
 */

import { ROLES, type UserRole } from '@/constants/roles';
import type { User } from '@/features/auth/types';

/**
 * Check if user has a specific role
 */
export const hasRole = (user: User | null, role: UserRole): boolean => {
  return user?.role === role;
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (user: User | null, roles: UserRole[]): boolean => {
  return user ? roles.includes(user.role) : false;
};

/**
 * Check if user has all of the specified roles (usually just one)
 */
export const hasAllRoles = (user: User | null, roles: UserRole[]): boolean => {
  return user ? roles.every((role) => user.role === role) : false;
};

/**
 * Check if user is an admin
 */
export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, ROLES.ADMIN);
};

/**
 * Check if user is a shop owner
 */
export const isShopOwner = (user: User | null): boolean => {
  return hasRole(user, ROLES.SHOP_OWNER);
};

/**
 * Check if user is a regular user
 */
export const isUser = (user: User | null): boolean => {
  return hasRole(user, ROLES.USER);
};

/**
 * Check if user is authenticated (has any role)
 */
export const isAuthenticated = (user: User | null): boolean => {
  return user !== null;
};

/**
 * Get user role display name
 */
export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    [ROLES.USER]: 'User',
    [ROLES.SHOP_OWNER]: 'Shop Owner',
    [ROLES.ADMIN]: 'Administrator',
  };
  return roleNames[role] || 'Unknown';
};
