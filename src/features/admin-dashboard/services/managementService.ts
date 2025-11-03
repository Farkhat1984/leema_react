/**
 * Management Service
 * Handles all API calls for admin management operations (users, orders, categories, wardrobes)
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
  is_active: boolean
  created_at: string
  last_activity?: string | null
}

export interface Order {
  id: number
  order_number: string
  user_id: number
  user_name?: string
  shop_id: number
  shop_name?: string
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

export interface Category {
  id: number
  name: string
  description?: string | null
  parent_id?: number | null
  icon_url?: string | null
  order: number
  is_active: boolean
  products_count?: number
  created_at: string
}

export interface CategoryCreate {
  name: string
  description?: string
  parent_id?: number
  icon_url?: string
  order?: number
  is_active?: boolean
}

export interface CategoryUpdate {
  name?: string
  description?: string
  parent_id?: number
  icon_url?: string
  order?: number
  is_active?: boolean
}

export interface Wardrobe {
  id: number
  user_id: number
  user_name?: string
  items: WardrobeItem[]
  created_at: string
}

export interface WardrobeItem {
  id: number
  product_id: number
  product_name: string
  product_image?: string
  try_on_image_url: string
  created_at: string
}

export interface UserFilters {
  search?: string
  role?: string
  is_active?: boolean
  has_orders?: boolean
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}

export interface OrderFilters {
  search?: string
  status?: string
  shop_id?: number
  user_id?: number
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}

export interface ShopFilters {
  search?: string
  status?: 'pending' | 'approved' | 'active' | 'rejected' | 'deactivated'
  sort_by?: 'created_at' | 'name' | 'total_products' | 'total_revenue'
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface Shop {
  id: number
  owner_id: number
  owner_name?: string
  owner_email?: string
  name: string
  description: string
  contact_phone: string
  whatsapp_phone?: string
  address: string
  avatar?: string
  status: 'pending' | 'approved' | 'active' | 'rejected' | 'deactivated'
  rejection_reason?: string
  total_products: number
  active_products: number
  total_orders: number
  total_revenue: number
  created_at: string
  updated_at: string
}

export interface ShopsResponse {
  items: Shop[]
  total: number
  pages: number
  page: number
  limit: number
  stats?: {
    total: number
    pending: number
    approved: number
    active: number
    rejected: number
    deactivated: number
  }
}

/**
 * Management Service
 * All methods for management-related API operations
 */
export const managementService = {
  // ==================== USERS ====================

  /**
   * Get all users
   * @param filters - User filters
   * @returns List of users
   */
  getUsers: async (filters?: UserFilters): Promise<User[]> => {
    return apiRequest<User[]>(API_ENDPOINTS.ADMIN.USERS, 'GET', null, filters)
  },

  /**
   * Get user by ID
   * @param id - User ID
   * @returns User details
   */
  getUser: async (id: number): Promise<User> => {
    return apiRequest<User>(API_ENDPOINTS.ADMIN.USER_BY_ID(id))
  },

  /**
   * Delete user
   * @param id - User ID
   * @returns Success message
   */
  deleteUser: async (id: number): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(API_ENDPOINTS.ADMIN.USER_DELETE(id), 'DELETE')
  },

  /**
   * Block user
   * @param id - User ID
   * @param reason - Block reason
   * @returns Success message
   */
  blockUser: async (id: number, reason: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      API_ENDPOINTS.ADMIN.USER_BY_ID(id),
      'PUT',
      { is_active: false, block_reason: reason }
    )
  },

  /**
   * Unblock user
   * @param id - User ID
   * @returns Success message
   */
  unblockUser: async (id: number): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      API_ENDPOINTS.ADMIN.USER_BY_ID(id),
      'PUT',
      { is_active: true }
    )
  },

  // ==================== ORDERS ====================

  /**
   * Get all orders
   * @param filters - Order filters
   * @returns List of orders
   */
  getOrders: async (filters?: OrderFilters): Promise<Order[]> => {
    return apiRequest<Order[]>(API_ENDPOINTS.ADMIN.ORDERS, 'GET', null, filters)
  },

  /**
   * Get order by ID
   * @param id - Order ID
   * @returns Order details
   */
  getOrder: async (id: number): Promise<Order> => {
    return apiRequest<Order>(API_ENDPOINTS.ADMIN.ORDER_BY_ID(id))
  },

  /**
   * Update order status
   * @param id - Order ID
   * @param status - New status
   * @returns Updated order
   */
  updateOrderStatus: async (id: number, status: string): Promise<Order> => {
    return apiRequest<Order>(API_ENDPOINTS.ADMIN.ORDER_UPDATE_STATUS(id), 'PUT', { status })
  },

  /**
   * Cancel order
   * @param id - Order ID
   * @param reason - Cancellation reason
   * @returns Success message
   */
  cancelOrder: async (id: number, reason: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      API_ENDPOINTS.ADMIN.ORDER_UPDATE_STATUS(id),
      'PUT',
      { status: 'cancelled', cancellation_reason: reason }
    )
  },

  // ==================== CATEGORIES ====================

  /**
   * Get all categories
   * @returns List of categories
   */
  getCategories: async (): Promise<Category[]> => {
    return apiRequest<Category[]>(API_ENDPOINTS.CATEGORIES.LIST)
  },

  /**
   * Get category by ID
   * @param id - Category ID
   * @returns Category details
   */
  getCategory: async (id: number): Promise<Category> => {
    return apiRequest<Category>(API_ENDPOINTS.CATEGORIES.BY_ID(id))
  },

  /**
   * Create category
   * @param data - Category data
   * @returns Created category
   */
  createCategory: async (data: CategoryCreate): Promise<Category> => {
    return apiRequest<Category>(API_ENDPOINTS.CATEGORIES.CREATE, 'POST', data)
  },

  /**
   * Update category
   * @param id - Category ID
   * @param data - Category update data
   * @returns Updated category
   */
  updateCategory: async (id: number, data: CategoryUpdate): Promise<Category> => {
    return apiRequest<Category>(API_ENDPOINTS.CATEGORIES.UPDATE(id), 'PUT', data)
  },

  /**
   * Delete category
   * @param id - Category ID
   * @returns Success message
   */
  deleteCategory: async (id: number): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      API_ENDPOINTS.CATEGORIES.DELETE(id),
      'DELETE'
    )
  },

  /**
   * Reorder categories
   * @param categoryIds - Array of category IDs in new order
   * @returns Success message
   */
  reorderCategories: async (categoryIds: number[]): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(API_ENDPOINTS.CATEGORIES.LIST, 'PUT', {
      category_ids: categoryIds,
    })
  },

  // ==================== SHOPS ====================

  /**
   * Get all shops with filters and pagination
   * @param filters - Shop filters
   * @returns Paginated shops response
   */
  getShops: async (filters?: ShopFilters): Promise<ShopsResponse> => {
    return apiRequest<ShopsResponse>(API_ENDPOINTS.ADMIN.SHOPS, 'GET', null, filters)
  },

  // ==================== WARDROBES ====================

  /**
   * Get all wardrobes
   * @returns List of wardrobes
   */
  getWardrobes: async (): Promise<Wardrobe[]> => {
    return apiRequest<Wardrobe[]>(API_ENDPOINTS.ADMIN.WARDROBES)
  },

  /**
   * Get wardrobe statistics
   * @returns Wardrobe stats
   */
  getWardrobeStats: async (): Promise<any> => {
    return apiRequest<any>(API_ENDPOINTS.ADMIN.WARDROBES_STATS)
  },

  /**
   * Get user wardrobe
   * @param userId - User ID
   * @returns User's wardrobe
   */
  getUserWardrobe: async (userId: number): Promise<Wardrobe> => {
    return apiRequest<Wardrobe>(API_ENDPOINTS.ADMIN.WARDROBES_USER(userId))
  },

  /**
   * Delete wardrobe item
   * @param itemId - Wardrobe item ID
   * @returns Success message
   */
  deleteWardrobeItem: async (itemId: number): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      `/api/v1/admin/wardrobes/items/${itemId}`,
      'DELETE'
    )
  },
}

export default managementService
