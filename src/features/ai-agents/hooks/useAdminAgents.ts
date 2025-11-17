/**
 * React Query Hooks for AI Agents - Admin
 *
 * Custom hooks for admin AI agents management with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminAiAgentsService } from '../services/admin-ai-agents.service';
import type {
  AdminAgentListParams,
  ConversationListParams,
  TemplateListParams,
  ToolListParams,
  SystemLogsParams,
  GlobalAIConfigUpdate,
  AgentTemplateCreate,
  AgentTemplateUpdate,
  AgentToolCreate,
  AgentToolUpdate,
} from '../types/ai-agents.types';

// ============================================================================
// Query Keys
// ============================================================================

export const ADMIN_QUERY_KEYS = {
  agents: ['admin', 'agents'] as const,
  overview: ['admin', 'agents', 'overview'] as const,
  agent: (id: number) => ['admin', 'agents', id] as const,
  conversations: ['admin', 'conversations'] as const,
  systemLogs: ['admin', 'system-logs'] as const,
  globalConfig: ['admin', 'ai-config'] as const,
  templates: ['admin', 'templates'] as const,
  template: (id: number) => ['admin', 'templates', id] as const,
  templateStats: (id: number) => ['admin', 'templates', id, 'stats'] as const,
  tools: ['admin', 'tools'] as const,
  tool: (id: number) => ['admin', 'tools', id] as const,
  toolStats: (id: number) => ['admin', 'tools', id, 'stats'] as const,
};

// ============================================================================
// Agent Monitoring Queries
// ============================================================================

/**
 * List all agents across all shops
 * @param params - Filter parameters
 */
export const useAdminAgents = (params: AdminAgentListParams = {}) => {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.agents, params],
    queryFn: () => adminAiAgentsService.listAllAgents(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Get platform overview statistics
 */
export const usePlatformOverview = () => {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.overview,
    queryFn: adminAiAgentsService.getPlatformOverview,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get agent details by ID (admin view)
 * @param agentId - Agent ID
 */
export const useAdminAgent = (agentId: number) => {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.agent(agentId),
    queryFn: () => adminAiAgentsService.getAgent(agentId),
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get recent conversations across platform
 * @param params - Filter parameters
 */
export const useRecentConversations = (params: ConversationListParams = {}) => {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.conversations, params],
    queryFn: () => adminAiAgentsService.getRecentConversations(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Get system logs
 * @param params - Filter parameters
 */
export const useSystemLogs = (params: SystemLogsParams = {}) => {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.systemLogs, params],
    queryFn: () => adminAiAgentsService.getSystemLogs(params),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// ============================================================================
// Global Configuration
// ============================================================================

/**
 * Get global AI configuration
 */
export const useGlobalConfig = () => {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.globalConfig,
    queryFn: adminAiAgentsService.getGlobalConfig,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Update global AI configuration
 */
export const useUpdateGlobalConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GlobalAIConfigUpdate) => adminAiAgentsService.updateGlobalConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.globalConfig });
      toast.success('Глобальные настройки успешно обновлены');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Не удалось обновить настройки';
      toast.error(message);
    },
  });
};

// ============================================================================
// Templates Management
// ============================================================================

/**
 * List all templates
 * @param params - Filter parameters
 */
export const useAdminTemplates = (params: TemplateListParams = {}) => {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.templates, params],
    queryFn: () => adminAiAgentsService.listTemplates(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get template details by ID
 * @param templateId - Template ID
 */
export const useAdminTemplate = (templateId: number) => {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.template(templateId),
    queryFn: () => adminAiAgentsService.getTemplate(templateId),
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get template statistics
 * @param templateId - Template ID
 */
export const useTemplateStats = (templateId: number) => {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.templateStats(templateId),
    queryFn: () => adminAiAgentsService.getTemplateStats(templateId),
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Create a new template
 */
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AgentTemplateCreate) => adminAiAgentsService.createTemplate(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.templates });
      toast.success(`Шаблон "${data.name}" успешно создан`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Не удалось создать шаблон';
      toast.error(message);
    },
  });
};

/**
 * Update an existing template
 */
export const useUpdateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: number; data: AgentTemplateUpdate }) =>
      adminAiAgentsService.updateTemplate(templateId, data),
    onSuccess: (data, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.templates });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.template(templateId) });
      toast.success(`Шаблон "${data.name}" успешно обновлен`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Не удалось обновить шаблон';
      toast.error(message);
    },
  });
};

/**
 * Deactivate a template
 */
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: number) => adminAiAgentsService.deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.templates });
      toast.success('Шаблон деактивирован');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Не удалось деактивировать шаблон';
      toast.error(message);
    },
  });
};

// ============================================================================
// Tools Management
// ============================================================================

/**
 * List all tools
 * @param params - Filter parameters
 */
export const useAdminTools = (params: ToolListParams = {}) => {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.tools, params],
    queryFn: () => adminAiAgentsService.listTools(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get tool details by ID
 * @param toolId - Tool ID
 */
export const useAdminTool = (toolId: number) => {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.tool(toolId),
    queryFn: () => adminAiAgentsService.getTool(toolId),
    enabled: !!toolId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get tool statistics
 * @param toolId - Tool ID
 */
export const useToolStats = (toolId: number) => {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.toolStats(toolId),
    queryFn: () => adminAiAgentsService.getToolStats(toolId),
    enabled: !!toolId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Create a new tool
 */
export const useCreateTool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AgentToolCreate) => adminAiAgentsService.createTool(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.tools });
      toast.success(`Инструмент "${data.name}" успешно создан`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Не удалось создать инструмент';
      toast.error(message);
    },
  });
};

/**
 * Update an existing tool
 */
export const useUpdateTool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ toolId, data }: { toolId: number; data: AgentToolUpdate }) =>
      adminAiAgentsService.updateTool(toolId, data),
    onSuccess: (data, { toolId }) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.tools });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.tool(toolId) });
      toast.success(`Инструмент "${data.name}" успешно обновлен`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Не удалось обновить инструмент';
      toast.error(message);
    },
  });
};

/**
 * Deactivate a tool
 */
export const useDeleteTool = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (toolId: number) => adminAiAgentsService.deleteTool(toolId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.tools });
      toast.success('Инструмент деактивирован');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Не удалось деактивировать инструмент';
      toast.error(message);
    },
  });
};

// ============================================================================
// Agent Actions
// ============================================================================

/**
 * Suspend an agent
 */
export const useSuspendAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ agentId, reason }: { agentId: number; reason: string }) =>
      adminAiAgentsService.suspendAgent(agentId, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.agents });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.agent(data.agent_id) });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.overview });
      toast.success(data.message || 'Агент приостановлен');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Не удалось приостановить агента';
      toast.error(message);
    },
  });
};
