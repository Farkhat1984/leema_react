/**
 * Application configuration with environment variable validation
 */

import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  VITE_API_URL: z
    .string()
    .url('VITE_API_URL must be a valid URL')
    .min(1, 'VITE_API_URL is required'),
  VITE_WS_URL: z
    .string()
    .url('VITE_WS_URL must be a valid WebSocket URL')
    .regex(/^wss?:\/\//, 'VITE_WS_URL must start with ws:// or wss://')
    .min(1, 'VITE_WS_URL is required'),
  VITE_GOOGLE_CLIENT_ID: z
    .string()
    .min(1, 'VITE_GOOGLE_CLIENT_ID is required for Google OAuth')
    .regex(/\.apps\.googleusercontent\.com$/, 'VITE_GOOGLE_CLIENT_ID must be a valid Google Client ID'),
  VITE_ENV: z
    .enum(['development', 'staging', 'production'], {
      errorMap: () => ({ message: 'VITE_ENV must be one of: development, staging, production' }),
    })
    .default('development'),
  DEV: z.boolean(),
  PROD: z.boolean(),
});

// Validate environment variables at startup
function validateEnv() {
  try {
    const env = {
      VITE_API_URL: import.meta.env.VITE_API_URL,
      VITE_WS_URL: import.meta.env.VITE_WS_URL,
      VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      VITE_ENV: import.meta.env.VITE_ENV || 'development',
      DEV: import.meta.env.DEV,
      PROD: import.meta.env.PROD,
    };

    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format validation errors nicely
      const errors = error.errors.map((err) => `  - ${err.path.join('.')}: ${err.message}`).join('\n');

      throw new Error(
        `❌ Environment variable validation failed:\n\n${errors}\n\n` +
        `Please check your .env file and ensure all required variables are set correctly.\n` +
        `See .env.example for reference.`
      );
    }
    throw error;
  }
}

// Validate and export validated environment
const validatedEnv = validateEnv();

export const CONFIG = {
  API_URL: validatedEnv.VITE_API_URL,
  WS_URL: validatedEnv.VITE_WS_URL,
  GOOGLE_CLIENT_ID: validatedEnv.VITE_GOOGLE_CLIENT_ID,
  ENV: validatedEnv.VITE_ENV,
  IS_DEV: validatedEnv.DEV,
  IS_PROD: validatedEnv.PROD,
} as const;

export const ROUTES = {
  PUBLIC: {
    LOGIN: '/login',
    REGISTER: '/register',
    AUTH_CALLBACK: '/auth/callback',
    PAYMENT_SUCCESS: '/payment/success',
    PAYMENT_CANCEL: '/payment/cancel',
  },
  SHOP: {
    DASHBOARD: '/shop',
    REGISTER: '/shop/register',
    PRODUCTS: '/shop/products',
    ORDERS: '/shop/orders',
    NEWSLETTER: '/shop/newsletter',
    ANALYTICS: '/shop/analytics',
    PROFILE: '/shop/profile',
    BILLING: '/shop/billing',
    BILLING_TOPUP: '/shop/billing/topup',
    CUSTOMERS: '/shop/customers',
    REVIEWS: '/shop/reviews',
    WHATSAPP_QR: '/shop/whatsapp-qr',
    WHATSAPP: '/shop/whatsapp',
    NOTIFICATIONS: '/shop/notifications',
    REPORTS: '/shop/reports',
  },
  ADMIN: {
    DASHBOARD: '/admin',
    PRODUCTS: '/admin/products',
    SHOPS: '/admin/shops',
    SHOPS_PENDING: '/admin/shops/pending',
    SHOP_DETAIL: (id: string | number) => `/admin/shops/${id}`,
    USERS: '/admin/users',
    USER_DETAIL: (id: string | number) => `/admin/users/${id}`,
    ORDERS: '/admin/orders',
    SETTINGS: '/admin/settings',
    REFUNDS: '/admin/refunds',
    REVIEWS: '/admin/reviews',
    CATEGORIES: '/admin/categories',
    LOGS: '/admin/logs',
    REPORTS: '/admin/reports',
    NEWSLETTER: '/admin/newsletters',
    NOTIFICATIONS: '/admin/notifications',
    WARDROBES: '/admin/wardrobes',
  },
  USER: {
    DASHBOARD: '/user',
    PROFILE: '/user/profile',
    NOTIFICATIONS: '/user/notifications',
  },
} as const;
