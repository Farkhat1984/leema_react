/**
 * Admin Shops Pending Page
 * Allows admins to approve or reject shops waiting for moderation
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/shared/components/feedback/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/feedback/Badge';
import { BackButton } from '@/shared/components/ui/BackButton';
import toast from 'react-hot-toast';
import { logger } from '@/shared/lib/utils/logger';
import { moderationService, managementService } from '@/features/admin-dashboard/services';
import { PageLoader } from '@/shared/components/feedback/PageLoader';

interface PendingShop {
  id: number;
  name: string;
  description: string;
  owner_name: string;
  owner_email: string;
  address: string;
  contact_phone: string;
  whatsapp_phone?: string;
  avatar?: string;
  status: string;
  created_at: string;
}

export default function AdminShopsPendingPage() {
  const queryClient = useQueryClient();
  const [selectedShop, setSelectedShop] = useState<PendingShop | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Fetch pending shops
  const { data: shopsData, isLoading } = useQuery({
    queryKey: ['admin', 'shops', 'pending'],
    queryFn: () => managementService.getShops({
      status: 'pending',
      limit: 100,
    }),
    staleTime: 1000 * 30, // 30 seconds
  });

  const shops = shopsData?.items || [];

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (shopId: number) => moderationService.approveShop(shopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
      toast.success('Магазин одобрен! Владелец получит уведомление.');
    },
    onError: (error: any) => {
      logger.error('Error approving shop', error);
      toast.error(error.message || 'Ошибка одобрения магазина');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ shopId, reason }: { shopId: number; reason: string }) =>
      moderationService.rejectShop(shopId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
      toast.success('Магазин отклонен. Владелец получит уведомление с причиной.');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedShop(null);
    },
    onError: (error: any) => {
      logger.error('Error rejecting shop', error);
      toast.error(error.message || 'Ошибка отклонения магазина');
    },
  });

  const handleApprove = (shop: PendingShop) => {
    approveMutation.mutate(shop.id);
  };

  const handleRejectClick = (shop: PendingShop) => {
    setSelectedShop(shop);
    setShowRejectModal(true);
  };

  const handleRejectSubmit = () => {
    if (!selectedShop) return;

    if (!rejectReason || rejectReason.trim().length < 10) {
      toast.error('Пожалуйста, укажите подробную причину отклонения (минимум 10 символов)');
      return;
    }

    rejectMutation.mutate({ shopId: selectedShop.id, reason: rejectReason });
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Модерация магазинов</h1>
          <p className="text-gray-600 mt-1">
            {shops.length > 0
              ? `${shops.length} магазинов ожидают проверки и одобрения`
              : 'Нет магазинов на модерации'}
          </p>
        </div>
        <BackButton to="/admin" />
      </div>

      <div className="flex justify-end mb-4">
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] })}
          variant="outline"
        >
          🔄 Обновить
        </Button>
      </div>

      {/* Shops List */}
      {shops.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Нет магазинов на модерации
          </h3>
          <p className="text-gray-600">
            Все магазины проверены. Новые заявки появятся здесь.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {shops.map((shop: any) => (
            <Card key={shop.id} className="p-6">
              <div className="flex items-start gap-6">
                {/* Logo */}
                <div className="flex-shrink-0">
                  {shop.avatar ? (
                    <img
                      src={shop.avatar}
                      alt={shop.name}
                      className="w-24 h-24 rounded-lg object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-24 h-24 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold ${
                      shop.avatar ? 'hidden' : ''
                    }`}
                  >
                    {shop.name.charAt(0)}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{shop.name}</h3>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        🕐 Ожидает проверки
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      Заявка от {new Date(shop.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  {shop.description && (
                    <p className="text-gray-700 mb-4">{shop.description}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Владелец</p>
                      <p className="font-medium">{shop.owner_name}</p>
                      <p className="text-sm text-gray-600">{shop.owner_email}</p>
                    </div>
                    {shop.address && (
                      <div>
                        <p className="text-sm text-gray-500">Адрес</p>
                        <p className="font-medium">{shop.address}</p>
                      </div>
                    )}
                    {shop.contact_phone && (
                      <div>
                        <p className="text-sm text-gray-500">Телефон</p>
                        <p className="font-medium">{shop.contact_phone}</p>
                      </div>
                    )}
                    {shop.whatsapp_phone && (
                      <div>
                        <p className="text-sm text-gray-500">WhatsApp</p>
                        <p className="font-medium">{shop.whatsapp_phone}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => handleApprove(shop)}
                      variant="primary"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={approveMutation.isPending}
                      isLoading={approveMutation.isPending && approveMutation.variables === shop.id}
                    >
                      ✅ Одобрить магазин
                    </Button>
                    <Button
                      onClick={() => handleRejectClick(shop)}
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      disabled={rejectMutation.isPending}
                    >
                      ❌ Отклонить
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedShop && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Отклонить магазин "{selectedShop.name}"
            </h3>
            <p className="text-gray-600 mb-4">
              Укажите причину отклонения. Владелец получит это сообщение.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Например: Не предоставлены необходимые документы..."
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 min-h-[100px]"
              required
            />
            <div className="flex gap-3">
              <Button
                onClick={handleRejectSubmit}
                variant="primary"
                className="bg-red-600 hover:bg-red-700"
                isLoading={rejectMutation.isPending}
                disabled={rejectMutation.isPending}
              >
                Отклонить
              </Button>
              <Button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                  setSelectedShop(null);
                }}
                variant="outline"
                disabled={rejectMutation.isPending}
              >
                Отмена
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
