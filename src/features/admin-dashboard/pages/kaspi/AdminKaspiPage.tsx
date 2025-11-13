import { useQuery } from '@tanstack/react-query';
import {
  Store,
  Package,
  TrendingUp,
  MessageSquare,
  CheckCircle,
  XCircle,
  RefreshCw,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { adminKaspiService } from '../../services/kaspi.service';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const STATUS_COLORS = [
  '#8b5cf6', // purple
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#6366f1', // indigo
];

export function AdminKaspiPage() {
  // Fetch stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'kaspi', 'stats'],
    queryFn: adminKaspiService.getStats,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Данные недоступны</h3>
          <p className="text-gray-600">Не удалось загрузить статистику Kaspi</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Аналитика Kaspi</h1>
        <p className="text-gray-600">Общая статистика по интеграциям Kaspi.kz</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Магазины с интеграцией</p>
              <p className="text-2xl font-bold">{stats.total_shops_with_integration}</p>
              <p className="text-xs text-green-600 mt-1">
                Активных: {stats.active_integrations}
              </p>
            </div>
            <Store className="w-8 h-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Всего заказов</p>
              <p className="text-2xl font-bold">{stats.total_orders}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Общая выручка</p>
              <p className="text-2xl font-bold">
                {parseFloat(stats.total_revenue).toLocaleString('ru-RU')}₸
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Доставляемость</p>
              <p className="text-2xl font-bold">{stats.notifications_stats.delivery_rate}%</p>
              <p className="text-xs text-gray-600 mt-1">
                {stats.notifications_stats.total_delivered} из{' '}
                {stats.notifications_stats.total_sent}
              </p>
            </div>
            <MessageSquare className="w-8 h-8 text-indigo-500" />
          </div>
        </Card>
      </div>

      {/* Notifications Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Уведомлений отправлено</p>
              <p className="text-xl font-bold">{stats.notifications_stats.total_sent}</p>
            </div>
            <MessageSquare className="w-6 h-6 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Доставлено</p>
              <p className="text-xl font-bold">{stats.notifications_stats.total_delivered}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ошибок</p>
              <p className="text-xl font-bold">{stats.notifications_stats.total_failed}</p>
            </div>
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Заказы по статусам</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.orders_by_status}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ status, count }) => `${status}: ${count}`}
              >
                {stats.orders_by_status.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Orders by Shop */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Заказы по магазинам</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.orders_by_shop.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="shop_name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_orders" fill="#8b5cf6" name="Заказов" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Shops Table */}
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Топ магазинов по заказам</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Магазин
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Заказов
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Выполнено
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Выручка
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Конверсия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.orders_by_shop.slice(0, 10).map((shop) => {
                const conversionRate =
                  shop.total_orders > 0
                    ? ((shop.completed_orders / shop.total_orders) * 100).toFixed(1)
                    : 0;

                return (
                  <tr key={shop.shop_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{shop.shop_name}</div>
                      <div className="text-sm text-gray-500">ID: {shop.shop_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{shop.total_orders}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="font-medium">{shop.completed_orders}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-green-600">
                        {parseFloat(shop.total_revenue).toLocaleString('ru-RU')}₸
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        className={
                          Number(conversionRate) >= 80
                            ? 'bg-green-100 text-green-700'
                            : Number(conversionRate) >= 60
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }
                      >
                        {conversionRate}%
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Syncs */}
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Последние синхронизации</h2>
        </div>
        <div className="divide-y">
          {stats.recent_syncs.slice(0, 10).map((sync) => (
            <div key={sync.shop_id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{sync.shop_name}</p>
                  <p className="text-sm text-gray-600">
                    <Activity className="w-4 h-4 inline mr-1" />
                    {new Date(sync.last_sync_at).toLocaleString('ru-RU')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={
                      sync.last_sync_status === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }
                  >
                    {sync.last_sync_status === 'success' ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <XCircle className="w-3 h-3 mr-1" />
                    )}
                    {sync.last_sync_status === 'success' ? 'Успешно' : 'Ошибка'}
                  </Badge>
                </div>
              </div>
              {sync.last_sync_status === 'error' && sync.last_sync_error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {sync.last_sync_error}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
export default AdminKaspiPage;
