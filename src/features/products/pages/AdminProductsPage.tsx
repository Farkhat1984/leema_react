/**
 * Admin Products Page - Product Moderation
 * Allows admins to approve/reject products from shops
 */

import { useState, useEffect } from 'react';
import { logger } from '@/shared/lib/utils/logger';
import { formatNumber } from '@/shared/lib/utils';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Eye, X, Box, Clock } from 'lucide-react';
import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { Button } from '@/shared/components/ui/Button';
import { BackButton } from '@/shared/components/ui/BackButton';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { StatsCard } from '@/shared/components/ui/StatsCard';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { RejectModal } from '@/shared/components/ui/RejectModal';
import { DetailModal } from '@/shared/components/ui/DetailModal';
import { Pagination } from '@/shared/components/ui/Pagination';
import type { Product, ProductsResponse, ProductStatus } from '../types';

interface ModerationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ModerationStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus | 'all'>('pending');
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'created_at' | 'price' | 'name' | 'views'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Available categories and shops for filters
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);
  const [shops, setShops] = useState<Array<{ id: number; name: string }>>([]);

  // Modals
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    loadCategories();
    loadShops();
  }, []);

  useEffect(() => {
    loadStats();
    loadProducts();
  }, [currentPage, searchTerm, selectedStatus, selectedShopId, minPrice, maxPrice, selectedCategory, sortBy, sortOrder]);

  /**
   * Load categories for filter
   */
  const loadCategories = async () => {
    try {
      const response = await apiRequest<Array<{ id: number; name: string }>>(
        API_ENDPOINTS.CATEGORIES.LIST
      );
      setCategories(Array.isArray(response) ? response : []);
    } catch (error) {
      logger.error('Failed to load categories', error);
      setCategories([]);
    }
  };

  /**
   * Load shops for filter
   */
  const loadShops = async () => {
    try {
      // Use the /all endpoint with simplified fields
      const response = await apiRequest<{
        shops: Array<{
          id: number;
          shop_name: string;
        }>
      }>(
        `${API_ENDPOINTS.ADMIN.SHOPS}/all?per_page=1000`
      );

      // Map shop_name to name for consistency
      const shopsArray = (response.shops || []).map(shop => ({
        id: shop.id,
        name: shop.shop_name
      }));
      setShops(shopsArray);
    } catch (error) {
      logger.error('Failed to load shops', error);
      setShops([]);
    }
  };

  /**
   * Load moderation statistics
   */
  const loadStats = async () => {
    try {
      const response = await apiRequest<ModerationStats>(
        API_ENDPOINTS.ADMIN.PRODUCTS_STATS
      );
      setStats(response);
    } catch (error) {
      logger.error('Failed to load stats', error);
      // Keep default stats on error (don't show error to user)
      setStats({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      });
    }
  };

  /**
   * Load products with filters
   */
  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        page: currentPage.toString(),
        per_page: '12',
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      // Add filters only if they have values
      if (searchTerm) params.search = searchTerm;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedShopId) params.shop_id = selectedShopId;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (selectedCategory) params.category_id = selectedCategory;

      const queryString = new URLSearchParams(params).toString();
      const response = await apiRequest<ProductsResponse>(
        `${API_ENDPOINTS.ADMIN.PRODUCTS}?${queryString}`
      );

      // Ensure products is an array
      const productsArray = Array.isArray(response.products) ? response.products : [];
      setProducts(productsArray);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      logger.error('Failed to load products', error);
      toast.error('Failed to load products');
      setProducts([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle approve product
   */
  const handleApprove = (product: Product) => {
    setSelectedProduct(product);
    setShowApproveDialog(true);
  };

  /**
   * Handle reject product
   */
  const handleReject = (product: Product) => {
    setSelectedProduct(product);
    setShowRejectModal(true);
  };

  /**
   * Handle view product details
   */
  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  /**
   * Confirm approve product
   */
  const confirmApprove = async () => {
    if (!selectedProduct) return;

    setIsProcessing(true);
    try {
      await apiRequest(
        API_ENDPOINTS.ADMIN.APPROVE_PRODUCT(selectedProduct.id),
        'POST',
        { notes: '' } // Backend expects ModerationAction with notes field
      );

      toast.success(`Product "${selectedProduct.name}" approved successfully`);
      setShowApproveDialog(false);
      loadStats();
      loadProducts();
    } catch (error: any) {
      logger.error('Failed to approve product', error);
      toast.error(error.message || 'Failed to approve product');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Confirm reject product
   */
  const confirmReject = async (reason: string) => {
    if (!selectedProduct) return;

    setIsProcessing(true);
    try {
      await apiRequest(
        API_ENDPOINTS.ADMIN.REJECT_PRODUCT(selectedProduct.id),
        'POST',
        { notes: reason } // Backend expects 'notes' field, not 'reason'
      );

      toast.success(`Product "${selectedProduct.name}" rejected`);
      setShowRejectModal(false);
      loadStats();
      loadProducts();
    } catch (error: any) {
      logger.error('Failed to reject product', error);
      toast.error(error.message || 'Failed to reject product');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle bulk approve
   */
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select products to approve');
      return;
    }

    setIsProcessing(true);
    try {
      await apiRequest(
        API_ENDPOINTS.ADMIN.PRODUCTS_BULK_ACTION,
        'POST',
        {
          product_ids: selectedIds,
          action: 'approve',
        }
      );

      toast.success(`${selectedIds.length} product(s) approved successfully`);
      setSelectedIds([]);
      loadStats();
      loadProducts();
    } catch (error: any) {
      logger.error('Failed to bulk approve', error);
      toast.error(error.message || 'Failed to approve products');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle bulk reject
   */
  const handleBulkReject = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select products to reject');
      return;
    }

    const reason = prompt('Enter rejection reason for all selected products:');
    if (!reason) return;

    setIsProcessing(true);
    try {
      await apiRequest(
        API_ENDPOINTS.ADMIN.PRODUCTS_BULK_ACTION,
        'POST',
        {
          product_ids: selectedIds,
          action: 'reject',
          notes: reason, // Backend expects 'notes' field, not 'reason'
        }
      );

      toast.success(`${selectedIds.length} product(s) rejected`);
      setSelectedIds([]);
      loadStats();
      loadProducts();
    } catch (error: any) {
      logger.error('Failed to bulk reject', error);
      toast.error(error.message || 'Failed to reject products');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Toggle product selection
   */
  const toggleSelection = (productId: number) => {
    if (selectedIds.includes(productId)) {
      setSelectedIds(selectedIds.filter(id => id !== productId));
    } else {
      setSelectedIds([...selectedIds, productId]);
    }
  };

  /**
   * Toggle select all
   */
  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  /**
   * Clear filters
   */
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('pending');
    setSelectedShopId('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedCategory('');
    setSortBy('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  /**
   * Get status variant
   */
  const getStatusVariant = (status: ProductStatus) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Модерация товаров</h1>
            <p className="text-gray-600 mt-1">Проверка и модерация товаров из магазинов</p>
          </div>
          <BackButton to="/admin" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Всего товаров"
            value={stats.total}
            icon={<Box className="w-6 h-6" />}
            variant="primary"
          />
          <StatsCard
            title="На модерации"
            value={stats.pending}
            icon={<Clock className="w-6 h-6" />}
            variant="warning"
          />
          <StatsCard
            title="Одобрено"
            value={stats.approved}
            icon={<CheckCircle className="w-6 h-6" />}
            variant="success"
          />
          <StatsCard
            title="Отклонено"
            value={stats.rejected}
            icon={<XCircle className="w-6 h-6" />}
            variant="danger"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="space-y-4">
            {/* Row 1: Search and Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Поиск по названию, описанию..."
                />
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as ProductStatus | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Все статусы</option>
                <option value="pending">На модерации</option>
                <option value="approved">Одобрено</option>
                <option value="rejected">Отклонено</option>
                <option value="draft">Черновик</option>
              </select>
            </div>

            {/* Row 2: Shop and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Shop Filter */}
              <select
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Все магазины</option>
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Все категории</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Row 3: Price Range and Sorting */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Min Price */}
              <div>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Мин. цена"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Max Price */}
              <div>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Макс. цена"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'created_at' | 'price' | 'name' | 'views')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="created_at">По дате</option>
                <option value="name">По названию</option>
                <option value="price">По цене</option>
                <option value="views">По просмотрам</option>
              </select>

              {/* Sort Order */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="desc">По убыванию</option>
                <option value="asc">По возрастанию</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchTerm || selectedStatus !== 'pending' || selectedShopId || minPrice || maxPrice || selectedCategory || sortBy !== 'created_at' || sortOrder !== 'desc') && (
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
              <Button
                onClick={clearFilters}
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Очистить фильтры
              </Button>
            </div>
          )}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="Товары не найдены"
            message={
              searchTerm
                ? 'Попробуйте изменить фильтры'
                : selectedStatus === 'pending'
                ? 'Нет товаров на модерации'
                : 'Нет товаров, соответствующих критериям'
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-sm border-2 border-gray-200 overflow-hidden hover:shadow-md transition-all"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-100">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Eye className="w-16 h-16" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <StatusBadge
                        status={product.status}
                        variant={getStatusVariant(product.status)}
                      />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {product.description}
                    </p>
                    <p className="text-lg font-bold text-purple-600 mb-3">
                      {formatNumber(product.price)} ₸
                    </p>

                    {/* Shop Info */}
                    <p className="text-xs text-gray-500 mb-3">
                      Магазин: {product.shop_name || `ID: ${product.shop_id}`}
                    </p>

                    {/* Rejection Reason */}
                    {product.status === 'rejected' && product.moderation_notes && (
                      <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
                        <p className="text-xs text-red-800">
                          <span className="font-semibold">Отклонено:</span> {product.moderation_notes}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleViewDetails(product)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Просмотр
                      </Button>

                      {/* Show approve/reject buttons (disabled if not pending) */}
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleApprove(product)}
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          disabled={isProcessing || product.status !== 'pending'}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Одобрить
                        </Button>
                        <Button
                          onClick={() => handleReject(product)}
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-red-600 hover:bg-red-50"
                          disabled={isProcessing || product.status !== 'pending'}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Отклонить
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}

        {/* Approve Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showApproveDialog}
          onClose={() => setShowApproveDialog(false)}
          onConfirm={confirmApprove}
          title="Одобрить товар"
          message={`Вы уверены, что хотите одобрить "${selectedProduct?.name}"? Товар станет виден всем пользователям.`}
          confirmText="Одобрить"
          variant="primary"
          loading={isProcessing}
        />

        {/* Reject Modal */}
        <RejectModal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          onConfirm={confirmReject}
          title="Отклонить товар"
          message={`Укажите причину отклонения товара "${selectedProduct?.name}". Владелец магазина получит уведомление.`}
          loading={isProcessing}
        />

        {/* Detail Modal */}
        {selectedProduct && (
          <DetailModal
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            title="Детали товара"
            size="lg"
          >
            <div className="space-y-6">
              {/* Images */}
              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Изображения</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedProduct.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img src={img.url} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute top-1 left-1 px-2 py-0.5 bg-black bg-opacity-60 text-white text-xs rounded">
                          {img.quality?.toUpperCase() || 'MEDIUM'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Название товара</span>
                  <span className="text-sm text-gray-900">{selectedProduct.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Цена</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(selectedProduct.price)} ₸
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Категория</span>
                  <span className="text-sm text-gray-900">{selectedProduct.category_name || 'Не указана'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Статус</span>
                  <StatusBadge
                    status={selectedProduct.status}
                    variant={getStatusVariant(selectedProduct.status)}
                  />
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Магазин</span>
                  <span className="text-sm text-gray-900">
                    {selectedProduct.shop_name || `ID: ${selectedProduct.shop_id}`}
                  </span>
                </div>
                <div className="py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600 block mb-1">Описание</span>
                  <p className="text-sm text-gray-900">{selectedProduct.description}</p>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Размеры</span>
                  <span className="text-sm text-gray-900">
                    {selectedProduct.sizes && selectedProduct.sizes.length > 0
                      ? selectedProduct.sizes.join(', ')
                      : 'Не указаны'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Цвета</span>
                  <span className="text-sm text-gray-900">
                    {selectedProduct.colors && selectedProduct.colors.length > 0
                      ? selectedProduct.colors.join(', ')
                      : 'Не указаны'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Просмотры</span>
                  <span className="text-sm text-gray-900">{selectedProduct.views}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Примерки</span>
                  <span className="text-sm text-gray-900">{selectedProduct.try_ons}</span>
                </div>
                {selectedProduct.moderation_notes && (
                  <div className="py-2">
                    <span className="text-sm font-medium text-red-600 block mb-1">Причина отклонения</span>
                    <p className="text-sm text-red-800 bg-red-50 p-3 rounded">
                      {selectedProduct.moderation_notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions - Always show buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleApprove(selectedProduct);
                  }}
                  variant="primary"
                  className="flex-1"
                  disabled={selectedProduct.status !== 'pending'}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Одобрить товар
                </Button>
                <Button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleReject(selectedProduct);
                  }}
                  variant="ghost"
                  className="flex-1 text-red-600 hover:bg-red-50"
                  disabled={selectedProduct.status !== 'pending'}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Отклонить товар
                </Button>
              </div>
            </div>
          </DetailModal>
        )}
      </div>
    </div>
  );
};

export default AdminProductsPage;
