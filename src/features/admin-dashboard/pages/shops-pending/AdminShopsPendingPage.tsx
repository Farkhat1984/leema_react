/**
 * Admin Shops Pending Page
 * Allows admins to approve or reject shops waiting for moderation
 */

import { useState, useEffect } from 'react';
import { Card } from '@/shared/components/feedback/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/feedback/Badge';
import { toast } from 'react-hot-toast';
import { logger } from '@/shared/lib/utils/logger';

interface PendingShop {
  id: string;
  name: string;
  description: string;
  ownerName: string;
  ownerEmail: string;
  category: string;
  address: string;
  phone: string;
  website?: string;
  logo?: string;
  registrationDate: string;
  status: 'pending';
  documents?: {
    businessLicense?: string;
    taxId?: string;
  };
}

export default function AdminShopsPendingPage() {
  const [shops, setShops] = useState<PendingShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<PendingShop | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadPendingShops();
  }, []);

  const loadPendingShops = async () => {
    try {
      setLoading(true);
      // Load pending shops from API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/admin/shops?status=pending`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending shops');
      }

      const data = await response.json();
      const mappedShops: PendingShop[] = (data.shops || data.data || []).map((shop: any) => ({
        id: String(shop.id),
        name: shop.shop_name || shop.name,
        description: shop.description || '',
        ownerName: shop.owner_name || '',
        ownerEmail: shop.email || '',
        category: shop.category || '',
        address: shop.address || '',
        phone: shop.phone || shop.contact_phone || '',
        website: shop.website || '',
        logo: shop.avatar_url || shop.logo_url,
        registrationDate: shop.created_at,
        status: 'pending' as const,
        documents: {
          businessLicense: shop.business_license,
          taxId: shop.tax_id,
        },
      }));

      setShops(mappedShops);
    } catch (error: any) {
      logger.error('Error loading pending shops', error);
      toast.error('Ошибка загрузки магазинов');
    } finally {
      setLoading(false);
    }
  };

  const approveShop = async (shopId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/shops/${shopId}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notes: 'Магазин одобрен администратором',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to approve shop');
      }

      setShops((prev) => prev.filter((s) => s.id !== shopId));
      toast.success('Магазин одобрен! Владелец получит уведомление.');
    } catch (error: any) {
      logger.error('Error approving shop', error);
      toast.error('Ошибка одобрения магазина');
    }
  };

  const rejectShop = async (shopId: string, reason: string) => {
    try {
      if (!reason || reason.trim().length < 10) {
        toast.error('Пожалуйста, укажите подробную причину отклонения (минимум 10 символов)');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/shops/${shopId}/reject`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: reason,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reject shop');
      }

      setShops((prev) => prev.filter((s) => s.id !== shopId));
      toast.success('Магазин отклонен. Владелец получит уведомление с причиной.');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedShop(null);
    } catch (error: any) {
      logger.error('Error rejecting shop', error);
      toast.error('Ошибка отклонения магазина');
    }
  };

  const handleRejectClick = (shop: PendingShop) => {
    setSelectedShop(shop);
    setShowRejectModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка магазинов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Модерация магазинов</h1>
          <p className="text-gray-600 mt-1">
            {shops.length > 0
              ? `${shops.length} магазинов ожидают проверки и одобрения`
              : 'Нет магазинов на модерации'}
          </p>
        </div>
        <Button onClick={loadPendingShops} variant="outline">
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
          {shops.map((shop) => (
            <Card key={shop.id} className="p-6">
              <div className="flex items-start gap-6">
                {/* Logo */}
                <div className="flex-shrink-0">
                  {shop.logo ? (
                    <img
                      src={shop.logo}
                      alt={shop.name}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                      {shop.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {shop.name}
                      </h3>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        🕐 Ожидает проверки
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">
                      Заявка от{' '}
                      {new Date(shop.registrationDate).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4">{shop.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Владелец</p>
                      <p className="font-medium">{shop.ownerName}</p>
                      <p className="text-sm text-gray-600">{shop.ownerEmail}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Категория</p>
                      <p className="font-medium">{shop.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Адрес</p>
                      <p className="font-medium">{shop.address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Телефон</p>
                      <p className="font-medium">{shop.phone}</p>
                    </div>
                    {shop.website && (
                      <div>
                        <p className="text-sm text-gray-500">Веб-сайт</p>
                        <a
                          href={shop.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {shop.website}
                        </a>
                      </div>
                    )}
                    {shop.documents && (
                      <div>
                        <p className="text-sm text-gray-500">Документы</p>
                        {shop.documents.businessLicense && (
                          <p className="text-sm">{shop.documents.businessLicense}</p>
                        )}
                        {shop.documents.taxId && (
                          <p className="text-sm">{shop.documents.taxId}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => approveShop(shop.id)}
                      variant="primary"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      ✅ Одобрить магазин
                    </Button>
                    <Button
                      onClick={() => handleRejectClick(shop)}
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      ❌ Отклонить
                    </Button>
                    <Button variant="ghost">
                      👁️ Подробнее
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
                onClick={() => {
                  if (rejectReason.trim()) {
                    rejectShop(selectedShop.id, rejectReason);
                  } else {
                    toast.error('Укажите причину отклонения');
                  }
                }}
                variant="primary"
                className="bg-red-600 hover:bg-red-700"
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
