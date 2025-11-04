/**
 * Application Router Configuration
 * Defines all routes with lazy loading and protected routes
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import type { UserRole } from '@/features/auth/types';
import { PageLoader } from '@/shared/components/feedback/PageLoader';
import { ROUTES } from '@/shared/constants/config';

// Error Fallback Component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ошибка загрузки страницы</h1>
          <p className="text-gray-600 mb-4">{error.message}</p>
        </div>
        <div className="space-y-3">
          <button 
            onClick={resetErrorBoundary}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Попробовать снова
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            На главную
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to wrap components with ErrorBoundary and Suspense
function withErrorBoundary(
  component: React.ReactNode, 
  protectedRoute?: { allowedRoles: UserRole[] }
) {
  const content = (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<PageLoader />}>
        {component}
      </Suspense>
    </ErrorBoundary>
  );

  if (protectedRoute) {
    return (
      <ProtectedRoute allowedRoles={protectedRoute.allowedRoles}>
        {content}
      </ProtectedRoute>
    );
  }

  return content;
}

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const AuthCallbackPage = lazy(() => import('@/features/auth/pages/AuthCallbackPage'));

// Payment pages
const PaymentSuccessPage = lazy(() => import('@/features/payment').then(m => ({ default: m.PaymentSuccessPage })));
const PaymentCancelPage = lazy(() => import('@/features/payment').then(m => ({ default: m.PaymentCancelPage })));

// Shop dashboard pages
const ShopDashboard = lazy(() => import('@/features/shop-dashboard').then(m => ({ default: m.ShopDashboard })));
const ShopRegistration = lazy(() => import('@/features/shop-dashboard').then(m => ({ default: m.ShopRegistrationPage })));
const ShopCustomers = lazy(() => import('@/features/shop-dashboard').then(m => ({ default: m.CustomersPage })));
const ShopWhatsAppQR = lazy(() => import('@/features/shop-dashboard').then(m => ({ default: m.WhatsAppQRPage })));
const ShopProfile = lazy(() => import('@/features/shop-dashboard').then(m => ({ default: m.ShopProfilePage })));
const ShopReports = lazy(() => import('@/features/shop-dashboard').then(m => ({ default: m.ShopReportsPage })));
const ShopNotifications = lazy(() => import('@/features/shop-dashboard').then(m => ({ default: m.ShopNotificationsPage })));
const ShopWhatsApp = lazy(() => import('@/features/shop-dashboard').then(m => ({ default: m.ShopWhatsAppPage })));
const ShopReviews = lazy(() => import('@/features/shop-dashboard').then(m => ({ default: m.ShopReviewsPage })));

// Product pages
const ShopProducts = lazy(() => import('@/features/products').then(m => ({ default: m.ShopProductsPage })));
const AdminProducts = lazy(() => import('@/features/products').then(m => ({ default: m.AdminProductsPage })));

// Newsletter pages
const ShopNewsletters = lazy(() => import('@/features/newsletters/pages/ShopNewslettersPage'));
const AdminNewsletters = lazy(() => import('@/features/newsletters/pages/AdminNewslettersPage'));

// Analytics pages
const ShopAnalytics = lazy(() => import('@/features/analytics/pages/ShopAnalyticsPage'));

// Order pages
const ShopOrders = lazy(() => import('@/features/orders/pages/ShopOrdersPage'));
const AdminOrders = lazy(() => import('@/features/orders/pages/AdminOrdersPage'));

// Billing pages
const ShopBilling = lazy(() => import('@/features/billing/pages/BillingPage'));
const ShopTopUp = lazy(() => import('@/features/billing/pages/TopUpPage'));

// Admin dashboard pages
const AdminDashboard = lazy(() => import('@/features/admin-dashboard').then(m => ({ default: m.AdminDashboard })));
const AdminShops = lazy(() => import('@/features/admin-dashboard').then(m => ({ default: m.AdminShopsPage })));
const AdminSettings = lazy(() => import('@/features/admin-dashboard').then(m => ({ default: m.AdminSettingsPage })));
const AdminRefunds = lazy(() => import('@/features/admin-dashboard').then(m => ({ default: m.AdminRefundsPage })));
const AdminReviews = lazy(() => import('@/features/admin-dashboard').then(m => ({ default: m.AdminReviewsPage })));
const AdminUsers = lazy(() => import('@/features/admin-dashboard').then(m => ({ default: m.AdminUsersPage })));
const AdminUserProfile = lazy(() => import('@/features/admin-dashboard').then(m => ({ default: m.AdminUserProfilePage })));
const AdminLogs = lazy(() => import('@/features/admin-dashboard').then(m => ({ default: m.AdminLogsPage })));
const AdminReports = lazy(() => import('@/features/admin-dashboard').then(m => ({ default: m.AdminReportsPage })));
const AdminCategories = lazy(() => import('@/features/admin-dashboard').then(m => ({ default: m.AdminCategoriesPage })));
const AdminWardrobes = lazy(() => import('@/features/admin-dashboard').then(m => ({ default: m.AdminWardrobesPage })));
const AdminNotifications = lazy(() => import('@/features/admin-dashboard').then(m => ({ default: m.AdminNotificationsPage })));
const AdminShopsPending = lazy(() => import('@/features/admin-dashboard').then(m => ({ default: m.AdminShopsPendingPage })));
const AdminShopProfile = lazy(() => import('@/features/admin-dashboard').then(m => ({ default: m.AdminShopProfilePage })));

// User dashboard pages - REMOVED (users use mobile app only)

/**
 * Router configuration
 */
export const router = createBrowserRouter([
  // Public routes
  {
    path: ROUTES.PUBLIC.LOGIN,
    element: withErrorBoundary(<LoginPage />),
  },
  {
    path: ROUTES.PUBLIC.AUTH_CALLBACK,
    element: withErrorBoundary(<AuthCallbackPage />),
  },
  {
    path: ROUTES.PUBLIC.PAYMENT_SUCCESS,
    element: withErrorBoundary(<PaymentSuccessPage />),
  },
  {
    path: ROUTES.PUBLIC.PAYMENT_CANCEL,
    element: withErrorBoundary(<PaymentCancelPage />),
  },

  // Shop routes
  {
    path: ROUTES.SHOP.DASHBOARD,
    element: withErrorBoundary(<ShopDashboard />, { allowedRoles: ['shop_owner'] }),
  },
  {
    path: ROUTES.SHOP.REGISTER,
    element: withErrorBoundary(<ShopRegistration />, { allowedRoles: ['shop_owner'] }),
  },
  {
    path: ROUTES.SHOP.PRODUCTS,
    element: withErrorBoundary(<ShopProducts />, { allowedRoles: ['shop_owner'] }),
  },
  {
    path: ROUTES.SHOP.NEWSLETTER,
    element: withErrorBoundary(<ShopNewsletters />, { allowedRoles: ['shop_owner'] }),
  },
  {
    path: ROUTES.SHOP.ANALYTICS,
    element: withErrorBoundary(<ShopAnalytics />, { allowedRoles: ['shop_owner'] }),
  },
  {
    path: ROUTES.SHOP.ORDERS,
    element: withErrorBoundary(<ShopOrders />, { allowedRoles: ['shop_owner'] }),
  },
  {
    path: ROUTES.SHOP.BILLING,
    element: withErrorBoundary(<ShopBilling />, { allowedRoles: ['shop_owner'] }),
  },
  {
    path: ROUTES.SHOP.BILLING_TOPUP,
    element: withErrorBoundary(<ShopTopUp />, { allowedRoles: ['shop_owner'] }),
  },
  {
    path: ROUTES.SHOP.CUSTOMERS,
    element: withErrorBoundary(<ShopCustomers />, { allowedRoles: ['shop_owner'] }),
  },
  {
    path: ROUTES.SHOP.WHATSAPP_QR,
    element: withErrorBoundary(<ShopWhatsAppQR />, { allowedRoles: ['shop_owner'] }),
  },
  {
    path: ROUTES.SHOP.PROFILE,
    element: withErrorBoundary(<ShopProfile />, { allowedRoles: ['shop_owner'] }),
  },
  {
    path: ROUTES.SHOP.REPORTS,
    element: withErrorBoundary(<ShopReports />, { allowedRoles: ['shop_owner'] }),
  },
  {
    path: ROUTES.SHOP.NOTIFICATIONS,
    element: withErrorBoundary(<ShopNotifications />, { allowedRoles: ['shop_owner'] }),
  },
  {
    path: ROUTES.SHOP.WHATSAPP,
    element: withErrorBoundary(<ShopWhatsApp />, { allowedRoles: ['shop_owner'] }),
  },
  {
    path: ROUTES.SHOP.REVIEWS,
    element: withErrorBoundary(<ShopReviews />, { allowedRoles: ['shop_owner'] }),
  },

  // Admin routes
  {
    path: ROUTES.ADMIN.DASHBOARD,
    element: withErrorBoundary(<AdminDashboard />, { allowedRoles: ['admin'] }),
  },
  {
    path: ROUTES.ADMIN.PRODUCTS,
    element: withErrorBoundary(<AdminProducts />, { allowedRoles: ['admin'] }),
  },
  {
    path: ROUTES.ADMIN.SHOPS,
    element: withErrorBoundary(<AdminShops />, { allowedRoles: ['admin'] }),
  },
  {
    path: ROUTES.ADMIN.NEWSLETTER,
    element: withErrorBoundary(<AdminNewsletters />, { allowedRoles: ['admin'] }),
  },
  {
    path: ROUTES.ADMIN.ORDERS,
    element: withErrorBoundary(<AdminOrders />, { allowedRoles: ['admin'] }),
  },
  {
    path: ROUTES.ADMIN.SETTINGS,
    element: withErrorBoundary(<AdminSettings />, { allowedRoles: ['admin'] }),
  },
  {
    path: ROUTES.ADMIN.REFUNDS,
    element: withErrorBoundary(<AdminRefunds />, { allowedRoles: ['admin'] }),
  },
  {
    path: ROUTES.ADMIN.WARDROBES,
    element: withErrorBoundary(<AdminWardrobes />, { allowedRoles: ['admin'] }),
  },
  {
    path: ROUTES.ADMIN.NOTIFICATIONS,
    element: withErrorBoundary(<AdminNotifications />, { allowedRoles: ['admin'] }),
  },
  {
    path: ROUTES.ADMIN.SHOPS_PENDING,
    element: withErrorBoundary(<AdminShopsPending />, { allowedRoles: ['admin'] }),
  },
  {
    path: '/admin/shops/:shopId',
    element: withErrorBoundary(<AdminShopProfile />, { allowedRoles: ['admin'] }),
  },
  {
    path: ROUTES.ADMIN.USERS,
    element: withErrorBoundary(<AdminUsers />, { allowedRoles: ['admin'] }),
  },
  {
    path: '/admin/users/:userId',
    element: withErrorBoundary(<AdminUserProfile />, { allowedRoles: ['admin'] }),
  },
  {
    path: ROUTES.ADMIN.REVIEWS,
    element: withErrorBoundary(<AdminReviews />, { allowedRoles: ['admin'] }),
  },
  {
    path: ROUTES.ADMIN.CATEGORIES,
    element: withErrorBoundary(<AdminCategories />, { allowedRoles: ['admin'] }),
  },
  {
    path: ROUTES.ADMIN.LOGS,
    element: withErrorBoundary(<AdminLogs />, { allowedRoles: ['admin'] }),
  },
  {
    path: ROUTES.ADMIN.REPORTS,
    element: withErrorBoundary(<AdminReports />, { allowedRoles: ['admin'] }),
  },

  // User routes - REMOVED (users use mobile app only)

  // Root redirect to login
  {
    path: '/',
    element: <Navigate to={ROUTES.PUBLIC.LOGIN} replace />,
  },

  // Catch all - redirect to login
  {
    path: '*',
    element: <Navigate to={ROUTES.PUBLIC.LOGIN} replace />,
  },
]);
