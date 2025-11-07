import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Eye, Edit, Store } from 'lucide-react'
import { DataTable } from '@/shared/components/ui/DataTable'
import { Button } from '@/shared/components/ui/Button'
import { SearchInput } from '@/shared/components/ui/SearchInput'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { FormModal } from '@/shared/components/ui/FormModal'
import { useDebounce } from '@/shared/hooks'
import { ordersService } from '../services/orders.service'
import { OrderDetailModal } from '../components/OrderDetailModal'
import type { Order, OrderStatus } from '../types/order.types'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  pending: { label: 'Ожидание', color: 'gray' as const },
  paid: { label: 'Оплачен', color: 'green' as const },
  shipped: { label: 'Отправлен', color: 'blue' as const },
  completed: { label: 'Завершен', color: 'green' as const },
  cancelled: { label: 'Отменен', color: 'red' as const },
  refunded: { label: 'Возврат', color: 'yellow' as const },
}

export default function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const debouncedSearch = useDebounce(search, 300)

  // Modal state
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [updatingOrder, setUpdatingOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState<OrderStatus>('paid')
  const [notes, setNotes] = useState('')

  // Fetch orders
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, debouncedSearch, statusFilter],
    queryFn: () =>
      ordersService.getAdminOrders({
        page,
        per_page: 20,
        search: debouncedSearch,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  })

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: OrderStatus; notes?: string }) =>
      ordersService.updateOrderStatus(id, { status, notes }),
    onSuccess: () => {
      toast.success('Статус заказа успешно обновлен')
      setUpdatingOrder(null)
      setNotes('')
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Не удалось обновить статус заказа')
    },
  })

  const handleStatusUpdate = () => {
    if (!updatingOrder) return
    updateStatusMutation.mutate({
      id: updatingOrder.id,
      status: newStatus,
      notes: notes || undefined,
    })
  }

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
      accessorKey: 'shop_name',
      header: 'Магазин',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900">{row.original.shop_name || 'Н/Д'}</span>
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
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewingOrder(row.original)}
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Просмотр
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setUpdatingOrder(row.original)
              setNewStatus(row.original.status)
            }}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Edit className="w-4 h-4 mr-1.5" />
            Изменить статус
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Все заказы</h1>
        <p className="text-gray-600 mt-2">Управление заказами во всех магазинах</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Update Status Modal */}
      {updatingOrder && (
        <FormModal
          isOpen={!!updatingOrder}
          onClose={() => {
            setUpdatingOrder(null)
            setNotes('')
          }}
          title="Изменить статус заказа"
          onSubmit={handleStatusUpdate}
          isSubmitting={updateStatusMutation.isPending}
          submitText="Обновить статус"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Заказ: {ordersService.formatOrderNumber(updatingOrder.order_number)}
              </label>
              <div className="text-sm text-gray-600">
                Клиент: {updatingOrder.customer.name}
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Новый статус <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pending">Ожидание</option>
                <option value="paid">Оплачен</option>
                <option value="shipped">Отправлен</option>
                <option value="completed">Завершен</option>
                <option value="cancelled">Отменен</option>
                <option value="refunded">Возврат</option>
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Примечания (необязательно)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Добавьте примечание к изменению статуса..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </FormModal>
      )}
    </div>
  )
}
