export interface Contact {
  id: number
  name: string
  phone: string
  has_whatsapp: boolean
  created_at: string
  updated_at: string
}

export interface ContactCreateInput {
  name: string
  phone: string
  has_whatsapp: boolean
}

export interface ContactUpdateInput extends ContactCreateInput {
  id: number
}

export interface ContactsImportResult {
  success_count: number
  failed_count: number
  total: number
  errors?: Array<{
    row: number
    error: string
    data: Record<string, string>
  }>
}

export interface NewsletterText {
  id?: number
  content: string
  order?: number
}

export interface NewsletterImage {
  id?: number
  url: string
  order?: number
}

export type NewsletterStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'sending'
  | 'completed'
  | 'failed'

export type RecipientType = 'all' | 'selected'

export interface Newsletter {
  id: number
  title: string
  description?: string
  texts: NewsletterText[]
  images: NewsletterImage[]
  recipient_type: RecipientType
  recipient_ids: number[] // contact IDs
  status: NewsletterStatus
  rejection_reason?: string
  scheduled_at?: string
  sent_at?: string
  sent_count: number
  total_recipients: number
  opened_count?: number
  clicked_count?: number
  created_at: string
  updated_at: string
}

export interface NewsletterCreateInput {
  title: string
  description?: string
  texts: Array<{ content: string; order: number }>
  images: File[]
  recipient_type: RecipientType
  recipient_ids: number[]
  scheduled_at?: string
}

export interface NewsletterStats {
  total: number
  pending: number
  approved: number
  rejected: number
  completed: number
}

export interface PaginatedContacts {
  data: Contact[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface PaginatedNewsletters {
  data: Newsletter[]
  total: number
  page: number
  per_page: number
  total_pages: number
}
