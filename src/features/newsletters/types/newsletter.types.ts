export interface Contact {
  id: number
  full_name: string
  whatsapp_number: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ContactCreateInput {
  full_name: string
  whatsapp_number: string
  is_active?: boolean
}

export interface ContactUpdateInput {
  full_name?: string
  whatsapp_number?: string
  is_active?: boolean
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
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type RecipientType = 'all' | 'selected'

export interface Newsletter {
  id: number
  title: string
  description?: string
  texts: NewsletterText[]
  images: NewsletterImage[]
  recipient_type: RecipientType
  recipient_ids?: number[] // contact IDs (optional when recipient_type === 'all')
  status: NewsletterStatus
  rejection_reason?: string
  scheduled_at?: string
  sent_at?: string
  sent_count?: number
  total_recipients?: number
  opened_count?: number
  clicked_count?: number
  created_at: string
  updated_at: string
  // Backend returns these fields with different names
  creative_texts?: string[]
  creative_images?: string[]
  // Admin view fields
  shop_name?: string
  shop_id?: number
  approved_by?: number
  rejected_by?: number
  approved_at?: string
  rejected_at?: string
}

export interface UploadedImage {
  id: string
  file?: File
  url: string
  quality?: 'low' | 'medium' | 'high'
}

export interface NewsletterCreateInput {
  title: string
  description?: string
  texts: Array<{ content: string; order: number }>
  images: UploadedImage[]
  recipient_type: RecipientType
  recipient_ids: number[]
  scheduled_at?: string
}

export interface NewsletterStats {
  total: number
  pending: number
  approved: number
  rejected: number
  in_progress: number
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
