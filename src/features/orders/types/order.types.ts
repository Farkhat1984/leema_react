export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' | 'refunded'

export interface OrderProduct {
  id: number
  product_id: number
  product_name: string
  product_image?: string
  quantity: number
  price: number
  size?: string
  color?: string
}

export interface OrderCustomer {
  id: number
  name: string
  email: string
  phone: string
  address: string
  city?: string
  postal_code?: string
  country?: string
}

export interface Order {
  id: number
  order_number: string
  customer: OrderCustomer
  products: OrderProduct[]
  subtotal: number
  shipping_cost: number
  tax: number
  total: number
  status: OrderStatus
  payment_method: string
  payment_id?: string
  notes?: string
  // Timestamps for status tracking
  ordered_at: string
  paid_at?: string
  shipped_at?: string
  completed_at?: string
  cancelled_at?: string
  // Shop info (for admin)
  shop_id?: number
  shop_name?: string
  // Platform fee (for admin)
  platform_fee?: number
  shop_payout?: number
  created_at: string
  updated_at: string
}

export interface OrderStats {
  today: number
  this_week: number
  this_month: number
  all_time: number
}

export interface PaginatedOrders {
  data: Order[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus
  notes?: string
}
