/**
 * Product Domain Logic Layer
 *
 * This layer handles business logic and orchestration for product operations.
 * Provides testable business logic independent of UI components.
 *
 * @created 2025-11-06 - Phase 2 improvements
 */

import { toast } from '@/shared/components/ui/Toast';
import { logger } from '@/shared/lib/utils/logger';
import { handleError } from '@/shared/lib/utils/error-handler';
import productService, {
  type Product,
  type ProductCreate,
  type ProductUpdate,
  type ProductFilters,
  type ProductListResponse
} from '../services/productService';

/**
 * Result type for domain operations
 */
export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  message?: string;
}

/**
 * Product Operations
 * Contains all business logic for product management
 */
export class ProductOperations {
  /**
   * Create a new product
   *
   * This operation:
   * 1. Validates product data
   * 2. Creates product via service
   * 3. Shows success/error notifications
   * 4. Logs product creation
   *
   * @param data - Product creation data
   * @returns Operation result with created product
   */
  static async createProduct(data: ProductCreate): Promise<OperationResult<Product>> {
    try {
      logger.info('[ProductOperations] Creating product', { productName: data.name });

      // Validate required fields
      const validation = this.validateProductData(data);
      if (!validation.valid) {
        const error = new Error(validation.error);
        toast.error(validation.error);
        return { success: false, error, message: validation.error };
      }

      // Create product
      const product = await productService.createProduct(data);

      toast.success(`Товар "${product.name}" успешно создан`);
      logger.info('[ProductOperations] Product created successfully', {
        productId: product.id,
        productName: product.name
      });

      return {
        success: true,
        data: product,
        message: 'Product created successfully'
      };

    } catch (error) {
      logger.error('[ProductOperations] Failed to create product', error);
      handleError(error, {
        context: {
          operation: 'createProduct',
          productData: data
        }
      });

      return {
        success: false,
        error: error as Error,
        message: 'Failed to create product'
      };
    }
  }

  /**
   * Update an existing product
   *
   * @param productId - ID of product to update
   * @param updates - Product fields to update
   * @returns Operation result with updated product
   */
  static async updateProduct(
    productId: number,
    updates: ProductUpdate
  ): Promise<OperationResult<Product>> {
    try {
      logger.info('[ProductOperations] Updating product', { productId, updates });

      // Validate product ID
      if (!productId || productId <= 0) {
        const error = new Error('Invalid product ID');
        toast.error('Неверный ID товара');
        return { success: false, error, message: 'Invalid product ID' };
      }

      // Validate updates
      if (!updates || Object.keys(updates).length === 0) {
        const error = new Error('No updates provided');
        toast.error('Нет данных для обновления');
        return { success: false, error, message: 'No updates provided' };
      }

      // Validate update data
      if (updates.price !== undefined && updates.price <= 0) {
        const error = new Error('Price must be greater than 0');
        toast.error('Цена должна быть больше 0');
        return { success: false, error, message: 'Invalid price' };
      }

      if (updates.name !== undefined && updates.name.trim().length === 0) {
        const error = new Error('Name cannot be empty');
        toast.error('Название не может быть пустым');
        return { success: false, error, message: 'Invalid name' };
      }

      // Update product
      const product = await productService.updateProduct(productId, updates);

      toast.success(`Товар "${product.name}" успешно обновлен`);
      logger.info('[ProductOperations] Product updated successfully', {
        productId: product.id
      });

      return {
        success: true,
        data: product,
        message: 'Product updated successfully'
      };

    } catch (error) {
      logger.error('[ProductOperations] Failed to update product', error);
      handleError(error, {
        context: {
          operation: 'updateProduct',
          productId,
          updates
        }
      });

      return {
        success: false,
        error: error as Error,
        message: 'Failed to update product'
      };
    }
  }

  /**
   * Delete a product
   *
   * @param productId - ID of product to delete
   * @param productName - Name of product (for confirmation message)
   * @returns Operation result
   */
  static async deleteProduct(
    productId: number,
    productName?: string
  ): Promise<OperationResult<void>> {
    try {
      logger.info('[ProductOperations] Deleting product', { productId, productName });

      if (!productId || productId <= 0) {
        const error = new Error('Invalid product ID');
        toast.error('Неверный ID товара');
        return { success: false, error, message: 'Invalid product ID' };
      }

      await productService.deleteProduct(productId);

      const message = productName
        ? `Товар "${productName}" успешно удален`
        : 'Товар успешно удален';
      toast.success(message);
      logger.info('[ProductOperations] Product deleted successfully', { productId });

      return {
        success: true,
        message: 'Product deleted successfully'
      };

    } catch (error) {
      logger.error('[ProductOperations] Failed to delete product', error);
      handleError(error, {
        context: {
          operation: 'deleteProduct',
          productId
        }
      });

      return {
        success: false,
        error: error as Error,
        message: 'Failed to delete product'
      };
    }
  }

  /**
   * Get products with filters
   *
   * @param filters - Product filters
   * @returns Operation result with product list
   */
  static async getProducts(
    filters?: ProductFilters
  ): Promise<OperationResult<ProductListResponse>> {
    try {
      logger.debug('[ProductOperations] Fetching products', { filters });

      const products = await productService.getProducts(filters);

      logger.debug('[ProductOperations] Products fetched successfully', {
        count: products.products.length,
        total: products.total
      });

      return {
        success: true,
        data: products,
        message: 'Products fetched successfully'
      };

    } catch (error) {
      logger.error('[ProductOperations] Failed to fetch products', error);
      handleError(error, {
        context: {
          operation: 'getProducts',
          filters
        }
      });

      return {
        success: false,
        error: error as Error,
        message: 'Failed to fetch products'
      };
    }
  }

  /**
   * Upload product images
   *
   * @param productId - Product ID
   * @param files - Image files to upload
   * @returns Operation result with image URLs
   */
  static async uploadImages(
    productId: number,
    files: File[]
  ): Promise<OperationResult<{ urls: string[] }>> {
    try {
      logger.info('[ProductOperations] Uploading product images', {
        productId,
        fileCount: files.length
      });

      // Validate inputs
      if (!productId || productId <= 0) {
        const error = new Error('Invalid product ID');
        toast.error('Неверный ID товара');
        return { success: false, error, message: 'Invalid product ID' };
      }

      if (!files || files.length === 0) {
        const error = new Error('No files provided');
        toast.error('Не выбраны файлы для загрузки');
        return { success: false, error, message: 'No files provided' };
      }

      // Validate file types and sizes
      const validation = this.validateImageFiles(files);
      if (!validation.valid) {
        const error = new Error(validation.error);
        toast.error(validation.error);
        return { success: false, error, message: validation.error };
      }

      // Upload images
      const result = await productService.uploadImages(productId, files);

      toast.success(`Загружено изображений: ${result.urls.length}`);
      logger.info('[ProductOperations] Images uploaded successfully', {
        productId,
        uploadedCount: result.urls.length
      });

      return {
        success: true,
        data: result,
        message: 'Images uploaded successfully'
      };

    } catch (error) {
      logger.error('[ProductOperations] Failed to upload images', error);
      handleError(error, {
        context: {
          operation: 'uploadImages',
          productId,
          fileCount: files.length
        }
      });

      return {
        success: false,
        error: error as Error,
        message: 'Failed to upload images'
      };
    }
  }

  /**
   * Toggle product active status
   *
   * @param productId - Product ID
   * @param isActive - New active status
   * @param productName - Product name (for notification)
   * @returns Operation result with updated product
   */
  static async toggleProductStatus(
    productId: number,
    isActive: boolean,
    productName?: string
  ): Promise<OperationResult<Product>> {
    try {
      logger.info('[ProductOperations] Toggling product status', {
        productId,
        isActive
      });

      const product = await productService.updateProduct(productId, { is_active: isActive });

      const statusLabel = isActive ? 'активирован' : 'деактивирован';
      const message = productName
        ? `Товар "${productName}" ${statusLabel}`
        : `Товар ${statusLabel}`;
      toast.success(message);

      logger.info('[ProductOperations] Product status toggled successfully', {
        productId,
        isActive
      });

      return {
        success: true,
        data: product,
        message: 'Product status updated'
      };

    } catch (error) {
      logger.error('[ProductOperations] Failed to toggle product status', error);
      handleError(error, {
        context: {
          operation: 'toggleProductStatus',
          productId,
          isActive
        }
      });

      return {
        success: false,
        error: error as Error,
        message: 'Failed to update product status'
      };
    }
  }

  /**
   * Validate product data before creation
   *
   * @param data - Product data to validate
   * @returns Validation result
   */
  private static validateProductData(data: ProductCreate): {
    valid: boolean;
    error?: string;
  } {
    if (!data.name || data.name.trim().length === 0) {
      return { valid: false, error: 'Название товара обязательно' };
    }

    if (data.name.length > 200) {
      return { valid: false, error: 'Название товара слишком длинное (макс. 200 символов)' };
    }

    if (data.price === undefined || data.price === null) {
      return { valid: false, error: 'Цена товара обязательна' };
    }

    if (data.price <= 0) {
      return { valid: false, error: 'Цена должна быть больше 0' };
    }

    if (data.price > 99999999) {
      return { valid: false, error: 'Цена слишком большая' };
    }

    if (data.description && data.description.length > 5000) {
      return { valid: false, error: 'Описание слишком длинное (макс. 5000 символов)' };
    }

    return { valid: true };
  }

  /**
   * Validate image files
   *
   * @param files - Files to validate
   * @returns Validation result
   */
  private static validateImageFiles(files: File[]): {
    valid: boolean;
    error?: string;
  } {
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_FILES = 10;
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (files.length > MAX_FILES) {
      return {
        valid: false,
        error: `Максимум ${MAX_FILES} изображений за раз`
      };
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return {
          valid: false,
          error: `Файл ${file.name} имеет недопустимый формат. Разрешены: JPEG, PNG, WebP`
        };
      }

      if (file.size > MAX_FILE_SIZE) {
        return {
          valid: false,
          error: `Файл ${file.name} слишком большой (макс. 5MB)`
        };
      }
    }

    return { valid: true };
  }
}

export default ProductOperations;
