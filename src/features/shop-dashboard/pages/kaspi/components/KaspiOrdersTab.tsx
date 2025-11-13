import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Filter,
  Phone,
  Calendar,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { kaspiService } from '../../../services/kaspi.service';
import type { KaspiOrderStatus, KaspiOrderState, KaspiOrder } from '@/shared/types/kaspi';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/feedback/Card';
import { Badge } from '@/shared/components/feedback/Badge';
import { OrderDetailView } from './OrderDetailView';
import { KaspiProductImage } from './KaspiProductImage';

const statusLabels: Record<KaspiOrderStatus, string> = {
  APPROVED_BY_BANK: 'Одобрен банком',
  ACCEPTED_BY_MERCHANT: 'Принят',
  ASSEMBLED: 'Скомплектован',
  COMPLETED: 'Выполнен',
  CANCELLED: 'Отменен',
  CANCELLING: 'Отменяется',
  RETURNED: 'Возвращен',
};

const statusColors: Record<KaspiOrderStatus, string> = {
  APPROVED_BY_BANK: 'bg-blue-100 text-blue-700',
  ACCEPTED_BY_MERCHANT: 'bg-purple-100 text-purple-700',
  ASSEMBLED: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  CANCELLING: 'bg-orange-100 text-orange-700',
  RETURNED: 'bg-gray-100 text-gray-700',
};

const stateLabels: Record<KaspiOrderState, string> = {
  NEW: 'Новый',
  PICKUP: 'Самовывоз',
  DELIVERY: 'Доставка',
  KASPI_DELIVERY: 'Доставка Kaspi',
  ARCHIVE: 'Архив',
};

export function KaspiOrdersTab() {
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<KaspiOrder | null>(null);
  const [filters, setFilters] = useState<{
    status?: KaspiOrderStatus;
    state?: KaspiOrderState;
    customer_phone?: string;
    start_date?: string;
    end_date?: string;
  }>({});
  const [showFilters, setShowFilters] = useState(false);

  // Fetch orders
  const { data, isLoading, error } = useQuery({
    queryKey: ['kaspi', 'orders', page, filters],
    queryFn: () =>
      kaspiService.getOrders({
        page,
        size: 20,
        ...filters,
      }),
    retry: false,
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['kaspi', 'stats'],
    queryFn: kaspiService.getStats,
    retry: false,
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  // If order is selected, show detail view
  if (selectedOrder) {
    return <OrderDetailView order={selectedOrder} onBack={() => setSelectedOrder(null)} />;
  }

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  // Show error state if API is not ready
  if (error && !data) {
    return (
      <div className="space-y-6">
        <Card className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Интеграция Kaspi еще не настроена</h3>
          <p className="text-gray-600 mb-4">
            Перейдите во вкладку "Настройки" чтобы настроить интеграцию с Kaspi.kz
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Заказы Kaspi</h2>
          <p className="text-gray-600">Управление заказами из Kaspi.kz</p>
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4 mr-2" />
          Фильтры
        </Button>
      </div>

      {/* Info: No images available */}
      <Card className="p-4 bg-purple-50 border-purple-200">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-purple-900">
              Изображения товаров Kaspi недоступны
            </p>
            <p className="text-purple-700 mt-1">
              Kaspi API не предоставляет URL изображений товаров. Для получения доступа к
              фотографиям обратитесь в техподдержку Kaspi:{' '}
              <a href="tel:+77272442244" className="underline">
                +7 727 244 22 44
              </a>
              ,{' '}
              <a href="mailto:support@kaspi.kz" className="underline">
                support@kaspi.kz
              </a>
            </p>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Всего заказов</p>
                <p className="text-2xl font-bold">{stats.orders.total_orders}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Новые</p>
                <p className="text-2xl font-bold">{stats.orders.new_orders}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Выполнено</p>
                <p className="text-2xl font-bold">{stats.orders.completed_orders}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Выручка</p>
                <p className="text-2xl font-bold">
                  {parseFloat(stats.orders.total_revenue).toLocaleString('ru-RU')}₸
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Статус</label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Все статусы</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Тип доставки</label>
              <select
                value={filters.state || ''}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Все типы</option>
                {Object.entries(stateLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                Телефон клиента
              </label>
              <input
                type="text"
                value={filters.customer_phone || ''}
                onChange={(e) => handleFilterChange('customer_phone', e.target.value)}
                placeholder="+7 700 123 45 67"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Дата от
              </label>
              <input
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Дата до
              </label>
              <input
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                Сбросить фильтры
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Orders List */}
      <Card>
        {data?.orders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Заказов нет</h3>
            <p className="text-gray-600">
              Заказы из Kaspi.kz появятся здесь после синхронизации
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {data?.orders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">#{order.kaspi_order_code}</h3>
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                      <Badge variant="outline">{stateLabels[order.state]}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(order.creation_date).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-purple-600">
                      {parseFloat(order.total_price).toLocaleString('ru-RU')}₸
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {order.customer_name}
                    {order.customer_phone && (
                      <>
                        <span
                          className={`font-medium ml-1 ${
                            order.customer_phone.includes('(000)') ||
                            order.customer_phone.includes('0000') ||
                            order.customer_phone.startsWith('+0')
                              ? 'text-orange-600'
                              : 'text-purple-600'
                          }`}
                        >
                          {order.customer_phone.startsWith('+')
                            ? order.customer_phone
                            : '+' + order.customer_phone}
                        </span>
                        {(order.customer_phone.includes('(000)') ||
                          order.customer_phone.includes('0000') ||
                          order.customer_phone.startsWith('+0')) && (
                          <span className="text-orange-600 text-xs ml-1" title="Телефон замаскирован">
                            ⚠️
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    {order.products_json.length} товар(ов)
                  </div>
                  {order.delivery_address && (
                    <div className="flex items-center gap-1 flex-1 truncate">
                      <span className="truncate">
                        {typeof order.delivery_address === 'object'
                          ? order.delivery_address.formattedAddress ||
                            `${order.delivery_address.town || ''}, ${order.delivery_address.streetName || ''} ${order.delivery_address.streetNumber || ''}, ${order.delivery_address.building || ''}`.trim()
                          : order.delivery_address}
                      </span>
                    </div>
                  )}
                </div>

                {/* Products Preview with Images */}
                <div className="mt-3 flex items-center gap-3">
                  {/* Product Images */}
                  <div className="flex -space-x-2">
                    {order.products_json.slice(0, 3).map((product, idx) => (
                      <div key={idx} className="relative">
                        <KaspiProductImage
                          productName={product.name}
                          size="sm"
                          className="ring-2 ring-white"
                        />
                      </div>
                    ))}
                    {order.products_json.length > 3 && (
                      <div className="w-12 h-12 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-medium ring-2 ring-white">
                        +{order.products_json.length - 3}
                      </div>
                    )}
                  </div>

                  {/* Product Names */}
                  <div className="flex-1 text-sm text-gray-600">
                    {order.products_json.slice(0, 2).map((product, idx) => (
                      <div key={idx} className="truncate">
                        {product.name} × {product.quantity}
                      </div>
                    ))}
                    {order.products_json.length > 2 && (
                      <div className="text-purple-600 text-xs">
                        и ещё {order.products_json.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.total > data.size && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Показано {(page - 1) * data.size + 1}-{Math.min(page * data.size, data.total)} из{' '}
              {data.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Назад
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * data.size >= data.total}
              >
                Вперед
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
