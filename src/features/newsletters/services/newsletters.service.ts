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

    // Backend expects 'skip' and 'limit' instead of 'page' and 'per_page'
    const page = params.page || 1
    const perPage = params.per_page || 20
    const skip = (page - 1) * perPage

    queryParams.append('skip', skip.toString())
    queryParams.append('limit', perPage.toString())

    if (params.search) queryParams.append('search', params.search)
    if (params.status) queryParams.append('status', params.status)

    const url = `${API_ENDPOINTS.SHOPS.NEWSLETTERS}?${queryParams.toString()}`
    const response = await apiRequest<unknown>(url)

    // Transform backend response to match frontend expectations
    return {
      data: response.newsletters || [],
      total: response.total || 0,
      page: page,
      per_page: perPage,
      total_pages: Math.ceil((response.total || 0) / perPage)
    }
  },

  async getNewsletter(id: number): Promise<Newsletter> {
    return apiRequest<Newsletter>(API_ENDPOINTS.SHOPS.NEWSLETTER_BY_ID(id))
  },

  async createNewsletter(data: NewsletterCreateInput, newsletterId?: number): Promise<Newsletter> {
    // Step 1: Upload images first to get URLs (only if they have File objects)
    const imageUrls: string[] = []
    for (const image of data.images) {
      // Check if the image has a file to upload
      if (image.file) {
        const formData = new FormData()
        formData.append('file', image.file)

        try {
          // Add newsletter_id if provided (recommended for organization)
          const uploadUrl = newsletterId
            ? `${API_ENDPOINTS.SHOPS.NEWSLETTER_UPLOAD_IMAGE}?newsletter_id=${newsletterId}`
            : API_ENDPOINTS.SHOPS.NEWSLETTER_UPLOAD_IMAGE

          const response = await apiRequest<{ url: string, image_url: string }>(
            uploadUrl,
            'POST',
            formData
          )
          imageUrls.push(response.image_url || response.url)
        } catch {
          // Error already logged by API client
          throw new Error('Failed to upload newsletter image')
        }
      } else if (image.url && !image.url.startsWith('blob:')) {
        // If it's already a server URL (not a blob), use it directly
        imageUrls.push(image.url)
      }
    }

    // Step 2: Transform data to match backend schema
    const backendData = {
      title: data.title,
      creative_texts: data.texts.map(t => t.content),
      creative_images: imageUrls,
      send_to_all: data.recipient_type === 'all',
      contact_ids: data.recipient_type === 'selected' ? data.recipient_ids : [],
      scheduled_at: data.scheduled_at || undefined,
    }

    // Step 3: Create newsletter
    return apiRequest<Newsletter>(
      API_ENDPOINTS.SHOPS.NEWSLETTER_CREATE,
      'POST',
      backendData
    )
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

    // Admin endpoint uses 'page' and 'per_page' directly
    const page = params.page || 1
    const perPage = params.per_page || 20

    queryParams.append('page', page.toString())
    queryParams.append('per_page', perPage.toString())

    if (params.search) queryParams.append('search', params.search)
    if (params.status) queryParams.append('status', params.status)
    if (params.shop_id) queryParams.append('shop_id', params.shop_id.toString())

    const url = `${API_ENDPOINTS.ADMIN.NEWSLETTERS}?${queryParams.toString()}`
    const response = await apiRequest<unknown>(url)

    // Backend returns { data, total, page, per_page, total_pages }
    return {
      data: response.data || [],
      total: response.total || 0,
      page: response.page || page,
      per_page: response.per_page || perPage,
      total_pages: response.total_pages || Math.ceil((response.total || 0) / perPage)
    }
  },

  async getAdminNewsletter(id: number): Promise<Newsletter> {
    return apiRequest<Newsletter>(API_ENDPOINTS.ADMIN.NEWSLETTER_BY_ID(id))
  },

  async approveNewsletter(id: number): Promise<void> {
    return apiRequest<void>(API_ENDPOINTS.ADMIN.NEWSLETTER_APPROVE(id), 'POST')
  },

  async rejectNewsletter(id: number, reason: string): Promise<void> {
    // Backend expects reason as query parameter, not body
    const url = `${API_ENDPOINTS.ADMIN.NEWSLETTER_REJECT(id)}?reason=${encodeURIComponent(reason)}`
    return apiRequest<void>(url, 'POST')
  },

  async getNewsletterStats(): Promise<NewsletterStats> {
    return apiRequest<NewsletterStats>(API_ENDPOINTS.ADMIN.NEWSLETTER_STATS)
  },
}
