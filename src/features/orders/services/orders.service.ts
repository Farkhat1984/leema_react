import { apiRequest } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import type {
  Order,
  PaginatedOrders,
  OrderStats,
  OrderStatus,
  UpdateOrderStatusPayload,
} from '../types/order.types'

export interface GetOrdersParams {
  page?: number
  per_page?: number
  search?: string
  status?: OrderStatus
  from?: string // ISO date
  to?: string // ISO date
  sort_by?: 'date' | 'total'
  sort_order?: 'asc' | 'desc'
}

export const ordersService = {
  // Shop endpoints
  async getShopOrders(params: GetOrdersParams = {}): Promise<PaginatedOrders> {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.per_page) queryParams.append('per_page', params.per_page.toString())
    if (params.search) queryParams.append('search', params.search)
    if (params.status) queryParams.append('status', params.status)
    if (params.from) queryParams.append('from', params.from)
    if (params.to) queryParams.append('to', params.to)
    if (params.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params.sort_order) queryParams.append('sort_order', params.sort_order)

    const url = `${API_ENDPOINTS.SHOPS.ORDERS}?${queryParams.toString()}`
    return apiRequest<PaginatedOrders>(url)
  },

  async getShopOrder(id: number): Promise<Order> {
    return apiRequest<Order>(API_ENDPOINTS.SHOPS.ORDER_BY_ID(id))
  },

  async getShopOrderStats(): Promise<OrderStats> {
    return apiRequest<OrderStats>(`${API_ENDPOINTS.SHOPS.ORDERS}/stats`)
  },

  // Admin endpoints
  async getAdminOrders(params: GetOrdersParams = {}): Promise<PaginatedOrders> {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.per_page) queryParams.append('per_page', params.per_page.toString())
    if (params.search) queryParams.append('search', params.search)
    if (params.status) queryParams.append('status', params.status)
    if (params.from) queryParams.append('from', params.from)
    if (params.to) queryParams.append('to', params.to)
    if (params.sort_by) queryParams.append('sort_by', params.sort_by)
    if (params.sort_order) queryParams.append('sort_order', params.sort_order)

    const url = `${API_ENDPOINTS.ADMIN.ORDERS}?${queryParams.toString()}`
    return apiRequest<PaginatedOrders>(url)
  },

  async getAdminOrder(id: number): Promise<Order> {
    return apiRequest<Order>(API_ENDPOINTS.ADMIN.ORDER_BY_ID(id))
  },

  async updateOrderStatus(id: number, payload: UpdateOrderStatusPayload): Promise<Order> {
    return apiRequest<Order>(API_ENDPOINTS.ADMIN.ORDER_UPDATE_STATUS(id), 'PUT', payload)
  },

  // Helper methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  },

  formatOrderNumber(orderNumber: string): string {
    return `#${orderNumber}`
  },
}
