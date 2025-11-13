import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, CheckCircle, XCircle, Clock, Phone } from 'lucide-react';
import { kaspiService } from '../../../services/kaspi.service';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/feedback/Card';
import { Badge } from '@/shared/components/feedback/Badge';

const deliveryStatusLabels = {
  sent: 'Отправлено',
  delivered: 'Доставлено',
  failed: 'Ошибка',
};

const deliveryStatusColors = {
  sent: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const deliveryStatusIcons = {
  sent: Clock,
  delivered: CheckCircle,
  failed: XCircle,
};

const notificationTypeLabels = {
  status_change: 'Изменение статуса',
  order_created: 'Новый заказ',
  manual: 'Ручная отправка',
};

export function KaspiNotificationsTab() {
  const [page, setPage] = useState(1);

  // Fetch notifications
  const { data, isLoading, error } = useQuery({
    queryKey: ['kaspi', 'notifications', page],
    queryFn: () =>
      kaspiService.getNotifications({
        page,
        size: 20,
      }),
    retry: false,
  });

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  // Show error state if API is not ready
  if (error && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">История уведомлений</h2>
          <p className="text-gray-600">WhatsApp сообщения клиентам о заказах</p>
        </div>
        <Card className="p-12 text-center">
          <MessageSquare className="w-16 h-16 text-orange-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Интеграция Kaspi еще не настроена</h3>
          <p className="text-gray-600">
            Настройте интеграцию во вкладке "Настройки" чтобы начать получать уведомления
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold">История уведомлений</h2>
        <p className="text-gray-600">WhatsApp сообщения клиентам о заказах</p>
      </div>

      {/* Notifications List */}
      <Card>
        {data?.notifications.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Нет уведомлений</h3>
            <p className="text-gray-600">
              История отправленных WhatsApp сообщений появится здесь
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {data?.notifications.map((notification) => {
              const StatusIcon = deliveryStatusIcons[notification.delivery_status] || Clock;

              return (
                <div key={notification.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {notificationTypeLabels[notification.notification_type] || notification.notification_type}
                      </Badge>
                      {notification.trigger_status && (
                        <Badge variant="outline" className="text-xs">
                          {notification.trigger_status}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={deliveryStatusColors[notification.delivery_status] || 'bg-gray-100 text-gray-700'}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {deliveryStatusLabels[notification.delivery_status] || notification.delivery_status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {notification.message_text}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {notification.phone_number}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(notification.sent_at).toLocaleString('ru-RU')}
                    </div>
                    {notification.retry_count > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Попыток: {notification.retry_count}
                      </Badge>
                    )}
                  </div>

                  {notification.delivery_status === 'failed' && notification.error_message && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        <span className="font-medium">Ошибка:</span> {notification.error_message}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {data && data.total > data.size && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Показано {(page - 1) * data.size + 1}-{Math.min(page * data.size, data.total)} из{' '}
              {data.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Назад
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * data.size >= data.total}
              >
                Вперед
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
