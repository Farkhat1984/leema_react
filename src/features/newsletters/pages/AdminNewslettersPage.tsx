import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'
import { Eye, CheckCircle, XCircle, Store, Calendar, TrendingUp } from 'lucide-react'
import { DataTable } from '@/shared/components/ui/DataTable'
import { Button } from '@/shared/components/ui/Button'
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
  draft: { label: 'Draft', color: 'gray' as const },
  pending: { label: 'Pending', color: 'yellow' as const },
  approved: { label: 'Approved', color: 'green' as const },
  rejected: { label: 'Rejected', color: 'red' as const },
  sending: { label: 'Sending', color: 'blue' as const },
  completed: { label: 'Completed', color: 'green' as const },
  failed: { label: 'Failed', color: 'red' as const },
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
      toast.success('Newsletter approved successfully')
      setApprovingNewsletter(null)
      refetch()
      queryClient.invalidateQueries({ queryKey: ['newsletter-stats'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve newsletter')
    },
  })

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      newslettersService.rejectNewsletter(id, reason),
    onSuccess: () => {
      toast.success('Newsletter rejected successfully')
      setRejectingNewsletter(null)
      refetch()
      queryClient.invalidateQueries({ queryKey: ['newsletter-stats'] })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject newsletter')
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
      header: 'Shop',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 min-w-[150px]">
          <Store className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-gray-900">
            {row.original.shop_name || 'Unknown Shop'}
          </span>
        </div>
      ),
    },
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
                Approve
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRejectingNewsletter(row.original)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Newsletter Moderation</h1>
        <p className="text-gray-600 mt-2">
          Review and approve newsletters submitted by shops
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Pending Approval"
            value={stats.pending}
            icon={<Calendar className="w-5 h-5" />}
            variant="warning"
          />
          <StatsCard
            title="Approved"
            value={stats.approved}
            icon={<CheckCircle className="w-5 h-5" />}
            variant="success"
          />
          <StatsCard
            title="Rejected"
            value={stats.rejected}
            icon={<XCircle className="w-5 h-5" />}
            variant="danger"
          />
          <StatsCard
            title="Completed"
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
              placeholder="Search by title..."
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as NewsletterStatus | 'all')}
            className="w-full sm:w-56 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="sending">Sending</option>
            <option value="completed">Completed</option>
          </select>

          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="sm:ml-auto">
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
          emptyMessage="No newsletters found"
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
                Approve Newsletter
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
                Reject Newsletter
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
        title="Approve Newsletter"
        description={`Are you sure you want to approve "${approvingNewsletter?.title}"? The newsletter will be sent to recipients.`}
        confirmText="Approve"
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
        title="Reject Newsletter"
        description={`Please provide a reason for rejecting "${rejectingNewsletter?.title}". The shop owner will be notified.`}
        loading={rejectMutation.isPending}
      />
    </div>
  )
}
