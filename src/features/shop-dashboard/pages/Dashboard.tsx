/**
 * Shop Dashboard - Main dashboard for shop owners
 * Shows statistics, quick actions, and recent activity
 */

import { Link } from 'react-router-dom';
import {
  Store,
  LogOut,
  Package,
  CheckCircle,
  Eye,
  Wand2,
  Settings,
  ShoppingCart,
  UserCog,
  Mail,
  TrendingUp,
  Wallet,
  Users,
  Star,
  MessageSquare,
  QrCode,
  FileText,
  Bell
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/authStore';
import { shopService } from '@/features/shop-dashboard/services';
import { useProductEvents, useOrderEvents, useBalanceEvents, useNotificationEvents, useShopEvents, useWhatsAppEvents } from '@/features/websocket/hooks';
import { Card } from '@/shared/components/feedback/Card';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { NotificationDropdown } from '@/shared/components/layout/NotificationDropdown';
import { ROUTES } from '@/shared/constants/config';

interface DashboardStats {
  total_products: number;
  active_products: number;
  total_views: number;
  total_try_ons: number;
  total_purchases: number;
  total_revenue: number;
}

function ShopDashboard() {
  const { shop } = useAuthStore();

  // Enable WebSocket event handlers
  useProductEvents();
  useOrderEvents();
  useBalanceEvents();
  useNotificationEvents();
  useShopEvents();
  useWhatsAppEvents();

  /**
   * Fetch shop analytics using React Query
   */
  const { data: stats, isLoading } = useQuery({
    queryKey: ['shop', 'analytics'],
    queryFn: shopService.getAnalytics,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  /**
   * Fetch shop profile
   */
  const { data: shopProfile } = useQuery({
    queryKey: ['shop', 'profile'],
    queryFn: shopService.getProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  /**
   * Fetch shop balance
   */
  const { data: balance } = useQuery({
    queryKey: ['shop', 'balance'],
    queryFn: shopService.getBalance,
    staleTime: 1000 * 60, // 1 minute
  });

  /**
   * Handle logout
   */
  const handleLogout = () => {
    useAuthStore.getState().logout();
    window.location.href = ROUTES.PUBLIC.LOGIN;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner className="w-12 h-12 text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <Store className="text-purple-600 w-6 h-6 mr-3" />
                <span className="text-xl font-bold text-gray-900">Панель магазина</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Temporarily disabled - causes 401 for shop users */}
              {/* <NotificationDropdown /> */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{shop?.name || 'Мой магазин'}</p>
                  <p className="text-xs text-gray-500">Владелец магазина</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Balance & Revenue Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          {balance && (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Баланс</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {balance.current_balance.toLocaleString('ru-RU')} ₸
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    В ожидании: {balance.pending_balance?.toLocaleString('ru-RU') || 0} ₸
                  </p>
                </div>
                <Wallet className="w-12 h-12 text-green-600" />
              </div>
            </Card>
          )}

          {stats && (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Общая выручка</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.total_revenue?.toLocaleString('ru-RU') || 0} ₸
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Покупок: {stats.total_purchases || 0}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-600" />
              </div>
            </Card>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Всего товаров</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_products || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="text-purple-600 w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Активные товары</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.active_products || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600 w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Всего просмотров</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_views || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="text-blue-600 w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Виртуальные примерки</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_try_ons || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Wand2 className="text-orange-600 w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="text-purple-600 w-5 h-5 mr-2" />
            Управление магазином
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Товары */}
            <Link
              to={ROUTES.SHOP.PRODUCTS}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Package className="text-purple-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Товары</h3>
                <p className="text-sm text-gray-500">Управление товарами</p>
              </div>
            </Link>

            {/* Заказы */}
            <Link
              to={ROUTES.SHOP.ORDERS}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <ShoppingCart className="text-blue-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Заказы</h3>
                <p className="text-sm text-gray-500">Просмотр заказов клиентов</p>
              </div>
            </Link>

            {/* Клиенты */}
            <Link
              to={ROUTES.SHOP.CUSTOMERS}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Users className="text-cyan-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Клиенты</h3>
                <p className="text-sm text-gray-500">База клиентов</p>
              </div>
            </Link>

            {/* Отзывы */}
            <Link
              to={ROUTES.SHOP.REVIEWS}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Star className="text-yellow-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Отзывы</h3>
                <p className="text-sm text-gray-500">Отзывы клиентов</p>
              </div>
            </Link>

            {/* Аналитика */}
            <Link
              to={ROUTES.SHOP.ANALYTICS}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <TrendingUp className="text-teal-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Аналитика</h3>
                <p className="text-sm text-gray-500">Статистика и отчеты</p>
              </div>
            </Link>

            {/* Отчеты */}
            <Link
              to={ROUTES.SHOP.REPORTS}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <FileText className="text-emerald-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Отчеты</h3>
                <p className="text-sm text-gray-500">Финансовые отчеты</p>
              </div>
            </Link>

            {/* Рассылки */}
            <Link
              to={ROUTES.SHOP.NEWSLETTER}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Mail className="text-indigo-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Рассылки</h3>
                <p className="text-sm text-gray-500">Управление рассылками</p>
              </div>
            </Link>

            {/* WhatsApp Business */}
            <Link
              to={ROUTES.SHOP.WHATSAPP}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <MessageSquare className="text-green-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">WhatsApp Business</h3>
                <p className="text-sm text-gray-500">Подключение и настройки</p>
              </div>
            </Link>

            {/* Уведомления */}
            <Link
              to={ROUTES.SHOP.NOTIFICATIONS}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Bell className="text-amber-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Уведомления</h3>
                <p className="text-sm text-gray-500">Центр уведомлений</p>
              </div>
            </Link>

            {/* Биллинг */}
            <Link
              to={ROUTES.SHOP.BILLING}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Wallet className="text-yellow-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Биллинг</h3>
                <p className="text-sm text-gray-500">Баланс и платежи</p>
              </div>
            </Link>

            {/* Профиль */}
            <Link
              to={ROUTES.SHOP.PROFILE}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <UserCog className="text-pink-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Профиль</h3>
                <p className="text-sm text-gray-500">Настройки магазина</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ShopDashboard;
