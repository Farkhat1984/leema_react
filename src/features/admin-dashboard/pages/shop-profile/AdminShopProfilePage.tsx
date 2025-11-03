/**
 * Admin Shop Profile Page
 * Detailed view of a specific shop for administrators
 */

import { useState, useEffect } from 'react';
import { formatNumber } from '@/shared/lib/utils';
import { useParams } from 'react-router-dom';
import { Card } from '@/shared/components/feedback/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/feedback/Badge';
import { toast } from 'react-hot-toast';

interface ShopProfile {
  id: string;
  name: string;
  description: string;
  logo?: string;
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  category: string;
  address: string;
  phone: string;
  website?: string;
  registrationDate: string;
  stats: {
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    totalRevenue: number;
    rating: number;
    reviewsCount: number;
  };
  billing: {
    balance: number;
    currency: string;
  };
}

export default function AdminShopProfilePage() {
  const { shopId } = useParams<{ shopId: string }>();
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'products' | 'orders' | 'billing'>('info');

  useEffect(() => {
    if (shopId) {
      loadShopProfile(shopId);
    }
  }, [shopId]);

  const loadShopProfile = async (id: string) => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const mockShop: ShopProfile = {
        id,
        name: 'Fashion Style Boutique',
        description: 'Современная женская одежда и аксессуары высокого качества',
        logo: undefined,
        owner: {
          id: 'owner1',
          name: 'Айгерим Жанбекова',
          email: 'aigerim@example.com',
          phone: '+7 777 123 4567',
        },
        status: 'active',
        category: 'Женская одежда',
        address: 'Алматы, пр. Абая, 123',
        phone: '+7 727 123 4567',
        website: 'https://fashionstyle.kz',
        registrationDate: '2024-01-15T10:00:00Z',
        stats: {
          totalProducts: 145,
          activeProducts: 132,
          totalOrders: 1234,
          totalRevenue: 5678900,
          rating: 4.8,
          reviewsCount: 456,
        },
        billing: {
          balance: 125000,
          currency: 'KZT',
        },
      };
      setShop(mockShop);
    } catch (error) {
      toast.error('Ошибка загрузки профиля магазина');
    } finally {
      setLoading(false);
    }
  };

  const suspendShop = async () => {
    if (!shop) return;
    try {
      // TODO: API call
      setShop({ ...shop, status: 'suspended' });
      toast.success('Магазин приостановлен');
    } catch (error) {
      toast.error('Ошибка приостановки магазина');
    }
  };

  const activateShop = async () => {
    if (!shop) return;
    try {
      // TODO: API call
      setShop({ ...shop, status: 'active' });
      toast.success('Магазин активирован');
    } catch (error) {
      toast.error('Ошибка активации магазина');
    }
  };

  const getStatusBadge = (status: ShopProfile['status']) => {
    const badges = {
      active: <Badge className="bg-green-100 text-green-800">✅ Активен</Badge>,
      inactive: <Badge className="bg-gray-100 text-gray-800">⚪ Неактивен</Badge>,
      suspended: <Badge className="bg-red-100 text-red-800">🚫 Приостановлен</Badge>,
      pending: <Badge className="bg-yellow-100 text-yellow-800">🕐 На модерации</Badge>,
    };
    return badges[status];
  };

  if (loading) {
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
      <div className="flex items-start gap-6">
        {/* Logo */}
        <div className="flex-shrink-0">
          {shop.logo ? (
            <img
              src={shop.logo}
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
                  onClick={suspendShop}
                  variant="outline"
                  className="text-red-600 border-red-600"
                >
                  🚫 Приостановить
                </Button>
              ) : (
                <Button
                  onClick={activateShop}
                  variant="primary"
                  className="bg-green-600"
                >
                  ✅ Активировать
                </Button>
              )}
              <Button variant="outline">✏️ Редактировать</Button>
            </div>
          </div>
          <p className="text-gray-700 mb-4">{shop.description}</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Категория</p>
              <p className="font-medium">{shop.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Дата регистрации</p>
              <p className="font-medium">
                {new Date(shop.registrationDate).toLocaleDateString('ru-RU')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Рейтинг</p>
              <p className="font-medium">
                ⭐ {shop.stats.rating} ({shop.stats.reviewsCount} отзывов)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500 mb-1">Товары</p>
          <p className="text-2xl font-bold text-gray-900">
            {shop.stats.activeProducts}/{shop.stats.totalProducts}
          </p>
          <p className="text-xs text-gray-600">активных/всего</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 mb-1">Заказы</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(shop.stats?.totalOrders)}
          </p>
          <p className="text-xs text-gray-600">всего заказов</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 mb-1">Выручка</p>
          <p className="text-2xl font-bold text-gray-900">
            {(shop.stats.totalRevenue / 1000).toFixed(0)}k
          </p>
          <p className="text-xs text-gray-600">{shop.billing.currency}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500 mb-1">Баланс</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(shop.billing?.balance)}
          </p>
          <p className="text-xs text-gray-600">{shop.billing.currency}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {['info', 'products', 'orders', 'billing'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
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
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Владелец</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Имя</p>
                  <p className="font-medium">{shop.owner.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{shop.owner.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Телефон</p>
                  <p className="font-medium">{shop.owner.phone}</p>
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
