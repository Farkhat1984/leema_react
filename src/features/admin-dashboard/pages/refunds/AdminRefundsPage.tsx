import { useState, useMemo } from 'react';
import { formatNumber } from '@/shared/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { RefreshCcw, Eye, Check, X } from 'lucide-react';
import { apiClient } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { DataTable } from '@/shared/components/ui/DataTable';
import { Button } from '@/shared/components/ui/Button';
import { PageLoader } from '@/shared/components/feedback/PageLoader';
import { StatsCard } from '@/shared/components/ui/StatsCard';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { RejectModal } from '@/shared/components/ui/RejectModal';
import { DetailModal } from '@/shared/components/ui/DetailModal';
import { type ColumnDef } from '@tanstack/react-table';

// Types
type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processed';

interface Refund {
  id: number;
  refund_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  order_id: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  rejection_reason?: string;
  created_at: string;
  processed_at?: string;
  order_details: {
    original_amount: number;
    products: Array<{
      id: number;
      name: string;
      quantity: number;
      price: number;
      image_url?: string;
    }>;
  };
}

interface RefundsStats {
  pending_count: number;
  pending_total_amount: number;
  approved_this_month: number;
  total_refunded_amount: number;
}

const STATUS_CONFIG: Record<RefundStatus, { label: string; color: 'yellow' | 'green' | 'red' | 'blue' }> = {
  pending: { label: 'Pending', color: 'yellow' },
  approved: { label: 'Approved', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
  processed: { label: 'Processed', color: 'blue' },
};

export default function RefundsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<RefundStatus | 'all'>('all');
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  // Fetch refunds
  const { data: refunds, isLoading: refundsLoading } = useQuery<Refund[]>({
    queryKey: ['admin-refunds', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await apiClient.get(API_ENDPOINTS.ADMIN.REFUNDS, { params });
      return response.data.data;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery<RefundsStats>({
    queryKey: ['admin-refunds-stats'],
    queryFn: async () => {
      const response = await apiClient.get(`${API_ENDPOINTS.ADMIN.REFUNDS}/stats`);
      return response.data.data;
    },
  });

  // Approve refund mutation
  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.post(API_ENDPOINTS.ADMIN.REFUND_APPROVE(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['admin-refunds-stats'] });
      toast.success('Refund approved and processed successfully');
      setApproveDialogOpen(false);
      setDetailModalOpen(false);
      setSelectedRefund(null);
    },
    onError: () => {
      toast.error('Failed to approve refund');
    },
  });

  // Reject refund mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await apiClient.post(API_ENDPOINTS.ADMIN.REFUND_REJECT(id), {
        rejection_reason: reason,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['admin-refunds-stats'] });
      toast.success('Refund rejected');
      setRejectModalOpen(false);
      setDetailModalOpen(false);
      setSelectedRefund(null);
    },
    onError: () => {
      toast.error('Failed to reject refund');
    },
  });

  const handleViewDetails = (refund: Refund) => {
    setSelectedRefund(refund);
    setDetailModalOpen(true);
  };

  const handleApproveClick = (refund: Refund) => {
    setSelectedRefund(refund);
    setApproveDialogOpen(true);
  };

  const handleRejectClick = (refund: Refund) => {
    setSelectedRefund(refund);
    setRejectModalOpen(true);
  };

  const handleApproveConfirm = () => {
    if (selectedRefund) {
      approveMutation.mutate(selectedRefund.id);
    }
  };

  const handleRejectConfirm = (reason: string) => {
    if (selectedRefund) {
      rejectMutation.mutate({ id: selectedRefund.id, reason });
    }
  };

  // Table columns
  const columns = useMemo<ColumnDef<Refund>[]>(
    () => [
      {
        accessorKey: 'refund_id',
        header: 'Refund ID',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-gray-900">{row.original.refund_id}</span>
        ),
      },
      {
        accessorKey: 'user_name',
        header: 'User',
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-gray-900">{row.original.user_name}</div>
            <div className="text-sm text-gray-500">{row.original.user_email}</div>
          </div>
        ),
      },
      {
        accessorKey: 'order_id',
        header: 'Order ID',
        cell: ({ row }) => (
          <span className="font-mono text-sm text-gray-600">{row.original.order_id}</span>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => (
          <span className="font-semibold text-gray-900">{formatNumber(row.original.amount)} KZT</span>
        ),
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => (
          <span className="text-sm text-gray-600 line-clamp-2 max-w-xs">
            {row.original.reason}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const config = STATUS_CONFIG[row.original.status];
          return <StatusBadge status={row.original.status} customText={config.label} />;
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-sm text-gray-500">
            {new Date(row.original.created_at).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleViewDetails(row.original)}
              className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            {row.original.status === 'pending' && (
              <>
                <button
                  onClick={() => handleApproveClick(row.original)}
                  className="text-green-600 hover:text-green-700 p-1 hover:bg-green-50 rounded transition-colors"
                  title="Approve"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRejectClick(row.original)}
                  className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                  title="Reject"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ),
      },
    ],
    []
  );

  if (refundsLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <RefreshCcw className="w-7 h-7" />
          Refunds Management
        </h1>
        <p className="text-gray-600 mt-1">Process refund requests from customers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Pending Refunds"
          value={stats?.pending_count || 0}
        />
        <StatsCard
          title="Approved This Month"
          value={stats?.approved_this_month || 0}
        />
        <StatsCard
          title="Total Refunded"
          value={`${(stats?.total_refunded_amount || 0).toLocaleString()} KZT`}
        />
        <StatsCard
          title="Processing Rate"
          value={
            stats?.pending_count && stats?.approved_this_month
              ? `${Math.round((stats.approved_this_month / (stats.approved_this_month + stats.pending_count)) * 100)}%`
              : '0%'
          }
        />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RefundStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="processed">Processed</option>
          </select>
          {statusFilter !== 'all' && (
            <Button variant="secondary" size="sm" onClick={() => setStatusFilter('all')}>
              Clear Filter
            </Button>
          )}
        </div>
      </div>

      {/* Refunds Table */}
      <DataTable
        data={refunds || []}
        columns={columns}
      />

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        isOpen={approveDialogOpen}
        onClose={() => setApproveDialogOpen(false)}
        onConfirm={handleApproveConfirm}
        title="Approve Refund"
        message={`Are you sure you want to approve this refund of ${selectedRefund?.amount.toLocaleString()} KZT? The amount will be returned to the user's balance.`}
        confirmText="Approve & Process"
        variant="success"
        isLoading={approveMutation.isPending}
      />

      {/* Reject Modal */}
      <RejectModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onReject={handleRejectConfirm}
        title="Reject Refund"
        message="Please provide a reason for rejecting this refund request:"
        loading={rejectMutation.isPending}
      />

      {/* Detail Modal */}
      <DetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedRefund(null);
        }}
        title="Refund Details"
        size="lg"
        actions={
          selectedRefund?.status === 'pending' ? (
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setDetailModalOpen(false);
                  handleApproveClick(selectedRefund);
                }}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Approve
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setDetailModalOpen(false);
                  handleRejectClick(selectedRefund);
                }}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Reject
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedRefund && (
          <div className="space-y-6">
            {/* Refund Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Refund Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Refund ID:</span>
                  <span className="text-sm font-mono font-medium text-gray-900">
                    {selectedRefund.refund_id}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Amount:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(selectedRefund?.amount)} KZT
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Status:</span>
                  <StatusBadge
                    status={selectedRefund.status}
                    customText={STATUS_CONFIG[selectedRefund.status].label}
                  />
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(selectedRefund.created_at).toLocaleString()}
                  </span>
                </div>
                {selectedRefund.processed_at && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Processed:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(selectedRefund.processed_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* User Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Name:</span>
                  <span className="text-sm text-gray-900">{selectedRefund.user_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm text-gray-900">{selectedRefund.user_email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Phone:</span>
                  <span className="text-sm text-gray-900">{selectedRefund.user_phone}</span>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Order ID:</span>
                  <span className="text-sm font-mono text-gray-900">{selectedRefund.order_id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Original Amount:</span>
                  <span className="text-sm text-gray-900">
                    {selectedRefund.order_details.original_amount.toLocaleString()} KZT
                  </span>
                </div>
              </div>

              {/* Products */}
              <div className="mt-4">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Products:</h4>
                <div className="space-y-2">
                  {selectedRefund.order_details.products.map((product) => (
                    <div key={product.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Qty: {product.quantity} × {formatNumber(product.price)} KZT
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {(product.quantity * product.price).toLocaleString()} KZT
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Refund Reason */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Refund Reason</h3>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{selectedRefund.reason}</p>
            </div>

            {/* Rejection Reason */}
            {selectedRefund.status === 'rejected' && selectedRefund.rejection_reason && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Rejection Reason</h3>
                <p className="text-sm text-red-700 bg-red-50 p-3 rounded border border-red-200">
                  {selectedRefund.rejection_reason}
                </p>
              </div>
            )}
          </div>
        )}
      </DetailModal>
    </div>
  );
}
