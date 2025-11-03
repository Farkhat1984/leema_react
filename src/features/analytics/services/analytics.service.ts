import { apiRequest } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import type {
  AnalyticsData,
  AnalyticsParams,
  AnalyticsExportData,
} from '../types/analytics.types'

export const analyticsService = {
  async getAnalytics(params: AnalyticsParams = {}): Promise<AnalyticsData> {
    const queryParams = new URLSearchParams()
    if (params.period) queryParams.append('period', params.period)
    if (params.from) queryParams.append('from', params.from)
    if (params.to) queryParams.append('to', params.to)

    const url = `${API_ENDPOINTS.SHOPS.ANALYTICS}?${queryParams.toString()}`
    return apiRequest<AnalyticsData>(url)
  },

  async getDetailedAnalytics(params: AnalyticsParams = {}): Promise<AnalyticsData> {
    const queryParams = new URLSearchParams()
    if (params.period) queryParams.append('period', params.period)
    if (params.from) queryParams.append('from', params.from)
    if (params.to) queryParams.append('to', params.to)

    const url = `${API_ENDPOINTS.SHOPS.ANALYTICS_DETAILED}?${queryParams.toString()}`
    return apiRequest<AnalyticsData>(url)
  },

  async exportAnalytics(
    params: AnalyticsParams = {},
    format: 'csv' | 'json' = 'csv'
  ): Promise<Blob> {
    const queryParams = new URLSearchParams()
    if (params.period) queryParams.append('period', params.period)
    if (params.from) queryParams.append('from', params.from)
    if (params.to) queryParams.append('to', params.to)
    queryParams.append('format', format)

    const url = `${API_ENDPOINTS.SHOPS.ANALYTICS_EXPORT}?${queryParams.toString()}`

    const response = await fetch(`${import.meta.env.VITE_API_URL}${url}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem('access_token')}`,
      },
    })

    if (!response.ok) {
      throw new Error('Export failed')
    }

    return response.blob()
  },

  // Helper to download exported data
  downloadExport(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  },

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  },

  // Format percentage
  formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  },
}
