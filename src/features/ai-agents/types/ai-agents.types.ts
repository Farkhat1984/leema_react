/**
 * AI Agents TypeScript Types
 *
 * Complete type definitions for AI Agents feature
 * Based on backend API schemas
 */

// ============================================================================
// Agent Configuration
// ============================================================================

export interface AIAgentConfig {
  model: string; // Default: "gemini-2.5-flash"
  temperature: number; // 0.0-2.0, default: 0.7
  max_tokens: number; // 100-8192, default: 1024
  language: 'ru' | 'kk' | 'en'; // Default: "ru"
  tone: string; // Default: "friendly"
  enabled_tools: string[]; // Tool names
  working_hours?: Record<string, unknown> | null;
  fallback_message?: string | null;
  response_style: 'concise' | 'balanced' | 'detailed'; // Default: "balanced"
  knowledge_base?: Record<string, string>; // FAQ pairs: question -> answer
}

// ============================================================================
// Agent CRUD
// ============================================================================

export interface AIAgentCreate {
  template_id?: number | null; // Optional template
  name: string; // Agent name (min 1, max 255)
  description?: string | null;
  system_prompt?: string | null; // Required if no template
  custom_instructions?: string | null; // Max 2000 chars
  config: AIAgentConfig;
}

export interface AIAgentUpdate {
  name?: string;
  description?: string | null;
  custom_instructions?: string | null;
  config?: AIAgentConfig;
}

export interface AIAgentResponse {
  id: number;
  shop_id: number;
  template_id: number | null;
  name: string;
  description: string | null;
  system_prompt: string;
  custom_instructions: string | null;
  config: AIAgentConfig;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface AgentActivateResponse {
  success: boolean;
  message: string;
  agent_id: number;
  status: string;
}

// ============================================================================
// Templates
// ============================================================================

export interface AgentTemplateResponse {
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

export interface AgentTemplateCreate {
  name: string;
  description?: string | null;
  system_prompt: string;
  default_config: AIAgentConfig;
}

export interface AgentTemplateUpdate {
  name?: string;
  description?: string | null;
  system_prompt?: string;
  default_config?: AIAgentConfig;
  is_active?: boolean;
}

export interface TemplateStats {
  template_id: number;
  template_name: string;
  total_agents: number;
  active_agents: number;
  inactive_agents: number;
  suspended_agents: number;
  total_conversations: number;
  total_messages: number;
  created_at: string;
}

// ============================================================================
// Tools
// ============================================================================

export interface AgentToolResponse {
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

export interface AgentToolCreate {
  name: string;
  description: string;
  version: string;
  schema: Record<string, unknown>;
  is_experimental?: boolean;
}

export interface AgentToolUpdate {
  name?: string;
  description?: string;
  version?: string;
  schema?: Record<string, unknown>;
  is_active?: boolean;
  is_experimental?: boolean;
}

export interface AgentToolStatsResponse {
  tool_id: number;
  tool_name: string;
  version: string;
  total_usage: number;
  active_agents_count: number;
  agents_using_tool: Array<{
    agent_id: number;
    agent_name: string;
    shop_id: number;
  }>;
  created_at: string;
}

// ============================================================================
// Conversations
// ============================================================================

export interface Conversation {
  id: number;
  customer_phone: string;
  status: 'active' | 'resolved' | 'escalated';
  message_count: number;
  started_at: string;
  last_message_at: string;
}

export interface ConversationMessage {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls?: Record<string, unknown> | null;
  tool_results?: Record<string, unknown> | null;
  created_at: string;
}

export interface ConversationDetails extends Conversation {
  agent_id: number;
  messages: ConversationMessage[];
}

// ============================================================================
// Analytics
// ============================================================================

export interface AgentAnalytics {
  agent_id: number;
  agent_name: string;
  status: string;
  created_at: string;
  total_conversations: number;
  total_messages: number;
  avg_response_time_ms: number;
  active_conversations: number;
  tool_usage: Record<string, number>; // tool_name -> count
}

// ============================================================================
// Admin Types
// ============================================================================

export interface PlatformOverview {
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

export interface GlobalAIConfigResponse {
  id: number;
  available_models: Record<
    string,
    {
      name: string;
      description: string;
      max_tokens: number;
    }
  >;
  max_temperature: number;
  max_tokens: number;
  default_model: string;
  rate_limit_per_hour: number;
}

export interface GlobalAIConfigUpdate {
  available_models?: GlobalAIConfigResponse['available_models'];
  max_temperature?: number;
  max_tokens?: number;
  default_model?: string;
  rate_limit_per_hour?: number;
}

export interface SystemLog {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  agent_id?: number | null;
  shop_id?: number | null;
  details?: Record<string, unknown> | null;
}

export interface SystemLogs {
  logs: SystemLog[];
  total_count: number;
  hours: number;
  level: string;
}

// ============================================================================
// Testing
// ============================================================================

export interface AgentTestMessage {
  message: string;
}

export interface AgentTestResponse {
  success: boolean;
  response: string;
  agent_id: number;
  agent_name: string;
}

// ============================================================================
// Pagination
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ============================================================================
// Query Parameters
// ============================================================================

export interface AgentListParams {
  include_inactive?: boolean;
}

export interface AdminAgentListParams {
  page?: number;
  per_page?: number;
  status?: 'active' | 'inactive' | 'suspended' | string;
  shop_id?: number;
  template_id?: number;
}

export interface ConversationListParams {
  page?: number;
  per_page?: number;
  status?: 'active' | 'resolved' | 'escalated' | string;
}

export interface TemplateListParams {
  active_only?: boolean;
}

export interface ToolListParams {
  active_only?: boolean;
  experimental?: boolean;
}

export interface SystemLogsParams {
  hours?: number;
  level?: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
}
