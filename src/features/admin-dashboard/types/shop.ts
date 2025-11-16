/**
 * Shop-related TypeScript types for Admin
 */

export type ShopStatus = 'draft' | 'pending' | 'approved' | 'active' | 'rejected' | 'deactivated';

export interface Shop {
  id: number;
  owner_id: number;
  owner_name?: string;
  owner_email?: string;
  name: string;
  description: string;
  contact_phone: string;
  whatsapp_phone?: string;
  address: string;
  avatar?: string;
  status: ShopStatus;
  rejection_reason?: string;
  total_products: number;
  active_products: number;
  total_orders: number;
  total_revenue: number;
  created_at: string;
  updated_at: string;
}

export interface ShopsResponse {
  shops: Shop[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ShopStats {
  total: number;
  pending: number;
  approved: number;
  active: number;
  rejected: number;
  deactivated: number;
}

export interface ShopFilters {
  search?: string;
  status?: ShopStatus | 'all';
  sort_by?: 'created_at' | 'name' | 'total_products' | 'total_revenue';
  sort_order?: 'asc' | 'desc';
}
