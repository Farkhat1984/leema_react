/**
 * Templates Management Page - Admin
 * Manage AI agent templates
 */

import { useState } from 'react';
import { FileText, Plus, Edit, Trash2, BarChart3 } from 'lucide-react';
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
import {
  useAdminTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from '../../hooks/useAdminAgents';
import { formatDate } from '@/shared/lib/utils';
import type { AgentTemplateResponse } from '../../types/ai-agents.types';

// Template form schema
const templateSchema = z.object({
  name: z.string().min(1, 'Обязательное поле'),
  description: z.string().nullable().optional(),
  system_prompt: z.string().min(10, 'Минимум 10 символов'),
  default_config: z.object({
    model: z.string(),
    temperature: z.number().min(0).max(2),
    max_tokens: z.number().min(100).max(8192),
    language: z.string(),
    tone: z.string(),
    enabled_tools: z.array(z.string()),
    response_style: z.enum(['concise', 'balanced', 'detailed']),
  }),
});

type TemplateFormData = z.infer<typeof templateSchema>;

export default function TemplatesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplateResponse | null>(null);
  const [activeOnlyFilter, setActiveOnlyFilter] = useState(false);

  const { data: templates, isLoading } = useAdminTemplates({ active_only: activeOnlyFilter });
  const { mutate: createTemplate, isPending: isCreating } = useCreateTemplate();
  const { mutate: updateTemplate, isPending: isUpdating } = useUpdateTemplate();
  const { mutate: deleteTemplate, isPending: isDeleting } = useDeleteTemplate();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      description: '',
      system_prompt: '',
      default_config: {
        model: 'gemini-2.0-flash-exp',
        temperature: 0.7,
        max_tokens: 1024,
        language: 'ru',
        tone: 'friendly',
        enabled_tools: [],
        response_style: 'balanced',
      },
    },
  });

  const handleCreate = () => {
    reset({
      name: '',
      description: '',
      system_prompt: '',
      default_config: {
        model: 'gemini-2.0-flash-exp',
        temperature: 0.7,
        max_tokens: 1024,
        language: 'ru',
        tone: 'friendly',
        enabled_tools: [],
        response_style: 'balanced',
      },
    });
    setShowCreateModal(true);
  };

  const handleEdit = (template: AgentTemplateResponse) => {
    setSelectedTemplate(template);
    reset({
      name: template.name,
      description: template.description,
      system_prompt: template.system_prompt,
      default_config: template.default_config,
    });
    setShowEditModal(true);
  };

  const handleDelete = (template: AgentTemplateResponse) => {
    setSelectedTemplate(template);
    setShowDeleteDialog(true);
  };

  const onSubmitCreate = (data: TemplateFormData) => {
    createTemplate(data, {
      onSuccess: () => {
        toast.success('Шаблон создан');
        setShowCreateModal(false);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Не удалось создать шаблон');
      },
    });
  };

  const onSubmitUpdate = (data: TemplateFormData) => {
    if (!selectedTemplate) return;

    updateTemplate(
      { templateId: selectedTemplate.id, data },
      {
        onSuccess: () => {
          toast.success('Шаблон обновлен');
          setShowEditModal(false);
          setSelectedTemplate(null);
        },
        onError: (error: any) => {
          toast.error(error.message || 'Не удалось обновить шаблон');
        },
      }
    );
  };

  const confirmDelete = () => {
    if (!selectedTemplate) return;

    deleteTemplate(selectedTemplate.id, {
      onSuccess: () => {
        toast.success('Шаблон удален');
        setShowDeleteDialog(false);
        setSelectedTemplate(null);
      },
      onError: (error: any) => {
        toast.error(error.message || 'Не удалось удалить шаблон');
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
              <FileText className="w-7 h-7" />
              Шаблоны агентов
            </h1>
            <p className="text-gray-600 mt-1">Управление готовыми шаблонами</p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Создать шаблон
        </Button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={activeOnlyFilter}
            onChange={(e) => setActiveOnlyFilter(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Только активные шаблоны</span>
        </label>
      </div>

      {/* Templates Table */}
      {templates && templates.length > 0 ? (
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
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{template.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-md truncate">
                        {template.description || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge variant={template.is_active ? 'success' : 'default'}>
                        {template.is_active ? 'Активен' : 'Неактивен'}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(template.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template)}
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
          icon={<FileText className="h-8 w-8" />}
          title="Нет шаблонов"
          description="Создайте первый шаблон для упрощения создания агентов"
          action={{
            label: 'Создать шаблон',
            onClick: handleCreate,
          }}
        />
      )}

      {/* Create Modal */}
      <FormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Создать шаблон"
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
            placeholder="Помощник интернет-магазина"
            required
            error={errors.name?.message}
          />

          <FormTextarea
            control={control}
            name="description"
            label="Описание"
            placeholder="Краткое описание назначения шаблона"
            rows={2}
            error={errors.description?.message}
          />

          <FormTextarea
            control={control}
            name="system_prompt"
            label="Системный промпт"
            placeholder="Ты — полезный AI-ассистент..."
            rows={6}
            required
            error={errors.system_prompt?.message}
          />

          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <strong>Примечание:</strong> Конфигурация по умолчанию будет установлена автоматически.
            Вы сможете настроить её после создания.
          </div>
        </div>
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTemplate(null);
        }}
        title="Редактировать шаблон"
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
            error={errors.description?.message}
          />

          <FormTextarea
            control={control}
            name="system_prompt"
            label="Системный промпт"
            rows={6}
            required
            error={errors.system_prompt?.message}
          />
        </div>
      </FormModal>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedTemplate(null);
        }}
        onConfirm={confirmDelete}
        title="Удалить шаблон?"
        description={`Вы уверены, что хотите удалить шаблон "${selectedTemplate?.name}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
