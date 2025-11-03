/**
 * NotificationDropdown Component
 * Displays notifications with unread badge and mark as read functionality
 *
 * Features:
 * - Real-time unread count badge
 * - Dropdown with notification list
 * - Mark individual notifications as read
 * - Mark all as read button
 * - Type-specific icons
 * - Time formatting (relative time)
 * - Scroll for long lists
 * - Empty state
 */

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, X, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, type Notification } from '@/features/notifications/services/notificationService';
import toast from 'react-hot-toast';
import { cn } from '@/shared/lib/utils';

interface NotificationDropdownProps {
  className?: string;
}

/**
 * Get icon for notification type
 */
const getNotificationIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    order_created: '🛒',
    order_updated: '📦',
    order_completed: '✅',
    order_cancelled: '❌',
    product_approved: '🎉',
    product_rejected: '❌',
    shop_approved: '✅',
    shop_rejected: '❌',
    shop_deactivated: '⚠️',
    newsletter_approved: '✅',
    newsletter_rejected: '❌',
    balance_updated: '💰',
    transaction_completed: '✅',
    transaction_failed: '❌',
    review_created: '⭐',
    review_replied: '💬',
    refund_approved: '✅',
    refund_rejected: '❌',
    whatsapp_status_changed: '📱',
    system_announcement: '📢',
  };

  return iconMap[type] || '🔔';
};

/**
 * Format timestamp to relative time
 */
const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'только что';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин назад`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ч назад`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} дн назад`;

  return past.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  /**
   * Fetch unread count
   */
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: notificationService.getUnreadCount,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });

  const unreadCount = unreadData?.count || 0;

  /**
   * Fetch notifications (only when dropdown is open)
   */
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications({ limit: 20 }),
    staleTime: 1000 * 60, // 1 minute
    enabled: isOpen, // Only fetch when dropdown is open
  });

  /**
   * Mark notification as read mutation
   */
  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    },
    onError: () => {
      toast.error('Не удалось отметить уведомление как прочитанное');
    },
  });

  /**
   * Mark all as read mutation
   */
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
      toast.success(`Отмечено прочитанными: ${data.count}`);
    },
    onError: () => {
      toast.error('Не удалось отметить все уведомления');
    },
  });

  /**
   * Handle mark as read
   */
  const handleMarkAsRead = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsReadMutation.mutate(id);
  };

  /**
   * Handle mark all as read
   */
  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;
    markAllAsReadMutation.mutate();
  };

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Уведомления"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[18px]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              Уведомления
              {unreadCount > 0 && (
                <span className="ml-2 text-xs text-gray-500">({unreadCount} непрочитанных)</span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Прочитать все
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Bell className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 text-center">
                  Нет уведомлений
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer',
                      !notification.is_read && 'bg-purple-50 hover:bg-purple-100/50'
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className={cn(
                            'text-sm text-gray-900',
                            !notification.is_read && 'font-semibold'
                          )}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <button
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              className="flex-shrink-0 ml-2 p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded transition-colors"
                              title="Отметить как прочитанное"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center mt-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatRelativeTime(notification.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to notifications page when implemented
                  toast.info('Страница всех уведомлений в разработке');
                }}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium w-full text-center"
              >
                Посмотреть все уведомления
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
