/**
 * Moderation Service
 * Handles all API calls for admin moderation operations (products, shops, newsletters, refunds, reviews)
 */

import { apiRequest } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'

// Types
export interface Product {
  id: number
  shop_id: number
  shop_name?: string
  name: string
  description?: string
  price: number
  images?: string[]
  characteristics?: Record<string, any>
  category_id?: number
  moderation_status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string | null
  is_active: boolean
  views: number
  created_at: string
}

export interface Shop {
  id: number
  shop_name: string
  owner_name: string
  email: string
  phone?: string
  description?: string
  avatar_url?: string
  is_approved: boolean
  is_active: boolean
  balance: number
  products_count: number
  created_at: string
  approval_reason?: string | null
  deactivation_reason?: string | null
}

export interface Newsletter {
  id: number
  shop_id: number
  shop_name?: string
  subject: string
  content: string
  image_url?: string
  target_audience: string
  recipients_count: number
  status: 'pending' | 'approved' | 'rejected' | 'sent'
  rejection_reason?: string | null
  created_at: string
  sent_at?: string | null
}

export interface Refund {
  id: number
  order_id: number
  user_id: number
  user_name?: string
  shop_id: number
  shop_name?: string
  amount: number
  reason: string
  status: 'requested' | 'approved' | 'rejected' | 'completed'
  rejection_reason?: string | null
  images?: string[]
  created_at: string
  processed_at?: string | null
}

export interface Review {
  id: number
  user_id: number
  user_name: string
  product_id: number
  product_name?: string
  shop_id: number
  rating: number
  comment?: string
  images?: string[]
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string | null
  created_at: string
}

/**
 * Moderation Service
 * All methods for moderation-related API operations
 */
export const moderationService = {
  // ==================== PRODUCTS ====================

  /**
   * Get products for moderation
   * @param status - Filter by moderation status
   * @returns List of products
   */
  getProducts: async (status?: 'pending' | 'approved' | 'rejected'): Promise<Product[]> => {
    return apiRequest<Product[]>(API_ENDPOINTS.ADMIN.PRODUCTS, 'GET', null, { status })
  },

  /**
   * Get all products (admin view)
   * @returns List of all products
   */
  getAllProducts: async (): Promise<Product[]> => {
    return apiRequest<Product[]>(API_ENDPOINTS.ADMIN.PRODUCTS_ALL)
  },

  /**
   * Get product statistics
   * @returns Product stats
   */
  getProductStats: async (): Promise<any> => {
    return apiRequest<any>(API_ENDPOINTS.ADMIN.PRODUCTS_STATS)
  },

  /**
   * Approve product
   * @param id - Product ID
   * @returns Success message
   */
  approveProduct: async (id: number): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      API_ENDPOINTS.ADMIN.APPROVE_PRODUCT(id),
      'POST',
      {} // Empty body required by backend
    )
  },

  /**
   * Reject product
   * @param id - Product ID
   * @param reason - Rejection reason
   * @returns Success message
   */
  rejectProduct: async (id: number, reason: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      API_ENDPOINTS.ADMIN.REJECT_PRODUCT(id),
      'POST',
      { notes: reason } // Backend expects 'notes' field, not 'reason'
    )
  },

  /**
   * Bulk action on products
   * @param productIds - Array of product IDs
   * @param action - Action to perform (approve, reject)
   * @param reason - Rejection reason (for reject action)
   * @returns Success message
   */
  bulkProductAction: async (
    productIds: number[],
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      API_ENDPOINTS.ADMIN.PRODUCTS_BULK_ACTION,
      'POST',
      { product_ids: productIds, action, notes: reason } // Backend expects 'notes' field
    )
  },

  // ==================== SHOPS ====================

  /**
   * Get shops for moderation
   * @param status - Filter by status
   * @returns List of shops
   */
  getShops: async (
    status?: 'pending' | 'approved' | 'active' | 'deactivated'
  ): Promise<Shop[]> => {
    return apiRequest<Shop[]>(API_ENDPOINTS.ADMIN.SHOPS, 'GET', null, { status })
  },

  /**
   * Get all shops (admin view)
   * @returns List of all shops
   */
  getAllShops: async (): Promise<Shop[]> => {
    return apiRequest<Shop[]>(API_ENDPOINTS.ADMIN.SHOPS_ALL)
  },

  /**
   * Get shop by ID
   * @param id - Shop ID
   * @returns Shop details
   */
  getShop: async (id: number): Promise<Shop> => {
    return apiRequest<Shop>(API_ENDPOINTS.ADMIN.SHOP_BY_ID(id))
  },

  /**
   * Approve shop
   * @param id - Shop ID
   * @param notes - Optional approval notes
   * @returns Success message
   */
  approveShop: async (id: number, notes?: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      API_ENDPOINTS.ADMIN.SHOP_APPROVE(id),
      'POST',
      { notes: notes || 'Магазин одобрен администратором' }
    )
  },

  /**
   * Reject shop
   * @param id - Shop ID
   * @param reason - Rejection reason
   * @returns Success message
   */
  rejectShop: async (id: number, reason: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      API_ENDPOINTS.ADMIN.SHOP_REJECT(id),
      'POST',
      { reason }
    )
  },

  /**
   * Activate shop
   * @param id - Shop ID
   * @returns Success message
   */
  activateShop: async (id: number): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(API_ENDPOINTS.ADMIN.SHOP_ACTIVATE(id), 'POST')
  },

  /**
   * Deactivate shop
   * @param id - Shop ID
   * @param reason - Deactivation reason
   * @returns Success message
   */
  deactivateShop: async (id: number, reason: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      API_ENDPOINTS.ADMIN.SHOP_DEACTIVATE(id),
      'POST',
      { reason }
    )
  },

  /**
   * Bulk action on shops
   * @param shopIds - Array of shop IDs
   * @param action - Action to perform
   * @param reason - Reason (for reject/deactivate)
   * @returns Success message
   */
  bulkShopAction: async (
    shopIds: number[],
    action: 'approve' | 'reject' | 'activate' | 'deactivate',
    reason?: string
  ): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      API_ENDPOINTS.ADMIN.SHOPS_BULK_ACTION,
      'POST',
      { shop_ids: shopIds, action, reason }
    )
  },

  // ==================== NEWSLETTERS ====================

  /**
   * Get newsletters for moderation
   * @param status - Filter by status
   * @returns List of newsletters
   */
  getNewsletters: async (
    status?: 'pending' | 'approved' | 'rejected' | 'sent'
  ): Promise<Newsletter[]> => {
    return apiRequest<Newsletter[]>(API_ENDPOINTS.ADMIN.NEWSLETTERS, 'GET', null, { status })
  },

  /**
   * Get newsletter by ID
   * @param id - Newsletter ID
   * @returns Newsletter details
   */
  getNewsletter: async (id: number): Promise<Newsletter> => {
    return apiRequest<Newsletter>(API_ENDPOINTS.ADMIN.NEWSLETTER_BY_ID(id))
  },

  /**
   * Approve newsletter
   * @param id - Newsletter ID
   * @returns Success message
   */
  approveNewsletter: async (id: number): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      API_ENDPOINTS.ADMIN.NEWSLETTER_APPROVE(id),
      'POST'
    )
  },

  /**
   * Reject newsletter
   * @param id - Newsletter ID
   * @param reason - Rejection reason
   * @returns Success message
   */
  rejectNewsletter: async (id: number, reason: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      API_ENDPOINTS.ADMIN.NEWSLETTER_REJECT(id),
      'POST',
      { reason }
    )
  },

  /**
   * Get newsletter statistics
   * @returns Newsletter stats
   */
  getNewsletterStats: async (): Promise<any> => {
    return apiRequest<any>(API_ENDPOINTS.ADMIN.NEWSLETTER_STATS)
  },

  // ==================== REFUNDS ====================

  /**
   * Get refunds for moderation
   * @param status - Filter by status
   * @returns List of refunds
   */
  getRefunds: async (
    status?: 'requested' | 'approved' | 'rejected' | 'completed'
  ): Promise<Refund[]> => {
    return apiRequest<Refund[]>(API_ENDPOINTS.ADMIN.REFUNDS, 'GET', null, { status })
  },

  /**
   * Get refund by ID
   * @param id - Refund ID
   * @returns Refund details
   */
  getRefund: async (id: number): Promise<Refund> => {
    return apiRequest<Refund>(API_ENDPOINTS.ADMIN.REFUND_BY_ID(id))
  },

  /**
   * Approve refund
   * @param id - Refund ID
   * @returns Success message
   */
  approveRefund: async (id: number): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      API_ENDPOINTS.ADMIN.REFUND_APPROVE(id),
      'POST'
    )
  },

  /**
   * Reject refund
   * @param id - Refund ID
   * @param reason - Rejection reason
   * @returns Success message
   */
  rejectRefund: async (id: number, reason: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      API_ENDPOINTS.ADMIN.REFUND_REJECT(id),
      'POST',
      { reason }
    )
  },

  /**
   * Process refund
   * @param id - Refund ID
   * @returns Success message
   */
  processRefund: async (id: number): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      API_ENDPOINTS.ADMIN.REFUND_PROCESS(id),
      'POST'
    )
  },

  // ==================== REVIEWS ====================

  /**
   * Get reviews for moderation
   * @param status - Filter by status
   * @returns List of reviews
   */
  getReviews: async (status?: 'pending' | 'approved' | 'rejected'): Promise<Review[]> => {
    return apiRequest<Review[]>(API_ENDPOINTS.REVIEWS.LIST, 'GET', null, { status })
  },

  /**
   * Moderate review
   * @param id - Review ID
   * @param action - Moderation action (approve, reject)
   * @param reason - Rejection reason (for reject action)
   * @returns Success message
   */
  moderateReview: async (
    id: number,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      API_ENDPOINTS.REVIEWS.MODERATE(id),
      'POST',
      { action, reason }
    )
  },

  /**
   * Delete review
   * @param id - Review ID
   * @returns Success message
   */
  deleteReview: async (id: number): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(API_ENDPOINTS.REVIEWS.DELETE(id), 'DELETE')
  },

  // ==================== MODERATION QUEUE ====================

  /**
   * Get moderation queue
   * @returns Moderation queue items
   */
  getModerationQueue: async (): Promise<any> => {
    return apiRequest<any>(API_ENDPOINTS.ADMIN.MODERATION_QUEUE)
  },
}

export default moderationService
