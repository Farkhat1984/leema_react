import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, MessageSquare } from 'lucide-react';
import { BackButton } from '@/shared/components/ui/BackButton';
import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { DataTable } from '@/shared/components/ui/DataTable';
import { StatsCard } from '@/shared/components/ui/StatsCard';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { Button } from '@/shared/components/ui/Button';
import { DetailModal } from '@/shared/components/ui/DetailModal';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useDebounce } from '@/shared/hooks';
import { formatDate } from '@/shared/lib/utils';

interface Review {
  id: number;
  user_name: string;
  user_avatar?: string;
  product_name: string;
  product_id: number;
  product_image?: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewsResponse {
  data: Review[];
  total: number;
  page: number;
  limit: number;
}

interface Product {
  id: number;
  name: string;
}

interface StatsResponse {
  total_reviews: number;
  average_rating: number;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
}

function ShopReviewsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [viewingReview, setViewingReview] = useState<Review | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch products for filter
  const { data: productsData } = useQuery<Product[] | { products: Product[] }>({
    queryKey: ['shop-products-list'],
    queryFn: () =>
      apiRequest<Product[] | { products: Product[] }>(`${API_ENDPOINTS.SHOPS.PRODUCTS}?limit=1000&fields=id,name`),
  });

  // Ensure products is always an array
  const products = Array.isArray(productsData)
    ? productsData
    : Array.isArray(productsData?.products)
      ? productsData.products
      : [];

  // Fetch stats
  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ['shop-reviews-stats'],
    queryFn: () =>
      apiRequest<StatsResponse>(`${API_ENDPOINTS.SHOPS.ME}/reviews/stats`),
  });

  // Fetch reviews
  const { data: reviewsData, isLoading } = useQuery<ReviewsResponse>({
    queryKey: ['shop-reviews', page, debouncedSearch, selectedProduct],
    queryFn: () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(selectedProduct !== 'all' && { product_id: selectedProduct }),
      });
      return apiRequest<ReviewsResponse>(
        `${API_ENDPOINTS.SHOPS.ME}/reviews?${params}`
      );
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
      cell: ({row}: {row: {original: Review}}) => (
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
      cell: ({row}: {row: {original: Review}}) => (
        <div className="flex items-center gap-3">
          {row.original.product_image && (
            <img
              src={row.original.product_image}
              alt={row.original.product_name}
              className="w-10 h-10 object-cover rounded"
            />
          )}
          <span className="font-medium text-gray-900 dark:text-white">
            {row.original.product_name}
          </span>
        </div>
      ),
    },
    {
      header: 'Рейтинг',
      accessorKey: 'rating',
      cell: ({row}: {row: {original: Review}}) => renderStars(row.original.rating),
    },
    {
      header: 'Комментарий',
      accessorKey: 'comment',
      cell: ({row}: {row: {original: Review}}) => (
        <div className="max-w-md truncate text-gray-600 dark:text-gray-400">
          {row.original.comment}
        </div>
      ),
    },
    {
      header: 'Дата',
      accessorKey: 'created_at',
      cell: ({row}: {row: {original: Review}}) => formatDate(row.original.created_at),
    },
    {
      header: 'Действия',
      accessorKey: 'id',
      cell: ({row}: {row: {original: Review}}) => (
        <Button size="sm" variant="ghost" onClick={() => setViewingReview(row.original)}>
          Просмотр
        </Button>
      ),
    },
  ];

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedProduct('all');
    setPage(1);
  };

  const renderRatingBar = (count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex items-center gap-2">
        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-yellow-400 h-2 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
          {count}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Отзывы о товарах
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Просмотр и анализ отзывов клиентов о ваших товарах
          </p>
        </div>
        <BackButton to="/shop" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Всего отзывов"
          value={stats?.total_reviews || 0}
          icon={<MessageSquare />}
          variant="primary"
        />
        <StatsCard
          title="Средний рейтинг"
          value={stats?.average_rating?.toFixed(1) || '0.0'}
          icon={<Star />}
          variant="warning"
        />
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
            Распределение рейтинга
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400 w-4">5</span>
              {renderRatingBar(stats?.five_star || 0, stats?.total_reviews || 0)}
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400 w-4">4</span>
              {renderRatingBar(stats?.four_star || 0, stats?.total_reviews || 0)}
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400 w-4">3</span>
              {renderRatingBar(stats?.three_star || 0, stats?.total_reviews || 0)}
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400 w-4">2</span>
              {renderRatingBar(stats?.two_star || 0, stats?.total_reviews || 0)}
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400 w-4">1</span>
              {renderRatingBar(stats?.one_star || 0, stats?.total_reviews || 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Поиск отзывов..."
          />
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Все товары</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          {(searchQuery || selectedProduct !== 'all') && (
            <Button variant="outline" onClick={handleClearFilters}>
              Очистить фильтры
            </Button>
          )}
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {!isLoading && (!reviewsData?.data || reviewsData.data.length === 0) ? (
          <EmptyState
            icon={<MessageSquare />}
            title="Пока нет отзывов"
            message="У ваших товаров пока нет отзывов. Предложите клиентам оставить отзывы!"
          />
        ) : (
          <DataTable
            columns={columns}
            data={Array.isArray(reviewsData?.data) ? reviewsData.data : []}
            loading={isLoading}
            pageIndex={page - 1}
            pageSize={20}
            totalRows={reviewsData?.total || 0}
            onPaginationChange={(pageIndex) => setPage(pageIndex + 1)}
            manualPagination={true}
          />
        )}
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
                <p className="font-medium text-gray-900 dark:text-white">
                  {viewingReview.product_name}
                </p>
              </div>
            </div>

            {/* Rating */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Рейтинг
              </h4>
              <div className="flex items-center gap-2">
                {renderStars(viewingReview.rating)}
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {viewingReview.rating}.0
                </span>
              </div>
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
          </div>
        </DetailModal>
      )}
    </div>
  );
};
export default ShopReviewsPage;
