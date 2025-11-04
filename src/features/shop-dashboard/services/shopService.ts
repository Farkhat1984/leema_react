/**
 * Shop Service
 * Handles all API calls for shop dashboard, profile, and management
 */

import { apiRequest } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'

// Types
export interface Shop {
  id: number
  google_id?: string
  email: string
  shop_name: string
  owner_name: string
  description?: string | null
  avatar_url?: string | null
  phone?: string | null
  whatsapp_number?: string | null
  is_approved: boolean
  is_active: boolean
  balance: number
  created_at: string
  approval_reason?: string | null
  deactivation_reason?: string | null
}

export interface ShopCreate {
  google_id: string
  email: string
  shop_name: string
  owner_name: string
  description?: string
  avatar_url?: string
  phone?: string
  whatsapp_number?: string
  is_active?: boolean
}

export interface ShopUpdate {
  shop_name?: string
  owner_name?: string
  description?: string
  avatar_url?: string
  phone?: string
  whatsapp_number?: string
  address?: string
}

export interface ShopAnalytics {
  total_products: number
  total_orders: number
  total_revenue: number
  pending_orders: number
  completed_orders: number
  total_views: number
  total_try_ons: number
  conversion_rate: number
  top_products?: TopProduct[]
  revenue_chart?: RevenueDataPoint[]
}

export interface TopProduct {
  product_id: number
  product_name: string
  total_sales: number
  total_revenue: number
  image_url?: string
}

export interface RevenueDataPoint {
  date: string
  revenue: number
  orders: number
}

export interface Transaction {
  id: number
  shop_id: number
  amount: number
  type: string
  status: string
  description?: string
  created_at: string
}

export interface Product {
  id: number
  shop_id: number
  name: string
  description?: string
  price: number
  images?: string[]
  characteristics?: Record<string, any>
  category_id?: number
  moderation_status: string
  is_active: boolean
  views: number
  created_at: string
}

export interface Order {
  id: number
  order_number: string
  user_id: number
  user_name?: string
  user_email?: string
  shop_id: number
  total_amount: number
  status: string
  created_at: string
  items: OrderItem[]
}

export interface OrderItem {
  id: number
  product_id: number
  product_name: string
  product_image?: string
  quantity: number
  price: number
}

/**
 * Shop Service
 * All methods for shop-related API operations
 */
export const shopService = {
  /**
   * Create shop (registration)
   * @param data - Shop creation data
   * @returns Created shop
   */
  createShop: async (data: ShopCreate): Promise<Shop> => {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString())
      }
    })
    return apiRequest<Shop>(API_ENDPOINTS.SHOPS.BASE, 'POST', formData)
  },

  /**
   * Get current shop profile
   * @returns Shop profile data
   */
  getProfile: async (): Promise<Shop> => {
    return apiRequest<Shop>(API_ENDPOINTS.SHOPS.ME)
  },

  /**
   * Update current shop profile
   * @param data - Shop update data
   * @returns Updated shop profile
   */
  updateProfile: async (data: ShopUpdate): Promise<Shop> => {
    return apiRequest<Shop>(API_ENDPOINTS.SHOPS.UPDATE_ME, 'PUT', data)
  },

  /**
   * Delete current shop
   * @returns Success message
   */
  deleteShop: async (): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(API_ENDPOINTS.SHOPS.ME, 'DELETE')
  },

  /**
   * Upload shop avatar
   * @param file - Image file
   * @returns Avatar URL
   */
  uploadAvatar: async (file: File): Promise<{ url: string; message: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    return apiRequest<{ url: string; message: string }>(
      API_ENDPOINTS.SHOPS.UPLOAD_AVATAR,
      'POST',
      formData
    )
  },

  /**
   * Get shop products
   * @returns List of shop products
   */
  getProducts: async (): Promise<Product[]> => {
    return apiRequest<Product[]>(API_ENDPOINTS.SHOPS.PRODUCTS)
  },

  /**
   * Get shop orders
   * @returns List of shop orders
   */
  getOrders: async (): Promise<Order[]> => {
    return apiRequest<Order[]>(API_ENDPOINTS.SHOPS.ORDERS)
  },

  /**
   * Get specific order
   * @param orderId - Order ID
   * @returns Order details
   */
  getOrder: async (orderId: string | number): Promise<Order> => {
    return apiRequest<Order>(API_ENDPOINTS.SHOPS.ORDER_BY_ID(orderId))
  },

  /**
   * Get shop transactions
   * @returns List of transactions
   */
  getTransactions: async (): Promise<Transaction[]> => {
    return apiRequest<Transaction[]>(API_ENDPOINTS.SHOPS.TRANSACTIONS)
  },

  /**
   * Get shop analytics
   * @returns Shop analytics data
   */
  getAnalytics: async (): Promise<ShopAnalytics> => {
    return apiRequest<ShopAnalytics>(API_ENDPOINTS.SHOPS.ANALYTICS)
  },

  /**
   * Get detailed analytics
   * @returns Detailed analytics data
   */
  getDetailedAnalytics: async (): Promise<any> => {
    return apiRequest<any>(API_ENDPOINTS.SHOPS.ANALYTICS_DETAILED)
  },

  /**
   * Export analytics data
   * @param format - Export format (csv, excel, pdf)
   * @returns Export file URL or blob
   */
  exportAnalytics: async (format: 'csv' | 'excel' | 'pdf' = 'excel'): Promise<Blob> => {
    return apiRequest<Blob>(
      API_ENDPOINTS.SHOPS.ANALYTICS_EXPORT,
      'GET',
      null,
      { format },
      { responseType: 'blob' }
    )
  },

  /**
   * Get shop balance
   * @returns Shop balance data
   */
  getBalance: async (): Promise<{
    current_balance: number;
    pending_balance?: number;
    currency?: string;
  }> => {
    // Note: Balance is now part of shop profile
    const shop = await apiRequest<Shop>(API_ENDPOINTS.SHOPS.ME);
    return {
      current_balance: shop.balance || 0,
      pending_balance: 0,
      currency: 'KZT'
    };
  },
}

export default shopService
