import { apiRequest } from '@/shared/lib/api/client';
import type {
  KaspiIntegration,
  CreateKaspiIntegrationRequest,
  UpdateKaspiIntegrationRequest,
  KaspiOrder,
  KaspiOrdersResponse,
  KaspiOrdersQueryParams,
  UpdateKaspiOrderStatusRequest,
  KaspiNotification,
  KaspiNotificationsResponse,
  KaspiNotificationsQueryParams,
  SendKaspiNotificationRequest,
  SyncKaspiOrdersRequest,
  SyncKaspiOrdersResponse,
  KaspiDashboardStats,
} from '@/shared/types/kaspi';

const BASE_URL = '/api/v1/shops/me/kaspi';

export const kaspiService = {
  // Integration
  getIntegration: () =>
    apiRequest<KaspiIntegration>(`${BASE_URL}/integration`, 'GET'),

  createIntegration: (data: CreateKaspiIntegrationRequest) =>
    apiRequest<KaspiIntegration>(`${BASE_URL}/integration`, 'POST', data),

  updateIntegration: (data: UpdateKaspiIntegrationRequest) =>
    apiRequest<KaspiIntegration>(`${BASE_URL}/integration`, 'PUT', data),

  deleteIntegration: () =>
    apiRequest<void>(`${BASE_URL}/integration`, 'DELETE', undefined, undefined, {
      timeout: 60000, // 60 seconds - каскадное удаление заказов и уведомлений может занять время
    }),

  // Orders
  getOrders: (params?: KaspiOrdersQueryParams) =>
    apiRequest<KaspiOrdersResponse>(`${BASE_URL}/orders`, 'GET', undefined, params),

  getOrder: (orderId: number) =>
    apiRequest<KaspiOrder>(`${BASE_URL}/orders/${orderId}`, 'GET'),

  updateOrderStatus: (orderId: number, data: UpdateKaspiOrderStatusRequest) =>
    apiRequest<KaspiOrder>(`${BASE_URL}/orders/${orderId}/status`, 'POST', data),

  // Sync (with extended timeout for Kaspi API - up to 3 minutes)
  syncOrders: (data?: SyncKaspiOrdersRequest) =>
    apiRequest<SyncKaspiOrdersResponse>(`${BASE_URL}/sync`, 'POST', data, undefined, {
      timeout: 180000, // 180 seconds (3 min) - Kaspi API может отвечать 1+ минуту на запрос
    }),

  // Notifications
  getNotifications: (params?: KaspiNotificationsQueryParams) =>
    apiRequest<KaspiNotificationsResponse>(`${BASE_URL}/notifications`, 'GET', undefined, params),

  sendNotification: (data: SendKaspiNotificationRequest) =>
    apiRequest<{ success: boolean; notification_id: number }>(
      `${BASE_URL}/notifications/send`,
      'POST',
      data
    ),

  // Stats
  getStats: () =>
    apiRequest<KaspiDashboardStats>(`${BASE_URL}/stats`, 'GET'),
};
