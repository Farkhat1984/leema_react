/**
 * Admin Notifications Page
 * Displays real-time notifications for administrators
 */

import { useEffect, useState } from 'react';
import { useWebSocketStore } from '@/features/websocket/WebSocketManager';
import { Card } from '@/shared/components/feedback/Card';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/feedback/Badge';
import { toast } from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'moderation' | 'shop' | 'user' | 'order' | 'refund' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  data?: any;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const { isConnected, subscribe } = useWebSocketStore();

  useEffect(() => {
    loadNotifications();

    // Subscribe to WebSocket notifications
    const unsubscribe = subscribe('notification.new', (data) => {
      // Extract notification from the event data
      const notification = (data as any).notification;
      if (notification) {
        addNotification(notification as Notification);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe]);

  const loadNotifications = async () => {
    try {
      // TODO: Replace with actual API call
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'shop',
          title: 'Новый магазин на модерации',
          message: 'Магазин "Fashion Style" ожидает одобрения',
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'urgent',
          actionUrl: '/admin/shops/pending',
        },
        {
          id: '2',
          type: 'moderation',
          title: 'Товар требует проверки',
          message: '5 новых товаров ожидают модерации',
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          read: false,
          priority: 'high',
          actionUrl: '/admin/products',
        },
        {
          id: '3',
          type: 'refund',
          title: 'Запрос на возврат',
          message: 'Пользователь запросил возврат средств по заказу #12345',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: false,
          priority: 'high',
          actionUrl: '/admin/refunds',
        },
        {
          id: '4',
          type: 'user',
          title: 'Новая регистрация',
          message: '10 новых пользователей зарегистрировалось сегодня',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          read: true,
          priority: 'low',
        },
        {
          id: '5',
          type: 'system',
          title: 'Обновление системы',
          message: 'Доступно обновление платформы v2.1.0',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          read: true,
          priority: 'medium',
        },
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      toast.error('Ошибка загрузки уведомлений');
    }
  };

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (notification.priority === 'urgent') {
      toast.error(notification.title, { duration: 5000 });
    } else {
      toast.success(notification.title);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      toast.error('Ошибка обновления уведомления');
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('Все уведомления отмечены как прочитанные');
    } catch (error) {
      toast.error('Ошибка обновления уведомлений');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Уведомление удалено');
    } catch (error) {
      toast.error('Ошибка удаления уведомления');
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const icons = {
      moderation: '🔍',
      shop: '🏪',
      user: '👤',
      order: '📦',
      refund: '💸',
      system: '⚙️',
    };
    return icons[type] || '🔔';
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority];
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    if (filter === 'urgent') return n.priority === 'urgent';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const urgentCount = notifications.filter((n) => n.priority === 'urgent' && !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Уведомления администратора</h1>
          <p className="text-gray-600 mt-1">
            {urgentCount > 0 ? (
              <span className="text-red-600 font-medium">
                ⚠️ {urgentCount} срочных уведомлений требуют внимания
              </span>
            ) : unreadCount > 0 ? (
              `У вас ${unreadCount} непрочитанных уведомлений`
            ) : (
              'Все уведомления прочитаны'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={isConnected ? 'success' : 'error'}
            className="text-xs"
          >
            {isConnected ? '🟢 Онлайн' : '🔴 Оффлайн'}
          </Badge>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              Отметить все как прочитанные
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`pb-4 px-1 font-medium border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Все ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`pb-4 px-1 font-medium border-b-2 transition-colors ${
            filter === 'unread'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Непрочитанные ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('urgent')}
          className={`pb-4 px-1 font-medium border-b-2 transition-colors ${
            filter === 'urgent'
              ? 'border-red-500 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Срочные ({urgentCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет уведомлений
            </h3>
            <p className="text-gray-600">
              {filter === 'urgent'
                ? 'Нет срочных уведомлений'
                : filter === 'unread'
                ? 'Все уведомления прочитаны'
                : 'У вас пока нет уведомлений'}
            </p>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 transition-colors ${
                !notification.read
                  ? notification.priority === 'urgent'
                    ? 'bg-red-50 border-red-300 border-2'
                    : 'bg-blue-50 border-blue-200'
                  : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="text-3xl flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3
                      className={`font-medium ${
                        !notification.read
                          ? 'text-gray-900'
                          : 'text-gray-700'
                      }`}
                    >
                      {notification.title}
                    </h3>
                    <Badge
                      className={`text-xs ${getPriorityColor(
                        notification.priority
                      )}`}
                    >
                      {notification.priority === 'urgent'
                        ? '🚨 Срочно'
                        : notification.priority === 'high'
                        ? 'Важно'
                        : notification.priority === 'medium'
                        ? 'Средний'
                        : 'Низкий'}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {new Date(notification.timestamp).toLocaleString('ru-RU')}
                    </span>
                    <div className="flex gap-2">
                      {notification.actionUrl && (
                        <Button
                          onClick={() => window.location.href = notification.actionUrl!}
                          variant="primary"
                          size="sm"
                          className="text-xs"
                        >
                          Перейти
                        </Button>
                      )}
                      {!notification.read && (
                        <Button
                          onClick={() => markAsRead(notification.id)}
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                        >
                          Прочитано
                        </Button>
                      )}
                      <Button
                        onClick={() => deleteNotification(notification.id)}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
