import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Settings as SettingsIcon, Trash2, Edit2, Save, X } from 'lucide-react';
import { apiClient } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';
import { Button } from '@/shared/components/ui/Button';
import { BackButton } from '@/shared/components/ui/BackButton';
import { PageLoader } from '@/shared/components/feedback/PageLoader';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';

// Types
interface Setting {
  id: number;
  key: string;
  value: string;
  description: string;
  is_system: boolean;
  updated_at: string;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<Record<number, string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<Setting | null>(null);

  // Fetch settings
  const { data: settings, isLoading } = useQuery<Setting[]>({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.ADMIN.SETTINGS);
      return response.data;
    },
    // Отключаем автоматическое обновление во время редактирования
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  // Update setting mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, value }: { id: number; value: string }) => {
      const response = await apiClient.put(API_ENDPOINTS.ADMIN.SETTING_UPDATE(String(id)), { value });
      return response.data;
    },
    onMutate: async ({ id, value }) => {
      // Отменяем текущие запросы чтобы они не перезаписали наше оптимистичное обновление
      await queryClient.cancelQueries({ queryKey: ['admin-settings'] });

      // Сохраняем предыдущее состояние
      const previousSettings = queryClient.getQueryData<Setting[]>(['admin-settings']);

      // Оптимистично обновляем кеш
      queryClient.setQueryData<Setting[]>(['admin-settings'], (old) => {
        if (!old) return old;
        return old.map((setting) =>
          setting.id === id
            ? { ...setting, value, updated_at: new Date().toISOString() }
            : setting
        );
      });

      return { previousSettings };
    },
    onSuccess: (_, variables) => {
      toast.success('Настройка успешно обновлена');
      setEditingId(null);
      setEditValues(prev => {
        const newValues = { ...prev };
        delete newValues[variables.id];
        return newValues;
      });
    },
    onError: (error, _, context) => {
      // Откатываем изменения при ошибке
      if (context?.previousSettings) {
        queryClient.setQueryData(['admin-settings'], context.previousSettings);
      }
      toast.error('Не удалось обновить настройку');
    },
    onSettled: () => {
      // Синхронизируем с сервером после завершения
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
  });

  // Delete setting mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiClient.delete(API_ENDPOINTS.ADMIN.SETTING_DELETE(String(id)));
      return response.data;
    },
    onMutate: async (id) => {
      // Отменяем текущие запросы
      await queryClient.cancelQueries({ queryKey: ['admin-settings'] });

      // Сохраняем предыдущее состояние
      const previousSettings = queryClient.getQueryData<Setting[]>(['admin-settings']);

      // Оптимистично удаляем из кеша
      queryClient.setQueryData<Setting[]>(['admin-settings'], (old) => {
        if (!old) return old;
        return old.filter((setting) => setting.id !== id);
      });

      return { previousSettings };
    },
    onSuccess: () => {
      toast.success('Настройка успешно удалена');
      setDeleteDialogOpen(false);
      setSettingToDelete(null);
    },
    onError: (error, _, context) => {
      // Откатываем изменения при ошибке
      if (context?.previousSettings) {
        queryClient.setQueryData(['admin-settings'], context.previousSettings);
      }
      toast.error('Не удалось удалить настройку');
    },
    onSettled: () => {
      // Синхронизируем с сервером
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
  });


  const handleEdit = (setting: Setting) => {
    setEditingId(setting.id);
    setEditValues(prev => ({ ...prev, [setting.id]: setting.value }));
  };

  const handleSave = (id: number) => {
    const value = editValues[id];
    if (value && value.trim()) {
      updateMutation.mutate({ id, value: value.trim() });
    }
  };

  const handleCancel = () => {
    if (editingId !== null) {
      setEditValues(prev => {
        const newValues = { ...prev };
        delete newValues[editingId];
        return newValues;
      });
    }
    setEditingId(null);
  };

  const handleValueChange = (id: number, value: string) => {
    setEditValues(prev => ({ ...prev, [id]: value }));
  };

  const handleDeleteClick = (setting: Setting) => {
    setSettingToDelete(setting);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (settingToDelete) {
      deleteMutation.mutate(settingToDelete.id);
    }
  };

  // Мемоизируем настройки чтобы сохранить порядок
  const sortedSettings = useMemo(() => {
    if (!settings) return [];
    // Сортируем по ID чтобы порядок всегда был одинаковый
    return [...settings].sort((a, b) => a.id - b.id);
  }, [settings]);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="w-7 h-7" />
            Настройки платформы
          </h1>
          <p className="text-gray-600 mt-1">Управление системными параметрами и настройками</p>
        </div>
        <BackButton to="/admin" />
      </div>

      {/* Settings Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ключ настройки
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Значение
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Описание
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Обновлено
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSettings.map((setting) => {
                const isEditing = editingId === setting.id;
                const displayValue = isEditing ? (editValues[setting.id] ?? setting.value) : setting.value;

                return (
                <tr
                  key={`setting-${setting.id}`}
                  className={`transition-colors ${isEditing ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{setting.key}</span>
                      {setting.is_system && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          Системная
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      // Числовые поля для newsletter и AI credits настроек
                      (setting.key.startsWith('newsletter_') && (
                        setting.key.includes('frequency') ||
                        setting.key.includes('batch_size') ||
                        setting.key.includes('batch_pause') ||
                        setting.key.includes('time_window')
                      )) || setting.key.startsWith('ai_') ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <input
                              type="number"
                              min={
                                setting.key.includes('time_window') ? "0" :
                                setting.key.includes('ai_credits_price') ? "0.01" :
                                setting.key.startsWith('ai_') ? "0" :
                                "1"
                              }
                              max={setting.key.includes('time_window') ? "23" : "99999"}
                              step={setting.key.includes('ai_credits_price') ? "0.01" : "1"}
                              value={displayValue}
                              onChange={(e) => handleValueChange(setting.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSave(setting.id);
                                } else if (e.key === 'Escape') {
                                  handleCancel();
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              autoFocus
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {setting.description}
                              {setting.key.includes('ai_credits_price') && ' (USD)'}
                              {(setting.key === 'ai_new_user_bonus_credits' || setting.key === 'ai_daily_free_quota_new_user') && ' (кредитов)'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={displayValue}
                          onChange={(e) => handleValueChange(setting.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSave(setting.id);
                            } else if (e.key === 'Escape') {
                              handleCancel();
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          autoFocus
                        />
                      )
                    ) : (
                      <span className="text-sm text-gray-900">
                        {setting.key.includes('frequency') || setting.key.includes('pause')
                          ? `${setting.value} сек`
                          : setting.key.includes('time_window')
                          ? `${setting.value}:00`
                          : setting.key.includes('ai_credits_price')
                          ? `$${setting.value}`
                          : setting.key === 'ai_new_user_bonus_credits' || setting.key === 'ai_daily_free_quota_new_user'
                          ? `${setting.value} кредитов`
                          : setting.value}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{setting.description || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {new Date(setting.updated_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(setting.id)}
                          isLoading={updateMutation.isPending}
                          className="flex items-center gap-1"
                        >
                          <Save className="w-4 h-4" />
                          Сохранить
                        </Button>
                        <Button size="sm" variant="secondary" onClick={handleCancel}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(setting)}
                          className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-50 rounded transition-colors"
                          title="Редактировать"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!setting.is_system && (
                          <button
                            onClick={() => handleDeleteClick(setting)}
                            className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>

          {/* Empty State */}
          {sortedSettings.length === 0 && (
            <div className="text-center py-12">
              <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Настройки не найдены</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Удалить настройку"
        message={`Вы уверены, что хотите удалить настройку "${settingToDelete?.key}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
