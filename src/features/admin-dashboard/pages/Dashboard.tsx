/**
 * Admin Dashboard - Main dashboard for administrators
 * Shows system statistics, moderation queue, and management tools
 */

import { Link } from 'react-router-dom';
import {
  Shield,
  LogOut,
  Users,
  Store,
  Package,
  Clock,
  Settings,
  Mail,
  ShoppingCart,
  DollarSign,
  Star,
  FolderTree,
  FileText,
  BarChart3,
  Shirt,
  Bell,
  ClipboardCheck,
  Bot
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store/authStore';
import { adminService } from '@/features/admin-dashboard/services';
import { useProductEvents, useOrderEvents, useShopEvents, useNotificationEvents, useSettingsEvents } from '@/features/websocket/hooks';
import { Card } from '@/shared/components/feedback/Card';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { NotificationDropdown } from '@/shared/components/layout/NotificationDropdown';
import { ROUTES } from '@/shared/constants/config';

function AdminDashboard() {
  const { user } = useAuthStore();

  // Enable WebSocket event handlers for admin
  useProductEvents();
  useOrderEvents();
  useShopEvents();
  useNotificationEvents();
  useSettingsEvents();

  /**
   * Fetch admin dashboard statistics
   */
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: adminService.getDashboard,
    staleTime: 1000 * 60 * 2, // 2 minutes
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
                <Shield className="text-purple-600 w-6 h-6 mr-3" />
                <span className="text-xl font-bold text-gray-900">Панель администратора</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationDropdown />
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">Администратор</p>
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
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Всего пользователей</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_users || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="text-blue-600 w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Всего магазинов</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_shops || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Store className="text-purple-600 w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Всего товаров</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.total_products || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="text-green-600 w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">На модерации</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pending_moderation || 0}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="text-orange-600 w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Management Tools */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="text-purple-600 w-5 h-5 mr-2" />
            Управление системой
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Модерация товаров */}
            <Link
              to={ROUTES.ADMIN.PRODUCTS}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Package className="text-purple-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Модерация товаров</h3>
                <p className="text-sm text-gray-500">Проверка и одобрение</p>
              </div>
            </Link>

            {/* Магазины */}
            <Link
              to={ROUTES.ADMIN.SHOPS}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Store className="text-blue-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Магазины</h3>
                <p className="text-sm text-gray-500">Управление магазинами</p>
              </div>
            </Link>

            {/* Магазины на модерации */}
            <Link
              to={ROUTES.ADMIN.SHOPS_PENDING}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <ClipboardCheck className="text-orange-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Модерация магазинов</h3>
                <p className="text-sm text-gray-500">Ожидающие проверки</p>
              </div>
            </Link>

            {/* Пользователи */}
            <Link
              to={ROUTES.ADMIN.USERS}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Users className="text-green-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Пользователи</h3>
                <p className="text-sm text-gray-500">Управление пользователями</p>
              </div>
            </Link>

            {/* Заказы */}
            <Link
              to={ROUTES.ADMIN.ORDERS}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <ShoppingCart className="text-cyan-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Заказы</h3>
                <p className="text-sm text-gray-500">Все заказы системы</p>
              </div>
            </Link>

            {/* Возвраты */}
            <Link
              to={ROUTES.ADMIN.REFUNDS}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <DollarSign className="text-red-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Возвраты</h3>
                <p className="text-sm text-gray-500">Обработка возвратов</p>
              </div>
            </Link>

            {/* Отзывы */}
            <Link
              to={ROUTES.ADMIN.REVIEWS}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Star className="text-yellow-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Отзывы</h3>
                <p className="text-sm text-gray-500">Модерация отзывов</p>
              </div>
            </Link>

            {/* Категории */}
            <Link
              to={ROUTES.ADMIN.CATEGORIES}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <FolderTree className="text-teal-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Категории</h3>
                <p className="text-sm text-gray-500">Управление категориями</p>
              </div>
            </Link>

            {/* Гардеробы */}
            <Link
              to={ROUTES.ADMIN.WARDROBES}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-fuchsia-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Shirt className="text-fuchsia-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Гардеробы</h3>
                <p className="text-sm text-gray-500">Управление гардеробами</p>
              </div>
            </Link>

            {/* AI Agents */}
            <Link
              to="/admin/ai-agents"
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Bot className="text-violet-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">AI Агенты</h3>
                <p className="text-sm text-gray-500">Управление агентами</p>
              </div>
            </Link>

            {/* Рассылки */}
            <Link
              to={ROUTES.ADMIN.NEWSLETTER}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Mail className="text-pink-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Рассылки</h3>
                <p className="text-sm text-gray-500">Модерация рассылок</p>
              </div>
            </Link>

            {/* Уведомления */}
            <Link
              to={ROUTES.ADMIN.NOTIFICATIONS}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Bell className="text-amber-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Уведомления</h3>
                <p className="text-sm text-gray-500">Управление уведомлениями</p>
              </div>
            </Link>

            {/* Логи */}
            <Link
              to={ROUTES.ADMIN.LOGS}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <FileText className="text-slate-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Логи</h3>
                <p className="text-sm text-gray-500">Системные логи</p>
              </div>
            </Link>

            {/* Отчеты */}
            <Link
              to={ROUTES.ADMIN.REPORTS}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <BarChart3 className="text-emerald-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Отчеты</h3>
                <p className="text-sm text-gray-500">Аналитика и отчеты</p>
              </div>
            </Link>

            {/* Настройки */}
            <Link
              to={ROUTES.ADMIN.SETTINGS}
              className="flex items-center p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
            >
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                <Settings className="text-indigo-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Настройки</h3>
                <p className="text-sm text-gray-500">Системные настройки</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
