/**
 * AI Agent Form Validation Schemas
 *
 * Zod schemas for form validation
 * All UI text in Russian as per project standards
 */

import { z } from 'zod';

// ============================================================================
// Agent Configuration Schema
// ============================================================================

export const agentConfigSchema = z.object({
  model: z.string().default('gemini-2.5-flash'),
  temperature: z
    .number()
    .min(0, 'Минимальное значение: 0')
    .max(2, 'Максимальное значение: 2')
    .default(0.7),
  max_tokens: z
    .number()
    .min(100, 'Минимум 100 токенов')
    .max(8192, 'Максимум 8192 токена')
    .default(1024),
  language: z.enum(['ru', 'kk', 'en'], {
    errorMap: () => ({ message: 'Выберите язык' }),
  }).default('ru'),
  tone: z.string().default('friendly'),
  enabled_tools: z.array(z.string()).default([]),
  working_hours: z.record(z.unknown()).nullable().optional(),
  fallback_message: z.string().nullable().optional(),
  response_style: z
    .enum(['concise', 'balanced', 'detailed'], {
      errorMap: () => ({ message: 'Выберите стиль ответов' }),
    })
    .default('balanced'),
  knowledge_base: z.record(z.string()).optional(),
});

export type AgentConfigFormData = z.infer<typeof agentConfigSchema>;

// ============================================================================
// Agent Create Schema
// ============================================================================

export const agentCreateSchema = z
  .object({
    template_id: z.number().nullable().optional(),
    name: z
      .string()
      .min(1, 'Обязательное поле')
      .max(255, 'Максимум 255 символов'),
    description: z.string().nullable().optional(),
    system_prompt: z
      .string()
      .min(10, 'Минимум 10 символов')
      .nullable()
      .optional(),
    custom_instructions: z
      .string()
      .max(2000, 'Максимум 2000 символов')
      .nullable()
      .optional(),
    config: agentConfigSchema,
  })
  .refine(
    (data) => {
      // Require system_prompt if no template
      if (!data.template_id && !data.system_prompt) {
        return false;
      }
      return true;
    },
    {
      message: 'Укажите системный промпт или выберите шаблон',
      path: ['system_prompt'],
    }
  );

export type AgentCreateFormData = z.infer<typeof agentCreateSchema>;

// ============================================================================
// Agent Update Schema
// ============================================================================

export const agentUpdateSchema = z.object({
  name: z.string().min(1, 'Обязательное поле').max(255, 'Максимум 255 символов').optional(),
  description: z.string().nullable().optional(),
  custom_instructions: z
    .string()
    .max(2000, 'Максимум 2000 символов')
    .nullable()
    .optional(),
  config: agentConfigSchema.optional(),
});

export type AgentUpdateFormData = z.infer<typeof agentUpdateSchema>;

// ============================================================================
// Test Message Schema
// ============================================================================

export const testMessageSchema = z.object({
  message: z
    .string()
    .min(1, 'Введите сообщение')
    .max(1000, 'Максимум 1000 символов'),
});

export type TestMessageFormData = z.infer<typeof testMessageSchema>;

// ============================================================================
// Template Schemas
// ============================================================================

export const templateCreateSchema = z.object({
  name: z.string().min(1, 'Обязательное поле').max(255, 'Максимум 255 символов'),
  description: z.string().nullable().optional(),
  system_prompt: z.string().min(10, 'Минимум 10 символов'),
  default_config: agentConfigSchema,
});

export type TemplateCreateFormData = z.infer<typeof templateCreateSchema>;

export const templateUpdateSchema = z.object({
  name: z.string().min(1, 'Обязательное поле').max(255, 'Максимум 255 символов').optional(),
  description: z.string().nullable().optional(),
  system_prompt: z.string().min(10, 'Минимум 10 символов').optional(),
  default_config: agentConfigSchema.optional(),
  is_active: z.boolean().optional(),
});

export type TemplateUpdateFormData = z.infer<typeof templateUpdateSchema>;

// ============================================================================
// Tool Schemas
// ============================================================================

export const toolCreateSchema = z.object({
  name: z
    .string()
    .min(1, 'Обязательное поле')
    .max(100, 'Максимум 100 символов')
    .regex(/^[a-z0-9_]+$/, 'Только латиница, цифры и подчеркивание'),
  description: z.string().min(1, 'Обязательное поле'),
  version: z.string().min(1, 'Обязательное поле').default('1.0.0'),
  schema: z.record(z.unknown()),
  is_experimental: z.boolean().default(false),
});

export type ToolCreateFormData = z.infer<typeof toolCreateSchema>;

export const toolUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Обязательное поле')
    .max(100, 'Максимум 100 символов')
    .regex(/^[a-z0-9_]+$/, 'Только латиница, цифры и подчеркивание')
    .optional(),
  description: z.string().min(1, 'Обязательное поле').optional(),
  version: z.string().min(1, 'Обязательное поле').optional(),
  schema: z.record(z.unknown()).optional(),
  is_active: z.boolean().optional(),
  is_experimental: z.boolean().optional(),
});

export type ToolUpdateFormData = z.infer<typeof toolUpdateSchema>;

// ============================================================================
// Global Config Schema
// ============================================================================

export const globalConfigUpdateSchema = z.object({
  available_models: z
    .record(
      z.object({
        name: z.string(),
        description: z.string(),
        max_tokens: z.number().min(1),
      })
    )
    .optional(),
  max_temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().min(1).optional(),
  default_model: z.string().optional(),
  rate_limit_per_hour: z.number().min(1).optional(),
});

export type GlobalConfigUpdateFormData = z.infer<typeof globalConfigUpdateSchema>;
