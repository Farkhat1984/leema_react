/**
 * React Query Hooks for AI Agents - Shop Owner
 *
 * Custom hooks for managing AI agents state with React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { aiAgentsService } from '../services/ai-agents.service';
import type {
  AIAgentCreate,
  AIAgentUpdate,
} from '../types/ai-agents.types';

// ============================================================================
// Query Keys
// ============================================================================

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

// ============================================================================
// Queries
// ============================================================================

/**
 * List all agents for the shop
 * @param includeInactive - Include inactive agents (default: true)
 */
export const useAgents = (includeInactive = true) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.agents, includeInactive],
    queryFn: () => aiAgentsService.listAgents(includeInactive),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get single agent details
 * @param agentId - Agent ID
 */
export const useAgent = (agentId: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.agent(agentId),
    queryFn: () => aiAgentsService.getAgent(agentId),
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Get available templates
 */
export const useTemplates = () => {
  return useQuery({
    queryKey: QUERY_KEYS.templates,
    queryFn: aiAgentsService.listTemplates,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Get available tools
 */
export const useTools = () => {
  return useQuery({
    queryKey: QUERY_KEYS.tools,
    queryFn: aiAgentsService.listTools,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Get agent conversations with pagination
 * @param agentId - Agent ID
 * @param page - Page number
 * @param perPage - Items per page
 */
export const useConversations = (agentId: number, page = 1, perPage = 20) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.conversations(agentId), page, perPage],
    queryFn: () => aiAgentsService.getConversations(agentId, page, perPage),
    enabled: !!agentId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Get conversation details with messages
 * @param agentId - Agent ID
 * @param conversationId - Conversation ID
 */
export const useConversationDetails = (agentId: number, conversationId: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.conversationDetails(agentId, conversationId),
    queryFn: () => aiAgentsService.getConversationDetails(agentId, conversationId),
    enabled: !!agentId && !!conversationId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Get agent analytics
 * @param agentId - Agent ID
 */
export const useAgentAnalytics = (agentId: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.analytics(agentId),
    queryFn: () => aiAgentsService.getAnalytics(agentId),
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new agent
 */
export const useCreateAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AIAgentCreate) => aiAgentsService.createAgent(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agents });
      toast.success(`Агент "${data.name}" успешно создан`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Не удалось создать агента';
      toast.error(message);
    },
  });
};

/**
 * Update an existing agent
 */
export const useUpdateAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ agentId, data }: { agentId: number; data: AIAgentUpdate }) =>
      aiAgentsService.updateAgent(agentId, data),
    onSuccess: (data, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agents });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agent(agentId) });
      toast.success(`Агент "${data.name}" успешно обновлен`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Не удалось обновить агента';
      toast.error(message);
    },
  });
};

/**
 * Delete an agent
 */
export const useDeleteAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentId: number) => aiAgentsService.deleteAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agents });
      toast.success('Агент успешно удален');
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Не удалось удалить агента';
      toast.error(message);
    },
  });
};

/**
 * Activate an agent
 */
export const useActivateAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentId: number) => aiAgentsService.activateAgent(agentId),
    onSuccess: (data, agentId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agents });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.agent(agentId) });
      toast.success(data.message || 'Агент успешно активирован');
    },
    onError: (error: any) => {
      const status = error.response?.status;
      const message = error.response?.data?.detail || error.message;

      if (status === 409) {
        toast.error('Агент уже активен');
      } else {
        toast.error(message || 'Не удалось активировать агента');
      }
    },
  });
};

/**
 * Test agent with a message
 */
export const useTestAgent = () => {
  return useMutation({
    mutationFn: ({ agentId, message }: { agentId: number; message: string }) =>
      aiAgentsService.testAgent(agentId, message),
    onError: (error: any) => {
      const message = error.response?.data?.detail || error.message || 'Не удалось отправить сообщение';
      toast.error(message);
    },
  });
};
