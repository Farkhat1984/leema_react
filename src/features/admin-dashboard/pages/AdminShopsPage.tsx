/**
 * Admin Shops Page - Shop Management
 * Allows admins to approve/reject/activate/deactivate shops
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Eye, Power, PowerOff, Search, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moderationService, managementService } from '@/features/admin-dashboard/services';
import { ROUTES } from '@/shared/constants/config';
import { formatNumber } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/Button';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { StatsCard } from '@/shared/components/ui/StatsCard';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { DataTable } from '@/shared/components/ui/DataTable';
import { Pagination } from '@/shared/components/ui/Pagination';
import { SkeletonTable } from '@/shared/components/feedback/SkeletonTable';
import { logger } from '@/shared/lib/utils/logger';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { RejectModal } from '@/shared/components/ui/RejectModal';
import { useDebounce } from '@/shared/hooks';
import { BackButton } from '@/shared/components/ui/BackButton';
import type { Shop, ShopsResponse, ShopStats, ShopStatus } from '../types/shop';
import { type ColumnDef, type Row } from '@tanstack/react-table';

function AdminShopsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ShopStatus | 'all'>('pending');
  const [sortBy, setSortBy] = useState<'created_at' | 'name' | 'total_products' | 'total_revenue'>('created_at');

  // Modals
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const debouncedSearch = useDebounce(searchTerm, 300);

  /**
   * Fetch shops with filters using React Query
   */
  const { data: shopsData, isLoading } = useQuery({
    queryKey: ['admin', 'shops', currentPage, debouncedSearch, selectedStatus, sortBy],
    queryFn: () => managementService.getShops({
      page: currentPage,
      limit: 20,
      search: debouncedSearch || undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      sort_by: sortBy,
    }),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const shops = shopsData?.items || [];
  const totalPages = shopsData?.pages || 1;
  const stats = shopsData?.stats || {
    total: 0,
    pending: 0,
    approved: 0,
    active: 0,
    rejected: 0,
    deactivated: 0,
  };

  /**
   * Mutations for shop moderation
   */
  const approveMutation = useMutation({
    mutationFn: (shopId: number) => moderationService.approveShop(shopId),
    onMutate: async (shopId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['admin', 'shops'] });

      // Snapshot previous data
      const previousData = queryClient.getQueryData<ShopsResponse>(['admin', 'shops', currentPage, debouncedSearch, selectedStatus, sortBy]);

      // Optimistically update shop status
      if (previousData) {
        queryClient.setQueryData<ShopsResponse>(
          ['admin', 'shops', currentPage, debouncedSearch, selectedStatus, sortBy],
          {
            ...previousData,
            items: previousData.items.map((shop) =>
              shop.id === shopId ? { ...shop, status: 'approved' as ShopStatus } : shop
            ),
            stats: {
              ...previousData.stats,
              pending: previousData.stats.pending - 1,
              approved: previousData.stats.approved + 1,
            },
          }
        );
      }

      return { previousData };
    },
    onSuccess: () => {
      toast.success('Магазин одобрен');
      setShowApproveDialog(false);
    },
    onError: (_error, _variables, context) => {
      toast.error('Не удалось одобрить магазин');
      // Rollback
      if (context?.previousData) {
        queryClient.setQueryData(['admin', 'shops', currentPage, debouncedSearch, selectedStatus, sortBy], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ shopId, reason }: { shopId: number; reason: string }) =>
      moderationService.rejectShop(shopId, reason),
    onMutate: async ({ shopId }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'shops'] });
      const previousData = queryClient.getQueryData<ShopsResponse>(['admin', 'shops', currentPage, debouncedSearch, selectedStatus, sortBy]);

      if (previousData) {
        queryClient.setQueryData<ShopsResponse>(
          ['admin', 'shops', currentPage, debouncedSearch, selectedStatus, sortBy],
          {
            ...previousData,
            items: previousData.items.map((shop) =>
              shop.id === shopId ? { ...shop, status: 'rejected' as ShopStatus } : shop
            ),
            stats: {
              ...previousData.stats,
              pending: previousData.stats.pending - 1,
              rejected: previousData.stats.rejected + 1,
            },
          }
        );
      }

      return { previousData };
    },
    onSuccess: () => {
      toast.success('Магазин отклонен');
      setShowRejectModal(false);
    },
    onError: (_error, _variables, context) => {
      toast.error('Не удалось отклонить магазин');
      if (context?.previousData) {
        queryClient.setQueryData(['admin', 'shops', currentPage, debouncedSearch, selectedStatus, sortBy], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (shopId: number) => moderationService.activateShop(shopId),
    onMutate: async (shopId) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'shops'] });
      const previousData = queryClient.getQueryData<ShopsResponse>(['admin', 'shops', currentPage, debouncedSearch, selectedStatus, sortBy]);

      if (previousData) {
        queryClient.setQueryData<ShopsResponse>(
          ['admin', 'shops', currentPage, debouncedSearch, selectedStatus, sortBy],
          {
            ...previousData,
            items: previousData.items.map((shop) =>
              shop.id === shopId ? { ...shop, status: 'active' as ShopStatus } : shop
            ),
            stats: {
              ...previousData.stats,
              approved: previousData.stats.approved - 1,
              active: previousData.stats.active + 1,
            },
          }
        );
      }

      return { previousData };
    },
    onSuccess: () => {
      toast.success('Магазин активирован');
      setShowActivateDialog(false);
    },
    onError: (_error, _variables, context) => {
      toast.error('Не удалось активировать магазин');
      if (context?.previousData) {
        queryClient.setQueryData(['admin', 'shops', currentPage, debouncedSearch, selectedStatus, sortBy], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: ({ shopId, reason }: { shopId: number; reason: string }) =>
      moderationService.deactivateShop(shopId, reason),
    onMutate: async ({ shopId }) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'shops'] });
      const previousData = queryClient.getQueryData<ShopsResponse>(['admin', 'shops', currentPage, debouncedSearch, selectedStatus, sortBy]);

      if (previousData) {
        queryClient.setQueryData<ShopsResponse>(
          ['admin', 'shops', currentPage, debouncedSearch, selectedStatus, sortBy],
          {
            ...previousData,
            items: previousData.items.map((shop) =>
              shop.id === shopId ? { ...shop, status: 'deactivated' as ShopStatus } : shop
            ),
            stats: {
              ...previousData.stats,
              active: previousData.stats.active - 1,
              deactivated: previousData.stats.deactivated + 1,
            },
          }
        );
      }

      return { previousData };
    },
    onSuccess: () => {
      toast.success('Магазин деактивирован');
      setShowDeactivateModal(false);
    },
    onError: (_error, _variables, context) => {
      toast.error('Не удалось деактивировать магазин');
      if (context?.previousData) {
        queryClient.setQueryData(['admin', 'shops', currentPage, debouncedSearch, selectedStatus, sortBy], context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
    },
  });

  /**
   * Handle approve shop
   */
  const handleApprove = (shop: Shop) => {
    setSelectedShop(shop);
    setShowApproveDialog(true);
  };

  /**
   * Handle reject shop
   */
  const handleReject = (shop: Shop) => {
    setSelectedShop(shop);
    setShowRejectModal(true);
  };

  /**
   * Handle activate shop
   */
  const handleActivate = (shop: Shop) => {
    setSelectedShop(shop);
    setShowActivateDialog(true);
  };

  /**
   * Handle deactivate shop
   */
  const handleDeactivate = (shop: Shop) => {
    setSelectedShop(shop);
    setShowDeactivateModal(true);
  };

  /**
   * Handle view shop details
   */
  const handleViewDetails = (shop: Shop) => {
    navigate(`${ROUTES.ADMIN.SHOPS}/${shop.id}`);
  };

  /**
   * Confirm approve shop
   */
  const confirmApprove = () => {
    if (!selectedShop) return;
    approveMutation.mutate(selectedShop.id);
  };

  /**
   * Confirm reject shop
   */
  const confirmReject = (reason: string) => {
    if (!selectedShop) return;
    rejectMutation.mutate({ shopId: selectedShop.id, reason });
  };

  /**
   * Confirm activate shop
   */
  const confirmActivate = () => {
    if (!selectedShop) return;
    activateMutation.mutate(selectedShop.id);
  };

  /**
   * Confirm deactivate shop with reason
   */
  const confirmDeactivate = (reason: string) => {
    if (!selectedShop) return;
    deactivateMutation.mutate({ shopId: selectedShop.id, reason });
  };

  /**
   * Handle bulk actions (fallback to sequential operations)
   */
  const handleBulkAction = async (action: 'approve' | 'reject' | 'activate' | 'deactivate') => {
    if (selectedIds.size === 0) {
      toast.error('Сначала выберите магазины');
      return;
    }

    const shopIds = Array.from(selectedIds);

    // For bulk operations, we'll use individual mutations
    // This ensures proper loading states and error handling
    try {
      for (const shopId of shopIds) {
        switch (action) {
          case 'approve':
            await approveMutation.mutateAsync(shopId);
            break;
          case 'reject':
            const reason = prompt('Введите причину отклонения:');
            if (!reason) continue;
            await rejectMutation.mutateAsync({ shopId, reason });
            break;
          case 'activate':
            await activateMutation.mutateAsync(shopId);
            break;
          case 'deactivate':
            const deactivateReason = prompt('Введите причину деактивации:');
            if (!deactivateReason) continue;
            await deactivateMutation.mutateAsync({ shopId, reason: deactivateReason });
            break;
        }
      }
      const actionText = action === 'approve' ? 'одобрено' : action === 'reject' ? 'отклонено' : action === 'activate' ? 'активировано' : 'деактивировано';
      toast.success(`${shopIds.length} магазин(ов) ${actionText}`);
      setSelectedIds(new Set());
    } catch (error) {
      // Individual errors are already handled by mutation callbacks
    }
  };

  /**
   * Get status variant
   */
  const getStatusVariant = (status: ShopStatus) => {
    switch (status) {
      case 'active':
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'deactivated':
        return 'default';
      default:
        return 'default';
    }
  };

  /**
   * Clear filters
   */
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('pending');
    setSortBy('created_at');
    setCurrentPage(1);
  };

  /**
   * Table columns
   */
  const columns: ColumnDef<Shop>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
        />
      ),
    },
    {
      accessorKey: 'name',
      header: 'Название магазина',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.avatar && (
            <img
              src={row.original.avatar}
              alt={row.original.name}
              className="w-10 h-10 rounded-lg object-cover"
            />
          )}
          <div>
            <div className="font-medium text-gray-900">{row.original.name}</div>
            <div className="text-xs text-gray-500">{row.original.owner_email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status}
          variant={getStatusVariant(row.original.status)}
        />
      ),
    },
    {
      accessorKey: 'total_products',
      header: 'Товары',
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-medium">{row.original.total_products}</div>
          <div className="text-xs text-gray-500">
            {row.original.active_products} активных
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'total_orders',
      header: 'Заказы',
      cell: ({ row }) => <div className="text-center">{row.original.total_orders}</div>,
    },
    {
      accessorKey: 'total_revenue',
      header: 'Выручка',
      cell: ({ row }) => (
        <div className="font-medium">{formatNumber(row.original.total_revenue)} ₸</div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Создан',
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {new Date(row.original.created_at).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Действия',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            onClick={() => handleViewDetails(row.original)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Eye className="w-4 h-4" />
          </Button>
          {row.original.status === 'pending' && (
            <>
              <Button
                onClick={() => handleApprove(row.original)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleReject(row.original)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </>
          )}
          {row.original.status === 'approved' && (
            <Button
              onClick={() => handleActivate(row.original)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
              disabled={activateMutation.isPending}
            >
              <Power className="w-4 h-4" />
            </Button>
          )}
          {row.original.status === 'active' && (
            <Button
              onClick={() => handleDeactivate(row.original)}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-50"
              disabled={deactivateMutation.isPending}
            >
              <PowerOff className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Управление магазинами</h1>
            <p className="text-gray-600 mt-1">Модерация и управление магазинами на платформе</p>
          </div>
          <BackButton to="/admin" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatsCard title="Всего" value={stats.total} icon="store" variant="primary" />
          <StatsCard title="На модерации" value={stats.pending} icon="clock" variant="warning" />
          <StatsCard title="Одобрено" value={stats.approved} icon="check" variant="success" />
          <StatsCard title="Активных" value={stats.active} icon="zap" variant="success" />
          <StatsCard title="Отклонено" value={stats.rejected} icon="x-circle" variant="error" />
          <StatsCard title="Деактивировано" value={stats.deactivated} icon="pause" variant="primary" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Поиск по названию или владельцу..."
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as ShopStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Все статусы</option>
              <option value="pending">На модерации</option>
              <option value="approved">Одобрено</option>
              <option value="active">Активный</option>
              <option value="rejected">Отклонено</option>
              <option value="deactivated">Деактивирован</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">Выбрано магазинов: {selectedIds.size}</span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleBulkAction('approve')}
                  variant="primary"
                  size="sm"
                  disabled={approveMutation.isPending || rejectMutation.isPending || activateMutation.isPending || deactivateMutation.isPending}
                  isLoading={approveMutation.isPending}
                >
                  Одобрить
                </Button>
                <Button
                  onClick={() => handleBulkAction('reject')}
                  variant="ghost"
                  size="sm"
                  disabled={approveMutation.isPending || rejectMutation.isPending || activateMutation.isPending || deactivateMutation.isPending}
                  className="text-red-600"
                >
                  Отклонить
                </Button>
                <Button
                  onClick={() => handleBulkAction('activate')}
                  variant="ghost"
                  size="sm"
                  disabled={approveMutation.isPending || rejectMutation.isPending || activateMutation.isPending || deactivateMutation.isPending}
                >
                  Активировать
                </Button>
                <Button
                  onClick={() => handleBulkAction('deactivate')}
                  variant="ghost"
                  size="sm"
                  disabled={approveMutation.isPending || rejectMutation.isPending || activateMutation.isPending || deactivateMutation.isPending}
                  className="text-orange-600"
                >
                  Деактивировать
                </Button>
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {(searchTerm || selectedStatus !== 'pending') && (
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
              <Button onClick={clearFilters} variant="ghost" size="sm" className="flex items-center gap-1">
                <X className="w-4 h-4" />
                Сбросить фильтры
              </Button>
            </div>
          )}
        </div>

        {/* Shops Table */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <SkeletonTable rows={10} columns={8} />
          </div>
        ) : shops.length === 0 ? (
          <EmptyState
            title="Магазины не найдены"
            message={searchTerm ? 'Попробуйте изменить фильтры' : 'Нет магазинов соответствующих критериям'}
          />
        ) : (
          <>
            <DataTable
              data={shops}
              columns={columns}
              enableRowSelection
              rowSelection={Object.fromEntries(Array.from(selectedIds).map(id => [id.toString(), true]))}
              onRowSelectionChange={(selection) => {
                const ids = Object.keys(selection).filter(key => selection[key]).map(Number);
                setSelectedIds(new Set(ids));
              }}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}

        {/* Dialogs */}
        <ConfirmDialog
          isOpen={showApproveDialog}
          onClose={() => setShowApproveDialog(false)}
          onConfirm={confirmApprove}
          title="Одобрить магазин"
          message={`Вы уверены, что хотите одобрить магазин "${selectedShop?.name}"?`}
          confirmText="Одобрить"
          variant="primary"
          loading={approveMutation.isPending}
        />

        <RejectModal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          onConfirm={confirmReject}
          title="Отклонить магазин"
          message={`Укажите причину отклонения магазина "${selectedShop?.name}".`}
          loading={rejectMutation.isPending}
        />

        <ConfirmDialog
          isOpen={showActivateDialog}
          onClose={() => setShowActivateDialog(false)}
          onConfirm={confirmActivate}
          title="Активировать магазин"
          message={`Вы уверены, что хотите активировать магазин "${selectedShop?.name}"?`}
          confirmText="Активировать"
          variant="primary"
          loading={activateMutation.isPending}
        />

        <RejectModal
          isOpen={showDeactivateModal}
          onClose={() => setShowDeactivateModal(false)}
          onSubmit={confirmDeactivate}
          title="Деактивировать магазин"
          description={`Укажите причину деактивации магазина "${selectedShop?.name}". Магазин не сможет продавать товары до повторной активации.`}
          submitText="Деактивировать"
          loading={deactivateMutation.isPending}
        />
      </div>
    </div>
  );
};

export default AdminShopsPage;
