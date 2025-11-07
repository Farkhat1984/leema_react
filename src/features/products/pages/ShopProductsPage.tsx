/**
 * Shop Products Page
 * Full product management with CRUD operations
 */

import { useState, useEffect } from 'react';
import { logger } from '@/shared/lib/utils/logger';
import { formatNumber } from '@/shared/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye, Search, Filter, X } from 'lucide-react';
import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { productService } from '../services/productService';
import { Button } from '@/shared/components/ui/Button';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { FormModal } from '@/shared/components/ui/FormModal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { FormInput } from '@/shared/components/forms/FormInput';
import { FormTextarea } from '@/shared/components/forms/FormTextarea';
import { ImageUploadMultiple, UploadedImage } from '@/shared/components/ui/ImageUploadMultiple';
import { Pagination } from '@/shared/components/ui/Pagination';
import { productSchema, type ProductFormData } from '@/shared/lib/validation/schemas';
import type { Product, Category, ProductsResponse, ProductStatus } from '../types';

function ShopProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'name'>('date');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Images
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [currentPage, searchTerm, selectedCategory, selectedStatus, sortBy]);

  /**
   * Load categories
   */
  const loadCategories = async () => {
    try {
      const response = await apiRequest<{ categories: Category[]; total: number } | Category[]>(
        API_ENDPOINTS.CATEGORIES.LIST
      );

      // Handle both response formats
      if (Array.isArray(response)) {
        setCategories(response);
      } else if (response && typeof response === 'object' && 'categories' in response) {
        // Backend returns {categories: [...], total: N}
        setCategories(Array.isArray(response.categories) ? response.categories : []);
      } else {
        logger.warn('Categories response has unexpected format:', response);
        setCategories([]);
      }
    } catch (error) {
      logger.error('Failed to load categories', error);
      setCategories([]); // Set empty array on error
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
        ...(selectedCategory && { category_id: selectedCategory.toString() }),
        ...(selectedStatus && { status: selectedStatus }),
        sort_by: sortBy,
        sort_order: 'desc',
      });

      const response = await apiRequest<ProductsResponse | Product[]>(
        `${API_ENDPOINTS.SHOPS.PRODUCTS}?${params}`
      );

      // Handle both array response and paginated response
      if (Array.isArray(response)) {
        setProducts(response);
        setTotalPages(1);
        setTotalProducts(response.length);
      } else if (response && typeof response === 'object') {
        // Ensure products is an array
        const productsArray = Array.isArray(response.products) ? response.products : [];
        setProducts(productsArray);
        setTotalPages(response.total_pages || 1);
        setTotalProducts(response.total || 0);
      } else {
        logger.warn('Products response has unexpected format:', response);
        setProducts([]);
        setTotalPages(1);
        setTotalProducts(0);
      }
    } catch (error) {
      logger.error('Failed to load products', error);
      toast.error('Не удалось загрузить товары');
      setProducts([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle create product
   */
  const handleCreate = () => {
    reset({
      name: '',
      description: '',
      price: 0,
      category_id: 0,
      sizes: '',
      colors: '',
    });
    setUploadedImages([]);
    setShowCreateModal(true);
  };

  /**
   * Handle edit product
   */
  const handleEdit = (product: Product) => {
    setSelectedProduct(product);

    // Extract sizes and colors from characteristics if they exist
    const characteristics = product.characteristics || {};
    const sizes = characteristics.sizes || product.sizes || [];
    const colors = characteristics.colors || product.colors || [];

    reset({
      name: product.name,
      description: product.description,
      price: product.price,
      category_id: product.category_id,
      sizes: Array.isArray(sizes) ? sizes.join(', ') : '',
      colors: Array.isArray(colors) ? colors.join(', ') : '',
    });

    // Safely handle images array - extract URLs from objects or use strings directly
    const imagesArray = Array.isArray(product.images) ? product.images : [];
    setUploadedImages(
      imagesArray.map((img, index) => {
        // Handle both string URLs and image objects {url, quality}
        const url = typeof img === 'string' ? img : img.url;
        const quality = typeof img === 'object' ? img.quality : 'medium';
        return {
          id: `img-${index}`,
          url,
          quality,
        };
      })
    );
    setShowEditModal(true);
  };

  /**
   * Handle delete product
   */
  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteDialog(true);
  };

  /**
   * Submit create/edit form
   */
  const onSubmit = async (data: ProductFormData) => {
    setIsSaving(true);
    try {
      // Parse sizes and colors
      const sizes = data.sizes.split(',').map((s) => s.trim()).filter(Boolean);
      const colors = data.colors.split(',').map((c) => c.trim()).filter(Boolean);

      const newImages = uploadedImages.filter(img => img.url.startsWith('blob:'));
      const existingImages = uploadedImages.filter(img => !img.url.startsWith('blob:'));

      if (selectedProduct) {
        // Update existing product
        const imageUrls: string[] = [];

        // Add existing image URLs first
        existingImages.forEach(img => imageUrls.push(img.url));

        // Upload new images if any (with product_id)
        if (newImages.length > 0) {
          const files = await Promise.all(
            newImages.map(async (img) => {
              const blob = await fetch(img.url).then((r) => r.blob());
              return new File([blob], `image-${Date.now()}.jpg`, { type: 'image/jpeg' });
            })
          );

          const uploadResponse = await productService.uploadImages(selectedProduct.id, files);

          // Add newly uploaded URLs
          if (uploadResponse.urls && Array.isArray(uploadResponse.urls)) {
            imageUrls.push(...uploadResponse.urls);
          }
        }

        const payload = {
          name: data.name,
          description: data.description,
          price: data.price,
          category_id: data.category_id,
          characteristics: {
            sizes,
            colors,
          },
          images: imageUrls,
        };

        await productService.updateProduct(selectedProduct.id, payload);
        toast.success('Товар успешно обновлен');
        setShowEditModal(false);
      } else {
        // Create new product first (without images)
        const payload = {
          name: data.name,
          description: data.description,
          price: data.price,
          category_id: data.category_id,
          characteristics: {
            sizes,
            colors,
          },
        };

        const createdProduct = await productService.createProduct(payload);

        // Then upload images with the product_id
        if (newImages.length > 0) {
          const files = await Promise.all(
            newImages.map(async (img) => {
              const blob = await fetch(img.url).then((r) => r.blob());
              return new File([blob], `image-${Date.now()}.jpg`, { type: 'image/jpeg' });
            })
          );

          const uploadResponse = await productService.uploadImages(createdProduct.id, files);

          // Update product with uploaded image URLs
          if (uploadResponse.urls && Array.isArray(uploadResponse.urls)) {
            await productService.updateProduct(createdProduct.id, {
              images: uploadResponse.urls,
            });
          }
        }

        toast.success('Товар создан и отправлен на модерацию');
        setShowCreateModal(false);
      }

      loadProducts();
    } catch (error: any) {
      logger.error('Failed to save product', error);
      toast.error(error.message || 'Не удалось сохранить товар');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Confirm delete
   */
  const confirmDelete = async () => {
    if (!selectedProduct) return;

    try {
      await apiRequest(API_ENDPOINTS.PRODUCTS.DELETE(selectedProduct.id), 'DELETE');
      toast.success('Товар успешно удален');
      setShowDeleteDialog(false);
      loadProducts();
    } catch (error: any) {
      logger.error('Failed to delete product', error);
      toast.error(error.message || 'Не удалось удалить товар');
    }
  };

  /**
   * Clear filters
   */
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory(null);
    setSelectedStatus(null);
    setSortBy('date');
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Товары</h1>
            <p className="text-gray-600 mt-1">
              Управление товарами ({totalProducts} всего)
            </p>
          </div>
          <Button onClick={handleCreate} variant="primary" className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Добавить товар
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Поиск товаров..."
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Все категории</option>
              {Array.isArray(categories) && categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus || ''}
              onChange={(e) => setSelectedStatus((e.target.value as ProductStatus) || null)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Все статусы</option>
              <option value="draft">Черновик</option>
              <option value="pending">На модерации</option>
              <option value="approved">Одобрено</option>
              <option value="rejected">Отклонено</option>
            </select>
          </div>

          {/* Sort and Clear */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Сортировка:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'price' | 'name')}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="date">По дате</option>
                <option value="price">По цене</option>
                <option value="name">По названию</option>
              </select>
            </div>
            {(searchTerm || selectedCategory || selectedStatus) && (
              <Button onClick={clearFilters} variant="ghost" size="sm" className="flex items-center gap-1">
                <X className="w-4 h-4" />
                Очистить фильтры
              </Button>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="Товары не найдены"
            message={searchTerm ? 'Попробуйте изменить фильтры' : 'Начните с создания вашего первого товара'}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-100">
                    {product.images && product.images[0] ? (
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
                      <StatusBadge status={product.status} variant={getStatusVariant(product.status)} />
                    </div>
                    {product.images && product.images[0]?.quality && (
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
                        {product.images[0].quality.toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                    <p className="text-lg font-bold text-purple-600 mb-3">
                      {formatNumber(product.price)} ₸
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {product.views || 0} просм.
                      </span>
                      <span>{product.try_ons || 0} примерок</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleEdit(product)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Изменить
                      </Button>
                      <Button
                        onClick={() => handleDelete(product)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        aria-label={`Delete product ${product.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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

        {/* Create Modal */}
        <FormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Создать новый товар"
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isSaving}
          size="lg"
        >
          <div className="space-y-4">
            <FormInput
              label="Название товара"
              {...register('name')}
              error={errors.name?.message}
              placeholder="Например, Летнее платье"
              required
            />

            <FormTextarea
              label="Описание"
              {...register('description')}
              error={errors.description?.message}
              placeholder="Опишите ваш товар..."
              rows={3}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Цена (₸)"
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                error={errors.price?.message}
                placeholder="0.00"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Категория <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('category_id', { valueAsNumber: true })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.category_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Выберите категорию</option>
                  {Array.isArray(categories) && categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
                )}
              </div>
            </div>

            <FormInput
              label="Размеры"
              {...register('sizes')}
              error={errors.sizes?.message}
              placeholder="Например, S, M, L, XL"
              helperText="Список через запятую"
              required
            />

            <FormInput
              label="Цвета"
              {...register('colors')}
              error={errors.colors?.message}
              placeholder="Например, Красный, Синий, Зеленый"
              helperText="Список через запятую"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Изображения товара <span className="text-red-500">*</span>
              </label>
              <ImageUploadMultiple
                value={uploadedImages}
                onChange={setUploadedImages}
                maxFiles={5}
                maxSize={5 * 1024 * 1024}
                helperText="Загрузите до 5 изображений. Первое изображение будет главным."
              />
            </div>
          </div>
        </FormModal>

        {/* Edit Modal */}
        <FormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Редактировать товар"
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isSaving}
          size="lg"
        >
          <div className="space-y-4">
            <FormInput
              label="Название товара"
              {...register('name')}
              error={errors.name?.message}
              required
            />

            <FormTextarea
              label="Описание"
              {...register('description')}
              error={errors.description?.message}
              rows={3}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Цена (₸)"
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                error={errors.price?.message}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Категория <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('category_id', { valueAsNumber: true })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    errors.category_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Выберите категорию</option>
                  {Array.isArray(categories) && categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
                )}
              </div>
            </div>

            <FormInput
              label="Размеры"
              {...register('sizes')}
              error={errors.sizes?.message}
              helperText="Список через запятую"
              required
            />

            <FormInput
              label="Цвета"
              {...register('colors')}
              error={errors.colors?.message}
              helperText="Список через запятую"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Изображения товара
              </label>
              <ImageUploadMultiple
                value={uploadedImages}
                onChange={setUploadedImages}
                maxFiles={5}
                maxSize={5 * 1024 * 1024}
                helperText="Загрузите до 5 изображений. Первое изображение будет главным."
              />
            </div>
          </div>
        </FormModal>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          title="Удалить товар"
          message={`Вы уверены, что хотите удалить "${selectedProduct?.name}"? Это действие нельзя отменить.`}
          confirmText="Удалить"
          variant="danger"
        />
      </div>
    </div>
  );
};

export default ShopProductsPage;
