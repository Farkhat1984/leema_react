export type TimePeriod = 'daily' | 'weekly' | 'monthly'

export interface DateRange {
  from: string // ISO date
  to: string // ISO date
}

export interface AnalyticsMetrics {
  total_revenue: number
  total_orders: number
  average_order_value: number
  top_category: {
    id: number
    name: string
    revenue: number
  } | null
  revenue_trend: number // percentage change
  orders_trend: number // percentage change
}

export interface RevenueDataPoint {
  date: string
  revenue: number
  label: string // formatted date for display
}

export interface OrdersDataPoint {
  date: string
  orders: number
  label: string
}

export interface CategoryBreakdown {
  name: string
  value: number // revenue
  percentage: number
}

export interface TopProduct {
  id: number
  name: string
  image_url?: string
  sales_count: number
  revenue: number
  category: string
}

export interface AnalyticsData {
  metrics: AnalyticsMetrics
  revenue_data: RevenueDataPoint[]
  orders_data: OrdersDataPoint[]
  category_breakdown: CategoryBreakdown[]
  top_products: TopProduct[]
}

export interface AnalyticsExportData {
  period: TimePeriod
  date_range: DateRange
  metrics: AnalyticsMetrics
  revenue_data: RevenueDataPoint[]
  orders_data: OrdersDataPoint[]
  category_breakdown: CategoryBreakdown[]
  top_products: TopProduct[]
  generated_at: string
}

// Query parameters for analytics API
export interface AnalyticsParams {
  period?: TimePeriod
  from?: string // ISO date
  to?: string // ISO date
}
