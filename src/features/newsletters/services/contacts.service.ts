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
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.per_page) queryParams.append('per_page', params.per_page.toString())
    if (params.search) queryParams.append('search', params.search)

    const url = `${API_ENDPOINTS.SHOPS.CONTACTS}?${queryParams.toString()}`
    return apiRequest<PaginatedContacts>(url)
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
    return apiRequest<void>(API_ENDPOINTS.SHOPS.CONTACT_BULK_DELETE, 'POST', { ids })
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
