/**
 * Application Router Configuration
 * Defines all routes with lazy loading and protected routes
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import type { UserRole } from '@/features/auth/types';
import { ROLES } from '@/constants/roles';
import { PageLoader } from '@/shared/components/feedback/PageLoader';
import { ROUTES } from '@/shared/constants/config';

// Error Fallback Component
// eslint-disable-next-line react-refresh/only-export-components
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
const UnifiedWhatsApp = lazy(() => import('@/features/shop-dashboard').then(m => ({ default: m.UnifiedWhatsAppPage })));
const ShopProfile = lazy(() => import('@/features/shop-dashboard').then(m => ({ default: m.ShopProfilePage })));
const ShopReports = lazy(() => import('@/features/shop-dashboard').then(m => ({ default: m.ShopReportsPage })));
const ShopNotifications = lazy(() => import('@/features/shop-dashboard').then(m => ({ default: m.ShopNotificationsPage })));
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

// Kaspi pages
const ShopKaspi = lazy(() => import('@/features/shop-dashboard/pages/kaspi/ShopKaspiPage'));
const AdminKaspi = lazy(() => import('@/features/admin-dashboard/pages/kaspi/AdminKaspiPage'));

// Billing pages
const ShopBilling = lazy(() => import('@/features/billing/pages/BillingPage'));
const ShopTopUp = lazy(() => import('@/features/billing/pages/TopUpPage'));

// AI Agents pages (Shop Owner)
const AgentListPage = lazy(() => import('@/features/ai-agents/pages/AgentListPage'));
const CreateAgentPage = lazy(() => import('@/features/ai-agents/pages/CreateAgentPage'));
const EditAgentPage = lazy(() => import('@/features/ai-agents/pages/EditAgentPage'));
const AgentDetailsPage = lazy(() => import('@/features/ai-agents/pages/AgentDetailsPage'));

// AI Agents pages (Admin)
const AdminPlatformOverview = lazy(() => import('@/features/ai-agents/pages/admin/PlatformOverviewPage'));
const AdminAllAgents = lazy(() => import('@/features/ai-agents/pages/admin/AllAgentsPage'));
const AdminTemplates = lazy(() => import('@/features/ai-agents/pages/admin/TemplatesPage'));
const AdminTools = lazy(() => import('@/features/ai-agents/pages/admin/ToolsPage'));
const AdminGlobalConfig = lazy(() => import('@/features/ai-agents/pages/admin/GlobalConfigPage'));

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
const AdminUserWardrobe = lazy(() => import('@/features/admin-dashboard/pages/wardrobes/AdminUserWardrobePage'));
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
    element: withErrorBoundary(<ShopDashboard />, { allowedRoles: [ROLES.SHOP_OWNER] }),
  },
  {
    path: ROUTES.SHOP.REGISTER,
    element: withErrorBoundary(<ShopRegistration />, { allowedRoles: [ROLES.SHOP_OWNER] }),
  },
  {
    path: ROUTES.SHOP.PRODUCTS,
    element: withErrorBoundary(<ShopProducts />, { allowedRoles: [ROLES.SHOP_OWNER] }),
  },
  {
    path: ROUTES.SHOP.NEWSLETTER,
    element: withErrorBoundary(<ShopNewsletters />, { allowedRoles: [ROLES.SHOP_OWNER] }),
  },
  {
    path: ROUTES.SHOP.ANALYTICS,
    element: withErrorBoundary(<ShopAnalytics />, { allowedRoles: [ROLES.SHOP_OWNER] }),
  },
  {
    path: ROUTES.SHOP.ORDERS,
    element: withErrorBoundary(<ShopOrders />, { allowedRoles: [ROLES.SHOP_OWNER] }),
  },
  {
    path: ROUTES.SHOP.BILLING,
    element: withErrorBoundary(<ShopBilling />, { allowedRoles: [ROLES.SHOP_OWNER] }),
  },
  {
    path: ROUTES.SHOP.BILLING_TOPUP,
    element: withErrorBoundary(<ShopTopUp />, { allowedRoles: [ROLES.SHOP_OWNER] }),
  },
  {
    path: ROUTES.SHOP.CUSTOMERS,
    element: withErrorBoundary(<ShopCustomers />, { allowedRoles: [ROLES.SHOP_OWNER] }),
  },
  {
    path: ROUTES.SHOP.WHATSAPP,
    element: withErrorBoundary(<UnifiedWhatsApp />, { allowedRoles: [ROLES.SHOP_OWNER] }),
  },
  {
    path: ROUTES.SHOP.WHATSAPP_QR,
    element: <Navigate to={ROUTES.SHOP.WHATSAPP} replace />,
  },
  {
    path: ROUTES.SHOP.PROFILE,
    element: withErrorBoundary(<ShopProfile />, { allowedRoles: [ROLES.SHOP_OWNER] }),
  },
  {
    path: ROUTES.SHOP.REPORTS,
    element: withErrorBoundary(<ShopReports />, { allowedRoles: [ROLES.SHOP_OWNER] }),
  },
  {
    path: ROUTES.SHOP.NOTIFICATIONS,
    element: withErrorBoundary(<ShopNotifications />, { allowedRoles: [ROLES.SHOP_OWNER] }),
  },
  {
    path: ROUTES.SHOP.REVIEWS,
    element: withErrorBoundary(<ShopReviews />, { allowedRoles: [ROLES.SHOP_OWNER] }),
  },
  {
    path: ROUTES.SHOP.KASPI,
    element: withErrorBoundary(<ShopKaspi />, { allowedRoles: [ROLES.SHOP_OWNER] }),
  },
  {
    path: '/shop/ai-agents',
    element: withErrorBoundary(<AgentListPage />, { allowedRoles: [ROLES.SHOP_OWNER] }),
  },
  {
    path: '/shop/ai-agents/create',
    element: withErrorBoundary(<CreateAgentPage />, { allowedRoles: [ROLES.SHOP_OWNER] }),
  },
  {
    path: '/shop/ai-agents/:id',
    element: withErrorBoundary(<AgentDetailsPage />, { allowedRoles: [ROLES.SHOP_OWNER] }),
  },
  {
    path: '/shop/ai-agents/:id/edit',
    element: withErrorBoundary(<EditAgentPage />, { allowedRoles: [ROLES.SHOP_OWNER] }),
  },

  // Admin routes
  {
    path: ROUTES.ADMIN.DASHBOARD,
    element: withErrorBoundary(<AdminDashboard />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: ROUTES.ADMIN.PRODUCTS,
    element: withErrorBoundary(<AdminProducts />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: ROUTES.ADMIN.SHOPS,
    element: withErrorBoundary(<AdminShops />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: ROUTES.ADMIN.NEWSLETTER,
    element: withErrorBoundary(<AdminNewsletters />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: ROUTES.ADMIN.ORDERS,
    element: withErrorBoundary(<AdminOrders />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: ROUTES.ADMIN.SETTINGS,
    element: withErrorBoundary(<AdminSettings />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: ROUTES.ADMIN.REFUNDS,
    element: withErrorBoundary(<AdminRefunds />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: ROUTES.ADMIN.WARDROBES,
    element: withErrorBoundary(<AdminWardrobes />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: '/admin/wardrobes/user/:userId',
    element: withErrorBoundary(<AdminUserWardrobe />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: ROUTES.ADMIN.NOTIFICATIONS,
    element: withErrorBoundary(<AdminNotifications />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: ROUTES.ADMIN.SHOPS_PENDING,
    element: withErrorBoundary(<AdminShopsPending />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: '/admin/shops/:shopId',
    element: withErrorBoundary(<AdminShopProfile />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: ROUTES.ADMIN.USERS,
    element: withErrorBoundary(<AdminUsers />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: '/admin/users/:userId',
    element: withErrorBoundary(<AdminUserProfile />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: ROUTES.ADMIN.KASPI,
    element: withErrorBoundary(<AdminKaspi />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: ROUTES.ADMIN.REVIEWS,
    element: withErrorBoundary(<AdminReviews />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: ROUTES.ADMIN.CATEGORIES,
    element: withErrorBoundary(<AdminCategories />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: ROUTES.ADMIN.LOGS,
    element: withErrorBoundary(<AdminLogs />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: '/admin/ai-agents',
    element: withErrorBoundary(<AdminPlatformOverview />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: '/admin/ai-agents/all',
    element: withErrorBoundary(<AdminAllAgents />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: '/admin/ai-agents/templates',
    element: withErrorBoundary(<AdminTemplates />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: '/admin/ai-agents/tools',
    element: withErrorBoundary(<AdminTools />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: '/admin/ai-agents/config',
    element: withErrorBoundary(<AdminGlobalConfig />, { allowedRoles: [ROLES.ADMIN] }),
  },
  {
    path: ROUTES.ADMIN.REPORTS,
    element: withErrorBoundary(<AdminReports />, { allowedRoles: [ROLES.ADMIN] }),
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
