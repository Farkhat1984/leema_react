/**
 * useProductEvents Hook
 * Handles product-related WebSocket events with React Query cache invalidation
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useWebSocketStore } from '../WebSocketManager';
import type { ProductEvent } from '../services/websocketEvents';

/**
 * Product Events Hook
 * Automatically invalidates React Query cache and shows toast notifications
 */
export function useProductEvents() {
  const queryClient = useQueryClient();
  const subscribe = useWebSocketStore((state) => state.subscribe);
  const isConnected = useWebSocketStore((state) => state.isConnected);

  useEffect(() => {
    if (!isConnected) return;

    // Product created event
    const unsubscribeCreated = subscribe('product.created', (data: unknown) => {
      const event = data as ProductEvent;

      // Invalidate product lists
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['shop', 'analytics'] });

      // Show toast notification
      toast.success(`Новый товар добавлен: ${event.product_name}`, {
        icon: '🎉',
        duration: 4000,
      });
    });

    // Product updated event
    const unsubscribeUpdated = subscribe('product.updated', (data: unknown) => {
      const event = data as ProductEvent;

      // Invalidate specific product and lists
      queryClient.invalidateQueries({ queryKey: ['products', event.product_id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      // Show toast notification
      toast.info(`Товар обновлен: ${event.product_name}`, {
        icon: '✏️',
        duration: 3000,
      });
    });

    // Product deleted event
    const unsubscribeDeleted = subscribe('product.deleted', (data: unknown) => {
      const event = data as ProductEvent;

      // Invalidate product lists
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['shop', 'analytics'] });

      // Show toast notification
      toast.error(`Товар удален: ${event.product_name}`, {
        icon: '🗑️',
        duration: 3000,
      });
    });

    // Product approved event
    const unsubscribeApproved = subscribe('product.approved', (data: unknown) => {
      const event = data as ProductEvent;

      // Invalidate specific product and lists
      queryClient.invalidateQueries({ queryKey: ['products', event.product_id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['shop', 'analytics'] });

      // Show toast notification
      toast.success(`Товар "${event.product_name}" одобрен! 🎉`, {
        icon: '✅',
        duration: 5000,
      });
    });

    // Product rejected event
    const unsubscribeRejected = subscribe('product.rejected', (data: unknown) => {
      const event = data as ProductEvent;

      // Invalidate specific product and lists
      queryClient.invalidateQueries({ queryKey: ['products', event.product_id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });

      // Show toast notification with reason
      const reason = event.rejection_reason || 'Не указана причина';
      toast.error(`Товар "${event.product_name}" отклонен`, {
        icon: '❌',
        duration: 6000,
      });

      // Show reason in separate toast after a delay
      setTimeout(() => {
        toast.error(`Причина: ${reason}`, {
          duration: 5000,
        });
      }, 500);
    });

    // Cleanup all subscriptions
    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeApproved();
      unsubscribeRejected();
    };
  }, [isConnected, subscribe, queryClient]);
}
