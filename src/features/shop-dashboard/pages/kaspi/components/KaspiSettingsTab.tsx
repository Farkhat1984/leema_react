import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Settings, RefreshCw, FileText, AlertCircle } from 'lucide-react';
import { kaspiService } from '../../../services/kaspi.service';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/feedback/Card';
import { FormInput } from '@/shared/components/forms/FormInput';
import { FormTextarea } from '@/shared/components/forms/FormTextarea';
import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/feedback/Alert';

const integrationSchema = z.object({
  api_token: z.string().min(10, 'API токен должен содержать минимум 10 символов'),
  merchant_id: z.string().min(1, 'Введите ID мерчанта'),
});

type IntegrationFormData = z.infer<typeof integrationSchema>;

export function KaspiSettingsTab() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<{ status: string; text: string } | null>(
    null
  );

  // Get integration
  const { data: integration, isLoading } = useQuery({
    queryKey: ['kaspi', 'integration'],
    queryFn: kaspiService.getIntegration,
    retry: false,
  });

  // Create integration
  const createMutation = useMutation({
    mutationFn: kaspiService.createIntegration,
    onSuccess: () => {
      toast.success('✅ Интеграция успешно создана');
      queryClient.invalidateQueries({ queryKey: ['kaspi'] });
      setShowCreateModal(false);
      createForm.reset();
    },
    onError: (error: any) => {
      const errorDetail = error.response?.data?.detail || 'Неизвестная ошибка';

      // Более понятное сообщение для пользователя
      if (errorDetail.includes('timeout') || errorDetail.includes('Kaspi API не отвечает')) {
        toast.error(
          '⏱️ Не удалось подключиться к Kaspi API.\n\n' +
          'Возможные причины:\n' +
          '• Сервер не может достучаться до kaspi.kz (проверьте firewall/proxy)\n' +
          '• Kaspi API временно недоступен\n' +
          '• Неверный API токен\n\n' +
          'Обратитесь к администратору сервера для проверки доступа к kaspi.kz',
          { duration: 8000 }
        );
      } else if (errorDetail.includes('Невалидный')) {
        toast.error(
          '❌ Невалидный API токен или Merchant ID.\n' +
          'Проверьте правильность данных в личном кабинете Kaspi.',
          { duration: 5000 }
        );
      } else {
        toast.error(`Ошибка: ${errorDetail}`, { duration: 5000 });
      }
    },
  });

  // Update integration (for templates only)
  const updateMutation = useMutation({
    mutationFn: kaspiService.updateIntegration,
    onSuccess: () => {
      toast.success('✅ Шаблон успешно обновлен');
      queryClient.invalidateQueries({ queryKey: ['kaspi', 'integration'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Ошибка обновления шаблона');
    },
  });

  // Delete integration
  const deleteMutation = useMutation({
    mutationFn: kaspiService.deleteIntegration,
    onSuccess: () => {
      toast.success('✅ Интеграция успешно удалена');
      setShowDeleteConfirm(false);

      // Сбрасываем кэш интеграции вручную
      queryClient.setQueryData(['kaspi', 'integration'], null);

      // Инвалидируем все запросы Kaspi
      queryClient.invalidateQueries({ queryKey: ['kaspi'] });

      // Перезагружаем страницу через 1 секунду для полного сброса состояния
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Ошибка удаления интеграции');
    },
  });

  // Sync orders manually
  const syncMutation = useMutation({
    mutationFn: (data?: { force?: boolean }) => kaspiService.syncOrders(data),
    onSuccess: (data) => {
      toast.success(
        `✅ Синхронизация завершена!\n` +
        `Новых заказов: ${data.new_orders}\n` +
        `Обновлено: ${data.updated_orders}\n` +
        `Уведомлений отправлено: ${data.notifications_sent}`,
        { duration: 5000 }
      );
      queryClient.invalidateQueries({ queryKey: ['kaspi'] });
    },
    onError: (error: any) => {
      const errorDetail = error.response?.data?.detail || 'Ошибка синхронизации';
      toast.error(`❌ ${errorDetail}`, { duration: 7000 });
    },
  });

  const handleManualSync = () => {
    syncMutation.mutate({ force: true });
  };

  // Forms
  const createForm = useForm<IntegrationFormData>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      api_token: '',
      merchant_id: '',
    },
    mode: 'onChange', // Валидация при каждом изменении
  });

  const handleCreate = (data: IntegrationFormData) => {
    createMutation.mutate(data);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
  };

  const handleSaveTemplate = () => {
    if (!editingTemplate || !integration) return;

    updateMutation.mutate({
      notification_templates: {
        ...integration.notification_templates,
        [editingTemplate.status]: editingTemplate.text,
      },
    });
    setEditingTemplate(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // No integration - show create form
  if (!integration) {
    return (
      <div>
        <Card className="p-8">
          <div className="text-center mb-8">
            <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Интеграция с Kaspi.kz</h2>
            <p className="text-gray-600">
              Подключите интеграцию для автоматического получения заказов и отправки уведомлений
              клиентам
            </p>
          </div>

          <Button onClick={() => setShowCreateModal(true)} size="lg" className="w-full">
            Настроить интеграцию
          </Button>
        </Card>

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Создать интеграцию с Kaspi"
        >
          <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
            {/* Ошибки валидации */}
            {Object.keys(createForm.formState.errors).length > 0 && (
              <Alert variant="error">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Ошибки заполнения формы</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 ml-4 list-disc space-y-1">
                    {Object.entries(createForm.formState.errors).map(([field, error]) => (
                      <li key={field}>{error.message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API токен от Kaspi
              </label>
              <Controller
                control={createForm.control}
                name="api_token"
                render={({ field, fieldState }) => (
                  <div>
                    <input
                      {...field}
                      type="password"
                      placeholder="Введите X-Auth-Token"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {fieldState.error && (
                      <p className="text-sm text-red-600 mt-1">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID мерчанта
              </label>
              <Controller
                control={createForm.control}
                name="merchant_id"
                render={({ field, fieldState }) => (
                  <div>
                    <input
                      {...field}
                      type="text"
                      placeholder="Ваш Merchant ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {fieldState.error && (
                      <p className="text-sm text-red-600 mt-1">{fieldState.error.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            <Alert variant="info">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                После создания интеграции выполните первую синхронизацию вручную. Затем заказы будут синхронизироваться автоматически каждые 5 минут.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                isLoading={createMutation.isPending}
                disabled={createMutation.isPending}
                className="flex-1"
              >
                Создать
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // Integration exists - show settings
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Настройки интеграции</h2>
        <p className="text-gray-600">Управление подключением к Kaspi.kz</p>
      </div>

      {/* Status Card */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Manual Sync Button - ПЕРВАЯ КАРТОЧКА */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-purple-600" />
                  {!integration.last_sync_at ? 'Первая синхронизация' : 'Ручная синхронизация'}
                </h4>
                <p className="text-sm text-gray-600">
                  {!integration.last_sync_at
                    ? '⚡ Запустите первую синхронизацию вручную, затем она будет автоматической каждые 5 минут'
                    : 'Запустить синхронизацию заказов из Kaspi прямо сейчас'}
                </p>
              </div>
              <Button
                onClick={handleManualSync}
                isLoading={syncMutation.isPending}
                disabled={syncMutation.isPending}
                className="ml-4"
                size={!integration.last_sync_at ? 'lg' : 'default'}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                {syncMutation.isPending ? 'Синхронизация...' : 'Синхронизировать'}
              </Button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Merchant ID:</span>
              <p className="font-medium">{integration.merchant_id}</p>
            </div>
            <div>
              <span className="text-gray-600">Последняя синхронизация:</span>
              <p className="font-medium">
                {integration.last_sync_at
                  ? new Date(integration.last_sync_at).toLocaleString('ru-RU')
                  : 'Не выполнялась'}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Статус синхронизации:</span>
              <p
                className={`font-medium ${
                  !integration.last_sync_status
                    ? 'text-gray-500'
                    : integration.last_sync_status === 'success'
                      ? 'text-green-600'
                      : 'text-red-600'
                }`}
              >
                {!integration.last_sync_status
                  ? 'Ожидает первой синхронизации'
                  : integration.last_sync_status === 'success'
                    ? 'Успешно'
                    : 'Ошибка'}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Интервал синхронизации:</span>
              <p className="font-medium">{integration.sync_interval_minutes} мин</p>
            </div>
          </div>

          {/* Error Alert - если последняя синхронизация завершилась с ошибкой */}
          {integration.last_sync_status === 'error' && integration.last_sync_error && (
            <Alert variant="error">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ошибка синхронизации</AlertTitle>
              <AlertDescription>
                <div className="text-sm">
                  {integration.last_sync_error}
                </div>
                {integration.last_sync_at && (
                  <span className="block mt-2 text-xs opacity-75">
                    Время ошибки: {new Date(integration.last_sync_at).toLocaleString('ru-RU')}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

      {/* Settings Card - Templates */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Шаблоны уведомлений</h3>
            <p className="text-sm text-gray-600 mt-1">
              WhatsApp уведомления отправляются автоматически при создании и изменении статуса заказа
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowTemplatesModal(true)}
          >
            <FileText className="w-4 h-4 mr-2" />
            Редактировать шаблоны
          </Button>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200 bg-red-50">
        <h3 className="text-lg font-semibold text-red-700 mb-2">Опасная зона</h3>
        <p className="text-sm text-red-600 mb-4">
          Удаление интеграции приведет к остановке синхронизации заказов
        </p>
        <Button
          onClick={handleDelete}
          variant="outline"
          isLoading={deleteMutation.isPending}
          className="border-red-300 text-red-700 hover:bg-red-100"
        >
          Удалить интеграцию
        </Button>
      </Card>

      {/* Templates Modal */}
      <Modal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        title="Шаблоны уведомлений"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Доступные переменные: {'{customer_name}'}, {'{order_code}'}, {'{total_price}'},{' '}
            {'{status}'}
          </p>

          {Object.entries(integration.notification_templates).map(([status, template]) => (
            <div key={status} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{status}</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingTemplate({ status, text: template })}
                >
                  Редактировать
                </Button>
              </div>
              <p className="text-sm text-gray-600">{template}</p>
            </div>
          ))}
        </div>
      </Modal>

      {/* Edit Template Modal */}
      {editingTemplate && (
        <Modal
          isOpen={!!editingTemplate}
          onClose={() => setEditingTemplate(null)}
          title={`Редактировать шаблон: ${editingTemplate.status}`}
        >
          <div className="space-y-4">
            <FormTextarea
              value={editingTemplate.text}
              onChange={(e) =>
                setEditingTemplate({ ...editingTemplate, text: e.target.value })
              }
              rows={5}
              label="Текст шаблона"
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingTemplate(null)}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                onClick={handleSaveTemplate}
                isLoading={updateMutation.isPending}
                className="flex-1"
              >
                Сохранить
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Удалить интеграцию?"
        description="Вы действительно хотите удалить интеграцию с Kaspi? Это приведет к остановке автоматической синхронизации заказов и отправки уведомлений. Это действие нельзя отменить."
        confirmText="Да, удалить"
        cancelText="Отмена"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
