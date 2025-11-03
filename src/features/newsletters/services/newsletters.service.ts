import { apiRequest } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import type {
  Newsletter,
  NewsletterCreateInput,
  PaginatedNewsletters,
  NewsletterStats,
  NewsletterStatus,
} from '../types/newsletter.types'

export interface GetNewslettersParams {
  page?: number
  per_page?: number
  search?: string
  status?: NewsletterStatus
  shop_id?: number // For admin only
}

export const newslettersService = {
  // Shop endpoints
  async getNewsletters(params: GetNewslettersParams = {}): Promise<PaginatedNewsletters> {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.per_page) queryParams.append('per_page', params.per_page.toString())
    if (params.search) queryParams.append('search', params.search)
    if (params.status) queryParams.append('status', params.status)

    const url = `${API_ENDPOINTS.SHOPS.NEWSLETTERS}?${queryParams.toString()}`
    return apiRequest<PaginatedNewsletters>(url)
  },

  async getNewsletter(id: number): Promise<Newsletter> {
    return apiRequest<Newsletter>(API_ENDPOINTS.SHOPS.NEWSLETTER_BY_ID(id))
  },

  async createNewsletter(data: NewsletterCreateInput): Promise<Newsletter> {
    const formData = new FormData()
    formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)
    formData.append('texts', JSON.stringify(data.texts))
    formData.append('recipient_type', data.recipient_type)
    formData.append('recipient_ids', JSON.stringify(data.recipient_ids))
    if (data.scheduled_at) formData.append('scheduled_at', data.scheduled_at)

    // Add images
    data.images.forEach((image, index) => {
      formData.append(`images[${index}]`, image)
    })

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}${API_ENDPOINTS.SHOPS.NEWSLETTER_CREATE}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('access_token')}`,
        },
        body: formData,
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create newsletter')
    }

    return response.json()
  },

  async deleteNewsletter(id: number): Promise<void> {
    return apiRequest<void>(API_ENDPOINTS.SHOPS.NEWSLETTER_DELETE(id), 'DELETE')
  },

  async sendNewsletter(id: number): Promise<void> {
    return apiRequest<void>(API_ENDPOINTS.SHOPS.NEWSLETTER_SEND(id), 'POST')
  },

  // Admin endpoints
  async getAdminNewsletters(params: GetNewslettersParams = {}): Promise<PaginatedNewsletters> {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.per_page) queryParams.append('per_page', params.per_page.toString())
    if (params.search) queryParams.append('search', params.search)
    if (params.status) queryParams.append('status', params.status)
    if (params.shop_id) queryParams.append('shop_id', params.shop_id.toString())

    const url = `${API_ENDPOINTS.ADMIN.NEWSLETTERS}?${queryParams.toString()}`
    return apiRequest<PaginatedNewsletters>(url)
  },

  async getAdminNewsletter(id: number): Promise<Newsletter> {
    return apiRequest<Newsletter>(API_ENDPOINTS.ADMIN.NEWSLETTER_BY_ID(id))
  },

  async approveNewsletter(id: number): Promise<void> {
    return apiRequest<void>(API_ENDPOINTS.ADMIN.NEWSLETTER_APPROVE(id), 'POST')
  },

  async rejectNewsletter(id: number, reason: string): Promise<void> {
    return apiRequest<void>(API_ENDPOINTS.ADMIN.NEWSLETTER_REJECT(id), 'POST', { reason })
  },

  async getNewsletterStats(): Promise<NewsletterStats> {
    return apiRequest<NewsletterStats>(API_ENDPOINTS.ADMIN.NEWSLETTER_STATS)
  },
}
