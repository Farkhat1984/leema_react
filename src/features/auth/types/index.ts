/**
 * Authentication types
 */

export type UserRole = 'user' | 'shop_owner' | 'admin';
export type AccountType = 'user' | 'shop' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  accountType: AccountType;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Shop {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  phone?: string;
  whatsapp_phone?: string;
  ownerId: string;
  balance: number;
  status: 'active' | 'suspended' | 'pending';
  is_approved: boolean;
  is_active: boolean;
  rejection_reason?: string;
  deactivation_reason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthResponse {
  user?: User;
  access_token: string;
  refresh_token: string;
  shop?: Shop;
  // Legacy support
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthState {
  user: User | null;
  shop: Shop | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthStore extends AuthState {
  login: (user: User, accessToken: string, shop?: Shop) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  setShop: (shop: Shop | null) => void;
  updateShop: (shop: Shop) => void;
  setLoading: (isLoading: boolean) => void;
}
