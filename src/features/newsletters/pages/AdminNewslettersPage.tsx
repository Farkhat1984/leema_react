import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Eye, CheckCircle, XCircle, Store, Calendar, Trash2 } from 'lucide-react'
import { DataTable } from '@/shared/components/ui/DataTable'
import { Button } from '@/shared/components/ui/Button'
import { BackButton } from '@/shared/components/ui/BackButton'
import { SearchInput } from '@/shared/components/ui/SearchInput'
import { StatsCard } from '@/shared/components/ui/StatsCard'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog'
import { RejectModal } from '@/shared/components/ui/RejectModal'
import { useDebounce } from '@/shared/hooks'
import { newslettersService } from '../services/newsletters.service'
import { NewsletterDetailModal } from '../components/NewsletterDetailModal'
import type { Newsletter, NewsletterStatus } from '../types/newsletter.types'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  pending: { label: 'Ожидание одобрения', color: 'yellow' as const },
  approved: { label: 'Одобрено', color: 'green' as const },
  rejected: { label: 'Отклонено', color: 'red' as const },
  in_progress: { label: 'Отправляется', color: 'blue' as const },
  completed: { label: 'Завершено', color: 'green' as const },
  failed: { label: 'Ошибка', color: 'red' as const },
  cancelled: { label: 'Отменено', color: 'gray' as const },
}

export default function AdminNewslettersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<NewsletterStatus | 'all'>('all')
  const debouncedSearch = useDebounce(search, 300)

  // Modals state
  const [viewingNewsletter, setViewingNewsletter] = useState<Newsletter | null>(null)
  const [approvingNewsletter, setApprovingNewsletter] = useState<Newsletter | null>(null)
  const [rejectingNewsletter, setRejectingNewsletter] = useState<Newsletter | null>(null)
  const [deletingNewsletter, setDeletingNewsletter] = useState<Newsletter | null>(null)

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['newsletter-stats'],
    queryFn: () => newslettersService.getNewsletterStats(),
  })

  // Fetch newsletters
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-newsletters', page, debouncedSearch, statusFilter],
    queryFn: () =>
      newslettersService.getAdminNewsletters({
        page,
        per_page: 20,
        search: debouncedSearch,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  })

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: number) => newslettersService.approveNewsletter(id),
    onSuccess: () => {
      toast.success('Рассылка успешно одобрена')
      setApprovingNewsletter(null)
      refetch()
      queryClient.invalidateQueries({ queryKey: ['newsletter-stats'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Не удалось одобрить рассылку')
    },
  })

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      newslettersService.rejectNewsletter(id, reason),
    onSuccess: () => {
      toast.success('Рассылка успешно отклонена')
      setRejectingNewsletter(null)
      refetch()
      queryClient.invalidateQueries({ queryKey: ['newsletter-stats'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Не удалось отклонить рассылку')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => newslettersService.deleteNewsletter(id),
    onSuccess: () => {
      toast.success('Рассылка удалена успешно')
      setDeletingNewsletter(null)
      refetch()
      queryClient.invalidateQueries({ queryKey: ['newsletter-stats'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ошибка при удалении рассылки')
    },
  })

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
  }

  const hasFilters = search || statusFilter !== 'all'

  // Table columns
  const columns: ColumnDef<Newsletter>[] = [
    {
      accessorKey: 'shop_name',
      header: 'Магазин',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 min-w-[150px]">
          <Store className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900">
            {row.original.shop_name || 'Неизвестный магазин'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'title',
      header: 'Заголовок',
      cell: ({ row }) => (
        <div className="min-w-[200px]">
          <div className="font-medium text-gray-900">{row.original.title}</div>
          {row.original.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      cell: ({ row }) => {
        const config = STATUS_CONFIG[row.original.status as keyof typeof STATUS_CONFIG]
        // Fallback for unknown statuses
        if (!config) {
          return <StatusBadge status={row.original.status} variant="gray" />
        }
        return <StatusBadge status={row.original.status} variant={config.color} />
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Дата создания',
      cell: ({ row }) => (
        <div className="text-gray-600 text-sm">
          {new Date(row.original.created_at).toLocaleDateString('ru-RU')}
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
            onClick={() => setViewingNewsletter(row.original)}
          >
            <Eye className="w-4 h-4 mr-1.5" />
            Просмотр
          </Button>
          {row.original.status === 'pending' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setApprovingNewsletter(row.original)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Одобрить
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRejectingNewsletter(row.original)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Отклонить
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingNewsletter(row.original)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Удалить
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Модерация рассылок</h1>
          <p className="text-gray-600 mt-2">
            Проверка и одобрение рассылок, отправленных магазинами
          </p>
        </div>
        <BackButton to="/admin" />
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Ожидают одобрения"
            value={stats.pending}
            icon={<Calendar className="w-5 h-5" />}
            variant="warning"
          />
          <StatsCard
            title="Одобрено"
            value={stats.approved}
            icon={<CheckCircle className="w-5 h-5" />}
            variant="success"
          />
          <StatsCard
            title="Отклонено"
            value={stats.rejected}
            icon={<XCircle className="w-5 h-5" />}
            variant="danger"
          />
          <StatsCard
            title="Завершено"
            value={stats.completed}
            icon={<CheckCircle className="w-5 h-5" />}
            variant="success"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="w-full sm:w-80">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Поиск по заголовку..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as NewsletterStatus | 'all')}
            className="w-full sm:w-56 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидание одобрения</option>
            <option value="approved">Одобрено</option>
            <option value="rejected">Отклонено</option>
            <option value="in_progress">Отправляется</option>
            <option value="completed">Завершено</option>
            <option value="failed">Ошибка</option>
            <option value="cancelled">Отменено</option>
          </select>

          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="sm:ml-auto">
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
          emptyMessage="Рассылки не найдены"
        />
      </div>

      {/* Detail Modal with Approve/Reject Actions */}
      {viewingNewsletter && (
        <>
          <NewsletterDetailModal
            isOpen={!!viewingNewsletter}
            onClose={() => setViewingNewsletter(null)}
            newsletter={viewingNewsletter}
          />
          {viewingNewsletter.status === 'pending' && (
            <div className="fixed bottom-8 right-8 flex gap-3 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
              <Button
                onClick={() => {
                  setApprovingNewsletter(viewingNewsletter)
                  setViewingNewsletter(null)
                }}
                className="bg-green-600 hover:bg-green-700"
                disabled={approveMutation.isPending || rejectMutation.isPending}
                isLoading={approveMutation.isPending}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Одобрить рассылку
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setRejectingNewsletter(viewingNewsletter)
                  setViewingNewsletter(null)
                }}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                isLoading={rejectMutation.isPending}
              >
                <XCircle className="w-5 h-5 mr-2" />
                Отклонить рассылку
              </Button>
            </div>
          )}
        </>
      )}

      {/* Approve Confirmation */}
      <ConfirmDialog
        isOpen={!!approvingNewsletter}
        onClose={() => setApprovingNewsletter(null)}
        onConfirm={() =>
          approvingNewsletter ? approveMutation.mutate(approvingNewsletter.id) : Promise.resolve()
        }
        title="Одобрить рассылку"
        description={`Вы уверены, что хотите одобрить "${approvingNewsletter?.title}"? Рассылка будет отправлена получателям.`}
        confirmText="Одобрить"
        variant="success"
        isLoading={approveMutation.isPending}
      />

      {/* Reject Modal */}
      <RejectModal
        isOpen={!!rejectingNewsletter}
        onClose={() => setRejectingNewsletter(null)}
        onReject={async (reason) => {
          if (rejectingNewsletter) {
            await rejectMutation.mutateAsync({
              id: rejectingNewsletter.id,
              reason,
            })
          }
        }}
        title="Отклонить рассылку"
        description={`Пожалуйста, укажите причину отклонения "${rejectingNewsletter?.title}". Владелец магазина будет уведомлен.`}
        loading={rejectMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingNewsletter}
        onClose={() => setDeletingNewsletter(null)}
        onConfirm={() =>
          deletingNewsletter ? deleteMutation.mutate(deletingNewsletter.id) : Promise.resolve()
        }
        title="Удалить рассылку"
        description={`Вы уверены, что хотите удалить "${deletingNewsletter?.title}"? Это действие невозможно отменить.`}
        confirmText="Удалить"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
