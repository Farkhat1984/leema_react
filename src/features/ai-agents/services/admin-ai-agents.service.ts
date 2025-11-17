/**
 * Admin AI Agents Service
 *
 * Service layer for admin AI agent operations
 * Endpoints: /api/v1/admin/ai-agents, /api/v1/admin/templates, /api/v1/admin/tools, /api/v1/admin/ai-config
 */

import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import type {
  AIAgentResponse,
  PlatformOverview,
  GlobalAIConfigResponse,
  GlobalAIConfigUpdate,
  AgentTemplateResponse,
  AgentTemplateCreate,
  AgentTemplateUpdate,
  TemplateStats,
  AgentToolResponse,
  AgentToolCreate,
  AgentToolUpdate,
  AgentToolStatsResponse,
  Conversation,
  SystemLogs,
  PaginatedResponse,
  AdminAgentListParams,
  ConversationListParams,
  TemplateListParams,
  ToolListParams,
  SystemLogsParams,
} from '../types/ai-agents.types';

/**
 * Admin AI Agents Service
 */
export const adminAiAgentsService = {
  // ============================================================================
  // Agent Monitoring
  // ============================================================================

  /**
   * List all agents across all shops with pagination and filters
   * @param params - Filter parameters
   */
  listAllAgents: (params: AdminAgentListParams = {}) =>
    apiRequest<PaginatedResponse<AIAgentResponse>>(
      API_ENDPOINTS.ADMIN_AI_AGENTS.BASE,
      'GET',
      undefined,
      params
    ),

  /**
   * Get platform overview statistics
   */
  getPlatformOverview: () =>
    apiRequest<PlatformOverview>(API_ENDPOINTS.ADMIN_AI_AGENTS.OVERVIEW, 'GET'),

  /**
   * Get agent details by ID
   * @param agentId - Agent ID
   */
  getAgent: (agentId: number) =>
    apiRequest<AIAgentResponse>(API_ENDPOINTS.ADMIN_AI_AGENTS.BY_ID(agentId), 'GET'),

  /**
   * Suspend an agent
   * @param agentId - Agent ID
   * @param reason - Suspension reason
   */
  suspendAgent: (agentId: number, reason: string) =>
    apiRequest<{ success: boolean; message: string; agent_id: number; status: string; reason: string }>(
      API_ENDPOINTS.ADMIN_AI_AGENTS.SUSPEND(agentId),
      'POST',
      undefined,
      { reason }
    ),

  /**
   * Get recent conversations across platform
   * @param params - Filter parameters
   */
  getRecentConversations: (params: ConversationListParams = {}) =>
    apiRequest<PaginatedResponse<Conversation>>(
      API_ENDPOINTS.ADMIN_AI_AGENTS.RECENT_CONVERSATIONS,
      'GET',
      undefined,
      params
    ),

  /**
   * Get system logs
   * @param hours - Number of hours to look back (default: 24)
   * @param level - Log level filter (default: INFO)
   */
  getSystemLogs: (params: SystemLogsParams = {}) =>
    apiRequest<SystemLogs>(
      API_ENDPOINTS.ADMIN_AI_AGENTS.SYSTEM_LOGS,
      'GET',
      undefined,
      params
    ),

  // ============================================================================
  // Global Configuration
  // ============================================================================

  /**
   * Get global AI configuration
   */
  getGlobalConfig: () =>
    apiRequest<GlobalAIConfigResponse>(API_ENDPOINTS.ADMIN_AI_CONFIG.BASE, 'GET'),

  /**
   * Update global AI configuration
   * @param data - Configuration update data
   */
  updateGlobalConfig: (data: GlobalAIConfigUpdate) =>
    apiRequest<GlobalAIConfigResponse>(API_ENDPOINTS.ADMIN_AI_CONFIG.BASE, 'PUT', data),

  // ============================================================================
  // Templates Management
  // ============================================================================

  /**
   * List all templates
   * @param activeOnly - Show only active templates (default: false)
   */
  listTemplates: (params: TemplateListParams = {}) =>
    apiRequest<AgentTemplateResponse[]>(
      API_ENDPOINTS.ADMIN_TEMPLATES.BASE,
      'GET',
      undefined,
      params
    ),

  /**
   * Create a new template
   * @param data - Template creation data
   */
  createTemplate: (data: AgentTemplateCreate) =>
    apiRequest<AgentTemplateResponse>(API_ENDPOINTS.ADMIN_TEMPLATES.BASE, 'POST', data),

  /**
   * Get template details by ID
   * @param templateId - Template ID
   */
  getTemplate: (templateId: number) =>
    apiRequest<AgentTemplateResponse>(API_ENDPOINTS.ADMIN_TEMPLATES.BY_ID(templateId), 'GET'),

  /**
   * Update a template
   * @param templateId - Template ID
   * @param data - Template update data
   */
  updateTemplate: (templateId: number, data: AgentTemplateUpdate) =>
    apiRequest<AgentTemplateResponse>(
      API_ENDPOINTS.ADMIN_TEMPLATES.BY_ID(templateId),
      'PUT',
      data
    ),

  /**
   * Deactivate a template
   * @param templateId - Template ID
   */
  deleteTemplate: (templateId: number) =>
    apiRequest<void>(API_ENDPOINTS.ADMIN_TEMPLATES.BY_ID(templateId), 'DELETE'),

  /**
   * Get template statistics
   * @param templateId - Template ID
   */
  getTemplateStats: (templateId: number) =>
    apiRequest<TemplateStats>(API_ENDPOINTS.ADMIN_TEMPLATES.STATS(templateId), 'GET'),

  // ============================================================================
  // Tools Management
  // ============================================================================

  /**
   * List all tools
   * @param activeOnly - Show only active tools (default: false)
   * @param experimental - Include experimental tools (default: false)
   */
  listTools: (params: ToolListParams = {}) =>
    apiRequest<AgentToolResponse[]>(
      API_ENDPOINTS.ADMIN_TOOLS.BASE,
      'GET',
      undefined,
      params
    ),

  /**
   * Create a new tool
   * @param data - Tool creation data
   */
  createTool: (data: AgentToolCreate) =>
    apiRequest<AgentToolResponse>(API_ENDPOINTS.ADMIN_TOOLS.BASE, 'POST', data),

  /**
   * Get tool details by ID
   * @param toolId - Tool ID
   */
  getTool: (toolId: number) =>
    apiRequest<AgentToolResponse>(API_ENDPOINTS.ADMIN_TOOLS.BY_ID(toolId), 'GET'),

  /**
   * Update a tool
   * @param toolId - Tool ID
   * @param data - Tool update data
   */
  updateTool: (toolId: number, data: AgentToolUpdate) =>
    apiRequest<AgentToolResponse>(API_ENDPOINTS.ADMIN_TOOLS.BY_ID(toolId), 'PUT', data),

  /**
   * Deactivate a tool
   * @param toolId - Tool ID
   */
  deleteTool: (toolId: number) =>
    apiRequest<void>(API_ENDPOINTS.ADMIN_TOOLS.BY_ID(toolId), 'DELETE'),

  /**
   * Get tool usage statistics
   * @param toolId - Tool ID
   */
  getToolStats: (toolId: number) =>
    apiRequest<AgentToolStatsResponse>(API_ENDPOINTS.ADMIN_TOOLS.STATS(toolId), 'GET'),
};
