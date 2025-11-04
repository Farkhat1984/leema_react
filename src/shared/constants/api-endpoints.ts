/**
 * API Endpoints - Centralized endpoint definitions
 * Complete API endpoint structure for Leema React Platform
 *
 * @updated 2025-11-01 - Added 60+ missing endpoints from API_INTEGRATION_PLAN.md
 */

export const API_ENDPOINTS = {
  // ==================== AUTHENTICATION ====================
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    GOOGLE_URL: '/api/v1/auth/google/url',
    GOOGLE_LOGIN: '/api/v1/auth/google/login',
    GOOGLE_CALLBACK: '/api/v1/auth/google/callback',
    APPLE_LOGIN: '/api/v1/auth/apple/login',
    REFRESH: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/auth/me',
    UPDATE_PROFILE: '/api/v1/auth/profile',
  },

  // ==================== USERS ====================
  USERS: {
    ME: '/api/v1/users/me',
    UPDATE_ME: '/api/v1/users/me',
    BALANCE: '/api/v1/users/me/balance',
    ORDERS: '/api/v1/users/me/orders',
    WARDROBE: '/api/v1/users/me/wardrobe',
  },

  // ==================== SHOPS ====================
  SHOPS: {
    BASE: '/api/v1/shops',
    // Shop Profile
    ME: '/api/v1/shops/me',
    UPDATE_ME: '/api/v1/shops/me',
    UPLOAD_AVATAR: '/api/v1/shops/upload-avatar',

    // Analytics
    ANALYTICS: '/api/v1/shops/me/analytics',
    ANALYTICS_DETAILED: '/api/v1/shops/me/analytics/detailed',
    ANALYTICS_EXPORT: '/api/v1/shops/me/analytics/export',

    // Products & Orders
    PRODUCTS: '/api/v1/shops/me/products',
    TRANSACTIONS: '/api/v1/shops/me/transactions',
    ORDERS: '/api/v1/shops/me/orders',
    ORDER_BY_ID: (id: string | number) => `/api/v1/shops/me/orders/${id}`,

    // Newsletters
    NEWSLETTERS: '/api/v1/shops/me/newsletters/',
    NEWSLETTER_CREATE: '/api/v1/shops/me/newsletters',
    NEWSLETTER_BY_ID: (id: string | number) => `/api/v1/shops/me/newsletters/${id}`,
    NEWSLETTER_DELETE: (id: string | number) => `/api/v1/shops/me/newsletters/${id}`,
    NEWSLETTER_SEND: (id: string | number) => `/api/v1/shops/me/newsletters/${id}/send`,
    NEWSLETTER_UPLOAD_IMAGE: '/api/v1/shops/me/newsletters/upload-image',

    // Contacts/WhatsApp
    CONTACTS: '/api/v1/shops/me/contacts',
    CONTACT_CREATE: '/api/v1/shops/me/contacts',
    CONTACT_BULK_CREATE: '/api/v1/shops/me/contacts/bulk',
    CONTACT_BY_ID: (id: string | number) => `/api/v1/shops/me/contacts/${id}`,
    CONTACT_DELETE: (id: string | number) => `/api/v1/shops/me/contacts/${id}`,
    CONTACT_BULK_DELETE: '/api/v1/shops/me/contacts/bulk-delete',
    CONTACTS_IMPORT_EXCEL: '/api/v1/shops/me/contacts/upload',
    CONTACTS_EXPORT_EXCEL: '/api/v1/shops/me/contacts/export',
    CONTACTS_DOWNLOAD_TEMPLATE: '/api/v1/shops/me/contacts/template',

    // WhatsApp Integration
    WHATSAPP_QR: '/api/v1/shops/me/whatsapp/qr',
    WHATSAPP_STATUS: '/api/v1/shops/me/whatsapp/status',
    WHATSAPP_DISCONNECT: '/api/v1/shops/me/whatsapp/disconnect',
    WHATSAPP_INQUIRY: (shopId: string | number, productId: string | number) =>
      `/api/v1/shops/${shopId}/products/${productId}/whatsapp-inquiry`,
    WHATSAPP_SEND_INQUIRY: (shopId: string | number, productId: string | number) =>
      `/api/v1/shops/${shopId}/products/${productId}/send-whatsapp-inquiry`,
  },

  // ==================== PRODUCTS ====================
  PRODUCTS: {
    BASE: '/api/v1/products/',
    CREATE: '/api/v1/products/',
    BY_ID: (id: string | number) => `/api/v1/products/${id}`,
    UPDATE: (id: string | number) => `/api/v1/products/${id}`,
    DELETE: (id: string | number) => `/api/v1/products/${id}`,
    UPLOAD_IMAGES: '/api/v1/products/upload-images',
    BY_CATEGORY: (categoryId: string | number) => `/api/v1/products?category=${categoryId}`,
  },

  // ==================== ADMIN ====================
  ADMIN: {
    // Dashboard
    DASHBOARD: '/api/v1/admin/dashboard',

    // Products
    PRODUCTS: '/api/v1/admin/products',
    PRODUCTS_ALL: '/api/v1/admin/products/all',
    PRODUCTS_STATS: '/api/v1/admin/products/stats',
    PRODUCTS_BULK_ACTION: '/api/v1/admin/products/bulk-action',
    MODERATION_QUEUE: '/api/v1/admin/moderation/queue',
    PRODUCT_BY_ID: (id: string | number) => `/api/v1/admin/products/${id}`,
    APPROVE_PRODUCT: (id: string | number) => `/api/v1/admin/moderation/${id}/approve`,
    REJECT_PRODUCT: (id: string | number) => `/api/v1/admin/moderation/${id}/reject`,

    // Shops
    SHOPS: '/api/v1/admin/shops',
    SHOPS_ALL: '/api/v1/admin/shops/all',
    SHOPS_BULK_ACTION: '/api/v1/admin/shops/bulk-action',
    SHOP_BY_ID: (id: string | number) => `/api/v1/admin/shops/${id}`,
    SHOP_APPROVE: (id: string | number) => `/api/v1/admin/shops/${id}/approve`,
    SHOP_REJECT: (id: string | number) => `/api/v1/admin/shops/${id}/reject`,
    SHOP_DEACTIVATE: (id: string | number) => `/api/v1/admin/shops/${id}/deactivate`,
    SHOP_ACTIVATE: (id: string | number) => `/api/v1/admin/shops/${id}/activate`,

    // Users
    USERS: '/api/v1/admin/users',
    USER_BY_ID: (id: string | number) => `/api/v1/admin/users/${id}`,
    USER_DELETE: (id: string | number) => `/api/v1/admin/users/${id}`,

    // Settings
    SETTINGS: '/api/v1/admin/settings',
    SETTING_BY_KEY: (key: string) => `/api/v1/admin/settings/${key}`,
    SETTING_UPDATE: (key: string) => `/api/v1/admin/settings/${key}`,
    SETTING_DELETE: (key: string) => `/api/v1/admin/settings/${key}`,

    // Newsletters
    NEWSLETTERS: '/api/v1/admin/newsletters',
    NEWSLETTER_BY_ID: (id: string | number) => `/api/v1/admin/newsletters/${id}`,
    NEWSLETTER_APPROVE: (id: string | number) => `/api/v1/admin/newsletters/${id}/approve`,
    NEWSLETTER_REJECT: (id: string | number) => `/api/v1/admin/newsletters/${id}/reject`,
    NEWSLETTER_STATS: '/api/v1/admin/newsletters/stats',

    // Refunds
    REFUNDS: '/api/v1/admin/refunds',
    REFUND_BY_ID: (id: string | number) => `/api/v1/admin/refunds/${id}`,
    REFUND_PROCESS: (id: string | number) => `/api/v1/admin/refunds/${id}/process`,
    REFUND_APPROVE: (id: string | number) => `/api/v1/admin/refunds/${id}/approve`,
    REFUND_REJECT: (id: string | number) => `/api/v1/admin/refunds/${id}/reject`,

    // Orders
    ORDERS: '/api/v1/admin/orders',
    ORDER_BY_ID: (id: string | number) => `/api/v1/admin/orders/${id}`,
    ORDER_UPDATE_STATUS: (id: string | number) => `/api/v1/admin/orders/${id}/status`,

    // Wardrobes
    WARDROBES: '/api/v1/admin/wardrobes',
    WARDROBES_STATS: '/api/v1/admin/wardrobes/stats',
    WARDROBES_USER: (userId: string | number) => `/api/v1/admin/wardrobes/user/${userId}`,

    // Reports & Analytics
    REPORTS: '/api/v1/admin/reports',
    REPORT_FINANCIAL: '/api/v1/admin/reports/financial',
    REPORT_SALES: '/api/v1/admin/reports/sales',
    ANALYTICS: '/api/v1/admin/analytics',
    ANALYTICS_EXPORT: '/api/v1/admin/analytics/export',

    // Logs
    LOGS: '/api/v1/admin/logs',
    LOGS_ACTIVITY: '/api/v1/admin/logs/activity',
    LOGS_ERRORS: '/api/v1/admin/logs/errors',
    LOGS_EXPORT: '/api/v1/admin/logs/export',
  },

  // ==================== PAYMENTS ====================
  PAYMENTS: {
    SHOP_RENT_PRODUCT: '/api/v1/payments/shop/rent-product',
    SHOP_TOP_UP: '/api/v1/payments/shop/top-up',
    USER_TOP_UP: '/api/v1/payments/user/top-up',
    CAPTURE_PAYMENT: (token: string) => `/api/v1/payments/capture/${token}`,
  },

  // ==================== CATEGORIES ====================
  CATEGORIES: {
    LIST: '/api/v1/categories/',
    CREATE: '/api/v1/categories/',
    BY_ID: (id: string | number) => `/api/v1/categories/${id}`,
    UPDATE: (id: string | number) => `/api/v1/categories/${id}`,
    DELETE: (id: string | number) => `/api/v1/categories/${id}`,
  },

  // ==================== REVIEWS ====================
  REVIEWS: {
    LIST: '/api/v1/reviews/',
    CREATE: '/api/v1/reviews/',
    BY_ID: (id: string | number) => `/api/v1/reviews/${id}`,
    BY_PRODUCT: (productId: string | number) => `/api/v1/products/${productId}/reviews`,
    MODERATE: (id: string | number) => `/api/v1/admin/reviews/${id}/moderate`,
    DELETE: (id: string | number) => `/api/v1/reviews/${id}`,
  },

  // ==================== NOTIFICATIONS ====================
  NOTIFICATIONS: {
    LIST: '/api/v1/notifications/',
    UNREAD_COUNT: '/api/v1/notifications/unread-count',
    MARK_READ: (id: string | number) => `/api/v1/notifications/${id}/read`,
    MARK_ALL_READ: '/api/v1/notifications/mark-all-read',
    DELETE: (id: string | number) => `/api/v1/notifications/${id}`,
  },

  // ==================== AI TRY-ON ====================
  AI_TRYON: {
    BASE: '/api/ai-tryon',
    UPLOAD: '/api/ai-tryon/upload',
    GENERATE: '/api/ai-tryon/generate',
    HISTORY: '/api/ai-tryon/history',
  },
} as const;
