/**
 * AI Agents Service - Shop Owner
 *
 * Service layer for shop owner AI agent operations
 * All endpoints under /api/v1/shops/me/ai-agents
 */

import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import type {
  AIAgentResponse,
  AIAgentCreate,
  AIAgentUpdate,
  AgentActivateResponse,
  AgentTemplateResponse,
  AgentToolResponse,
  AgentTestResponse,
  Conversation,
  ConversationDetails,
  AgentAnalytics,
  PaginatedResponse,
  AgentTestMessage,
} from '../types/ai-agents.types';

/**
 * AI Agents Service
 */
export const aiAgentsService = {
  // ============================================================================
  // Agent CRUD
  // ============================================================================

  /**
   * List all agents for the current shop
   * @param includeInactive - Include inactive agents (default: true)
   */
  listAgents: (includeInactive = true) =>
    apiRequest<AIAgentResponse[]>(
      API_ENDPOINTS.AI_AGENTS.BASE,
      'GET',
      undefined,
      { include_inactive: includeInactive }
    ),

  /**
   * Create a new agent
   * @param data - Agent creation data
   */
  createAgent: (data: AIAgentCreate) =>
    apiRequest<AIAgentResponse>(API_ENDPOINTS.AI_AGENTS.BASE, 'POST', data),

  /**
   * Get agent details by ID
   * @param agentId - Agent ID
   */
  getAgent: (agentId: number) =>
    apiRequest<AIAgentResponse>(API_ENDPOINTS.AI_AGENTS.BY_ID(agentId), 'GET'),

  /**
   * Update an existing agent
   * @param agentId - Agent ID
   * @param data - Agent update data
   */
  updateAgent: (agentId: number, data: AIAgentUpdate) =>
    apiRequest<AIAgentResponse>(API_ENDPOINTS.AI_AGENTS.BY_ID(agentId), 'PUT', data),

  /**
   * Delete an agent (soft delete)
   * @param agentId - Agent ID
   */
  deleteAgent: (agentId: number) =>
    apiRequest<void>(API_ENDPOINTS.AI_AGENTS.BY_ID(agentId), 'DELETE'),

  /**
   * Activate an agent
   * @param agentId - Agent ID
   */
  activateAgent: (agentId: number) =>
    apiRequest<AgentActivateResponse>(API_ENDPOINTS.AI_AGENTS.ACTIVATE(agentId), 'POST'),

  // ============================================================================
  // Templates & Tools
  // ============================================================================

  /**
   * List available agent templates
   */
  listTemplates: () =>
    apiRequest<AgentTemplateResponse[]>(API_ENDPOINTS.AI_AGENTS.TEMPLATES, 'GET'),

  /**
   * List available tools
   */
  listTools: () =>
    apiRequest<AgentToolResponse[]>(API_ENDPOINTS.AI_AGENTS.TOOLS, 'GET'),

  // ============================================================================
  // Testing
  // ============================================================================

  /**
   * Test agent with a message
   * @param agentId - Agent ID
   * @param message - Test message
   */
  testAgent: (agentId: number, message: string) =>
    apiRequest<AgentTestResponse>(
      API_ENDPOINTS.AI_AGENTS.TEST(agentId),
      'POST',
      { message } as AgentTestMessage
    ),

  // ============================================================================
  // Conversations
  // ============================================================================

  /**
   * Get agent conversations with pagination
   * @param agentId - Agent ID
   * @param page - Page number (default: 1)
   * @param perPage - Items per page (default: 20)
   */
  getConversations: (agentId: number, page = 1, perPage = 20) =>
    apiRequest<PaginatedResponse<Conversation>>(
      API_ENDPOINTS.AI_AGENTS.CONVERSATIONS(agentId),
      'GET',
      undefined,
      { page, per_page: perPage }
    ),

  /**
   * Get conversation details with messages
   * @param agentId - Agent ID
   * @param conversationId - Conversation ID
   */
  getConversationDetails: (agentId: number, conversationId: number) =>
    apiRequest<ConversationDetails>(
      API_ENDPOINTS.AI_AGENTS.CONVERSATION_DETAILS(agentId, conversationId),
      'GET'
    ),

  // ============================================================================
  // Analytics
  // ============================================================================

  /**
   * Get agent analytics
   * @param agentId - Agent ID
   */
  getAnalytics: (agentId: number) =>
    apiRequest<AgentAnalytics>(API_ENDPOINTS.AI_AGENTS.ANALYTICS(agentId), 'GET'),
};
