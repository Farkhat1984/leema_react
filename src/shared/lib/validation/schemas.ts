/**
 * Validation schemas using Zod
 */

import { z } from 'zod';

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email обязателен')
    .email('Неверный формат email'),
  password: z
    .string()
    .min(6, 'Пароль должен быть не менее 6 символов'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Register form validation schema
 */
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Имя должно быть не менее 2 символов')
    .max(50, 'Имя должно быть не более 50 символов'),
  email: z
    .string()
    .min(1, 'Email обязателен')
    .email('Неверный формат email'),
  phone: z
    .string()
    .regex(/^\+?7\d{10}$/, 'Неверный формат телефона (используйте +7XXXXXXXXXX)')
    .optional(),
  password: z
    .string()
    .min(6, 'Пароль должен быть не менее 6 символов')
    .max(100, 'Пароль должен быть не более 100 символов'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Product form validation schema
 */
export const productSchema = z.object({
  name: z
    .string()
    .min(2, 'Название должно быть не менее 2 символов')
    .max(200, 'Название товара должно быть не более 200 символов'),
  description: z
    .string()
    .max(2000, 'Описание должно быть не более 2000 символов'),
  price: z
    .number()
    .min(0.01, 'Цена должна быть больше 0')
    .or(z.string().transform((val) => parseFloat(val))),
  category_id: z
    .number()
    .min(1, 'Выберите категорию')
    .or(z.string().transform((val) => parseInt(val, 10))),
  images: z
    .array(z.string())
    .min(1, 'Требуется хотя бы одно изображение')
    .max(10, 'Максимум 10 изображений разрешено')
    .optional(),
  stock: z
    .number()
    .int()
    .min(0, 'Складское количество должно быть неотрицательным')
    .or(z.string().transform((val) => parseInt(val, 10)))
    .optional(),
  sizes: z
    .string()
    .min(1, 'Укажите хотя бы один размер (разделенные запятыми)')
    .or(z.array(z.string())),
  colors: z
    .string()
    .min(1, 'Укажите хотя бы один цвет (разделенные запятыми)')
    .or(z.array(z.string())),
});

export type ProductFormData = z.infer<typeof productSchema>;

/**
 * Newsletter form validation schema
 */
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
  images: z.array(
    z.object({
      id: z.string(),
      file: z.instanceof(File).optional(),
      url: z.string(),
      quality: z.enum(['low', 'medium', 'high'] as const).optional(),
    })
  ).min(0),
  recipient_type: z.enum(['all', 'selected'] as const),
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
        return data.recipient_ids.length > 0;
      }
      return true;
    },
    {
      message: 'Выберите хотя бы один контакт',
      path: ['recipient_ids'],
    }
  );

export type NewsletterFormData = z.infer<typeof newsletterSchema>;

/**
 * Profile update validation schema
 */
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Имя должно быть не менее 2 символов')
    .max(50, 'Имя должно быть не более 50 символов'),
  phone: z
    .string()
    .regex(/^\+?7\d{10}$/, 'Неверный формат телефона (используйте +7XXXXXXXXXX)')
    .optional(),
  avatar: z.string().url('Неверный URL аватара').optional(),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

/**
 * Shop registration validation schema
 */
export const shopRegistrationSchema = z.object({
  name: z
    .string()
    .min(2, 'Название должно быть не менее 2 символов')
    .max(100, 'Название должно быть не более 100 символов'),
  description: z
    .string()
    .min(10, 'Описание должно быть не менее 10 символов')
    .max(1000, 'Описание должно быть не более 1000 символов'),
  contact_phone: z
    .string()
    .min(10, 'Введите корректный номер телефона')
    .regex(/^[\d\s\-+()]+$/, 'Неверный формат номера телефона'),
  whatsapp_phone: z
    .string()
    .regex(/^[\d\s\-+()]*$/, 'Неверный формат номера телефона')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .min(5, 'Адрес должен быть не менее 5 символов')
    .max(200, 'Адрес должен быть не более 200 символов'),
  avatar: z.string().url('Неверный формат URL').optional().or(z.literal('')),
});

export type ShopRegistrationFormData = z.infer<typeof shopRegistrationSchema>;

/**
 * Shop profile update validation schema
 */
export const shopProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Название должно быть не менее 2 символов')
    .max(100, 'Название должно быть не более 100 символов'),
  description: z
    .string()
    .min(10, 'Описание должно быть не менее 10 символов')
    .max(1000, 'Описание должно быть не более 1000 символов'),
  address: z
    .string()
    .min(5, 'Адрес должен быть не менее 5 символов')
    .max(200, 'Адрес должен быть не более 200 символов'),
  phone: z
    .string()
    .min(10, 'Введите корректный номер телефона')
    .regex(/^[\d\s\-+()]+$/, 'Неверный формат номера телефона'),
  whatsapp_phone: z
    .string()
    .regex(/^[\d\s\-+()]*$/, 'Неверный формат номера телефона')
    .optional()
    .or(z.literal('')),
  email: z.string().email('Введите корректный email'),
  instagram: z
    .string()
    .regex(/^@?[\w._]+$/, 'Неверный формат Instagram (@username)')
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .url('Введите корректный URL')
    .optional()
    .or(z.literal('')),
});

export type ShopProfileFormData = z.infer<typeof shopProfileSchema>;

/**
 * Category validation schema
 */
export const categorySchema = z.object({
  name: z
    .string()
    .min(2, 'Название должно быть не менее 2 символов')
    .max(100, 'Название должно быть не более 100 символов'),
  slug: z
    .string()
    .min(2, 'Slug должен быть не менее 2 символов')
    .max(100, 'Slug должен быть не более 100 символов')
    .regex(/^[a-z0-9-]+$/, 'Slug может содержать только строчные буквы, цифры и дефисы'),
  description: z
    .string()
    .max(500, 'Описание должно быть не более 500 символов')
    .optional()
    .or(z.literal('')),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

/**
 * Top-up balance validation schema
 */
export const topUpSchema = z.object({
  amount: z
    .number()
    .min(100, 'Минимальная сумма пополнения: 100 KZT')
    .max(1000000, 'Максимальная сумма пополнения: 1,000,000 KZT')
    .or(z.string().transform((val) => parseFloat(val))),
});

export type TopUpFormData = z.infer<typeof topUpSchema>;

/**
 * Contact form validation schema (for newsletters)
 */
export const contactSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Полное имя обязательно')
    .max(255, 'Полное имя слишком длинное'),
  whatsapp_number: z
    .string()
    .min(10, 'Номер WhatsApp должен содержать не менее 10 цифр')
    .max(50, 'Номер WhatsApp слишком длинный')
    .regex(/^[\d\s\-+()]+$/, 'Неверный формат номера телефона'),
  is_active: z.boolean().default(true).optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

/**
 * Settings update validation schema
 */
export const settingsSchema = z.object({
  platform_name: z.string().min(2, 'Название должно быть не менее 2 символов').optional(),
  support_email: z.string().email('Неверный формат email').optional(),
  support_phone: z
    .string()
    .regex(/^[\d\s\-+()]+$/, 'Неверный формат номера телефона')
    .optional(),
  commission_rate: z
    .number()
    .min(0, 'Комиссия не может быть отрицательной')
    .max(100, 'Комиссия не может превышать 100%')
    .or(z.string().transform((val) => parseFloat(val)))
    .optional(),
  min_order_amount: z
    .number()
    .min(0, 'Сумма не может быть отрицательной')
    .or(z.string().transform((val) => parseFloat(val)))
    .optional(),
});

export type SettingsFormData = z.infer<typeof settingsSchema>;

/**
 * Common field validators for reuse
 */
export const commonValidators = {
  email: z.string().email('Неверный формат email'),
  phone: z.string().regex(/^[\d\s\-+()]+$/, 'Неверный формат номера телефона'),
  url: z.string().url('Неверный формат URL'),
  positiveNumber: z.number().min(0, 'Значение должно быть неотрицательным'),
  requiredString: (fieldName: string) => z.string().min(1, `${fieldName} обязательно`),
};
