/**
 * Notification Service
 * Handles all API calls for notifications management
 */

import { apiRequest } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'

// Types
export interface Notification {
  id: number
  user_id?: number
  shop_id?: number
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  is_read: boolean
  created_at: string
  read_at?: string | null
}

export type NotificationType =
  | 'order_created'
  | 'order_updated'
  | 'order_completed'
  | 'order_cancelled'
  | 'product_approved'
  | 'product_rejected'
  | 'shop_approved'
  | 'shop_rejected'
  | 'shop_deactivated'
  | 'newsletter_approved'
  | 'newsletter_rejected'
  | 'balance_updated'
  | 'transaction_completed'
  | 'transaction_failed'
  | 'review_created'
  | 'review_replied'
  | 'refund_approved'
  | 'refund_rejected'
  | 'whatsapp_status_changed'
  | 'system_announcement'

export interface NotificationFilters {
  type?: NotificationType
  is_read?: boolean
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}

export interface UnreadCount {
  count: number
  by_type?: Record<NotificationType, number>
}

/**
 * Notification Service
 * All methods for notification-related API operations
 */
export const notificationService = {
  /**
   * Get all notifications
   * @param filters - Notification filters
   * @returns List of notifications
   */
  getNotifications: async (filters?: NotificationFilters): Promise<Notification[]> => {
    return apiRequest<Notification[]>(
      API_ENDPOINTS.NOTIFICATIONS.LIST,
      'GET',
      null,
      filters
    )
  },

  /**
   * Get unread notifications count
   * @returns Unread count
   */
  getUnreadCount: async (): Promise<UnreadCount> => {
    try {
      return await apiRequest<UnreadCount>(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT)
    } catch (error) {
      // Return default value if endpoint doesn't exist yet
      return { count: 0 }
    }
  },

  /**
   * Mark notification as read
   * @param id - Notification ID
   * @returns Updated notification
   */
  markAsRead: async (id: number): Promise<Notification> => {
    return apiRequest<Notification>(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id), 'POST')
  },

  /**
   * Mark all notifications as read
   * @returns Success message
   */
  markAllAsRead: async (): Promise<{ message: string; count: number }> => {
    return apiRequest<{ message: string; count: number }>(
      API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
      'POST'
    )
  },

  /**
   * Delete notification
   * @param id - Notification ID
   * @returns Success message
   */
  deleteNotification: async (id: number): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(
      API_ENDPOINTS.NOTIFICATIONS.DELETE(id),
      'DELETE'
    )
  },

  /**
   * Delete all read notifications
   * @returns Success message
   */
  deleteAllRead: async (): Promise<{ message: string; count: number }> => {
    return apiRequest<{ message: string; count: number }>(
      `${API_ENDPOINTS.NOTIFICATIONS.LIST}/delete-read`,
      'DELETE'
    )
  },

  /**
   * Get notification by ID
   * @param id - Notification ID
   * @returns Notification details
   */
  getNotification: async (id: number): Promise<Notification> => {
    return apiRequest<Notification>(`${API_ENDPOINTS.NOTIFICATIONS.LIST}/${id}`)
  },
}

export default notificationService
