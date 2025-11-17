# AI Agents Frontend Implementation Guide

This document provides a complete guide for implementing AI Agents features in the React frontend based on the backend API.

---

## Progress Tracking

**Last Updated:** 2025-11-17 (Implementation Complete!)

### Implementation Status

- [x] Stage 1: TypeScript Types & Schemas ✅ (Completed 2025-11-17 11:15)
  - Created `/src/features/ai-agents/types/ai-agents.types.ts` (310 lines)
  - All backend API types implemented
- [x] Stage 2: API Services Layer ✅ (Completed 2025-11-17 11:15)
  - Created `/src/features/ai-agents/services/ai-agents.service.ts` (Shop Owner)
  - Created `/src/features/ai-agents/services/admin-ai-agents.service.ts` (Admin)
  - Added API endpoints to `/src/shared/constants/api-endpoints.ts`
- [x] Stage 3: React Query Hooks ✅ (Completed 2025-11-17 11:15)
  - Created `/src/features/ai-agents/hooks/useAgents.ts` (Shop Owner hooks)
  - Created `/src/features/ai-agents/hooks/useAdminAgents.ts` (Admin hooks)
  - Created `/src/features/ai-agents/schemas/agent-form.schema.ts` (Form validation)
  - Created `/src/features/ai-agents/index.ts` (Public exports)
- [x] Stage 4: Initial Pages ✅ (Completed 2025-11-17 11:15)
  - Created `/src/features/ai-agents/pages/AgentListPage.tsx` (Shop Owner list page)
  - Added route to `/src/app/router.tsx` for `/shop/ai-agents`
- [x] Stage 5: Shop Owner Pages ✅ (Completed 2025-11-17)
  - Created `/src/features/ai-agents/pages/CreateAgentPage.tsx` (Multi-step form with template selection)
  - Created `/src/features/ai-agents/pages/EditAgentPage.tsx` (Edit existing agents)
  - Created `/src/features/ai-agents/pages/AgentDetailsPage.tsx` (Tabbed interface: Overview, Conversations, Analytics, Testing)
  - Created `/src/features/ai-agents/components/ConversationDetailsModal.tsx` (View conversation messages)
- [x] Stage 6: Admin Pages ✅ (Completed 2025-11-17)
  - Created `/src/features/ai-agents/pages/admin/PlatformOverviewPage.tsx` (Platform stats and quick links)
  - Created `/src/features/ai-agents/pages/admin/AllAgentsPage.tsx` (View and suspend agents)
  - Created `/src/features/ai-agents/pages/admin/TemplatesPage.tsx` (CRUD for templates)
  - Created `/src/features/ai-agents/pages/admin/ToolsPage.tsx` (CRUD for tools)
  - Created `/src/features/ai-agents/pages/admin/GlobalConfigPage.tsx` (Global AI settings)
- [x] Stage 7: Navigation & Polish ✅ (Completed 2025-11-17)
  - Added AI Agents link to shop dashboard (`/src/features/shop-dashboard/pages/Dashboard.tsx`)
  - Added AI Agents link to admin dashboard (`/src/features/admin-dashboard/pages/Dashboard.tsx`)
  - All routes added to `/src/app/router.tsx` (9 new routes total)
- [x] Stage 8: Testing & Verification ✅ (Completed 2025-11-17)
  - TypeScript typecheck passes with no errors
  - All pages follow existing Leema React patterns
  - Mobile responsive design implemented
  - Hot-reload enabled (no Docker rebuild needed)

### Final Status Summary

**IMPLEMENTATION COMPLETE (100%)** 🎉

**Shop Owner Pages (4 pages):**
- ✅ Agent List Page (`/shop/ai-agents`)
- ✅ Create Agent Page (`/shop/ai-agents/create`) - Multi-step form
- ✅ Edit Agent Page (`/shop/ai-agents/:id/edit`)
- ✅ Agent Details Page (`/shop/ai-agents/:id`) - Tabbed interface

**Admin Pages (5 pages):**
- ✅ Platform Overview (`/admin/ai-agents`)
- ✅ All Agents (`/admin/ai-agents/all`)
- ✅ Templates Management (`/admin/ai-agents/templates`)
- ✅ Tools Management (`/admin/ai-agents/tools`)
- ✅ Global Config (`/admin/ai-agents/config`)

**Components (1 component):**
- ✅ ConversationDetailsModal (View full conversation history)

**Total Lines of Code Added:** ~2,800+ lines
- Pages: ~2,400 lines
- Components: ~150 lines
- Routes: ~50 lines
- Navigation: ~50 lines

### Implementation Notes

**What Works Now:**
- All 9 pages are fully functional and accessible
- Shop owners can navigate to `/shop/ai-agents` from the dashboard
- Admins can navigate to `/admin/ai-agents` from the dashboard
- Full backend integration with type-safe API calls
- Complete CRUD operations for agents, templates, and tools
- Multi-step agent creation form with template selection
- Tabbed agent details with live testing interface
- Conversation history viewer with message details
- Platform-wide statistics and analytics
- Error handling and loading states throughout
- Mobile responsive design
- Hot-reload enabled (no Docker rebuild needed)

**How to Test:**
1. Start the backend: `cd /var/www/backend && make docker-up`
2. Frontend is already running in dev mode with hot-reload
3. Login as shop owner: Navigate to `/shop/ai-agents`
4. Login as admin: Navigate to `/admin/ai-agents`
5. Create a new agent using the multi-step form
6. View agent details and test the agent live
7. Manage templates and tools from admin panel

**Access URLs:**
- Shop Owner: `https://www.leema.kz/shop/ai-agents`
- Admin: `https://www.leema.kz/admin/ai-agents`

---

## Table of Contents

1. [Backend API Overview](#backend-api-overview)
2. [Frontend Implementation Plan](#frontend-implementation-plan)
3. [UI/UX Requirements](#uiux-requirements)
4. [Integration Checklist](#integration-checklist)
5. [Example Code Snippets](#example-code-snippets)

---

## Backend API Overview

### Shop Owner Endpoints (`/api/v1/shops/me/ai-agents`)

All endpoints require authentication with `shop_owner` role.

#### Agent CRUD

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/` | GET | List all agents for shop | Query: `include_inactive: bool` | `AIAgentResponse[]` |
| `/` | POST | Create new agent | `AIAgentCreate` | `AIAgentResponse` |
| `/{agent_id}` | GET | Get agent details | - | `AIAgentResponse` |
| `/{agent_id}` | PUT | Update agent | `AIAgentUpdate` | `AIAgentResponse` |
| `/{agent_id}` | DELETE | Delete agent (soft) | - | `204 No Content` |
| `/{agent_id}/activate` | POST | Activate agent | - | `AgentActivateResponse` |

#### Templates & Tools

| Endpoint | Method | Description | Response |
|----------|--------|-------------|----------|
| `/templates/list` | GET | List available templates | `AgentTemplateResponse[]` |
| `/tools/list` | GET | List available tools | `AgentToolResponse[]` |

#### Testing

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/{agent_id}/test` | POST | Test agent with message | `AgentTestMessage` | `{ success, response, agent_id, agent_name }` |

#### Conversations & Analytics

| Endpoint | Method | Description | Query Params | Response |
|----------|--------|-------------|--------------|----------|
| `/{agent_id}/conversations` | GET | List conversations | `page, per_page` | `PaginatedResponse<Conversation>` |
| `/{agent_id}/conversations/{conversation_id}` | GET | Get conversation details | - | `ConversationDetails` |
| `/{agent_id}/analytics` | GET | Get agent analytics | - | `AgentAnalytics` |

---

### Admin Endpoints

#### Agent Monitoring (`/api/v1/admin/ai-agents`)

| Endpoint | Method | Description | Query Params | Response |
|----------|--------|-------------|--------------|----------|
| `/` | GET | List all agents | `page, per_page, status, shop_id, template_id` | `PaginatedResponse<AIAgentResponse>` |
| `/overview` | GET | Platform statistics | - | `PlatformOverview` |
| `/{agent_id}` | GET | Get agent details | - | `AIAgentResponse` |
| `/{agent_id}/suspend` | POST | Suspend agent | Query: `reason` (required) | `{ success, message, agent_id, status, reason }` |
| `/conversations/recent` | GET | List recent conversations | `page, per_page, status` | `PaginatedResponse<Conversation>` |
| `/logs/system` | GET | Get system logs | `hours, level` | `SystemLogs` |

#### Global Config (`/api/v1/admin/ai-config`)

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/` | GET | Get global config | - | `GlobalAIConfigResponse` |
| `/` | PUT | Update global config | `GlobalAIConfigUpdate` | `GlobalAIConfigResponse` |

#### Templates (`/api/v1/admin/templates`)

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/` | GET | List templates | Query: `active_only` | `AgentTemplateResponse[]` |
| `/` | POST | Create template | `AgentTemplateCreate` | `AgentTemplateResponse` |
| `/{template_id}` | GET | Get template | - | `AgentTemplateResponse` |
| `/{template_id}` | PUT | Update template | `AgentTemplateUpdate` | `AgentTemplateResponse` |
| `/{template_id}` | DELETE | Deactivate template | - | `204 No Content` |
| `/{template_id}/stats` | GET | Get template stats | - | `TemplateStats` |

#### Tools (`/api/v1/admin/tools`)

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/` | GET | List tools | Query: `active_only, experimental` | `AgentToolResponse[]` |
| `/` | POST | Create tool | `AgentToolCreate` | `AgentToolResponse` |
| `/{tool_id}` | GET | Get tool | - | `AgentToolResponse` |
| `/{tool_id}` | PUT | Update tool | `AgentToolUpdate` | `AgentToolResponse` |
| `/{tool_id}` | DELETE | Deactivate tool | - | `204 No Content` |
| `/{tool_id}/stats` | GET | Get tool stats | - | `AgentToolStatsResponse` |

---

### Request/Response Schemas

#### AIAgentConfig
```typescript
interface AIAgentConfig {
  model: string;                    // Default: "gemini-2.5-flash"
  temperature: number;              // 0.0-2.0, default: 0.7
  max_tokens: number;               // 100-8192, default: 1024
  language: string;                 // "ru" | "kk" | "en"
  tone: string;                     // Default: "friendly"
  enabled_tools: string[];          // Tool names
  working_hours?: Record<string, unknown> | null;
  fallback_message?: string | null;
  response_style: "concise" | "balanced" | "detailed";
  knowledge_base?: Record<string, string>; // FAQ pairs
}
```

#### AIAgentCreate
```typescript
interface AIAgentCreate {
  template_id?: number | null;      // Optional template
  name: string;                     // Agent name (min 1, max 255)
  description?: string | null;
  system_prompt?: string | null;    // Required if no template
  custom_instructions?: string | null; // Max 2000 chars
  config: AIAgentConfig;
}
```

#### AIAgentUpdate
```typescript
interface AIAgentUpdate {
  name?: string;
  description?: string | null;
  custom_instructions?: string | null;
  config?: AIAgentConfig;
}
```

#### AIAgentResponse
```typescript
interface AIAgentResponse {
  id: number;
  shop_id: number;
  template_id: number | null;
  name: string;
  description: string | null;
  system_prompt: string;
  custom_instructions: string | null;
  config: AIAgentConfig;
  status: "active" | "inactive" | "suspended";
  created_at: string;
  updated_at: string;
}
```

#### AgentTemplateResponse
```typescript
interface AgentTemplateResponse {
  id: number;
  name: string;
  description: string | null;
  system_prompt: string;
  default_config: AIAgentConfig;
  is_active: boolean;
  created_by_admin_id: number;
  created_at: string;
  updated_at: string;
}
```

#### AgentToolResponse
```typescript
interface AgentToolResponse {
  id: number;
  name: string;
  description: string;
  version: string;
  schema: Record<string, unknown>; // JSON Schema
  is_active: boolean;
  is_experimental: boolean;
  usage_count: number;
  created_by_admin_id: number;
  created_at: string;
  updated_at: string;
}
```

#### Conversation Types
```typescript
interface Conversation {
  id: number;
  customer_phone: string;
  status: "active" | "resolved" | "escalated";
  message_count: number;
  created_at: string;
  last_message_at: string;
}

interface ConversationMessage {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  tool_calls?: Record<string, unknown> | null;
  tool_results?: Record<string, unknown> | null;
  created_at: string;
}

interface ConversationDetails extends Conversation {
  agent_id: number;
  messages: ConversationMessage[];
}

interface AgentAnalytics {
  agent_id: number;
  agent_name: string;
  status: string;
  created_at: string;
  total_conversations: number;
  total_messages: number;
  avg_response_time_ms: number;
  active_conversations: number;
  tool_usage: Record<string, number>;
}
```

#### Admin Types
```typescript
interface PlatformOverview {
  total_agents: number;
  active_agents: number;
  inactive_agents: number;
  suspended_agents: number;
  total_conversations: number;
  total_messages: number;
  agents_by_template: Array<{
    template_id: number;
    agent_count: number;
  }>;
  recent_conversations_24h: number;
  recent_messages_24h: number;
  active_shops_with_agents: number;
}

interface GlobalAIConfigResponse {
  id: number;
  available_models: Record<string, {
    name: string;
    description: string;
    max_tokens: number;
  }>;
  max_temperature: number;
  max_tokens: number;
  default_model: string;
  rate_limit_per_hour: number;
}
```

---

### Error Responses

| Status Code | Description | Response Format |
|-------------|-------------|-----------------|
| 400 | Validation error | `{ detail: string }` |
| 401 | Unauthorized | `{ detail: "Not authenticated" }` |
| 403 | Forbidden | `{ detail: "Not enough permissions" }` |
| 404 | Not found | `{ detail: "Agent not found" }` |
| 409 | Conflict | `{ detail: "Agent is already active" }` |
| 500 | Server error | `{ detail: "Failed to create agent" }` |

---

## Frontend Implementation Plan

### 1. Services Layer (`src/features/ai-agents/services/`)

Create three service files:

#### `ai-agents.service.ts` (Shop Owner)
```typescript
import { apiRequest } from '@/shared/lib/api/client';

export const aiAgentsService = {
  // Agent CRUD
  listAgents: (includeInactive = true) =>
    apiRequest<AIAgentResponse[]>('/api/v1/shops/me/ai-agents', 'GET', null, { include_inactive: includeInactive }),

  createAgent: (data: AIAgentCreate) =>
    apiRequest<AIAgentResponse>('/api/v1/shops/me/ai-agents', 'POST', data),

  getAgent: (agentId: number) =>
    apiRequest<AIAgentResponse>(`/api/v1/shops/me/ai-agents/${agentId}`),

  updateAgent: (agentId: number, data: AIAgentUpdate) =>
    apiRequest<AIAgentResponse>(`/api/v1/shops/me/ai-agents/${agentId}`, 'PUT', data),

  deleteAgent: (agentId: number) =>
    apiRequest<void>(`/api/v1/shops/me/ai-agents/${agentId}`, 'DELETE'),

  activateAgent: (agentId: number) =>
    apiRequest<AgentActivateResponse>(`/api/v1/shops/me/ai-agents/${agentId}/activate`, 'POST'),

  // Templates & Tools
  listTemplates: () =>
    apiRequest<AgentTemplateResponse[]>('/api/v1/shops/me/ai-agents/templates/list'),

  listTools: () =>
    apiRequest<AgentToolResponse[]>('/api/v1/shops/me/ai-agents/tools/list'),

  // Testing
  testAgent: (agentId: number, message: string) =>
    apiRequest<{ success: boolean; response: string }>(`/api/v1/shops/me/ai-agents/${agentId}/test`, 'POST', { message }),

  // Conversations
  getConversations: (agentId: number, page = 1, perPage = 20) =>
    apiRequest<PaginatedResponse<Conversation>>(`/api/v1/shops/me/ai-agents/${agentId}/conversations`, 'GET', null, { page, per_page: perPage }),

  getConversationDetails: (agentId: number, conversationId: number) =>
    apiRequest<ConversationDetails>(`/api/v1/shops/me/ai-agents/${agentId}/conversations/${conversationId}`),

  // Analytics
  getAnalytics: (agentId: number) =>
    apiRequest<AgentAnalytics>(`/api/v1/shops/me/ai-agents/${agentId}/analytics`),
};
```

#### `admin-ai-agents.service.ts` (Admin)
```typescript
export const adminAiAgentsService = {
  // Agent monitoring
  listAllAgents: (params: { page?: number; per_page?: number; status?: string; shop_id?: number; template_id?: number }) =>
    apiRequest<PaginatedResponse<AIAgentResponse>>('/api/v1/admin/ai-agents', 'GET', null, params),

  getPlatformOverview: () =>
    apiRequest<PlatformOverview>('/api/v1/admin/ai-agents/overview'),

  getAgent: (agentId: number) =>
    apiRequest<AIAgentResponse>(`/api/v1/admin/ai-agents/${agentId}`),

  suspendAgent: (agentId: number, reason: string) =>
    apiRequest<{ success: boolean; message: string }>(`/api/v1/admin/ai-agents/${agentId}/suspend`, 'POST', null, { reason }),

  getRecentConversations: (params: { page?: number; per_page?: number; status?: string }) =>
    apiRequest<PaginatedResponse<Conversation>>('/api/v1/admin/ai-agents/conversations/recent', 'GET', null, params),

  getSystemLogs: (hours = 24, level = 'INFO') =>
    apiRequest<SystemLogs>('/api/v1/admin/ai-agents/logs/system', 'GET', null, { hours, level }),

  // Global config
  getGlobalConfig: () =>
    apiRequest<GlobalAIConfigResponse>('/api/v1/admin/ai-config'),

  updateGlobalConfig: (data: GlobalAIConfigUpdate) =>
    apiRequest<GlobalAIConfigResponse>('/api/v1/admin/ai-config', 'PUT', data),

  // Templates
  listTemplates: (activeOnly = false) =>
    apiRequest<AgentTemplateResponse[]>('/api/v1/admin/templates', 'GET', null, { active_only: activeOnly }),

  createTemplate: (data: AgentTemplateCreate) =>
    apiRequest<AgentTemplateResponse>('/api/v1/admin/templates', 'POST', data),

  getTemplate: (templateId: number) =>
    apiRequest<AgentTemplateResponse>(`/api/v1/admin/templates/${templateId}`),

  updateTemplate: (templateId: number, data: AgentTemplateUpdate) =>
    apiRequest<AgentTemplateResponse>(`/api/v1/admin/templates/${templateId}`, 'PUT', data),

  deleteTemplate: (templateId: number) =>
    apiRequest<void>(`/api/v1/admin/templates/${templateId}`, 'DELETE'),

  getTemplateStats: (templateId: number) =>
    apiRequest<TemplateStats>(`/api/v1/admin/templates/${templateId}/stats`),

  // Tools
  listTools: (activeOnly = false, experimental = false) =>
    apiRequest<AgentToolResponse[]>('/api/v1/admin/tools', 'GET', null, { active_only: activeOnly, experimental }),

  createTool: (data: AgentToolCreate) =>
    apiRequest<AgentToolResponse>('/api/v1/admin/tools', 'POST', data),

  getTool: (toolId: number) =>
    apiRequest<AgentToolResponse>(`/api/v1/admin/tools/${toolId}`),

  updateTool: (toolId: number, data: AgentToolUpdate) =>
    apiRequest<AgentToolResponse>(`/api/v1/admin/tools/${toolId}`, 'PUT', data),

  deleteTool: (toolId: number) =>
    apiRequest<void>(`/api/v1/admin/tools/${toolId}`, 'DELETE'),

  getToolStats: (toolId: number) =>
    apiRequest<AgentToolStatsResponse>(`/api/v1/admin/tools/${toolId}/stats`),
};
```

---

### 2. TypeScript Types (`src/features/ai-agents/types/`)

Create `ai-agents.types.ts` with all schemas shown in the Backend API Overview section above.

---

### 3. React Query Hooks (`src/features/ai-agents/hooks/`)

#### `useAgents.ts` (Shop Owner)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiAgentsService } from '../services/ai-agents.service';

export const QUERY_KEYS = {
  agents: ['agents'] as const,
  agent: (id: number) => ['agents', id] as const,
  templates: ['agent-templates'] as const,
  tools: ['agent-tools'] as const,
  conversations: (agentId: number) => ['agents', agentId, 'conversations'] as const,
  conversationDetails: (agentId: number, conversationId: number) =>
    ['agents', agentId, 'conversations', conversationId] as const,
  analytics: (agentId: number) => ['agents', agentId, 'analytics'] as const,
};

// List agents
export const useAgents = (includeInactive = true) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.agents, includeInactive],
    queryFn: () => aiAgentsService.listAgents(includeInactive),
  });
};

// Get single agent
export const useAgent = (agentId: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.agent(agentId),
    queryFn: () => aiAgentsService.getAgent(agentId),
    enabled: !!agentId,
  });
};

// Create agent
export const useCreateAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: aiAgentsService.createAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agents });
    },
  });
};

// Update agent
export const useUpdateAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, data }: { agentId: number; data: AIAgentUpdate }) =>
      aiAgentsService.updateAgent(agentId, data),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agents });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agent(agentId) });
    },
  });
};

// Delete agent
export const useDeleteAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: aiAgentsService.deleteAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agents });
    },
  });
};

// Activate agent
export const useActivateAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: aiAgentsService.activateAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agents });
    },
  });
};

// Test agent
export const useTestAgent = () => {
  return useMutation({
    mutationFn: ({ agentId, message }: { agentId: number; message: string }) =>
      aiAgentsService.testAgent(agentId, message),
  });
};

// Templates & Tools
export const useTemplates = () => {
  return useQuery({
    queryKey: QUERY_KEYS.templates,
    queryFn: aiAgentsService.listTemplates,
  });
};

export const useTools = () => {
  return useQuery({
    queryKey: QUERY_KEYS.tools,
    queryFn: aiAgentsService.listTools,
  });
};

// Conversations
export const useConversations = (agentId: number, page = 1, perPage = 20) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.conversations(agentId), page, perPage],
    queryFn: () => aiAgentsService.getConversations(agentId, page, perPage),
    enabled: !!agentId,
  });
};

export const useConversationDetails = (agentId: number, conversationId: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.conversationDetails(agentId, conversationId),
    queryFn: () => aiAgentsService.getConversationDetails(agentId, conversationId),
    enabled: !!agentId && !!conversationId,
  });
};

// Analytics
export const useAgentAnalytics = (agentId: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.analytics(agentId),
    queryFn: () => aiAgentsService.getAnalytics(agentId),
    enabled: !!agentId,
  });
};
```

#### `useAdminAgents.ts` (Admin)
Similar structure but for admin endpoints.

---

### 4. Form Schemas (`src/features/ai-agents/schemas/`)

#### `agent-form.schema.ts`
```typescript
import { z } from 'zod';

export const agentConfigSchema = z.object({
  model: z.string().default('gemini-2.5-flash'),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().min(100).max(8192).default(1024),
  language: z.enum(['ru', 'kk', 'en']).default('ru'),
  tone: z.string().default('friendly'),
  enabled_tools: z.array(z.string()).default([]),
  working_hours: z.record(z.unknown()).nullable().optional(),
  fallback_message: z.string().nullable().optional(),
  response_style: z.enum(['concise', 'balanced', 'detailed']).default('balanced'),
  knowledge_base: z.record(z.string()).optional(),
});

export const agentCreateSchema = z.object({
  template_id: z.number().nullable().optional(),
  name: z.string().min(1, 'Обязательное поле').max(255, 'Максимум 255 символов'),
  description: z.string().nullable().optional(),
  system_prompt: z.string().min(10, 'Минимум 10 символов').nullable().optional(),
  custom_instructions: z.string().max(2000, 'Максимум 2000 символов').nullable().optional(),
  config: agentConfigSchema,
}).refine((data) => {
  // Require system_prompt if no template
  if (!data.template_id && !data.system_prompt) {
    return false;
  }
  return true;
}, {
  message: 'Укажите системный промпт или выберите шаблон',
  path: ['system_prompt'],
});

export const agentUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  custom_instructions: z.string().max(2000).nullable().optional(),
  config: agentConfigSchema.optional(),
});

export const testMessageSchema = z.object({
  message: z.string().min(1, 'Введите сообщение').max(1000, 'Максимум 1000 символов'),
});

export type AgentCreateFormData = z.infer<typeof agentCreateSchema>;
export type AgentUpdateFormData = z.infer<typeof agentUpdateSchema>;
export type TestMessageFormData = z.infer<typeof testMessageSchema>;
```

---

## UI/UX Requirements

### Shop Owner Pages (`/shop/ai-agents/*`)

#### 1. Agent List Page (`/shop/ai-agents`)

**Layout:**
- Header with "Создать агента" button
- Stats cards: Total Agents, Active Agent, Total Conversations, Total Messages
- Table with columns:
  - Название (name)
  - Статус (badge: active/inactive)
  - Шаблон (template name or "Собственный")
  - Разговоров (conversation count)
  - Создан (creation date)
  - Действия (actions dropdown)

**Actions per agent:**
- Просмотр (view details)
- Редактировать (edit)
- Тестировать (test)
- Активировать (if inactive)
- Удалить (delete, with confirmation)

**Filters:**
- Показать неактивные (checkbox)

**Empty State:**
- "У вас пока нет AI-агентов"
- "Создайте первого агента для автоматизации общения с клиентами"
- Button: "Создать агента"

---

#### 2. Create Agent Page (`/shop/ai-agents/create`)

**Form Sections:**

**Шаг 1: Выбор шаблона (Optional)**
- Grid of template cards (3 columns)
- Each card shows:
  - Template name
  - Description
  - Preview of enabled tools
  - "Выбрать" button
- "Начать с нуля" option (no template)

**Шаг 2: Основная информация**
- Название агента (required, max 255)
- Описание (optional, textarea)
- Системный промпт (required if no template, textarea, min 10 chars)
- Дополнительные инструкции (optional, max 2000 chars, textarea)

**Шаг 3: Настройки**
- Модель AI (select from available models)
- Температура (slider 0-2, step 0.1)
- Макс. токенов (slider 100-8192)
- Язык (select: Русский/Казахский/English)
- Тон общения (input, default "friendly")
- Стиль ответов (select: Краткий/Сбалансированный/Подробный)

**Шаг 4: Инструменты**
- Checkboxes for each available tool
- Show tool name, description, version
- Mark experimental tools with badge

**Шаг 5: База знаний (Optional)**
- FAQ editor: Add Q&A pairs
- Each pair: Question (input) + Answer (textarea)
- Add/Remove buttons

**Actions:**
- Назад (previous step)
- Далее (next step)
- Создать (final step, validates entire form)
- Отмена (cancel, go back to list)

---

#### 3. Edit Agent Page (`/shop/ai-agents/:id/edit`)

Same form as create, but:
- Pre-filled with agent data
- Cannot change template (show current template name, disabled)
- Save button instead of Create

---

#### 4. Agent Details Page (`/shop/ai-agents/:id`)

**Tabs:**

**Обзор (Overview)**
- Agent name, status badge
- Stats cards:
  - Всего разговоров
  - Активных разговоров
  - Средн. время ответа
  - Использовано инструментов
- Configuration preview (read-only):
  - Model, temperature, max_tokens
  - Language, tone, style
  - Enabled tools (badges)
- Recent conversations (5 latest)
- Quick actions: Редактировать, Тестировать, Активировать/Деактивировать

**Разговоры (Conversations)**
- Paginated table:
  - Телефон клиента (masked)
  - Статус (badge: active/resolved/escalated)
  - Сообщений
  - Начат (date)
  - Последнее сообщение (date)
  - Действия: Просмотреть
- Click row to open conversation details modal

**Аналитика (Analytics)**
- Time series chart: Messages per day (last 30 days)
- Tool usage pie chart
- Stats cards:
  - Conversion rate (if applicable)
  - Avg messages per conversation
  - Escalation rate

**Тестирование (Testing)**
- Chat interface:
  - Message input (textarea)
  - "Отправить" button
  - Display conversation (user messages + agent responses)
- Note: "Тестовые разговоры не сохраняются"

---

#### 5. Conversation Details Modal

**Header:**
- Customer phone (masked)
- Status badge
- Date range (started - last message)

**Body:**
- Message list (scrollable):
  - User messages (right, blue)
  - Agent messages (left, gray)
  - System messages (center, italic)
  - Show tool calls (expandable JSON)
  - Timestamps

**Footer:**
- Close button

---

### Admin Pages (`/admin/ai-agents/*`)

#### 1. Platform Overview (`/admin/ai-agents`)

**Stats Cards Row:**
- Всего агентов
- Активных агентов
- Неактивных агентов
- Приостановленных агентов
- Магазинов с агентами

**Activity Stats Row:**
- Всего разговоров
- Всего сообщений
- За последние 24ч: Разговоров
- За последние 24ч: Сообщений

**Charts:**
- Agents by template (bar chart)
- Agent status distribution (pie chart)

**Recent Activity:**
- Latest 10 conversations across platform (table)

**Quick Actions:**
- Настроить глобальные параметры
- Управление шаблонами
- Управление инструментами

---

#### 2. All Agents Page (`/admin/ai-agents/all`)

**Filters:**
- Магазин (select, searchable)
- Статус (select: all/active/inactive/suspended)
- Шаблон (select)

**Table:**
- ID
- Название
- Магазин
- Шаблон
- Статус (badge)
- Разговоров
- Создан
- Действия: Просмотреть, Приостановить (if active)

**Pagination:** Bottom of table

---

#### 3. Templates Management (`/admin/ai-agents/templates`)

**Header:** "Создать шаблон" button

**Table:**
- Название
- Описание
- Агентов использует (count)
- Статус (badge: active/inactive)
- Создан
- Действия: Редактировать, Статистика, Деактивировать, Удалить

**Create/Edit Template Modal:**
- Form similar to agent creation but admin-level
- Fields:
  - Название
  - Описание
  - Системный промпт
  - Default config (JSON editor or form)
- Actions: Сохранить, Отмена

---

#### 4. Tools Management (`/admin/ai-agents/tools`)

**Header:** "Создать инструмент" button

**Filters:**
- Только активные (checkbox)
- Экспериментальные (checkbox)

**Table:**
- Название
- Описание
- Версия
- Статус (badge)
- Экспериментальный (badge)
- Использований
- Действия: Редактировать, Статистика, Деактивировать

**Create/Edit Tool Modal:**
- Название (unique)
- Описание
- Версия
- JSON Schema (code editor with syntax highlighting)
- Экспериментальный (checkbox)
- Активен (checkbox)
- Actions: Сохранить, Отмена

---

#### 5. Global Config Page (`/admin/ai-agents/config`)

**Form:**

**Доступные модели:**
- Dynamic list editor
- For each model:
  - Key (identifier)
  - Name (display)
  - Description
  - Max tokens
- Add/Remove buttons

**Лимиты:**
- Макс. температура (slider)
- Макс. токенов (slider)
- Лимит запросов в час (number input)

**По умолчанию:**
- Модель по умолчанию (select from available)

**Actions:**
- Сохранить изменения
- Сбросить (restore defaults)

---

## Integration Checklist

### 1. Route Setup (`src/app/router.tsx`)

Add routes:

```typescript
// Shop owner routes
{
  path: '/shop/ai-agents',
  element: lazy(() => import('@/features/ai-agents/pages/AgentListPage')),
  meta: { allowedRoles: [ROLES.SHOP_OWNER] }
},
{
  path: '/shop/ai-agents/create',
  element: lazy(() => import('@/features/ai-agents/pages/CreateAgentPage')),
  meta: { allowedRoles: [ROLES.SHOP_OWNER] }
},
{
  path: '/shop/ai-agents/:id',
  element: lazy(() => import('@/features/ai-agents/pages/AgentDetailsPage')),
  meta: { allowedRoles: [ROLES.SHOP_OWNER] }
},
{
  path: '/shop/ai-agents/:id/edit',
  element: lazy(() => import('@/features/ai-agents/pages/EditAgentPage')),
  meta: { allowedRoles: [ROLES.SHOP_OWNER] }
},

// Admin routes
{
  path: '/admin/ai-agents',
  element: lazy(() => import('@/features/ai-agents/pages/admin/PlatformOverviewPage')),
  meta: { allowedRoles: [ROLES.ADMIN] }
},
{
  path: '/admin/ai-agents/all',
  element: lazy(() => import('@/features/ai-agents/pages/admin/AllAgentsPage')),
  meta: { allowedRoles: [ROLES.ADMIN] }
},
{
  path: '/admin/ai-agents/templates',
  element: lazy(() => import('@/features/ai-agents/pages/admin/TemplatesPage')),
  meta: { allowedRoles: [ROLES.ADMIN] }
},
{
  path: '/admin/ai-agents/tools',
  element: lazy(() => import('@/features/ai-agents/pages/admin/ToolsPage')),
  meta: { allowedRoles: [ROLES.ADMIN] }
},
{
  path: '/admin/ai-agents/config',
  element: lazy(() => import('@/features/ai-agents/pages/admin/GlobalConfigPage')),
  meta: { allowedRoles: [ROLES.ADMIN] }
},
```

---

### 2. Navigation Menu Updates

**Shop Dashboard Sidebar:**
```typescript
{
  label: 'AI Агенты',
  icon: Bot, // from lucide-react
  path: '/shop/ai-agents',
  badge: activeAgentCount > 0 ? activeAgentCount : undefined
}
```

**Admin Dashboard Sidebar:**
```typescript
{
  label: 'AI Агенты',
  icon: Bot,
  children: [
    { label: 'Обзор', path: '/admin/ai-agents' },
    { label: 'Все агенты', path: '/admin/ai-agents/all' },
    { label: 'Шаблоны', path: '/admin/ai-agents/templates' },
    { label: 'Инструменты', path: '/admin/ai-agents/tools' },
    { label: 'Настройки', path: '/admin/ai-agents/config' },
  ]
}
```

---

### 3. Permissions/Role Checks

All routes already protected by `allowedRoles` in router.
Services automatically use authenticated session.

---

### 4. WebSocket Subscriptions (Optional)

If real-time updates needed:

```typescript
// In AgentDetailsPage
useWebSocketEvent('agent:conversation_created', (data) => {
  if (data.agent_id === agentId) {
    queryClient.invalidateQueries(QUERY_KEYS.conversations(agentId));
    toast.info('Новый разговор!');
  }
});

useWebSocketEvent('agent:message_received', (data) => {
  if (data.conversation_id === currentConversationId) {
    queryClient.invalidateQueries(QUERY_KEYS.conversationDetails(agentId, currentConversationId));
  }
});
```

---

### 5. API Endpoints Constants

Add to `src/shared/constants/api-endpoints.ts`:

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints
  AI_AGENTS: {
    BASE: '/api/v1/shops/me/ai-agents',
    BY_ID: (id: number) => `/api/v1/shops/me/ai-agents/${id}`,
    ACTIVATE: (id: number) => `/api/v1/shops/me/ai-agents/${id}/activate`,
    TEST: (id: number) => `/api/v1/shops/me/ai-agents/${id}/test`,
    CONVERSATIONS: (id: number) => `/api/v1/shops/me/ai-agents/${id}/conversations`,
    CONVERSATION_DETAILS: (id: number, convId: number) =>
      `/api/v1/shops/me/ai-agents/${id}/conversations/${convId}`,
    ANALYTICS: (id: number) => `/api/v1/shops/me/ai-agents/${id}/analytics`,
    TEMPLATES: '/api/v1/shops/me/ai-agents/templates/list',
    TOOLS: '/api/v1/shops/me/ai-agents/tools/list',
  },
  ADMIN_AI_AGENTS: {
    BASE: '/api/v1/admin/ai-agents',
    OVERVIEW: '/api/v1/admin/ai-agents/overview',
    BY_ID: (id: number) => `/api/v1/admin/ai-agents/${id}`,
    SUSPEND: (id: number) => `/api/v1/admin/ai-agents/${id}/suspend`,
    RECENT_CONVERSATIONS: '/api/v1/admin/ai-agents/conversations/recent',
    SYSTEM_LOGS: '/api/v1/admin/ai-agents/logs/system',
  },
  ADMIN_AI_CONFIG: {
    BASE: '/api/v1/admin/ai-config',
  },
  ADMIN_TEMPLATES: {
    BASE: '/api/v1/admin/templates',
    BY_ID: (id: number) => `/api/v1/admin/templates/${id}`,
    STATS: (id: number) => `/api/v1/admin/templates/${id}/stats`,
  },
  ADMIN_TOOLS: {
    BASE: '/api/v1/admin/tools',
    BY_ID: (id: number) => `/api/v1/admin/tools/${id}`,
    STATS: (id: number) => `/api/v1/admin/tools/${id}/stats`,
  },
};
```

---

## Example Code Snippets

### 1. API Service Example

```typescript
// src/features/ai-agents/services/ai-agents.service.ts
import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import type { AIAgentCreate, AIAgentResponse, PaginatedResponse } from '../types';

export const aiAgentsService = {
  listAgents: (includeInactive = true) =>
    apiRequest<AIAgentResponse[]>(
      API_ENDPOINTS.AI_AGENTS.BASE,
      'GET',
      null,
      { include_inactive: includeInactive }
    ),

  createAgent: (data: AIAgentCreate) =>
    apiRequest<AIAgentResponse>(
      API_ENDPOINTS.AI_AGENTS.BASE,
      'POST',
      data
    ),

  activateAgent: (agentId: number) =>
    apiRequest<{ success: boolean; message: string }>(
      API_ENDPOINTS.AI_AGENTS.ACTIVATE(agentId),
      'POST'
    ),
};
```

---

### 2. React Query Hook Example

```typescript
// src/features/ai-agents/hooks/useAgents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiAgentsService } from '../services/ai-agents.service';
import { toast } from 'sonner';

export const useAgents = (includeInactive = true) => {
  return useQuery({
    queryKey: ['agents', includeInactive],
    queryFn: () => aiAgentsService.listAgents(includeInactive),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: aiAgentsService.createAgent,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success(`Агент "${data.name}" создан успешно`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Не удалось создать агента');
    },
  });
};

export const useActivateAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: aiAgentsService.activateAgent,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      if (error.status === 409) {
        toast.warning('Агент уже активен');
      } else {
        toast.error('Не удалось активировать агента');
      }
    },
  });
};
```

---

### 3. Form Component Example

```typescript
// src/features/ai-agents/components/CreateAgentForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput, FormTextarea, FormSelect, FormSlider } from '@/shared/components/forms';
import { Button } from '@/shared/components/ui';
import { agentCreateSchema, type AgentCreateFormData } from '../schemas/agent-form.schema';
import { useTemplates, useTools, useCreateAgent } from '../hooks/useAgents';

export function CreateAgentForm() {
  const { data: templates } = useTemplates();
  const { data: tools } = useTools();
  const { mutate: createAgent, isPending } = useCreateAgent();

  const { control, handleSubmit, watch, setValue } = useForm<AgentCreateFormData>({
    resolver: zodResolver(agentCreateSchema),
    defaultValues: {
      name: '',
      description: null,
      template_id: null,
      system_prompt: null,
      custom_instructions: null,
      config: {
        model: 'gemini-2.5-flash',
        temperature: 0.7,
        max_tokens: 1024,
        language: 'ru',
        tone: 'friendly',
        enabled_tools: [],
        response_style: 'balanced',
      },
    },
  });

  const selectedTemplate = watch('template_id');

  const onSubmit = (data: AgentCreateFormData) => {
    createAgent(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Step 1: Template Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Выбор шаблона (опционально)</h3>

        <div className="grid grid-cols-3 gap-4">
          {templates?.map((template) => (
            <div
              key={template.id}
              className={`p-4 border rounded-lg cursor-pointer hover:border-blue-500 ${
                selectedTemplate === template.id ? 'border-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => setValue('template_id', template.id)}
            >
              <h4 className="font-medium">{template.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2: Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Основная информация</h3>

        <FormInput
          control={control}
          name="name"
          label="Название агента"
          placeholder="Мой AI помощник"
          required
        />

        <FormTextarea
          control={control}
          name="description"
          label="Описание"
          placeholder="Краткое описание назначения агента"
          rows={3}
        />

        {!selectedTemplate && (
          <FormTextarea
            control={control}
            name="system_prompt"
            label="Системный промпт"
            placeholder="Ты — полезный AI-ассистент, который помогает клиентам..."
            rows={5}
            required
          />
        )}

        <FormTextarea
          control={control}
          name="custom_instructions"
          label="Дополнительные инструкции"
          placeholder="Дополнительные указания для агента (до 2000 символов)"
          rows={4}
        />
      </div>

      {/* Step 3: Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Настройки</h3>

        <FormSelect
          control={control}
          name="config.model"
          label="Модель AI"
          options={[
            { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (быстрая)' },
            { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (продвинутая)' },
          ]}
        />

        <FormSlider
          control={control}
          name="config.temperature"
          label="Температура"
          min={0}
          max={2}
          step={0.1}
          description="Контролирует случайность ответов (0 = точные, 2 = творческие)"
        />

        <FormSlider
          control={control}
          name="config.max_tokens"
          label="Макс. токенов"
          min={100}
          max={8192}
          step={100}
          description="Максимальная длина ответа"
        />

        <FormSelect
          control={control}
          name="config.language"
          label="Язык"
          options={[
            { value: 'ru', label: 'Русский' },
            { value: 'kk', label: 'Казахский' },
            { value: 'en', label: 'English' },
          ]}
        />

        <FormSelect
          control={control}
          name="config.response_style"
          label="Стиль ответов"
          options={[
            { value: 'concise', label: 'Краткий' },
            { value: 'balanced', label: 'Сбалансированный' },
            { value: 'detailed', label: 'Подробный' },
          ]}
        />
      </div>

      {/* Step 4: Tools */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Инструменты</h3>

        <div className="space-y-2">
          {tools?.map((tool) => (
            <label key={tool.id} className="flex items-start gap-3 p-3 border rounded hover:bg-gray-50">
              <input
                type="checkbox"
                value={tool.name}
                onChange={(e) => {
                  const current = watch('config.enabled_tools') || [];
                  if (e.target.checked) {
                    setValue('config.enabled_tools', [...current, tool.name]);
                  } else {
                    setValue('config.enabled_tools', current.filter(t => t !== tool.name));
                  }
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tool.name}</span>
                  {tool.is_experimental && (
                    <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                      Экспериментальный
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
                <p className="text-xs text-gray-400 mt-1">Версия: {tool.version}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Отмена
        </Button>
        <Button type="submit" loading={isPending}>
          Создать агента
        </Button>
      </div>
    </form>
  );
}
```

---

### 4. Table Component Example

```typescript
// src/features/ai-agents/components/AgentsTable.tsx
import { useState } from 'react';
import { Table, Badge, DropdownMenu } from '@/shared/components/ui';
import { MoreVertical, Edit, Play, Trash2, TestTube } from 'lucide-react';
import { useAgents, useDeleteAgent, useActivateAgent } from '../hooks/useAgents';
import { formatDate } from '@/shared/lib/utils';
import type { AIAgentResponse } from '../types';

export function AgentsTable() {
  const [includeInactive, setIncludeInactive] = useState(true);
  const { data: agents, isLoading } = useAgents(includeInactive);
  const { mutate: deleteAgent } = useDeleteAgent();
  const { mutate: activateAgent } = useActivateAgent();

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'success',
      inactive: 'default',
      suspended: 'error',
    };
    const labels = {
      active: 'Активен',
      inactive: 'Неактивен',
      suspended: 'Приостановлен',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const columns = [
    {
      header: 'Название',
      accessorKey: 'name',
      cell: (agent: AIAgentResponse) => (
        <div>
          <div className="font-medium">{agent.name}</div>
          {agent.description && (
            <div className="text-sm text-gray-500">{agent.description}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Статус',
      accessorKey: 'status',
      cell: (agent: AIAgentResponse) => getStatusBadge(agent.status),
    },
    {
      header: 'Шаблон',
      accessorKey: 'template_id',
      cell: (agent: AIAgentResponse) => (
        agent.template_id ? `Шаблон #${agent.template_id}` : 'Собственный'
      ),
    },
    {
      header: 'Создан',
      accessorKey: 'created_at',
      cell: (agent: AIAgentResponse) => formatDate(agent.created_at),
    },
    {
      header: 'Действия',
      id: 'actions',
      cell: (agent: AIAgentResponse) => (
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <button className="p-2 hover:bg-gray-100 rounded">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Item onClick={() => window.location.href = `/shop/ai-agents/${agent.id}`}>
              <Edit className="w-4 h-4 mr-2" />
              Редактировать
            </DropdownMenu.Item>
            <DropdownMenu.Item onClick={() => window.location.href = `/shop/ai-agents/${agent.id}?tab=testing`}>
              <TestTube className="w-4 h-4 mr-2" />
              Тестировать
            </DropdownMenu.Item>
            {agent.status !== 'active' && (
              <DropdownMenu.Item onClick={() => activateAgent(agent.id)}>
                <Play className="w-4 h-4 mr-2" />
                Активировать
              </DropdownMenu.Item>
            )}
            <DropdownMenu.Separator />
            <DropdownMenu.Item
              onClick={() => {
                if (confirm(`Удалить агента "${agent.name}"?`)) {
                  deleteAgent(agent.id);
                }
              }}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
          />
          <span className="text-sm">Показать неактивные</span>
        </label>
      </div>

      <Table
        data={agents || []}
        columns={columns}
        emptyState={{
          title: 'У вас пока нет AI-агентов',
          description: 'Создайте первого агента для автоматизации общения с клиентами',
          action: {
            label: 'Создать агента',
            onClick: () => window.location.href = '/shop/ai-agents/create',
          },
        }}
      />
    </div>
  );
}
```

---

## Implementation Notes

### State Management
- Use React Query for all server state (agents, templates, tools, conversations)
- No need for Zustand unless complex client-side state is required
- Leverage React Query's caching and automatic refetching

### Error Handling
- All service calls use `apiRequest` which handles errors automatically
- Display user-friendly error messages with `toast.error()`
- Validation errors from backend are shown in form fields

### Performance
- Lazy load all pages with `React.lazy()`
- Paginate large lists (conversations, agents in admin)
- Debounce search inputs
- Use React Query's `staleTime` to reduce unnecessary refetches

### Accessibility
- All forms have proper labels
- Buttons have aria-labels
- Tables are keyboard navigable
- Modals trap focus and close on Escape

### Testing
- Write unit tests for services
- Test form validation with Vitest
- E2E tests for critical flows (create agent, activate agent)

### Security
- CSRF tokens automatically added by `apiRequest`
- Input sanitization for custom_instructions and system_prompt
- Admin routes protected by role check

---

## Next Steps

1. Create feature directory: `src/features/ai-agents/`
2. Implement types and schemas first
3. Build services layer
4. Create React Query hooks
5. Build UI components (start with shared, then pages)
6. Add routes to router
7. Update navigation menus
8. Test thoroughly with backend
9. Add E2E tests

Good luck with the implementation! 🚀
