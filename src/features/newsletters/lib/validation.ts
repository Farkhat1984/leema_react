import { z } from 'zod'

export const contactSchema = z.object({
  name: z
    .string()
    .min(2, 'Имя должно быть не менее 2 символов')
    .max(100, 'Имя слишком длинное'),
  phone: z
    .string()
    .min(10, 'Номер телефона должен содержать не менее 10 цифр')
    .max(20, 'Номер телефона слишком длинный')
    .regex(/^[\d\s\-+()]+$/, 'Неверный формат номера телефона'),
  has_whatsapp: z.boolean().default(false),
})

export type ContactFormData = z.infer<typeof contactSchema>

export const newsletterSchema = z.object({
  title: z
    .string()
    .min(3, 'Название должно быть не менее 3 символов')
    .max(200, 'Название слишком длинное'),
  description: z.string().max(500, 'Описание слишком длинное').optional(),
  texts: z
    .array(
      z.object({
        content: z.string().min(1, 'Содержимое текста не может быть пусто'),
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
      message: 'Рассылка должна содержать хотя бы одно текстовое сообщение или изображение',
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
      message: 'Выберите хотя бы один контакт',
      path: ['recipient_ids'],
    }
  )

export type NewsletterFormData = z.infer<typeof newsletterSchema>
