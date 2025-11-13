// Kaspi Integration Types

export interface KaspiIntegration {
  id: number;
  shop_id: number;
  merchant_id: string;
  is_active: boolean;
  auto_notifications: boolean;
  sync_interval_minutes: number;
  notification_templates: Record<string, string>;
  last_sync_at?: string;
  last_sync_status?: 'success' | 'error';
  last_sync_error?: string;
  created_at: string;
  updated_at: string;
}

export interface KaspiProduct {
  code: string;
  name: string;
  quantity: number;
  price: string;
  total_price: string;
  // Note: Kaspi API не предоставляет URL изображений товаров
  // master_product_id доступен в raw_data, но изображения заблокированы
}

export interface KaspiOrder {
  id: number;
  kaspi_order_id: string;
  kaspi_order_code: string;
  customer_id: string;
  customer_name: string;
  customer_first_name?: string;
  customer_phone: string;
  status: KaspiOrderStatus;
  previous_status?: string;
  state: KaspiOrderState;
  total_price: string;
  delivery_cost: string;
  delivery_cost_for_seller: string;
  delivery_mode: string;
  payment_mode: string;
  is_kaspi_delivery: boolean;
  delivery_address?: string;
  products_json: KaspiProduct[];
  creation_date: string;
  approved_by_bank_date?: string;
  planned_delivery_date?: string;
  cancellation_reason?: string;
  cancellation_comment?: string;
  last_sync_at: string;
  created_at: string;
  updated_at: string;
}

export type KaspiOrderStatus =
  | 'APPROVED_BY_BANK'
  | 'ACCEPTED_BY_MERCHANT'
  | 'ASSEMBLED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CANCELLING'
  | 'RETURNED';

export type KaspiOrderState = 'NEW' | 'PICKUP' | 'DELIVERY' | 'KASPI_DELIVERY' | 'ARCHIVE';

export interface KaspiNotification {
  id: number;
  kaspi_order_id: number;
  notification_type: 'status_change' | 'order_created' | 'manual';
  trigger_status?: string;
  message_text: string;
  phone_number: string;
  sent_at: string;
  delivery_status: 'sent' | 'delivered' | 'failed';
  error_message?: string;
  retry_count: number;
  created_at: string;
}

export interface KaspiDashboardStats {
  orders: {
    total_orders: number;
    new_orders: number;
    accepted_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    total_revenue: string;
    average_order_value: string;
  };
  notifications: {
    total_sent: number;
    total_delivered: number;
    total_failed: number;
    delivery_rate: number;
  };
  last_sync_at?: string;
  is_integration_active: boolean;
}

// Request types
export interface CreateKaspiIntegrationRequest {
  api_token: string;
  merchant_id: string;
  auto_notifications?: boolean;
  sync_interval_minutes?: number;
}

export interface UpdateKaspiIntegrationRequest {
  api_token?: string;
  merchant_id?: string;
  is_active?: boolean;
  auto_notifications?: boolean;
  sync_interval_minutes?: number;
  notification_templates?: Record<string, string>;
}

export interface UpdateKaspiOrderStatusRequest {
  new_status: 'ACCEPTED_BY_MERCHANT' | 'COMPLETED' | 'CANCELLED' | 'ASSEMBLED';
  cancellation_reason?: 'BUYER_NOT_REACHABLE' | 'MERCHANT_OUT_OF_STOCK';
  cancellation_comment?: string;
  security_code?: string;
  number_of_space?: number;
}

export interface SendKaspiNotificationRequest {
  order_id: number;
  message_text: string;
}

export interface SyncKaspiOrdersRequest {
  force?: boolean;
}

export interface SyncKaspiOrdersResponse {
  success: boolean;
  new_orders: number;
  updated_orders: number;
  notifications_sent: number;
  errors: string[];
  synced_at: string;
}

// Response types
export interface KaspiOrdersResponse {
  orders: KaspiOrder[];
  total: number;
  page: number;
  size: number;
}

export interface KaspiNotificationsResponse {
  notifications: KaspiNotification[];
  total: number;
  page: number;
  size: number;
}

// Query params
export interface KaspiOrdersQueryParams {
  status?: KaspiOrderStatus;
  state?: KaspiOrderState;
  start_date?: string;
  end_date?: string;
  customer_phone?: string;
  page?: number;
  size?: number;
}

export interface KaspiNotificationsQueryParams {
  page?: number;
  size?: number;
}

// WebSocket events
export interface KaspiOrderCreatedEvent {
  type: 'kaspi:order_created';
  order_id: number;
  kaspi_order_code: string;
  customer_name: string;
  total_price: string;
  status: string;
  whatsapp_sent: boolean;
}

export interface KaspiOrderStatusChangedEvent {
  type: 'kaspi:order_status_changed';
  order_id: number;
  kaspi_order_code: string;
  old_status: string;
  new_status: string;
  whatsapp_sent: boolean;
}

export type KaspiWebSocketEvent = KaspiOrderCreatedEvent | KaspiOrderStatusChangedEvent;
