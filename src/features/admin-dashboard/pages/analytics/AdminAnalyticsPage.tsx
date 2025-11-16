import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react';
import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { StatsCard } from '@/shared/components/ui/StatsCard';
import { LineChart } from '@/shared/components/charts/LineChart';
import { BarChart } from '@/shared/components/charts/BarChart';
import { AreaChart } from '@/shared/components/charts/AreaChart';
import { Button } from '@/shared/components/ui/Button';
import { BackButton } from '@/shared/components/ui/BackButton';
import { FormDateRangePicker } from '@/shared/components/forms/FormDateRangePicker';
import { formatCurrency } from '@/shared/lib/utils';
import { logger } from '@/shared/lib/utils/logger';
import type { DateRange } from '@/shared/types/common';

type Period = 'daily' | 'weekly' | 'monthly';

interface AnalyticsData {
  total_revenue: number;
  total_users: number;
  total_shops: number;
  total_orders: number;
  revenue_growth: number;
  user_growth: number;
  shop_growth: number;
  order_growth: number;
  revenue_chart: { date: string; value: number }[];
  users_chart: { date: string; value: number }[];
  shops_chart: { date: string; value: number }[];
  orders_chart: { date: string; value: number }[];
}

function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('daily');
  const [dateRange, setDateRange] = useState<DateRange>({});

  // Fetch analytics data
  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ['admin-analytics', period, dateRange],
    queryFn: () => {
      const params = new URLSearchParams({
        period,
        ...(dateRange.from && dateRange.to && {
          start_date: dateRange.from.toISOString(),
          end_date: dateRange.to.toISOString(),
        }),
      });
      return apiRequest<AnalyticsData>(`${API_ENDPOINTS.ADMIN.ANALYTICS}?${params}`);
    },
  });

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const params = new URLSearchParams({
        period,
        format,
        ...(dateRange.from && dateRange.to && {
          start_date: dateRange.from.toISOString(),
          end_date: dateRange.to.toISOString(),
        }),
      });
      const blob = await apiRequest<Blob>(
        `${API_ENDPOINTS.ADMIN.ANALYTICS_EXPORT}?${params}`
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `platform-analytics-${new Date().toISOString()}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      logger.error('Export failed', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Аналитика платформы
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Мониторинг показателей и производительности платформы
          </p>
        </div>
        <BackButton to="/admin" />
      </div>

      <div className="flex items-center gap-2 justify-end mb-4">
        <Button variant="outline" onClick={() => handleExport('csv')}>
          <Download className="w-4 h-4 mr-2" />
          Экспорт CSV
        </Button>
        <Button variant="outline" onClick={() => handleExport('json')}>
          <Download className="w-4 h-4 mr-2" />
          Экспорт JSON
        </Button>
      </div>

      {/* Period Selector & Date Range */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Период
            </label>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly'] as Period[]).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? 'primary' : 'outline'}
                  onClick={() => setPeriod(p)}
                  className="capitalize"
                >
                  {p === 'daily' ? 'Ежедневно' : p === 'weekly' ? 'Еженедельно' : 'Ежемесячно'}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Диапазон дат
            </label>
            <FormDateRangePicker
              value={dateRange}
              onChange={setDateRange}
              presets={[
                {
                  label: 'Последние 7 дней',
                  getValue: () => {
                    const today = new Date();
                    const start = new Date(today);
                    start.setDate(start.getDate() - 6);
                    return { from: start, to: today };
                  },
                },
                {
                  label: 'Последние 30 дней',
                  getValue: () => {
                    const today = new Date();
                    const start = new Date(today);
                    start.setDate(start.getDate() - 29);
                    return { from: start, to: today };
                  },
                },
                {
                  label: 'Последние 90 дней',
                  getValue: () => {
                    const today = new Date();
                    const start = new Date(today);
                    start.setDate(start.getDate() - 89);
                    return { from: start, to: today };
                  },
                },
                {
                  label: 'Этот год',
                  getValue: () => {
                    const today = new Date();
                    const start = new Date(today.getFullYear(), 0, 1);
                    return { from: start, to: today };
                  },
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Общий доход"
          value={formatCurrency(analytics?.total_revenue || 0)}
          icon={<DollarSign className="w-6 h-6" />}
          trend={
            analytics?.revenue_growth
              ? { value: analytics.revenue_growth, isPositive: analytics.revenue_growth > 0 }
              : undefined
          }
          variant="success"
        />
        <StatsCard
          title="Всего пользователей"
          value={analytics?.total_users || 0}
          icon={<Users className="w-6 h-6" />}
          trend={
            analytics?.user_growth
              ? { value: analytics.user_growth, isPositive: analytics.user_growth > 0 }
              : undefined
          }
          variant="primary"
        />
        <StatsCard
          title="Всего магазинов"
          value={analytics?.total_shops || 0}
          icon={<ShoppingBag className="w-6 h-6" />}
          trend={
            analytics?.shop_growth
              ? { value: analytics.shop_growth, isPositive: analytics.shop_growth > 0 }
              : undefined
          }
          variant="primary"
        />
        <StatsCard
          title="Всего заказов"
          value={analytics?.total_orders || 0}
          icon={<TrendingUp className="w-6 h-6" />}
          trend={
            analytics?.order_growth
              ? { value: analytics.order_growth, isPositive: analytics.order_growth > 0 }
              : undefined
          }
          variant="primary"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Динамика дохода
        </h3>
        <LineChart
          data={analytics?.revenue_chart || []}
          lines={[{ dataKey: 'value', name: 'Доход', color: '#10b981' }]}
          xAxisKey="date"
          height={300}
          showTrend
          trendDataKey="value"
        />
      </div>

      {/* User Growth & Shop Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Рост пользователей
          </h3>
          <AreaChart
            data={analytics?.users_chart || []}
            areas={[{ dataKey: 'value', name: 'Пользователи', color: '#6366f1' }]}
            xAxisKey="date"
            height={250}
          />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Рост магазинов
          </h3>
          <AreaChart
            data={analytics?.shops_chart || []}
            areas={[{ dataKey: 'value', name: 'Магазины', color: '#8b5cf6' }]}
            xAxisKey="date"
            height={250}
          />
        </div>
      </div>

      {/* Orders Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Заказы по времени
        </h3>
        <BarChart
          data={analytics?.orders_chart || []}
          bars={[{ dataKey: 'value', name: 'Заказы', color: '#ec4899' }]}
          xAxisKey="date"
          height={300}
        />
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
