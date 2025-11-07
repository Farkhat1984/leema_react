/**
 * Role Constants
 * Centralized role definitions for type-safe role management
 */

export const ROLES = {
  USER: 'user',
  SHOP_OWNER: 'shop_owner',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

/**
 * Validate if a string is a valid role
 */
export const isValidRole = (role: string): role is UserRole => {
  return Object.values(ROLES).includes(role as UserRole);
};

/**
 * Get all available roles as an array
 */
export const getAllRoles = (): UserRole[] => {
  return Object.values(ROLES);
};
