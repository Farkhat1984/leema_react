/**
 * Shop Domain Logic Layer
 *
 * This layer handles business logic and orchestration for shop operations.
 * Provides testable business logic independent of UI components.
 *
 * @created 2025-11-06 - Phase 2 improvements
 */

import { toast } from '@/shared/components/ui/Toast';
import { logger } from '@/shared/lib/utils/logger';
import { handleError } from '@/shared/lib/utils/error-handler';
import shopService, {
  type Shop,
  type ShopCreate,
  type ShopUpdate,
  type ShopAnalytics
} from '../services/shopService';

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
 * Shop Operations
 * Contains all business logic for shop management
 */
export class ShopOperations {
  /**
   * Create a new shop (registration)
   *
   * This operation:
   * 1. Validates shop data
   * 2. Creates shop via service
   * 3. Shows success/error notifications
   * 4. Logs shop creation
   *
   * @param data - Shop creation data
   * @returns Operation result with created shop
   */
  static async createShop(data: ShopCreate): Promise<OperationResult<Shop>> {
    try {
      logger.info('[ShopOperations] Creating shop', { shopName: data.shop_name });

      // Validate required fields
      const validation = this.validateShopData(data);
      if (!validation.valid) {
        const error = new Error(validation.error);
        toast.error(validation.error);
        return { success: false, error, message: validation.error };
      }

      // Create shop
      const shop = await shopService.createShop(data);

      toast.success(
        'Магазин успешно зарегистрирован! Ожидайте подтверждения администратора.',
        { duration: 6000 }
      );
      logger.info('[ShopOperations] Shop created successfully', {
        shopId: shop.id,
        shopName: shop.shop_name,
        isApproved: shop.is_approved
      });

      return {
        success: true,
        data: shop,
        message: 'Shop created successfully'
      };

    } catch (error) {
      logger.error('[ShopOperations] Failed to create shop', error);
      handleError(error, {
        context: {
          operation: 'createShop',
          shopData: data
        }
      });

      return {
        success: false,
        error: error as Error,
        message: 'Failed to create shop'
      };
    }
  }

  /**
   * Update shop profile
   *
   * @param updates - Shop fields to update
   * @returns Operation result with updated shop
   */
  static async updateProfile(updates: ShopUpdate): Promise<OperationResult<Shop>> {
    try {
      logger.info('[ShopOperations] Updating shop profile', { updates });

      // Validate updates
      if (!updates || Object.keys(updates).length === 0) {
        const error = new Error('No updates provided');
        toast.error('Нет данных для обновления');
        return { success: false, error, message: 'No updates provided' };
      }

      // Validate specific fields
      if (updates.shop_name !== undefined && updates.shop_name.trim().length === 0) {
        const error = new Error('Shop name cannot be empty');
        toast.error('Название магазина не может быть пустым');
        return { success: false, error, message: 'Invalid shop name' };
      }

      if (updates.phone !== undefined) {
        const phoneValidation = this.validatePhone(updates.phone);
        if (!phoneValidation.valid) {
          const error = new Error(phoneValidation.error);
          toast.error(phoneValidation.error);
          return { success: false, error, message: phoneValidation.error };
        }
      }

      if (updates.whatsapp_number !== undefined) {
        const whatsappValidation = this.validatePhone(updates.whatsapp_number);
        if (!whatsappValidation.valid) {
          const error = new Error(whatsappValidation.error);
          toast.error(whatsappValidation.error);
          return { success: false, error, message: whatsappValidation.error };
        }
      }

      // Update shop
      const shop = await shopService.updateProfile(updates);

      toast.success('Профиль магазина успешно обновлен');
      logger.info('[ShopOperations] Shop profile updated successfully', {
        shopId: shop.id
      });

      return {
        success: true,
        data: shop,
        message: 'Shop profile updated successfully'
      };

    } catch (error) {
      logger.error('[ShopOperations] Failed to update shop profile', error);
      handleError(error, {
        context: {
          operation: 'updateProfile',
          updates
        }
      });

      return {
        success: false,
        error: error as Error,
        message: 'Failed to update shop profile'
      };
    }
  }

  /**
   * Upload shop avatar
   *
   * @param file - Image file
   * @returns Operation result with avatar URL
   */
  static async uploadAvatar(file: File): Promise<OperationResult<{ url: string }>> {
    try {
      logger.info('[ShopOperations] Uploading shop avatar', {
        fileName: file.name,
        fileSize: file.size
      });

      // Validate file
      const validation = this.validateAvatarFile(file);
      if (!validation.valid) {
        const error = new Error(validation.error);
        toast.error(validation.error);
        return { success: false, error, message: validation.error };
      }

      // Upload avatar
      const result = await shopService.uploadAvatar(file);

      toast.success('Аватар успешно загружен');
      logger.info('[ShopOperations] Avatar uploaded successfully', {
        url: result.url
      });

      return {
        success: true,
        data: { url: result.url },
        message: 'Avatar uploaded successfully'
      };

    } catch (error) {
      logger.error('[ShopOperations] Failed to upload avatar', error);
      handleError(error, {
        context: {
          operation: 'uploadAvatar',
          fileName: file.name
        }
      });

      return {
        success: false,
        error: error as Error,
        message: 'Failed to upload avatar'
      };
    }
  }

  /**
   * Get shop analytics
   *
   * @returns Operation result with analytics data
   */
  static async getAnalytics(): Promise<OperationResult<ShopAnalytics>> {
    try {
      logger.debug('[ShopOperations] Fetching shop analytics');

      const analytics = await shopService.getAnalytics();

      logger.debug('[ShopOperations] Analytics fetched successfully', {
        totalProducts: analytics.total_products,
        totalOrders: analytics.total_orders,
        totalRevenue: analytics.total_revenue
      });

      return {
        success: true,
        data: analytics,
        message: 'Analytics fetched successfully'
      };

    } catch (error) {
      logger.error('[ShopOperations] Failed to fetch analytics', error);
      handleError(error, {
        context: {
          operation: 'getAnalytics'
        }
      });

      return {
        success: false,
        error: error as Error,
        message: 'Failed to fetch analytics'
      };
    }
  }

  /**
   * Export analytics data
   *
   * @param format - Export format
   * @returns Operation result with blob
   */
  static async exportAnalytics(
    format: 'csv' | 'excel' | 'pdf' = 'excel'
  ): Promise<OperationResult<Blob>> {
    try {
      logger.info('[ShopOperations] Exporting analytics', { format });

      const blob = await shopService.exportAnalytics(format);

      toast.success(`Аналитика экспортирована (${format.toUpperCase()})`);
      logger.info('[ShopOperations] Analytics exported successfully', { format });

      return {
        success: true,
        data: blob,
        message: 'Analytics exported successfully'
      };

    } catch (error) {
      logger.error('[ShopOperations] Failed to export analytics', error);
      handleError(error, {
        context: {
          operation: 'exportAnalytics',
          format
        }
      });

      return {
        success: false,
        error: error as Error,
        message: 'Failed to export analytics'
      };
    }
  }

  /**
   * Delete shop
   *
   * @returns Operation result
   */
  static async deleteShop(): Promise<OperationResult<void>> {
    try {
      logger.info('[ShopOperations] Deleting shop');

      await shopService.deleteShop();

      toast.success('Магазин успешно удален');
      logger.info('[ShopOperations] Shop deleted successfully');

      return {
        success: true,
        message: 'Shop deleted successfully'
      };

    } catch (error) {
      logger.error('[ShopOperations] Failed to delete shop', error);
      handleError(error, {
        context: {
          operation: 'deleteShop'
        }
      });

      return {
        success: false,
        error: error as Error,
        message: 'Failed to delete shop'
      };
    }
  }

  /**
   * Validate shop creation data
   *
   * @param data - Shop data to validate
   * @returns Validation result
   */
  private static validateShopData(data: ShopCreate): {
    valid: boolean;
    error?: string;
  } {
    if (!data.shop_name || data.shop_name.trim().length === 0) {
      return { valid: false, error: 'Название магазина обязательно' };
    }

    if (data.shop_name.length < 2) {
      return { valid: false, error: 'Название магазина слишком короткое (мин. 2 символа)' };
    }

    if (data.shop_name.length > 100) {
      return { valid: false, error: 'Название магазина слишком длинное (макс. 100 символов)' };
    }

    if (!data.owner_name || data.owner_name.trim().length === 0) {
      return { valid: false, error: 'Имя владельца обязательно' };
    }

    if (data.owner_name.length < 2) {
      return { valid: false, error: 'Имя владельца слишком короткое (мин. 2 символа)' };
    }

    if (data.owner_name.length > 100) {
      return { valid: false, error: 'Имя владельца слишком длинное (макс. 100 символов)' };
    }

    if (!data.email || data.email.trim().length === 0) {
      return { valid: false, error: 'Email обязателен' };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return { valid: false, error: 'Некорректный формат email' };
    }

    if (data.phone) {
      const phoneValidation = this.validatePhone(data.phone);
      if (!phoneValidation.valid) {
        return phoneValidation;
      }
    }

    if (data.whatsapp_number) {
      const whatsappValidation = this.validatePhone(data.whatsapp_number);
      if (!whatsappValidation.valid) {
        return { valid: false, error: `WhatsApp: ${whatsappValidation.error}` };
      }
    }

    if (data.description && data.description.length > 1000) {
      return { valid: false, error: 'Описание слишком длинное (макс. 1000 символов)' };
    }

    return { valid: true };
  }

  /**
   * Validate phone number
   *
   * @param phone - Phone number to validate
   * @returns Validation result
   */
  private static validatePhone(phone: string): {
    valid: boolean;
    error?: string;
  } {
    if (!phone || phone.trim().length === 0) {
      return { valid: true }; // Optional field
    }

    // Remove spaces, dashes, parentheses
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Kazakhstan format: +7XXXXXXXXXX or 8XXXXXXXXXX
    const phoneRegex = /^(\+7|8|7)\d{10}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return {
        valid: false,
        error: 'Неверный формат телефона. Используйте: +7XXXXXXXXXX'
      };
    }

    return { valid: true };
  }

  /**
   * Validate avatar file
   *
   * @param file - File to validate
   * @returns Validation result
   */
  private static validateAvatarFile(file: File): {
    valid: boolean;
    error?: string;
  } {
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Недопустимый формат изображения. Разрешены: JPEG, PNG, WebP'
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'Файл слишком большой (макс. 2MB)'
      };
    }

    return { valid: true };
  }

  /**
   * Calculate shop health score
   *
   * This is a business metric based on various factors
   *
   * @param analytics - Shop analytics data
   * @returns Health score (0-100)
   */
  static calculateHealthScore(analytics: ShopAnalytics): number {
    let score = 0;

    // Active products (30 points max)
    if (analytics.total_products > 0) {
      score += Math.min(30, analytics.total_products * 3);
    }

    // Orders (30 points max)
    if (analytics.total_orders > 0) {
      score += Math.min(30, analytics.total_orders * 2);
    }

    // Conversion rate (20 points max)
    if (analytics.conversion_rate > 0) {
      score += Math.min(20, analytics.conversion_rate * 20);
    }

    // Revenue (20 points max)
    if (analytics.total_revenue > 0) {
      score += Math.min(20, (analytics.total_revenue / 100000) * 10);
    }

    return Math.min(100, Math.round(score));
  }
}

export default ShopOperations;
