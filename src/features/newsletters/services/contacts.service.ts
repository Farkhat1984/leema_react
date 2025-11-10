import { apiRequest } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'
import type {
  Contact,
  ContactCreateInput,
  ContactUpdateInput,
  PaginatedContacts,
  ContactsImportResult,
} from '../types/newsletter.types'

export interface GetContactsParams {
  page?: number
  per_page?: number
  search?: string
}

export const contactsService = {
  async getContacts(params: GetContactsParams = {}): Promise<PaginatedContacts> {
    const queryParams = new URLSearchParams()
    // Backend uses skip/limit, convert from page/per_page
    if (params.page && params.per_page) {
      const skip = (params.page - 1) * params.per_page
      queryParams.append('skip', skip.toString())
      queryParams.append('limit', params.per_page.toString())
    } else if (params.per_page) {
      queryParams.append('limit', params.per_page.toString())
    }
    if (params.search) queryParams.append('search', params.search)

    const url = `${API_ENDPOINTS.SHOPS.CONTACTS}?${queryParams.toString()}`
    const response = await apiRequest<any>(url)

    // Transform backend response to match frontend expectations
    return {
      data: response.contacts || [],
      total: response.total || 0,
      page: params.page || 1,
      per_page: params.per_page || 20,
      total_pages: Math.ceil((response.total || 0) / (params.per_page || 20)),
    }
  },

  async getContact(id: number): Promise<Contact> {
    return apiRequest<Contact>(API_ENDPOINTS.SHOPS.CONTACT_BY_ID(id))
  },

  async createContact(data: ContactCreateInput): Promise<Contact> {
    return apiRequest<Contact>(API_ENDPOINTS.SHOPS.CONTACT_CREATE, 'POST', data)
  },

  async updateContact(id: number, data: ContactUpdateInput): Promise<Contact> {
    return apiRequest<Contact>(API_ENDPOINTS.SHOPS.CONTACT_BY_ID(id), 'PUT', data)
  },

  async deleteContact(id: number): Promise<void> {
    return apiRequest<void>(API_ENDPOINTS.SHOPS.CONTACT_DELETE(id), 'DELETE')
  },

  async bulkDeleteContacts(ids: number[]): Promise<void> {
    return apiRequest<void>(API_ENDPOINTS.SHOPS.CONTACT_BULK_DELETE, 'POST', { contact_ids: ids })
  },

  async importFromExcel(file: File): Promise<ContactsImportResult> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}${API_ENDPOINTS.SHOPS.CONTACTS_IMPORT_EXCEL}`,
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
      throw new Error(error.message || 'Import failed')
    }

    return response.json()
  },

  async exportToExcel(): Promise<Blob> {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}${API_ENDPOINTS.SHOPS.CONTACTS_EXPORT_EXCEL}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('access_token')}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Export failed')
    }

    return response.blob()
  },

  async downloadTemplate(): Promise<Blob> {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}${API_ENDPOINTS.SHOPS.CONTACTS_DOWNLOAD_TEMPLATE}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('access_token')}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Template download failed')
    }

    return response.blob()
  },
}
