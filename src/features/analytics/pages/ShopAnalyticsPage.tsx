import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Tag,
  Download,
  ChevronDown,
} from 'lucide-react'
import { BackButton } from '@/shared/components/ui/BackButton'
import { StatsCard } from '@/shared/components/ui/StatsCard'
import { DataTable } from '@/shared/components/ui/DataTable'
import { Button } from '@/shared/components/ui/Button'
import { LineChart } from '@/shared/components/charts/LineChart'
import { BarChart } from '@/shared/components/charts/BarChart'
import { PieChart } from '@/shared/components/charts/PieChart'
import { PeriodSelector } from '../components/PeriodSelector'
import { DateRangePresets } from '../components/DateRangePresets'
import { analyticsService } from '../services/analytics.service'
import type { TimePeriod, TopProduct } from '../types/analytics.types'
import toast from 'react-hot-toast'

export default function ShopAnalyticsPage() {
  const [period, setPeriod] = useState<TimePeriod>('weekly')
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Prepare query params
  const queryParams = useMemo(() => {
    return {
      period,
      from: dateRange.from?.toISOString().split('T')[0],
      to: dateRange.to?.toISOString().split('T')[0],
    }
  }, [period, dateRange])

  // Fetch analytics data
  const { data, isLoading } = useQuery({
    queryKey: ['shop-analytics', queryParams],
    queryFn: () => analyticsService.getAnalytics(queryParams),
  })

  // Export handlers
  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const blob = await analyticsService.exportAnalytics(queryParams, format)
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `analytics_${period}_${timestamp}.${format}`
      analyticsService.downloadExport(blob, filename)
      toast.success(`Аналитика экспортирована как ${format.toUpperCase()}`)
      setShowExportMenu(false)
    } catch (error) {
      toast.error('Не удалось экспортировать аналитику')
    }
  }

  // Table columns for top products
  const topProductsColumns: ColumnDef<TopProduct>[] = [
    {
      accessorKey: 'name',
      header: 'Товар',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.image_url && (
            <img
              src={row.original.image_url}
              alt={row.original.name}
              className="w-10 h-10 rounded object-cover"
            />
          )}
          <div>
            <div className="font-medium text-gray-900">{row.original.name}</div>
            <div className="text-xs text-gray-500">{row.original.category}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'sales_count',
      header: 'Продажи',
      cell: ({ row }) => (
        <div className="text-center font-medium text-gray-900">
          {row.original.sales_count}
        </div>
      ),
    },
    {
      accessorKey: 'revenue',
      header: 'Доход',
      cell: ({ row }) => (
        <div className="text-right font-semibold text-gray-900">
          {analyticsService.formatCurrency(row.original.revenue)}
        </div>
      ),
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Панель аналитики</h1>
          <p className="text-gray-600 mt-2">
            Отслеживайте производительность магазина и получайте инсайты
          </p>
        </div>
        <BackButton to="/shop" />
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          {/* Period Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Временной период
            </label>
            <PeriodSelector value={period} onChange={setPeriod} />
          </div>

          {/* Date Range */}
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Произвольный диапазон дат
            </label>
            <DateRangePresets value={dateRange} onChange={setDateRange} />
          </div>

          {/* Export Button */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2 invisible">
              Действия
            </label>
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowExportMenu(!showExportMenu)}
              >
                <Download className="w-4 h-4 mr-2" />
                Экспорт
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                  >
                    Экспорт в CSV
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
                  >
                    Экспорт в JSON
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">Загрузка аналитики...</p>
        </div>
      ) : data && data.metrics ? (
        <div className="space-y-8">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Общий доход"
              value={analyticsService.formatCurrency(data.metrics.total_revenue || 0)}
              icon={<DollarSign className="w-5 h-5" />}
              variant="success"
              trend={
                data.metrics.revenue_trend !== 0
                  ? { value: data.metrics.revenue_trend, isPositive: data.metrics.revenue_trend > 0 }
                  : undefined
              }
            />
            <StatsCard
              title="Всего заказов"
              value={data.metrics.total_orders || 0}
              icon={<ShoppingCart className="w-5 h-5" />}
              variant="primary"
              trend={
                data.metrics.orders_trend !== 0
                  ? { value: data.metrics.orders_trend, isPositive: data.metrics.orders_trend > 0 }
                  : undefined
              }
            />
            <StatsCard
              title="Средний чек"
              value={analyticsService.formatCurrency(data.metrics.average_order_value || 0)}
              icon={<TrendingUp className="w-5 h-5" />}
              variant="info"
            />
            <StatsCard
              title="Топ категория"
              value={data.metrics.top_category?.name || 'Н/Д'}
              icon={<Tag className="w-5 h-5" />}
              variant="warning"
            />
          </div>

          {/* Charts Row 1: Revenue Line Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Тренд дохода</h3>
            <LineChart
              data={Array.isArray(data.revenue_data) ? data.revenue_data.map((d) => ({
                date: d.label,
                revenue: d.revenue,
              })) : []}
              lines={[{ dataKey: 'revenue', name: 'Доход', color: '#10b981' }]}
              xAxisKey="date"
              height={300}
              curved
              gradient
              formatYAxis={(value) => analyticsService.formatCurrency(value)}
              formatTooltip={(value) => analyticsService.formatCurrency(value)}
              showTrend
              trendDataKey="revenue"
            />
          </div>

          {/* Charts Row 2: Orders Bar Chart & Category Pie Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders Bar Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Заказы за период</h3>
              <BarChart
                data={Array.isArray(data.orders_data) ? data.orders_data.map((d) => ({
                  date: d.label,
                  orders: d.orders,
                })) : []}
                bars={[{ dataKey: 'orders', name: 'Заказы', color: '#6366f1' }]}
                xAxisKey="date"
                height={300}
                radius={[8, 8, 0, 0]}
                formatTooltip={(value) => `${value} заказов`}
              />
            </div>

            {/* Category Doughnut Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Доход по категориям
              </h3>
              <PieChart
                data={Array.isArray(data.category_breakdown) ? data.category_breakdown : []}
                height={300}
                doughnut
                showPercentage
                showLegend
                centerLabel="Всего"
                centerValue={analyticsService.formatCurrency(data.metrics.total_revenue || 0)}
                formatValue={(value) => analyticsService.formatCurrency(value)}
                hoverable
              />
            </div>
          </div>

          {/* Top Products Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Топ-10 товаров</h3>
              <p className="text-sm text-gray-600 mt-1">Лучшие товары по доходу</p>
            </div>
            <DataTable
              columns={topProductsColumns}
              data={Array.isArray(data.top_products) ? data.top_products.slice(0, 10) : []}
              loading={isLoading}
              showPagination={false}
              emptyMessage="Нет данных о товарах"
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Нет данных аналитики</p>
        </div>
      )}
    </div>
  )
}
