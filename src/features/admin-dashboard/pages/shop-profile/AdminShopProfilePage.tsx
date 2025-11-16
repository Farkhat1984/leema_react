/**
 * Admin Shop Profile Page
 * Detailed view of a specific shop for administrators
 */

import { useState } from 'react';
import { formatNumber } from '@/shared/lib/utils';
import { useParams } from 'react-router-dom';
import { Card } from '@/shared/components/feedback/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/feedback/Badge';
import { BackButton } from '@/shared/components/ui/BackButton';
import { toast } from 'react-hot-toast';
import { ROUTES } from '@/shared/constants/config';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { managementService, type Shop } from '@/features/admin-dashboard/services/managementService';
import { moderationService } from '@/features/admin-dashboard/services';

export default function AdminShopProfilePage() {
  const { shopId } = useParams<{ shopId: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'info' | 'products' | 'orders' | 'billing'>('info');

  // Fetch shop data
  const { data: shop, isLoading } = useQuery({
    queryKey: ['admin', 'shop', shopId],
    queryFn: () => managementService.getShop(Number(shopId)),
    enabled: !!shopId,
  });

  // Activate mutation
  const activateMutation = useMutation({
    mutationFn: (id: number) => moderationService.activateShop(id),
    onSuccess: () => {
      toast.success('Магазин активирован');
      queryClient.invalidateQueries({ queryKey: ['admin', 'shop', shopId] });
    },
    onError: () => {
      toast.error('Ошибка активации магазина');
    },
  });

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      moderationService.deactivateShop(id, reason),
    onSuccess: () => {
      toast.success('Магазин деактивирован');
      queryClient.invalidateQueries({ queryKey: ['admin', 'shop', shopId] });
    },
    onError: () => {
      toast.error('Ошибка деактивации магазина');
    },
  });

  const handleActivate = () => {
    if (!shop) return;
    activateMutation.mutate(shop.id);
  };

  const handleDeactivate = () => {
    if (!shop) return;
    const reason = prompt('Введите причину деактивации:');
    if (!reason) return;
    deactivateMutation.mutate({ id: shop.id, reason });
  };

  const getStatusBadge = (status: Shop['status']) => {
    const badges = {
      active: <Badge className="bg-green-100 text-green-800">✅ Активен</Badge>,
      approved: <Badge className="bg-blue-100 text-blue-800">✓ Одобрен</Badge>,
      deactivated: <Badge className="bg-gray-100 text-gray-800">⚪ Деактивирован</Badge>,
      rejected: <Badge className="bg-red-100 text-red-800">✕ Отклонен</Badge>,
      pending: <Badge className="bg-yellow-100 text-yellow-800">🕐 На модерации</Badge>,
    };
    return badges[status];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка профиля магазина...</p>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <Card className="p-12 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">
          Магазин не найден
        </h3>
        <p className="text-gray-600">Магазин с ID {shopId} не существует</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Профиль магазина</h1>
        <BackButton to={ROUTES.ADMIN.SHOPS} />
      </div>

      <div className="flex items-start gap-6">
        {/* Logo */}
        <div className="flex-shrink-0">
          {shop.avatar ? (
            <img
              src={shop.avatar}
              alt={shop.name}
              className="w-32 h-32 rounded-lg object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold">
              {shop.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {shop.name}
              </h1>
              {getStatusBadge(shop.status)}
            </div>
            <div className="flex gap-2">
              {shop.status === 'active' ? (
                <Button
                  onClick={handleDeactivate}
                  variant="outline"
                  className="text-red-600 border-red-600"
                  disabled={deactivateMutation.isPending}
                  isLoading={deactivateMutation.isPending}
                >
                  🚫 Деактивировать
                </Button>
              ) : shop.status === 'approved' ? (
                <Button
                  onClick={handleActivate}
                  variant="primary"
                  className="bg-green-600"
                  disabled={activateMutation.isPending}
                  isLoading={activateMutation.isPending}
                >
                  ✅ Активировать
                </Button>
              ) : null}
            </div>
          </div>
          <p className="text-gray-700 mb-4">{shop.description}</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Владелец</p>
              <p className="font-medium">{shop.owner_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Дата регистрации</p>
              <p className="font-medium">
                {new Date(shop.created_at).toLocaleDateString('ru-RU')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Обновлен</p>
              <p className="font-medium">
                {new Date(shop.updated_at).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500 mb-1">Товары</p>
          <p className="text-2xl font-bold text-gray-900">
            {shop.active_products}/{shop.total_products}
          </p>
          <p className="text-xs text-gray-600">активных/всего</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 mb-1">Заказы</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(shop.total_orders)}
          </p>
          <p className="text-xs text-gray-600">всего заказов</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 mb-1">Выручка</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(shop.total_revenue)} ₸
          </p>
          <p className="text-xs text-gray-600">всего</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {(['info', 'products', 'orders', 'billing'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-1 font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'info' && 'Информация'}
              {tab === 'products' && 'Товары'}
              {tab === 'orders' && 'Заказы'}
              {tab === 'billing' && 'Биллинг'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Контактная информация</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Магазин</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Адрес</p>
                  <p className="font-medium">{shop.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Телефон</p>
                  <p className="font-medium">{shop.contact_phone}</p>
                </div>
                {shop.whatsapp_phone && (
                  <div>
                    <p className="text-sm text-gray-500">WhatsApp</p>
                    <p className="font-medium">{shop.whatsapp_phone}</p>
                  </div>
                )}
                {shop.rejection_reason && (
                  <div>
                    <p className="text-sm text-gray-500">Причина отклонения</p>
                    <p className="font-medium text-red-600">{shop.rejection_reason}</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Владелец</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Имя</p>
                  <p className="font-medium">{shop.owner_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{shop.owner_email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">ID владельца</p>
                  <p className="font-medium">{shop.owner_id}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'products' && (
        <Card className="p-6">
          <p className="text-gray-600">Список товаров магазина (в разработке)</p>
        </Card>
      )}

      {activeTab === 'orders' && (
        <Card className="p-6">
          <p className="text-gray-600">История заказов магазина (в разработке)</p>
        </Card>
      )}

      {activeTab === 'billing' && (
        <Card className="p-6">
          <p className="text-gray-600">Биллинг и транзакции (в разработке)</p>
        </Card>
      )}
    </div>
  );
}
