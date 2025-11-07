import { useState } from 'react';
import { type Row } from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Star, Eye, Check, X, Trash2, MessageSquare } from 'lucide-react';
import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { DataTable } from '@/shared/components/ui/DataTable';
import { StatsCard } from '@/shared/components/ui/StatsCard';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { Button } from '@/shared/components/ui/Button';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { DetailModal } from '@/shared/components/ui/DetailModal';
import { RejectModal } from '@/shared/components/ui/RejectModal';
import { useDebounce } from '@/shared/hooks';
import { formatDate } from '@/shared/lib/utils';

interface Review {
  id: number;
  user_name: string;
  user_avatar?: string;
  product_name: string;
  product_image?: string;
  shop_name: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
}

interface ReviewsResponse {
  data: Review[];
  total: number;
  page: number;
  limit: number;
}

interface StatsResponse {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [viewingReview, setViewingReview] = useState<Review | null>(null);
  const [approvingReviewId, setApprovingReviewId] = useState<number | null>(null);
  const [rejectingReviewId, setRejectingReviewId] = useState<number | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch stats
  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ['admin-reviews-stats'],
    queryFn: () => apiRequest<StatsResponse>(`${API_ENDPOINTS.REVIEWS.LIST}/stats`),
  });

  // Fetch reviews
  const { data: reviewsData, isLoading } = useQuery<ReviewsResponse>({
    queryKey: ['admin-reviews', page, debouncedSearch, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });
      return apiRequest<ReviewsResponse>(`${API_ENDPOINTS.REVIEWS.LIST}?${params}`);
    },
  });

  // Approve review mutation
  const approveMutation = useMutation({
    mutationFn: (reviewId: number) =>
      apiRequest(`${API_ENDPOINTS.REVIEWS.BY_ID(reviewId)}/approve`, 'POST'),
    onSuccess: () => {
      toast.success('Отзыв одобрен успешно');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-stats'] });
      setApprovingReviewId(null);
    },
    onError: () => {
      toast.error('Не удалось одобрить отзыв');
    },
  });

  // Reject review mutation
  const rejectMutation = useMutation({
    mutationFn: ({ reviewId, reason }: { reviewId: number; reason: string }) =>
      apiRequest(`${API_ENDPOINTS.REVIEWS.BY_ID(reviewId)}/reject`, 'POST', { reason }),
    onSuccess: () => {
      toast.success('Отзыв отклонен успешно');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-stats'] });
      setRejectingReviewId(null);
    },
    onError: () => {
      toast.error('Не удалось отклонить отзыв');
    },
  });

  // Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: (reviewId: number) =>
      apiRequest(API_ENDPOINTS.REVIEWS.DELETE(reviewId), 'DELETE'),
    onSuccess: () => {
      toast.success('Отзыв удален успешно');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-stats'] });
      setDeletingReviewId(null);
    },
    onError: () => {
      toast.error('Не удалось удалить отзыв');
    },
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const columns = [
    {
      header: 'Пользователь',
      accessorKey: 'user_name',
      cell: ({ row }: { row: Row<Review> }) => (
        <div className="flex items-center gap-3">
          {row.original.user_avatar ? (
            <img
              src={row.original.user_avatar}
              alt={row.original.user_name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                {row.original.user_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-gray-900 dark:text-white">{row.original.user_name}</span>
        </div>
      ),
    },
    {
      header: 'Товар',
      accessorKey: 'product_name',
      cell: ({ row }: { row: Row<Review> }) => (
        <div className="flex items-center gap-3">
          {row.original.product_image && (
            <img
              src={row.original.product_image}
              alt={row.original.product_name}
              className="w-10 h-10 object-cover rounded"
            />
          )}
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {row.original.product_name}
            </div>
            <div className="text-sm text-gray-500">{row.original.shop_name}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Рейтинг',
      accessorKey: 'rating',
      cell: ({ row }: { row: Row<Review> }) => renderStars(row.original.rating),
    },
    {
      header: 'Комментарий',
      accessorKey: 'comment',
      cell: ({ row }: { row: Row<Review> }) => (
        <div className="max-w-xs truncate text-gray-600 dark:text-gray-400">
          {row.original.comment}
        </div>
      ),
    },
    {
      header: 'Статус',
      accessorKey: 'status',
      cell: ({ row }: { row: Row<Review> }) => <StatusBadge status={row.original.status} />,
    },
    {
      header: 'Дата',
      accessorKey: 'created_at',
      cell: ({ row }: { row: Row<Review> }) => formatDate(row.original.created_at),
    },
    {
      header: 'Действия',
      accessorKey: 'id',
      cell: ({ row }: { row: Row<Review> }) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setViewingReview(row.original)}>
            <Eye className="w-4 h-4" />
          </Button>
          {row.original.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setApprovingReviewId(row.original.id)}
                className="text-green-600 hover:text-green-700"
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRejectingReviewId(row.original.id)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeletingReviewId(row.original.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Управление отзывами
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Модерация отзывов о товарах и управление отзывами пользователей
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard title="Всего отзывов" value={stats?.total || 0} variant="primary" />
        <StatsCard
          title="Ожидающих проверки"
          value={stats?.pending || 0}
          variant="warning"
        />
        <StatsCard
          title="Одобрено"
          value={stats?.approved || 0}
          variant="success"
        />
        <StatsCard
          title="Отклонено"
          value={stats?.rejected || 0}
          variant="danger"
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Поиск по пользователю, товару или магазину..."
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидает</option>
            <option value="approved">Одобрен</option>
            <option value="rejected">Отклонен</option>
          </select>
          {(searchQuery || statusFilter !== 'all') && (
            <Button variant="outline" onClick={handleClearFilters}>
              Очистить фильтры
            </Button>
          )}
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <DataTable
          columns={columns}
          data={reviewsData?.data || []}
          loading={isLoading}
        />
      </div>

      {/* View Review Modal */}
      {viewingReview && (
        <DetailModal
          isOpen={true}
          onClose={() => setViewingReview(null)}
          title="Детали отзыва"
          size="lg"
        >
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center gap-4">
              {viewingReview.user_avatar ? (
                <img
                  src={viewingReview.user_avatar}
                  alt={viewingReview.user_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-2xl text-gray-600 dark:text-gray-300 font-medium">
                    {viewingReview.user_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewingReview.user_name}
                </h3>
                <p className="text-sm text-gray-500">
                  {formatDate(viewingReview.created_at)}
                </p>
              </div>
            </div>

            {/* Product Info */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Товар
              </h4>
              <div className="flex items-center gap-4">
                {viewingReview.product_image && (
                  <img
                    src={viewingReview.product_image}
                    alt={viewingReview.product_name}
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {viewingReview.product_name}
                  </p>
                  <p className="text-sm text-gray-500">{viewingReview.shop_name}</p>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Рейтинг
              </h4>
              {renderStars(viewingReview.rating)}
            </div>

            {/* Comment */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Комментарий
              </h4>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {viewingReview.comment}
              </p>
            </div>

            {/* Status */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Статус
              </h4>
              <StatusBadge status={viewingReview.status} />
              {viewingReview.rejection_reason && (
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    <strong>Причина отклонения:</strong> {viewingReview.rejection_reason}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            {viewingReview.status === 'pending' && (
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  onClick={() => {
                    setRejectingReviewId(viewingReview.id);
                    setViewingReview(null);
                  }}
                  variant="outline"
                  className="text-red-600"
                >
                  <X className="w-4 h-4 mr-2" />
                  Отклонить
                </Button>
                <Button
                  onClick={() => {
                    setApprovingReviewId(viewingReview.id);
                    setViewingReview(null);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Одобрить
                </Button>
              </div>
            )}
          </div>
        </DetailModal>
      )}

      {/* Approve Confirmation */}
      {approvingReviewId !== null && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setApprovingReviewId(null)}
          onConfirm={() => approveMutation.mutate(approvingReviewId)}
          title="Одобрить отзыв"
          message="Вы уверены, что хотите одобрить этот отзыв? Он будет виден всем пользователям."
          confirmText="Одобрить"
          loading={isLoading}
        />
      )}

      {/* Reject Modal */}
      {rejectingReviewId !== null && (
        <RejectModal
          isOpen={true}
          onClose={() => setRejectingReviewId(null)}
          onConfirm={(reason) => rejectMutation.mutate({ reviewId: rejectingReviewId, reason })}
          title="Отклонить отзыв"
          message="Пожалуйста, укажите причину отклонения этого отзыва:"
          loading={isLoading}
        />
      )}

      {/* Delete Confirmation */}
      {deletingReviewId !== null && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeletingReviewId(null)}
          onConfirm={() => deleteMutation.mutate(deletingReviewId)}
          title="Удалить отзыв"
          message="Вы уверены, что хотите удалить этот отзыв? Это действие нельзя отменить."
          confirmText="Удалить"
          loading={isLoading}
        />
      )}
    </div>
  );
};
export default AdminReviewsPage;
