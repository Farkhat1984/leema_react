/**
 * Tools Management Page - Admin
 * Manage AI agent tools
 */

import { useState } from 'react';
import { Wrench, Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/Button';
import { BackButton } from '@/shared/components/ui/BackButton';
import { StatusBadge } from '@/shared/components/ui/StatusBadge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { FormModal } from '@/shared/components/ui/FormModal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { FormInput } from '@/shared/components/forms/FormInput';
import { FormTextarea } from '@/shared/components/forms/FormTextarea';
import { FormCheckbox } from '@/shared/components/forms/FormCheckbox';
import {
  useAdminTools,
  useCreateTool,
  useUpdateTool,
  useDeleteTool,
} from '../../hooks/useAdminAgents';
import { formatDate } from '@/shared/lib/utils';
import type { AgentToolResponse } from '../../types/ai-agents.types';

// Tool form schema
const toolSchema = z.object({
  name: z.string().min(1, 'Обязательное поле'),
  description: z.string().min(1, 'Обязательное поле'),
  version: z.string().min(1, 'Обязательное поле'),
  schema: z.record(z.unknown()),
  is_experimental: z.boolean().default(false),
});

type ToolFormData = z.infer<typeof toolSchema>;

export default function ToolsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTool, setSelectedTool] = useState<AgentToolResponse | null>(null);
  const [activeOnlyFilter, setActiveOnlyFilter] = useState(false);
  const [experimentalFilter, setExperimentalFilter] = useState(false);

  const { data: tools, isLoading } = useAdminTools({
    active_only: activeOnlyFilter,
    experimental: experimentalFilter
  });
  const { mutate: createTool, isPending: isCreating } = useCreateTool();
  const { mutate: updateTool, isPending: isUpdating } = useUpdateTool();
  const { mutate: deleteTool, isPending: isDeleting } = useDeleteTool();

  const { control, handleSubmit, reset, setValue, formState: { errors } } = useForm<ToolFormData>({
    resolver: zodResolver(toolSchema),
    defaultValues: {
      name: '',
      description: '',
      version: '1.0.0',
      schema: {},
      is_experimental: false,
    },
  });

  const handleCreate = () => {
    reset({
      name: '',
      description: '',
      version: '1.0.0',
      schema: {},
      is_experimental: false,
    });
    setShowCreateModal(true);
  };

  const handleEdit = (tool: AgentToolResponse) => {
    setSelectedTool(tool);
    reset({
      name: tool.name,
      description: tool.description,
      version: tool.version,
      schema: tool.schema,
      is_experimental: tool.is_experimental,
    });
    setShowEditModal(true);
  };

  const handleDelete = (tool: AgentToolResponse) => {
    setSelectedTool(tool);
    setShowDeleteDialog(true);
  };

  const onSubmitCreate = (data: ToolFormData) => {
    createTool(data, {
      onSuccess: () => {
        toast.success('Инструмент создан');
        setShowCreateModal(false);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Не удалось создать инструмент');
      },
    });
  };

  const onSubmitUpdate = (data: ToolFormData) => {
    if (!selectedTool) return;

    updateTool(
      { toolId: selectedTool.id, data },
      {
        onSuccess: () => {
          toast.success('Инструмент обновлен');
          setShowEditModal(false);
          setSelectedTool(null);
        },
        onError: (error: any) => {
          toast.error(error.message || 'Не удалось обновить инструмент');
        },
      }
    );
  };

  const confirmDelete = () => {
    if (!selectedTool) return;

    deleteTool(selectedTool.id, {
      onSuccess: () => {
        toast.success('Инструмент удален');
        setShowDeleteDialog(false);
        setSelectedTool(null);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Не удалось удалить инструмент');
      },
    });
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wrench className="w-7 h-7" />
              Инструменты агентов
            </h1>
            <p className="text-gray-600 mt-1">Управление доступными инструментами</p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Создать инструмент
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={activeOnlyFilter}
              onChange={(e) => setActiveOnlyFilter(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Только активные</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={experimentalFilter}
              onChange={(e) => setExperimentalFilter(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Экспериментальные</span>
          </label>
        </div>
      </div>

      {/* Tools Table */}
      {tools && tools.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Название
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Описание
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Версия
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Статус
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Использований
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tools.map((tool) => (
                  <tr key={tool.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{tool.name}</span>
                        {tool.is_experimental && (
                          <StatusBadge variant="warning">Экспериментальный</StatusBadge>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-md truncate">
                        {tool.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      v{tool.version}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge variant={tool.is_active ? 'success' : 'default'}>
                        {tool.is_active ? 'Активен' : 'Неактивен'}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tool.usage_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tool)}
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tool)}
                          title="Удалить"
                          className="text-red-600 hover:text-red-700"
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
      ) : (
        <EmptyState
          icon={<Wrench className="w-6 h-6" />}
          title="Нет инструментов"
          description="Создайте первый инструмент для расширения возможностей агентов"
          action={{
            label: 'Создать инструмент',
            onClick: handleCreate,
          }}
        />
      )}

      {/* Create Modal */}
      <FormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Создать инструмент"
        onSubmit={handleSubmit(onSubmitCreate)}
        submitText="Создать"
        isLoading={isCreating}
        size="lg"
      >
        <div className="space-y-4">
          <FormInput
            control={control}
            name="name"
            label="Название"
            placeholder="product_search"
            required
            error={errors.name?.message}
          />

          <FormTextarea
            control={control}
            name="description"
            label="Описание"
            placeholder="Поиск товаров в каталоге"
            rows={2}
            required
            error={errors.description?.message}
          />

          <FormInput
            control={control}
            name="version"
            label="Версия"
            placeholder="1.0.0"
            required
            error={errors.version?.message}
          />

          <FormTextarea
            control={control}
            name="schema"
            label="JSON Schema"
            placeholder='{"type": "object", "properties": {...}}'
            rows={6}
            required
            error={errors.schema?.message}
          />

          <FormCheckbox
            control={control}
            name="is_experimental"
            label="Экспериментальный инструмент"
          />
        </div>
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTool(null);
        }}
        title="Редактировать инструмент"
        onSubmit={handleSubmit(onSubmitUpdate)}
        submitText="Сохранить"
        isLoading={isUpdating}
        size="lg"
      >
        <div className="space-y-4">
          <FormInput
            control={control}
            name="name"
            label="Название"
            required
            error={errors.name?.message}
          />

          <FormTextarea
            control={control}
            name="description"
            label="Описание"
            rows={2}
            required
            error={errors.description?.message}
          />

          <FormInput
            control={control}
            name="version"
            label="Версия"
            required
            error={errors.version?.message}
          />

          <FormCheckbox
            control={control}
            name="is_experimental"
            label="Экспериментальный инструмент"
          />
        </div>
      </FormModal>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedTool(null);
        }}
        onConfirm={confirmDelete}
        title="Удалить инструмент?"
        description={`Вы уверены, что хотите удалить инструмент "${selectedTool?.name}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
