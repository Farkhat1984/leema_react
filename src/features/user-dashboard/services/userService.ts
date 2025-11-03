/**
 * User Service
 * Handles all API calls for user dashboard and profile management
 */

import { apiRequest } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'

// Types
export interface User {
  id: number
  email: string
  name: string
  avatar_url?: string | null
  phone?: string | null
  role: string
  balance: number
  free_generations_left: number
  free_try_ons_left: number
  created_at: string
  last_activity?: string | null
}

export interface UserUpdate {
  name?: string
  phone?: string
  avatar_url?: string
}

export interface UserBalance {
  balance: number
  currency: string
  pending_transactions?: number
}

export interface Order {
  id: number
  order_number: string
  shop_id: number
  shop_name: string
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

export interface WardrobeItem {
  id: number
  user_id: number
  product_id: number
  product_name: string
  product_image?: string
  try_on_image_url: string
  created_at: string
}

/**
 * User Service
 * All methods for user-related API operations
 */
export const userService = {
  /**
   * Get current user profile
   * @returns User profile data
   */
  getProfile: async (): Promise<User> => {
    return apiRequest<User>(API_ENDPOINTS.USERS.ME)
  },

  /**
   * Update user profile
   * @param data - User update data
   * @returns Updated user profile
   */
  updateProfile: async (data: UserUpdate): Promise<User> => {
    return apiRequest<User>(API_ENDPOINTS.USERS.UPDATE_ME, 'PUT', data)
  },

  /**
   * Get user balance
   * @returns User balance information
   */
  getBalance: async (): Promise<UserBalance> => {
    return apiRequest<UserBalance>(API_ENDPOINTS.USERS.BALANCE)
  },

  /**
   * Get user orders
   * @returns List of user orders
   */
  getOrders: async (): Promise<Order[]> => {
    return apiRequest<Order[]>(API_ENDPOINTS.USERS.ORDERS)
  },

  /**
   * Get user wardrobe (AI try-on history)
   * @returns List of wardrobe items
   */
  getWardrobe: async (): Promise<WardrobeItem[]> => {
    return apiRequest<WardrobeItem[]>(API_ENDPOINTS.USERS.WARDROBE)
  },
}

export default userService
