/**
 * Product Service
 * Handles all API calls for product management and catalog
 */

import { apiRequest } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'

// Types
export interface Product {
  id: number
  shop_id: number
  shop_name?: string
  name: string
  description?: string | null
  price: number
  images?: string[]
  characteristics?: Record<string, any>
  category_id?: number | null
  category_name?: string
  moderation_status: 'pending' | 'approved' | 'rejected'
  is_active: boolean
  views: number
  created_at: string
  updated_at?: string
  rejection_reason?: string | null
}

export interface ProductCreate {
  name: string
  description?: string
  price: number
  characteristics?: Record<string, any>
  category_id?: number
  images?: string[]
}

export interface ProductUpdate {
  name?: string
  description?: string
  price?: number
  characteristics?: Record<string, any>
  category_id?: number
  images?: string[]
  is_active?: boolean
}

export interface ProductFilters {
  search?: string
  category_id?: number
  min_price?: number
  max_price?: number
  shop_id?: number
  moderation_status?: 'pending' | 'approved' | 'rejected'
  is_active?: boolean
  page?: number
  per_page?: number  // Changed from limit to per_page to match backend API
  limit?: number  // Deprecated - use per_page instead
  status?: string  // Added for user catalog approved products filter
  sort_by?: 'price' | 'created_at' | 'views' | 'name'
  sort_order?: 'asc' | 'desc'
}

export interface Review {
  id: number
  user_id: number
  user_name: string
  user_avatar?: string
  product_id: number
  rating: number
  comment?: string
  images?: string[]
  created_at: string
  shop_reply?: string
  shop_reply_at?: string
}

export interface ProductListResponse {
  products: Product[]  // Changed from items to products to match backend
  total: number
  page: number
  per_page: number  // Changed from limit to per_page
  total_pages: number  // Changed from pages to total_pages
}

export interface Category {
  id: number
  name: string
  description?: string
  created_at: string
}

/**
 * Product Service
 * All methods for product-related API operations
 */
export const productService = {
  /**
   * List products with filters
   * @param filters - Product filters
   * @returns Paginated list of products
   */
  getProducts: async (filters?: ProductFilters): Promise<ProductListResponse> => {
    return apiRequest<ProductListResponse>(API_ENDPOINTS.PRODUCTS.BASE, 'GET', null, filters)
  },

  /**
   * Create product
   * @param data - Product creation data
   * @returns Created product
   */
  createProduct: async (data: ProductCreate): Promise<Product> => {
    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('price', data.price.toString())

    if (data.description) {
      formData.append('description', data.description)
    }
    if (data.category_id) {
      formData.append('category_id', data.category_id.toString())
    }
    if (data.characteristics) {
      formData.append('characteristics', JSON.stringify(data.characteristics))
    }
    if (data.images && data.images.length > 0) {
      formData.append('image_urls', JSON.stringify(data.images))
    }

    return apiRequest<Product>(API_ENDPOINTS.PRODUCTS.CREATE, 'POST', formData)
  },

  /**
   * Get product by ID
   * @param id - Product ID
   * @returns Product details
   */
  getProduct: async (id: number): Promise<Product> => {
    return apiRequest<Product>(API_ENDPOINTS.PRODUCTS.BY_ID(id))
  },

  /**
   * Update product
   * @param id - Product ID
   * @param data - Product update data
   * @returns Updated product
   */
  updateProduct: async (id: number, data: ProductUpdate): Promise<Product> => {
    return apiRequest<Product>(API_ENDPOINTS.PRODUCTS.UPDATE(id), 'PUT', data)
  },

  /**
   * Delete product
   * @param id - Product ID
   * @returns Success message
   */
  deleteProduct: async (id: number): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(API_ENDPOINTS.PRODUCTS.DELETE(id), 'DELETE')
  },

  /**
   * Upload product images
   * @param files - Image files
   * @returns Array of uploaded image URLs
   */
  uploadImages: async (files: File[]): Promise<{ urls: string[] }> => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('files', file)
    })
    return apiRequest<{ urls: string[] }>(
      API_ENDPOINTS.PRODUCTS.UPLOAD_IMAGES,
      'POST',
      formData
    )
  },

  /**
   * Search products
   * @param query - Search query
   * @param filters - Additional filters
   * @returns List of matching products
   */
  searchProducts: async (query: string, filters?: ProductFilters): Promise<Product[]> => {
    return apiRequest<Product[]>(
      API_ENDPOINTS.PRODUCTS.BASE,
      'GET',
      null,
      { search: query, ...filters }
    )
  },

  /**
   * Get products by category
   * @param categoryId - Category ID
   * @param filters - Additional filters
   * @returns List of products in category
   */
  getProductsByCategory: async (
    categoryId: number,
    filters?: ProductFilters
  ): Promise<Product[]> => {
    return apiRequest<Product[]>(
      API_ENDPOINTS.PRODUCTS.BY_CATEGORY(categoryId),
      'GET',
      null,
      filters
    )
  },

  /**
   * Get product reviews
   * @param productId - Product ID
   * @returns List of product reviews
   */
  getReviews: async (productId: number): Promise<Review[]> => {
    return apiRequest<Review[]>(API_ENDPOINTS.REVIEWS.BY_PRODUCT(productId))
  },

  /**
   * Create product review
   * @param productId - Product ID
   * @param data - Review data
   * @returns Created review
   */
  createReview: async (
    productId: number,
    data: { rating: number; comment?: string; images?: string[] }
  ): Promise<Review> => {
    return apiRequest<Review>(API_ENDPOINTS.REVIEWS.CREATE, 'POST', {
      product_id: productId,
      ...data,
    })
  },

  /**
   * Get all categories
   * @returns List of categories
   */
  getCategories: async (): Promise<Category[]> => {
    return apiRequest<Category[]>(API_ENDPOINTS.CATEGORIES.LIST)
  },
}

export default productService
