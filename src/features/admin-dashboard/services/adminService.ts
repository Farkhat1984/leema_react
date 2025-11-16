/**
 * Admin Service
 * Handles all API calls for admin dashboard, settings, logs, analytics, and reports
 */

import { apiRequest } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'

// Types
export interface AdminDashboard {
  total_users: number
  total_shops: number
  total_products: number
  active_products: number
  total_generations: number
  total_revenue: number
  pending_moderation: number
  pending_refunds: number
  total_user_balances: number
  total_shop_balances: number
}

export interface PlatformSettings {
  [key: string]: unknown
  commission_rate?: number
  min_order_amount?: number
  platform_name?: string
  support_email?: string
  support_phone?: string
}

export interface SystemLog {
  id: number
  level: 'info' | 'warning' | 'error' | 'critical'
  message: string
  user_id?: number
  shop_id?: number
  ip_address?: string
  user_agent?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface Analytics {
  users_analytics: {
    total_users: number
    active_users: number
    new_users_today: number
    new_users_this_week: number
    new_users_this_month: number
  }
  shops_analytics: {
    total_shops: number
    active_shops: number
    pending_shops: number
    new_shops_today: number
  }
  products_analytics: {
    total_products: number
    active_products: number
    pending_products: number
    rejected_products: number
  }
  orders_analytics: {
    total_orders: number
    completed_orders: number
    pending_orders: number
    cancelled_orders: number
  }
  revenue_analytics: {
    total_revenue: number
    revenue_today: number
    revenue_this_week: number
    revenue_this_month: number
  }
}

export interface Report {
  id: string
  type: 'financial' | 'sales' | 'users' | 'products'
  title: string
  period: string
  data: Record<string, unknown>
  generated_at: string
}

export interface LogFilters {
  level?: 'info' | 'warning' | 'error' | 'critical'
  user_id?: number
  shop_id?: number
  start_date?: string
  end_date?: string
  search?: string
  page?: number
  limit?: number
}

/**
 * Admin Service
 * All methods for admin-related API operations
 */
export const adminService = {
  /**
   * Get admin dashboard statistics
   * @returns Dashboard data
   */
  getDashboard: async (): Promise<AdminDashboard> => {
    return apiRequest<AdminDashboard>(API_ENDPOINTS.ADMIN.DASHBOARD)
  },

  /**
   * Get platform settings
   * @returns Platform settings
   */
  getSettings: async (): Promise<PlatformSettings> => {
    return apiRequest<PlatformSettings>(API_ENDPOINTS.ADMIN.SETTINGS)
  },

  /**
   * Get specific setting by key
   * @param key - Setting key
   * @returns Setting value
   */
  getSetting: async (key: string): Promise<unknown> => {
    return apiRequest<unknown>(API_ENDPOINTS.ADMIN.SETTING_BY_KEY(key))
  },

  /**
   * Update setting
   * @param key - Setting key
   * @param value - Setting value
   * @returns Updated setting
   */
  updateSetting: async (key: string, value: unknown): Promise<unknown> => {
    return apiRequest<unknown>(API_ENDPOINTS.ADMIN.SETTING_UPDATE(key), 'PUT', { value })
  },

  /**
   * Delete setting
   * @param key - Setting key
   * @returns Success message
   */
  deleteSetting: async (key: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      API_ENDPOINTS.ADMIN.SETTING_DELETE(key),
      'DELETE'
    )
  },

  /**
   * Get system logs
   * @param filters - Log filters
   * @returns List of system logs
   */
  getLogs: async (filters?: LogFilters): Promise<SystemLog[]> => {
    return apiRequest<SystemLog[]>(API_ENDPOINTS.ADMIN.LOGS, 'GET', null, filters)
  },

  /**
   * Get activity logs
   * @param filters - Log filters
   * @returns List of activity logs
   */
  getActivityLogs: async (filters?: LogFilters): Promise<SystemLog[]> => {
    return apiRequest<SystemLog[]>(
      API_ENDPOINTS.ADMIN.LOGS_ACTIVITY,
      'GET',
      null,
      filters
    )
  },

  /**
   * Get error logs
   * @param filters - Log filters
   * @returns List of error logs
   */
  getErrorLogs: async (filters?: LogFilters): Promise<SystemLog[]> => {
    return apiRequest<SystemLog[]>(API_ENDPOINTS.ADMIN.LOGS_ERRORS, 'GET', null, filters)
  },

  /**
   * Export logs
   * @param filters - Log filters
   * @param format - Export format (csv, excel)
   * @returns Export file blob
   */
  exportLogs: async (
    filters?: LogFilters,
    format: 'csv' | 'excel' = 'excel'
  ): Promise<Blob> => {
    return apiRequest<Blob>(
      API_ENDPOINTS.ADMIN.LOGS_EXPORT,
      'GET',
      null,
      { ...filters, format },
      { responseType: 'blob' }
    )
  },

  /**
   * Get platform analytics
   * @returns Analytics data
   */
  getAnalytics: async (): Promise<Analytics> => {
    try {
      return await apiRequest<Analytics>(API_ENDPOINTS.ADMIN.ANALYTICS)
    } catch {
      // Return default analytics if endpoint doesn't exist yet
      return {
        users_analytics: {
          total_users: 0,
          active_users: 0,
          new_users_today: 0,
          new_users_this_week: 0,
          new_users_this_month: 0,
        },
        shops_analytics: {
          total_shops: 0,
          active_shops: 0,
          pending_shops: 0,
          new_shops_today: 0,
        },
        products_analytics: {
          total_products: 0,
          active_products: 0,
          pending_products: 0,
          rejected_products: 0,
        },
        orders_analytics: {
          total_orders: 0,
          completed_orders: 0,
          pending_orders: 0,
          cancelled_orders: 0,
        },
        revenue_analytics: {
          total_revenue: 0,
          revenue_today: 0,
          revenue_this_week: 0,
          revenue_this_month: 0,
        },
      }
    }
  },

  /**
   * Export analytics data
   * @param format - Export format (csv, excel, pdf)
   * @returns Export file blob
   */
  exportAnalytics: async (format: 'csv' | 'excel' | 'pdf' = 'excel'): Promise<Blob> => {
    return apiRequest<Blob>(
      API_ENDPOINTS.ADMIN.ANALYTICS_EXPORT,
      'GET',
      null,
      { format },
      { responseType: 'blob' }
    )
  },

  /**
   * Get reports
   * @param type - Report type (financial, sales, etc.)
   * @returns List of reports
   */
  getReports: async (type?: string): Promise<Report[]> => {
    return apiRequest<Report[]>(API_ENDPOINTS.ADMIN.REPORTS, 'GET', null, { type })
  },

  /**
   * Get financial report
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Financial report data
   */
  getFinancialReport: async (startDate?: string, endDate?: string): Promise<Record<string, unknown>> => {
    return apiRequest<Record<string, unknown>>(
      API_ENDPOINTS.ADMIN.REPORT_FINANCIAL,
      'GET',
      null,
      { start_date: startDate, end_date: endDate }
    )
  },

  /**
   * Get sales report
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Sales report data
   */
  getSalesReport: async (startDate?: string, endDate?: string): Promise<Record<string, unknown>> => {
    return apiRequest<Record<string, unknown>>(
      API_ENDPOINTS.ADMIN.REPORT_SALES,
      'GET',
      null,
      { start_date: startDate, end_date: endDate }
    )
  },
}

export default adminService
