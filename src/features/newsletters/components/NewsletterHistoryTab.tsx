import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Eye, Trash2, FileText } from 'lucide-react'
import { DataTable } from '@/shared/components/ui/DataTable'
import { Button } from '@/shared/components/ui/Button'
import { SearchInput } from '@/shared/components/ui/SearchInput'
import { StatusBadge } from '@/shared/components/ui/StatusBadge'
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog'
import { useDebounce } from '@/shared/hooks'
import { newslettersService } from '../services/newsletters.service'
import { NewsletterDetailModal } from './NewsletterDetailModal'
import type { Newsletter, NewsletterStatus } from '../types/newsletter.types'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'gray' as const },
  pending: { label: 'Pending', color: 'yellow' as const },
  approved: { label: 'Approved', color: 'green' as const },
  rejected: { label: 'Rejected', color: 'red' as const },
  sending: { label: 'Sending', color: 'blue' as const },
  completed: { label: 'Completed', color: 'green' as const },
  failed: { label: 'Failed', color: 'red' as const },
}

export function NewsletterHistoryTab() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<NewsletterStatus | 'all'>('all')
  const debouncedSearch = useDebounce(search, 300)

  // Modals state
  const [viewingNewsletter, setViewingNewsletter] = useState<Newsletter | null>(null)
  const [deletingNewsletter, setDeletingNewsletter] = useState<Newsletter | null>(null)

  // Fetch newsletters
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['newsletters', page, debouncedSearch, statusFilter],
    queryFn: () =>
      newslettersService.getNewsletters({
        page,
        per_page: 20,
        search: debouncedSearch,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }),
  })

  // Delete newsletter mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => newslettersService.deleteNewsletter(id),
    onSuccess: () => {
      toast.success('Newsletter deleted successfully')
      setDeletingNewsletter(null)
      refetch()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete newsletter')
    },
  })

  // Table columns
  const columns: ColumnDef<Newsletter>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
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
      header: 'Status',
      cell: ({ row }) => {
        const config = STATUS_CONFIG[row.original.status]
        return <StatusBadge status={row.original.status} variant={config.color} />
      },
    },
    {
      accessorKey: 'sent_count',
      header: 'Sent/Total',
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-medium text-gray-900">
            {row.original.sent_count} / {row.original.total_recipients}
          </div>
          {row.original.total_recipients > 0 && (
            <div className="text-xs text-gray-500">
              {((row.original.sent_count / row.original.total_recipients) * 100).toFixed(0)}%
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created Date',
      cell: ({ row }) => (
        <div className="text-gray-600 text-sm">
          {new Date(row.original.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewingNewsletter(row.original)}
          >
            <Eye className="w-4 h-4 mr-1.5" />
            View
          </Button>
          {row.original.status === 'draft' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeletingNewsletter(row.original)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search newsletters..."
          className="w-full sm:w-80"
        />

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as NewsletterStatus | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="sending">Sending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Status Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">📋 Newsletter Status Guide:</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-blue-800">
          <div>
            <span className="font-semibold">Pending:</span> Awaiting admin approval
          </div>
          <div>
            <span className="font-semibold">Approved:</span> Approved, will send soon
          </div>
          <div>
            <span className="font-semibold">Sending:</span> Currently being sent
          </div>
          <div>
            <span className="font-semibold">Completed:</span> Successfully sent
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={Array.isArray(data?.data) ? data.data : []}
        loading={isLoading}
        pageSize={20}
        pageIndex={page - 1}
        pageCount={data?.total_pages || 0}
        totalRows={data?.total || 0}
        onPaginationChange={(pageIndex) => setPage(pageIndex + 1)}
        manualPagination
        emptyMessage="No newsletters found. Create your first newsletter!"
        emptyIcon={<FileText className="w-16 h-16 text-gray-400" />}
      />

      {/* Detail Modal */}
      <NewsletterDetailModal
        isOpen={!!viewingNewsletter}
        onClose={() => setViewingNewsletter(null)}
        newsletter={viewingNewsletter}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingNewsletter}
        onClose={() => setDeletingNewsletter(null)}
        onConfirm={() =>
          deletingNewsletter ? deleteMutation.mutate(deletingNewsletter.id) : Promise.resolve()
        }
        title="Delete Newsletter"
        description={`Are you sure you want to delete "${deletingNewsletter?.title}"? This action cannot be undone. Only draft newsletters can be deleted.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
