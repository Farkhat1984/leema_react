import { z } from 'zod'

export const contactSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number is too long')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format'),
  has_whatsapp: z.boolean().default(false),
})

export type ContactFormData = z.infer<typeof contactSchema>

export const newsletterSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  texts: z
    .array(
      z.object({
        content: z.string().min(1, 'Text content cannot be empty'),
        order: z.number(),
      })
    )
    .min(0),
  images: z.array(z.instanceof(File)).min(0),
  recipient_type: z.enum(['all', 'selected']),
  recipient_ids: z.array(z.number()).min(0),
  scheduled_at: z.string().optional(),
})
  .refine(
    (data) => data.texts.length > 0 || data.images.length > 0,
    {
      message: 'Newsletter must have at least one text message or image',
      path: ['texts'],
    }
  )
  .refine(
    (data) => {
      if (data.recipient_type === 'selected') {
        return data.recipient_ids.length > 0
      }
      return true
    },
    {
      message: 'Please select at least one contact',
      path: ['recipient_ids'],
    }
  )

export type NewsletterFormData = z.infer<typeof newsletterSchema>
