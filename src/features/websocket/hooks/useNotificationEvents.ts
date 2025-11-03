/**
 * useNotificationEvents Hook
 * Handles notification WebSocket events with React Query cache invalidation
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useWebSocketStore } from '../WebSocketManager';
import type { NotificationEvent } from '../services/websocketEvents';

/**
 * Notification Events Hook
 * Automatically invalidates React Query cache and shows toast notifications
 */
export function useNotificationEvents() {
  const queryClient = useQueryClient();
  const subscribe = useWebSocketStore((state) => state.subscribe);
  const isConnected = useWebSocketStore((state) => state.isConnected);

  useEffect(() => {
    if (!isConnected) return;

    // New notification event
    const unsubscribeNewNotification = subscribe('notification.new', (data: unknown) => {
      const event = data as NotificationEvent;

      // Invalidate notification queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });

      // Show toast notification based on type
      const toastConfig = {
        duration: 5000,
      };

      switch (event.type) {
        case 'order':
          toast.info(event.title, {
            ...toastConfig,
            icon: '🛒',
            description: event.message,
          });
          break;

        case 'product':
          toast.success(event.title, {
            ...toastConfig,
            icon: '📦',
            description: event.message,
          });
          break;

        case 'balance':
          toast.success(event.title, {
            ...toastConfig,
            icon: '💰',
            description: event.message,
          });
          break;

        case 'review':
          toast.info(event.title, {
            ...toastConfig,
            icon: '⭐',
            description: event.message,
          });
          break;

        case 'shop':
          toast.info(event.title, {
            ...toastConfig,
            icon: '🏪',
            description: event.message,
          });
          break;

        case 'system':
          toast(event.title, {
            ...toastConfig,
            icon: '⚙️',
            description: event.message,
          });
          break;

        case 'moderation':
          toast.info(event.title, {
            ...toastConfig,
            icon: '👮',
            description: event.message,
          });
          break;

        case 'promotion':
          toast(event.title, {
            ...toastConfig,
            icon: '🎁',
            description: event.message,
          });
          break;

        default:
          toast.info(event.title, {
            ...toastConfig,
            icon: '🔔',
            description: event.message,
          });
      }

      // Play notification sound if available
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(event.title, {
          body: event.message,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: `notification-${event.notification_id}`,
        });
      }
    });

    // Cleanup subscription
    return () => {
      unsubscribeNewNotification();
    };
  }, [isConnected, subscribe, queryClient]);
}
