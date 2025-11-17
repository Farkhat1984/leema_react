/**
 * Agent Details Page - Shop Owner
 * Tabbed interface showing agent overview, conversations, analytics, and testing
 */

import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Bot, Edit, Play, Pause, TrendingUp, MessageSquare, BarChart3, TestTube, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/Button';
import { BackButton } from '@/shared/components/ui/BackButton';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { Tabs } from '@/shared/components/ui/Tabs';
import { StatsCard } from '@/shared/components/ui/StatsCard';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Pagination } from '@/shared/components/ui/Pagination';
import { Modal } from '@/shared/components/ui/Modal';
import { useAgent, useAgentAnalytics, useConversations, useTestAgent, useActivateAgent } from '../hooks/useAgents';
import { formatDate, formatNumber } from '@/shared/lib/utils';
import type { Conversation } from '../types/ai-agents.types';
import { ConversationDetailsModal } from '../components/ConversationDetailsModal';

export default function AgentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const agentId = parseInt(id || '0');

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [conversationPage, setConversationPage] = useState(1);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [testHistory, setTestHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const { data: agent, isLoading: agentLoading } = useAgent(agentId);
  const { data: analytics, isLoading: analyticsLoading } = useAgentAnalytics(agentId);
  const { data: conversationsData, isLoading: conversationsLoading } = useConversations(agentId, conversationPage, 20);
  const { mutate: testAgent, isPending: isTesting } = useTestAgent();
  const { mutate: activateAgent, isPending: isActivating } = useActivateAgent();

  const handleActivateToggle = () => {
    if (agent?.status === 'active') {
      toast.error('Для деактивации используйте редактирование агента');
    } else {
      activateAgent(agentId, {
        onSuccess: () => {
          toast.success('Агент активирован');
        },
      });
    }
  };

  const handleTestSend = () => {
    if (!testMessage.trim()) return;

    const userMessage = testMessage;
    setTestHistory([...testHistory, { role: 'user', content: userMessage }]);
    setTestMessage('');

    testAgent({ agentId, message: userMessage }, {
      onSuccess: (response) => {
        setTestHistory(prev => [...prev, { role: 'assistant', content: response.response }]);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Ошибка при тестировании');
        setTestHistory(prev => [...prev, { role: 'assistant', content: 'Ошибка: ' + (error.message || 'Не удалось получить ответ') }]);
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'default' | 'error'> = {
      active: 'success',
      inactive: 'default',
      suspended: 'error',
    };
    const labels: Record<string, string> = {
      active: 'Активен',
      inactive: 'Неактивен',
      suspended: 'Приостановлен',
    };
    return <StatusBadge variant={variants[status] || 'default'}>{labels[status] || status}</StatusBadge>;
  };

  const getConversationStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'error'> = {
      active: 'warning',
      resolved: 'success',
      escalated: 'error',
    };
    const labels: Record<string, string> = {
      active: 'Активный',
      resolved: 'Завершен',
      escalated: 'Эскалирован',
    };
    return <StatusBadge variant={variants[status] || 'default'}>{labels[status] || status}</StatusBadge>;
  };

  if (agentLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-600">Агент не найден</p>
          <Button onClick={() => navigate('/shop/ai-agents')} className="mt-4">
            Вернуться к списку
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Обзор', icon: TrendingUp },
    { id: 'conversations', label: 'Разговоры', icon: MessageSquare },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
    { id: 'testing', label: 'Тестирование', icon: TestTube },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bot className="w-7 h-7" />
                {agent.name}
              </h1>
              {getStatusBadge(agent.status)}
            </div>
            {agent.description && (
              <p className="text-gray-600 mt-1">{agent.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/shop/ai-agents/${agentId}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Редактировать
          </Button>
          {agent.status !== 'active' ? (
            <Button onClick={handleActivateToggle} disabled={isActivating}>
              <Play className="w-4 h-4 mr-2" />
              {isActivating ? 'Активация...' : 'Активировать'}
            </Button>
          ) : (
            <Button variant="outline" disabled>
              <Pause className="w-4 h-4 mr-2" />
              Активен
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs.map(t => ({ id: t.id, label: t.label }))}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard
                  title="Всего разговоров"
                  value={formatNumber(analytics.total_conversations)}
                  icon={MessageSquare}
                />
                <StatsCard
                  title="Активных"
                  value={formatNumber(analytics.active_conversations)}
                  icon={TrendingUp}
                  trend="up"
                />
                <StatsCard
                  title="Всего сообщений"
                  value={formatNumber(analytics.total_messages)}
                  icon={MessageSquare}
                />
                <StatsCard
                  title="Средн. время ответа"
                  value={`${Math.round(analytics.avg_response_time_ms)}мс`}
                  icon={BarChart3}
                />
              </div>
            )}

            {/* Configuration */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Конфигурация</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Модель</div>
                  <div className="font-medium mt-1">{agent.config.model}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Температура</div>
                  <div className="font-medium mt-1">{agent.config.temperature}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Макс. токенов</div>
                  <div className="font-medium mt-1">{agent.config.max_tokens}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Язык</div>
                  <div className="font-medium mt-1">
                    {agent.config.language === 'ru' ? 'Русский' : agent.config.language === 'kk' ? 'Қазақша' : 'English'}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Тон</div>
                  <div className="font-medium mt-1">{agent.config.tone}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Стиль ответов</div>
                  <div className="font-medium mt-1">
                    {agent.config.response_style === 'concise' ? 'Краткий' : agent.config.response_style === 'balanced' ? 'Сбалансированный' : 'Подробный'}
                  </div>
                </div>
              </div>
            </div>

            {/* Enabled Tools */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Включенные инструменты</h3>
              {agent.config.enabled_tools.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {agent.config.enabled_tools.map((tool) => (
                    <span
                      key={tool}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Нет включенных инструментов</p>
              )}
            </div>

            {/* Recent Conversations */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Последние разговоры</h3>
              {conversationsData && conversationsData.items.length > 0 ? (
                <div className="space-y-2">
                  {conversationsData.items.slice(0, 5).map((conv) => (
                    <div
                      key={conv.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium">{conv.customer_phone}</div>
                          {getConversationStatusBadge(conv.status)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(conv.last_message_at)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Сообщений: {conv.message_count}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={MessageSquare}
                  title="Нет разговоров"
                  description="Разговоры появятся после начала общения с клиентами"
                />
              )}
            </div>
          </div>
        )}

        {/* Conversations Tab */}
        {activeTab === 'conversations' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Все разговоры</h3>

            {conversationsLoading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : conversationsData && conversationsData.items.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Телефон
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Статус
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Сообщений
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Начат
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Последнее сообщение
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Действия
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {conversationsData.items.map((conv) => (
                        <tr key={conv.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {conv.customer_phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getConversationStatusBadge(conv.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {conv.message_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(conv.started_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(conv.last_message_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedConversation(conv)}
                            >
                              Просмотреть
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {conversationsData.total_pages > 1 && (
                  <Pagination
                    currentPage={conversationPage}
                    totalPages={conversationsData.total_pages}
                    onPageChange={setConversationPage}
                  />
                )}
              </>
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="Нет разговоров"
                description="Разговоры появятся после начала общения с клиентами"
              />
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Аналитика</h3>

            {analyticsLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            ) : analytics ? (
              <div className="space-y-6">
                {/* Main Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Всего разговоров</div>
                    <div className="text-2xl font-bold mt-1">{analytics.total_conversations}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Всего сообщений</div>
                    <div className="text-2xl font-bold mt-1">{analytics.total_messages}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Средн. время ответа</div>
                    <div className="text-2xl font-bold mt-1">{Math.round(analytics.avg_response_time_ms)}мс</div>
                  </div>
                </div>

                {/* Tool Usage */}
                <div>
                  <h4 className="font-semibold mb-3">Использование инструментов</h4>
                  {Object.keys(analytics.tool_usage).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(analytics.tool_usage).map(([tool, count]) => (
                        <div key={tool} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="font-medium">{tool}</span>
                          <span className="text-gray-600">{count} раз(а)</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Инструменты еще не использовались</p>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="Нет данных"
                description="Аналитика появится после начала работы агента"
              />
            )}
          </div>
        )}

        {/* Testing Tab */}
        {activeTab === 'testing' && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Внимание:</strong> Тестовые разговоры не сохраняются в истории
              </p>
            </div>

            {/* Chat History */}
            <div className="border rounded-lg p-4 h-96 overflow-y-auto space-y-3">
              {testHistory.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                  Отправьте сообщение для тестирования агента
                </div>
              ) : (
                testHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <div className="text-sm">{msg.content}</div>
                    </div>
                  </div>
                ))
              )}
              {isTesting && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTestSend()}
                placeholder="Введите сообщение для тестирования..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isTesting}
              />
              <Button onClick={handleTestSend} disabled={isTesting || !testMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Conversation Details Modal */}
      {selectedConversation && (
        <ConversationDetailsModal
          agentId={agentId}
          conversationId={selectedConversation.id}
          onClose={() => setSelectedConversation(null)}
        />
      )}
    </div>
  );
}
