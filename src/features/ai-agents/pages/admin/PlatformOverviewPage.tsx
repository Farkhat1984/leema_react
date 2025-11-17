/**
 * AI Agents Platform Overview - Admin
 * Dashboard showing platform-wide AI agent statistics
 */

import { Bot, Users, MessageSquare, TrendingUp, Settings, FileText, Wrench, Activity, Zap, PauseCircle, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/Button';
import { StatsCard } from '@/shared/components/ui/StatsCard';
import { BackButton } from '@/shared/components/ui/BackButton';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { usePlatformOverview, useRecentConversations } from '../../hooks/useAdminAgents';
import { formatDate, formatNumber } from '@/shared/lib/utils';

export default function PlatformOverviewPage() {
  const { data: overview, isLoading: overviewLoading } = usePlatformOverview();
  const { data: recentConversations, isLoading: conversationsLoading } = useRecentConversations({ page: 1, per_page: 10 });

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

  if (overviewLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="w-7 h-7 text-blue-600" />
              Обзор AI Агентов
            </h1>
            <p className="text-gray-600 mt-1">Статистика платформы и управление</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/admin/ai-agents/all">
            <Button variant="primary">
              <Bot className="w-4 h-4 mr-2" />
              Все агенты
            </Button>
          </Link>
          <Link to="/admin/ai-agents/templates">
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Шаблоны
            </Button>
          </Link>
          <Link to="/admin/ai-agents/tools">
            <Button variant="outline">
              <Wrench className="w-4 h-4 mr-2" />
              Инструменты
            </Button>
          </Link>
          <Link to="/admin/ai-agents/config">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Настройки
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Stats - Agent Status */}
      {overview && (
        <>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              Статус агентов
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Всего агентов"
                value={formatNumber(overview.total_agents)}
                icon={<Bot className="w-6 h-6" />}
                variant="primary"
              />
              <StatsCard
                title="Активных"
                value={formatNumber(overview.active_agents)}
                icon={<Zap className="w-6 h-6" />}
                variant="success"
              />
              <StatsCard
                title="Неактивных"
                value={formatNumber(overview.inactive_agents)}
                icon={<Activity className="w-6 h-6" />}
                variant="warning"
              />
              <StatsCard
                title="Приостановленных"
                value={formatNumber(overview.suspended_agents)}
                icon={<PauseCircle className="w-6 h-6" />}
                variant="error"
              />
            </div>
          </div>

          {/* Shop & Activity Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shop Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-purple-600" />
                Магазины
              </h3>
              <StatsCard
                title="Магазинов с агентами"
                value={formatNumber(overview.active_shops_with_agents)}
                icon={<Users className="w-6 h-6" />}
                variant="info"
              />
            </div>

            {/* Conversation Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                Активность
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <StatsCard
                  title="Всего разговоров"
                  value={formatNumber(overview.total_conversations)}
                  icon={<MessageSquare className="w-5 h-5" />}
                  variant="primary"
                />
                <StatsCard
                  title="Всего сообщений"
                  value={formatNumber(overview.total_messages)}
                  icon={<TrendingUp className="w-5 h-5" />}
                  variant="success"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <div className="text-xs font-medium text-blue-700 uppercase tracking-wider">За 24 часа</div>
                  <div className="text-xl font-bold text-blue-900 mt-2">
                    {formatNumber(overview.recent_conversations_24h)}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">разговоров</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                  <div className="text-xs font-medium text-green-700 uppercase tracking-wider">За 24 часа</div>
                  <div className="text-xl font-bold text-green-900 mt-2">
                    {formatNumber(overview.recent_messages_24h)}
                  </div>
                  <div className="text-xs text-green-600 mt-1">сообщений</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Agents by Template */}
      {overview && overview.agents_by_template.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              Распределение по шаблонам
            </h3>
            <Link to="/admin/ai-agents/templates">
              <Button variant="ghost" size="sm">
                Управление шаблонами →
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {overview.agents_by_template.map((item) => (
              <div key={item.template_id} className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {item.template_id ? `Шаблон #${item.template_id}` : 'Без шаблона'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.agent_count} {item.agent_count === 1 ? 'агент' : 'агентов'}
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {item.agent_count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Conversations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            Последние разговоры
          </h3>
        </div>

        {conversationsLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        ) : recentConversations && recentConversations.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Телефон
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Сообщений
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Начат
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Последнее сообщение
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentConversations.items.map((conv) => (
                  <tr key={conv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{conv.customer_phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getConversationStatusBadge(conv.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{conv.message_count}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(conv.started_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(conv.last_message_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-8 h-8 text-gray-300" />
            </div>
            <p className="font-medium">Нет разговоров</p>
            <p className="text-sm text-gray-400 mt-1">Разговоры появятся здесь, когда агенты начнут работу</p>
          </div>
        )}
      </div>
    </div>
  );
}
