/**
 * Admin Products Page - Product Moderation
 * Allows admins to approve/reject products from shops
 */

import { useState, useEffect } from 'react';
import { logger } from '@/shared/lib/utils/logger';
import { formatNumber } from '@/shared/lib/utils';
import { logger } from '@/shared/lib/utils/logger';
import toast from 'react-hot-toast';
import { logger } from '@/shared/lib/utils/logger';
import { CheckCircle, XCircle, Eye, Search, Filter, X } from 'lucide-react';
import { logger } from '@/shared/lib/utils/logger';
import { apiRequest } from '@/shared/lib/api/client';
import { logger } from '@/shared/lib/utils/logger';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { logger } from '@/shared/lib/utils/logger';
import { Button } from '@/shared/components/ui/Button';
import { logger } from '@/shared/lib/utils/logger';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { logger } from '@/shared/lib/utils/logger';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { logger } from '@/shared/lib/utils/logger';
import { StatsCard } from '@/shared/components/ui/StatsCard';
import { logger } from '@/shared/lib/utils/logger';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { logger } from '@/shared/lib/utils/logger';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { logger } from '@/shared/lib/utils/logger';
import { RejectModal } from '@/shared/components/ui/RejectModal';
import { logger } from '@/shared/lib/utils/logger';
import { DetailModal } from '@/shared/components/ui/DetailModal';
import { logger } from '@/shared/lib/utils/logger';
import { Pagination } from '@/shared/components/ui/Pagination';
import { logger } from '@/shared/lib/utils/logger';
import type { Product, ProductsResponse, ProductStatus } from '../types';
import { logger } from '@/shared/lib/utils/logger';

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

  // Modals
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Bulk actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    loadStats();
    loadProducts();
  }, [currentPage, searchTerm, selectedStatus]);

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
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: '12',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedStatus !== 'all' && { status: selectedStatus }),
        sort_by: 'created_at',
        sort_order: 'desc',
      });

      const response = await apiRequest<ProductsResponse>(
        `${API_ENDPOINTS.ADMIN.PRODUCTS}?${params}`
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
        'POST'
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
        { reason }
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
          reason,
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Product Moderation</h1>
          <p className="text-gray-600 mt-1">Review and moderate products from shops</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Products"
            value={stats.total}
            icon="box"
            variant="primary"
          />
          <StatsCard
            title="Pending Approval"
            value={stats.pending}
            icon="clock"
            variant="warning"
          />
          <StatsCard
            title="Approved"
            value={stats.approved}
            icon="check-circle"
            variant="success"
          />
          <StatsCard
            title="Rejected"
            value={stats.rejected}
            icon="x-circle"
            variant="error"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search products or shops..."
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as ProductStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600">
                {selectedIds.length} product(s) selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleBulkApprove}
                  variant="primary"
                  size="sm"
                  disabled={isProcessing}
                  className="flex items-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Selected
                </Button>
                <Button
                  onClick={handleBulkReject}
                  variant="ghost"
                  size="sm"
                  disabled={isProcessing}
                  className="text-red-600 hover:bg-red-50 flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Selected
                </Button>
                <Button
                  onClick={() => setSelectedIds([])}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {(searchTerm || selectedStatus !== 'pending') && (
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
              <Button
                onClick={clearFilters}
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear Filters
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
            title="No products found"
            message={
              searchTerm
                ? 'Try adjusting your filters'
                : selectedStatus === 'pending'
                ? 'No products pending approval'
                : 'No products match your criteria'
            }
          />
        ) : (
          <>
            {/* Select All */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.length === products.length && products.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Select All</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`bg-white rounded-lg shadow-sm border-2 overflow-hidden hover:shadow-md transition-all ${
                    selectedIds.includes(product.id) ? 'border-purple-500' : 'border-gray-200'
                  }`}
                >
                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product.id)}
                      onChange={() => toggleSelection(product.id)}
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-100">
                    {product.images[0] ? (
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
                      Shop ID: {product.shop_id}
                    </p>

                    {/* Rejection Reason */}
                    {product.status === 'rejected' && product.rejection_reason && (
                      <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
                        <p className="text-xs text-red-800">
                          <span className="font-semibold">Rejected:</span> {product.rejection_reason}
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
                        View Details
                      </Button>
                      {product.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleApprove(product)}
                            variant="primary"
                            size="sm"
                            className="flex-1"
                            disabled={isProcessing}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleReject(product)}
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-red-600 hover:bg-red-50"
                            disabled={isProcessing}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
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
          title="Approve Product"
          message={`Are you sure you want to approve "${selectedProduct?.name}"? The product will become visible to all users.`}
          confirmText="Approve"
          variant="primary"
          loading={isProcessing}
        />

        {/* Reject Modal */}
        <RejectModal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          onConfirm={confirmReject}
          title="Reject Product"
          message={`Please provide a reason for rejecting "${selectedProduct?.name}". The shop owner will be notified.`}
          loading={isProcessing}
        />

        {/* Detail Modal */}
        {selectedProduct && (
          <DetailModal
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            title="Product Details"
            size="lg"
          >
            <div className="space-y-6">
              {/* Images */}
              {selectedProduct.images.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Images</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedProduct.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <img src={img.url} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute top-1 left-1 px-2 py-0.5 bg-black bg-opacity-60 text-white text-xs rounded">
                          {img.quality.toUpperCase()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Product Name</span>
                  <span className="text-sm text-gray-900">{selectedProduct.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Price</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(selectedProduct.price)} ₸
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Category</span>
                  <span className="text-sm text-gray-900">{selectedProduct.category_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Status</span>
                  <StatusBadge
                    status={selectedProduct.status}
                    variant={getStatusVariant(selectedProduct.status)}
                  />
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Shop ID</span>
                  <span className="text-sm text-gray-900">{selectedProduct.shop_id}</span>
                </div>
                <div className="py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600 block mb-1">Description</span>
                  <p className="text-sm text-gray-900">{selectedProduct.description}</p>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Sizes</span>
                  <span className="text-sm text-gray-900">{selectedProduct.sizes.join(', ')}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Colors</span>
                  <span className="text-sm text-gray-900">{selectedProduct.colors.join(', ')}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Views</span>
                  <span className="text-sm text-gray-900">{selectedProduct.views}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-600">Try-ons</span>
                  <span className="text-sm text-gray-900">{selectedProduct.try_ons}</span>
                </div>
                {selectedProduct.rejection_reason && (
                  <div className="py-2">
                    <span className="text-sm font-medium text-red-600 block mb-1">Rejection Reason</span>
                    <p className="text-sm text-red-800 bg-red-50 p-3 rounded">
                      {selectedProduct.rejection_reason}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {selectedProduct.status === 'pending' && (
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <Button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleApprove(selectedProduct);
                    }}
                    variant="primary"
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Product
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleReject(selectedProduct);
                    }}
                    variant="ghost"
                    className="flex-1 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Product
                  </Button>
                </div>
              )}
            </div>
          </DetailModal>
        )}
      </div>
    </div>
  );
};

export default AdminProductsPage;
