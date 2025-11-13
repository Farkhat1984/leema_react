import { apiRequest } from '@/shared/lib/api/client';

const BASE_URL = '/api/v1/admin/kaspi';

// Admin Kaspi Analytics Types
export interface AdminKaspiStats {
  total_shops_with_integration: number;
  active_integrations: number;
  total_orders: number;
  total_revenue: string;
  orders_by_status: {
    status: string;
    count: number;
  }[];
  orders_by_shop: {
    shop_id: number;
    shop_name: string;
    total_orders: number;
    total_revenue: string;
    completed_orders: number;
  }[];
  notifications_stats: {
    total_sent: number;
    total_delivered: number;
    total_failed: number;
    delivery_rate: number;
  };
  recent_syncs: {
    shop_id: number;
    shop_name: string;
    last_sync_at: string;
    last_sync_status: 'success' | 'error';
    last_sync_error?: string;
  }[];
}

export const adminKaspiService = {
  // Get overall Kaspi analytics
  getStats: () => apiRequest<AdminKaspiStats>(`${BASE_URL}/stats`, 'GET'),
};
