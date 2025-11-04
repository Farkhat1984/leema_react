/**
 * Product Types
 * Type definitions for products, matching backend schema
 */

export type ProductStatus = 'pending' | 'approved' | 'rejected' | 'draft';

export interface ProductImage {
  url: string;
  quality: string;
  order: number;
}

export interface Product {
  id: number;
  shop_id: number;
  shop_name?: string;
  name: string;
  description?: string | null;
  price: number;
  images: ProductImage[];  // Array of image objects, not strings
  sizes: string[];  // Array of size strings
  colors: string[];  // Array of color strings
  characteristics?: Record<string, any>;
  category_id?: number | null;
  category_name?: string;
  status: ProductStatus;  // status field, not moderation_status
  is_active: boolean;
  views: number;
  try_ons: number;
  rent_expires_at?: string | null;
  rejection_reason?: string | null;
  moderation_notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ProductCreate {
  name: string;
  description?: string;
  price: number;
  characteristics?: Record<string, any>;
  category_id?: number;
  images?: string[];
}

export interface ProductUpdate {
  name?: string;
  description?: string;
  price?: number;
  characteristics?: Record<string, any>;
  category_id?: number;
  images?: string[];
  is_active?: boolean;
}

export interface ProductFilters {
  search?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  shop_id?: number;
  status?: ProductStatus | 'all';
  is_active?: boolean;
  page?: number;
  per_page?: number;
  sort_by?: 'price' | 'created_at' | 'views' | 'name';
  sort_order?: 'asc' | 'desc';
}
