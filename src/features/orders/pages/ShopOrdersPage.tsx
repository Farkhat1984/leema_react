import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Eye, Calendar, TrendingUp } from 'lucide-react'
import { DataTable } from '@/shared/components/ui/DataTable'
import { Button } from '@/shared/components/ui/Button'
import { SearchInput } from '@/shared/components/ui/SearchInput'
import { StatsCard } from '@/shared/components/ui/StatsCard'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { FormDateRangePicker } from '@/shared/components/forms/FormDateRangePicker'
import { useDebounce } from '@/shared/hooks'
import { ordersService } from '../services/orders.service'
import { OrderDetailModal } from '../components/OrderDetailModal'
import type { Order, OrderStatus } from '../types/order.types'

const STATUS_CONFIG = {
  pending: { label: 'Ожидание', color: 'gray' as const },
  paid: { label: 'Оплачен', color: 'green' as const },
  shipped: { label: 'Отправлен', color: 'blue' as const },
  completed: { label: 'Завершен', color: 'green' as const },
  cancelled: { label: 'Отменен', color: 'red' as const },
  refunded: { label: 'Возврат', color: 'yellow' as const },
}

export default function ShopOrdersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [sortBy, setSortBy] = useState<'date' | 'total'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const debouncedSearch = useDebounce(search, 300)

  // Modal state
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['shop-order-stats'],
    queryFn: () => ordersService.getShopOrderStats(),
  })

  // Fetch orders
  const { data, isLoading } = useQuery({
    queryKey: ['shop-orders', page, debouncedSearch, statusFilter, dateRange, sortBy, sortOrder],
    queryFn: () =>
      ordersService.getShopOrders({
        page,
        per_page: 20,
        search: debouncedSearch,
        status: statusFilter === 'all' ? undefined : statusFilter,
        from: dateRange.from?.toISOString().split('T')[0],
        to: dateRange.to?.toISOString().split('T')[0],
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
  })

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setDateRange({})
  }

  const hasFilters = search || statusFilter !== 'all' || dateRange.from || dateRange.to

  // Table columns
  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'order_number',
      header: 'Заказ №',
      cell: ({ row }) => (
        <div className="font-medium text-blue-600">
          {ordersService.formatOrderNumber(row.original.order_number)}
        </div>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Клиент',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900">{row.original.customer.name}</div>
          <div className="text-sm text-gray-500">{row.original.customer.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Сумма',
      cell: ({ row }) => (
        <div className="font-semibold text-gray-900">
          {ordersService.formatCurrency(row.original.total)}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      cell: ({ row }) => {
        const config = STATUS_CONFIG[row.original.status]
        return <StatusBadge status={row.original.status} variant={config.color} />
      },
    },
    {
      accessorKey: 'ordered_at',
      header: 'Дата',
      cell: ({ row }) => (
        <div className="text-gray-600 text-sm">
          {new Date(row.original.ordered_at).toLocaleDateString('ru-RU')}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Действия',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewingOrder(row.original)}
        >
          <Eye className="w-4 h-4 mr-2" />
          Просмотр
        </Button>
      ),
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Заказы</h1>
        <p className="text-gray-600 mt-2">Управление и отслеживание заказов</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Сегодня"
            value={stats.today}
            icon={<Calendar className="w-5 h-5" />}
            variant="primary"
          />
          <StatsCard
            title="За неделю"
            value={stats.this_week}
            icon={<TrendingUp className="w-5 h-5" />}
            variant="info"
          />
          <StatsCard
            title="За месяц"
            value={stats.this_month}
            icon={<TrendingUp className="w-5 h-5" />}
            variant="success"
          />
          <StatsCard
            title="За все время"
            value={stats.all_time}
            icon={<TrendingUp className="w-5 h-5" />}
            variant="warning"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
          Фильтры
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Поиск по номеру заказа или клиенту..."
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидание</option>
            <option value="paid">Оплачен</option>
            <option value="shipped">Отправлен</option>
            <option value="completed">Завершен</option>
            <option value="cancelled">Отменен</option>
            <option value="refunded">Возврат</option>
          </select>

          <FormDateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Выберите период"
          />
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Сортировка:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'total')}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">По дате</option>
              <option value="total">По сумме</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Сначала новые</option>
              <option value="asc">Сначала старые</option>
            </select>
          </div>

          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Очистить фильтры
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <DataTable
          columns={columns}
          data={data?.data || []}
          loading={isLoading}
          pageSize={20}
          pageIndex={page - 1}
          pageCount={data?.total_pages || 0}
          totalRows={data?.total || 0}
          onPaginationChange={(pageIndex) => setPage(pageIndex + 1)}
          manualPagination
          emptyMessage="Заказы не найдены"
        />
      </div>

      {/* Detail Modal */}
      <OrderDetailModal
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        order={viewingOrder}
      />
    </div>
  )
}
