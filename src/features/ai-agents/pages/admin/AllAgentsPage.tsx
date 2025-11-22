/**
 * All AI Agents Page - Admin
 * View and manage all agents across all shops
 */

import { useState } from 'react';
import { Bot, AlertCircle, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/shared/components/ui/Button';
import { BackButton } from '@/shared/components/ui/BackButton';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Pagination } from '@/shared/components/ui/Pagination';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { FormSelect } from '@/shared/components/forms/FormSelect';
import { useForm } from 'react-hook-form';
import { useAllAgents, useSuspendAgent } from '../../hooks/useAdminAgents';
import { formatDate } from '@/shared/lib/utils';
import type { AIAgentResponse } from '../../types/ai-agents.types';

export default function AllAgentsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [shopIdFilter, setShopIdFilter] = useState<string>('');
  const [templateIdFilter, setTemplateIdFilter] = useState<string>('');
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AIAgentResponse | null>(null);

  const { control } = useForm();

  const filters = {
    page,
    per_page: 20,
    ...(statusFilter && { status: statusFilter }),
    ...(shopIdFilter && { shop_id: parseInt(shopIdFilter) }),
    ...(templateIdFilter && { template_id: parseInt(templateIdFilter) }),
  };

  const { data: agentsData, isLoading } = useAllAgents(filters);
  const { mutate: suspendAgent, isPending: isSuspending } = useSuspendAgent();

  const handleSuspend = (agent: AIAgentResponse) => {
    setSelectedAgent(agent);
    setSuspendDialogOpen(true);
  };

  const confirmSuspend = () => {
    if (!selectedAgent || !suspendReason.trim()) {
      toast.error('Укажите причину приостановки');
      return;
    }

    suspendAgent(
      { agentId: selectedAgent.id, reason: suspendReason },
      {
        onSuccess: () => {
          toast.success('Агент приостановлен');
          setSuspendDialogOpen(false);
          setSelectedAgent(null);
          setSuspendReason('');
        },
        onError: (error: any) => {
          toast.error(error.message || 'Не удалось приостановить агента');
        },
      }
    );
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

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-7 h-7" />
            Все AI Агенты
          </h1>
          <p className="text-gray-600 mt-1">Управление агентами всех магазинов</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
              <option value="suspended">Приостановленные</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID магазина</label>
            <input
              type="number"
              value={shopIdFilter}
              onChange={(e) => {
                setShopIdFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Фильтр по магазину"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID шаблона</label>
            <input
              type="number"
              value={templateIdFilter}
              onChange={(e) => {
                setTemplateIdFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Фильтр по шаблону"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('');
                setShopIdFilter('');
                setTemplateIdFilter('');
                setPage(1);
              }}
              className="w-full"
            >
              Сбросить фильтры
            </Button>
          </div>
        </div>
      </div>

      {/* Agents Table */}
      {agentsData && agentsData.items.length > 0 ? (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Название
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Магазин
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Шаблон
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Создан
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agentsData.items.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        #{agent.id}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                          {agent.description && (
                            <div className="text-sm text-gray-500">{agent.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="text-blue-600">ID: {agent.shop_id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {agent.template_id ? `#${agent.template_id}` : 'Собственный'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(agent.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(agent.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`/shop/ai-agents/${agent.id}`, '_blank')}
                            title="Просмотр"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {agent.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSuspend(agent)}
                              title="Приостановить"
                              className="text-red-600 hover:text-red-700"
                            >
                              <AlertCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {agentsData.total_pages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={agentsData.total_pages}
              onPageChange={setPage}
            />
          )}

          {/* Total Count */}
          <div className="text-center text-sm text-gray-600">
            Всего найдено: {agentsData.total} {agentsData.total === 1 ? 'агент' : 'агентов'}
          </div>
        </>
      ) : (
        <EmptyState
          icon={<Bot className="w-6 h-6" />}
          title="Агенты не найдены"
          description="Попробуйте изменить фильтры поиска"
        />
      )}

      {/* Suspend Dialog */}
      <ConfirmDialog
        open={suspendDialogOpen}
        onClose={() => {
          setSuspendDialogOpen(false);
          setSelectedAgent(null);
          setSuspendReason('');
        }}
        onConfirm={confirmSuspend}
        title="Приостановить агента?"
        description={`Вы собираетесь приостановить агента "${selectedAgent?.name}". Укажите причину:`}
        confirmText="Приостановить"
        cancelText="Отмена"
        variant="danger"
        isLoading={isSuspending}
      >
        <div className="mt-4">
          <textarea
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="Причина приостановки (обязательно)"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
