/**
 * AI Agents List Page - Shop Owner
 * List and manage AI agents for the shop
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Plus, Edit, Play, Trash2, TestTube, Eye, Zap, Activity, PauseCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { StatsCard } from '@/shared/components/ui/StatsCard';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { BackButton } from '@/shared/components/ui/BackButton';
import { useAgents, useDeleteAgent, useActivateAgent } from '../hooks/useAgents';
import { formatDate } from '@/shared/lib/utils';
import type { AIAgentResponse } from '../types/ai-agents.types';

export default function AgentListPage() {
  const navigate = useNavigate();
  const [includeInactive, setIncludeInactive] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AIAgentResponse | null>(null);

  const { data: agents, isLoading } = useAgents(includeInactive);
  const { mutate: deleteAgent, isPending: isDeleting } = useDeleteAgent();
  const { mutate: activateAgent, isPending: isActivating } = useActivateAgent();

  const handleDelete = () => {
    if (selectedAgent) {
      deleteAgent(selectedAgent.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setSelectedAgent(null);
        },
      });
    }
  };

  const handleActivate = (agentId: number) => {
    activateAgent(agentId);
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

  // Calculate stats
  const stats = agents
    ? {
        total: agents.length,
        active: agents.filter((a) => a.status === 'active').length,
        inactive: agents.filter((a) => a.status === 'inactive').length,
      }
    : { total: 0, active: 0, inactive: 0 };

  if (isLoading) {
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="w-7 h-7 text-blue-600" />
              AI Агенты
            </h1>
            <p className="text-gray-600 mt-1">Управление AI-ассистентами для вашего магазина</p>
          </div>
        </div>
        <Button onClick={() => navigate('/shop/ai-agents/create')} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Создать агента
        </Button>
      </div>

      {/* Stats Cards */}
      {agents && agents.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            Статистика агентов
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatsCard
              title="Всего агентов"
              value={stats.total}
              icon={<Bot className="w-6 h-6" />}
              variant="primary"
            />
            <StatsCard
              title="Активных"
              value={stats.active}
              icon={<Zap className="w-6 h-6" />}
              variant="success"
            />
            <StatsCard
              title="Неактивных"
              value={stats.inactive}
              icon={<PauseCircle className="w-6 h-6" />}
              variant="warning"
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Показать неактивные агенты</span>
        </label>
      </div>

      {/* Agents List */}
      {!agents || agents.length === 0 ? (
        <EmptyState
          icon={<Bot className="h-8 w-8" />}
          title="У вас пока нет AI-агентов"
          description="Создайте первого агента для автоматизации общения с клиентами через WhatsApp"
          action={{
            label: 'Создать агента',
            onClick: () => navigate('/shop/ai-agents/create'),
          }}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Список агентов
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Название
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Шаблон
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Создан
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          agent.status === 'active'
                            ? 'bg-green-100'
                            : agent.status === 'suspended'
                            ? 'bg-red-100'
                            : 'bg-gray-100'
                        }`}>
                          <Bot className={`w-5 h-5 ${
                            agent.status === 'active'
                              ? 'text-green-600'
                              : agent.status === 'suspended'
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                          {agent.description && <div className="text-sm text-gray-500 mt-1">{agent.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(agent.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agent.template_id ? `Шаблон #${agent.template_id}` : 'Собственный'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(agent.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/shop/ai-agents/${agent.id}`)}
                          title="Просмотр"
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/shop/ai-agents/${agent.id}/edit`)}
                          title="Редактировать"
                          className="hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/shop/ai-agents/${agent.id}?tab=testing`)}
                          title="Тестировать"
                          className="hover:bg-purple-50 hover:text-purple-600"
                        >
                          <TestTube className="w-4 h-4" />
                        </Button>
                        {agent.status !== 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleActivate(agent.id)}
                            disabled={isActivating}
                            title="Активировать"
                            className="hover:bg-green-50 hover:text-green-600"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAgent(agent);
                            setDeleteDialogOpen(true);
                          }}
                          title="Удалить"
                          className="hover:bg-red-50 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Удалить агента?"
        description={`Вы уверены, что хотите удалить агента "${selectedAgent?.name}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
