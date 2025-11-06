/**
 * Product-related TypeScript types
 */

export type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export type ImageQuality = 'low' | 'medium' | 'high';

export interface ProductImage {
  id?: number;
  url: string;
  quality: ImageQuality;
  order: number;
}

export interface Product {
  id: number;
  shop_id: number;
  shop_name?: string;
  name: string;
  description: string;
  price: number;
  category_id: number;
  category_name?: string;
  sizes: string[];
  colors: string[];
  images: ProductImage[];
  status: ProductStatus;
  rejection_reason?: string;
  moderation_notes?: string;
  views: number;
  try_ons: number;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category_id: number;
  sizes: string[];
  colors: string[];
  images?: File[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface ProductFilters {
  search?: string;
  category_id?: number;
  status?: ProductStatus;
  sort_by?: 'date' | 'price' | 'name' | 'status';
  sort_order?: 'asc' | 'desc';
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
