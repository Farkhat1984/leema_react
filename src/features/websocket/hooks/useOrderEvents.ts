/**
 * useOrderEvents Hook
 * Handles order-related WebSocket events with React Query cache invalidation
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useWebSocketStore } from '../WebSocketManager';
import type { OrderEvent } from '../services/websocketEvents';

/**
 * Order Events Hook
 * Automatically invalidates React Query cache and shows toast notifications
 */
export function useOrderEvents() {
  const queryClient = useQueryClient();
  const subscribe = useWebSocketStore((state) => state.subscribe);
  const isConnected = useWebSocketStore((state) => state.isConnected);

  useEffect(() => {
    if (!isConnected) return;

    // Order created event
    const unsubscribeCreated = subscribe('order.created', (data: unknown) => {
      const event = data as OrderEvent;

      // Invalidate order lists and analytics
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['shop', 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });

      // Show toast notification
      toast.success(`Новый заказ #${event.order_number} создан`, {
        icon: '🛒',
        duration: 4000,
      });
    });

    // Order updated event
    const unsubscribeUpdated = subscribe('order.updated', (data: unknown) => {
      const event = data as OrderEvent;

      // Invalidate specific order and lists
      queryClient.invalidateQueries({ queryKey: ['orders', event.order_id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'orders'] });

      // Show toast notification
      toast.info(`Заказ #${event.order_number} обновлен: ${event.status}`, {
        icon: '📦',
        duration: 3000,
      });
    });

    // Order completed event
    const unsubscribeCompleted = subscribe('order.completed', (data: unknown) => {
      const event = data as OrderEvent;

      // Invalidate order data and balance
      queryClient.invalidateQueries({ queryKey: ['orders', event.order_id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['shop', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['shop', 'analytics'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'wardrobe'] });

      // Show toast notification
      toast.success(`Заказ #${event.order_number} успешно завершен! 🎉`, {
        icon: '✅',
        duration: 5000,
      });
    });

    // Order cancelled event
    const unsubscribeCancelled = subscribe('order.cancelled', (data: unknown) => {
      const event = data as OrderEvent;

      // Invalidate order data and balance
      queryClient.invalidateQueries({ queryKey: ['orders', event.order_id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'balance'] });

      // Show toast notification
      toast.error(`Заказ #${event.order_number} отменен`, {
        icon: '❌',
        duration: 4000,
      });
    });

    // Cleanup all subscriptions
    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeCompleted();
      unsubscribeCancelled();
    };
  }, [isConnected, subscribe, queryClient]);
}
