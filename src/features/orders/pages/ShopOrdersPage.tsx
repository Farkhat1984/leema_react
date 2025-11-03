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
  pending: { label: 'Pending', color: 'gray' as const },
  paid: { label: 'Paid', color: 'green' as const },
  shipped: { label: 'Shipped', color: 'blue' as const },
  completed: { label: 'Completed', color: 'green' as const },
  cancelled: { label: 'Cancelled', color: 'red' as const },
  refunded: { label: 'Refunded', color: 'yellow' as const },
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
      header: 'Order #',
      cell: ({ row }) => (
        <div className="font-medium text-blue-600">
          {ordersService.formatOrderNumber(row.original.order_number)}
        </div>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900">{row.original.customer.name}</div>
          <div className="text-sm text-gray-500">{row.original.customer.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => (
        <div className="font-semibold text-gray-900">
          {ordersService.formatCurrency(row.original.total)}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const config = STATUS_CONFIG[row.original.status]
        return <StatusBadge status={row.original.status} variant={config.color} />
      },
    },
    {
      accessorKey: 'ordered_at',
      header: 'Date',
      cell: ({ row }) => (
        <div className="text-gray-600 text-sm">
          {new Date(row.original.ordered_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewingOrder(row.original)}
        >
          <Eye className="w-4 h-4 mr-2" />
          View
        </Button>
      ),
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-2">Manage and track your orders</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Today's Orders"
            value={stats.today}
            icon={<Calendar className="w-5 h-5" />}
            variant="primary"
          />
          <StatsCard
            title="This Week"
            value={stats.this_week}
            icon={<TrendingUp className="w-5 h-5" />}
            variant="info"
          />
          <StatsCard
            title="This Month"
            value={stats.this_month}
            icon={<TrendingUp className="w-5 h-5" />}
            variant="success"
          />
          <StatsCard
            title="All Time"
            value={stats.all_time}
            icon={<TrendingUp className="w-5 h-5" />}
            variant="warning"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
          Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by order # or customer..."
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="shipped">Shipped</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>

          <FormDateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Select date range"
          />
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'total')}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Date</option>
              <option value="total">Total</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
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
          emptyMessage="No orders found"
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
