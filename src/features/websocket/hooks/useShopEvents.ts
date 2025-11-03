/**
 * useShopEvents Hook
 * Handles shop-related WebSocket events with React Query cache invalidation
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useWebSocketStore } from '../WebSocketManager';
import type { ShopEvent } from '../services/websocketEvents';

/**
 * Shop Events Hook
 * Automatically invalidates React Query cache and shows toast notifications
 */
export function useShopEvents() {
  const queryClient = useQueryClient();
  const subscribe = useWebSocketStore((state) => state.subscribe);
  const isConnected = useWebSocketStore((state) => state.isConnected);

  useEffect(() => {
    if (!isConnected) return;

    // Shop created event
    const unsubscribeCreated = subscribe('shop.created', (data: unknown) => {
      const event = data as ShopEvent;

      // Invalidate shop lists
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });

      // Show toast notification
      toast.info(`Новый магазин зарегистрирован: ${event.shop_name}`, {
        icon: '🏪',
        duration: 4000,
      });
    });

    // Shop updated event
    const unsubscribeUpdated = subscribe('shop.updated', (data: unknown) => {
      const event = data as ShopEvent;

      // Invalidate specific shop and lists
      queryClient.invalidateQueries({ queryKey: ['shop', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });

      // Show toast notification
      toast.info(`Магазин обновлен: ${event.shop_name}`, {
        icon: '✏️',
        duration: 3000,
      });
    });

    // Shop deleted event
    const unsubscribeDeleted = subscribe('shop.deleted', (data: unknown) => {
      const event = data as ShopEvent;

      // Invalidate shop lists
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });

      // Show toast notification
      toast.error(`Магазин удален: ${event.shop_name}`, {
        icon: '🗑️',
        duration: 3000,
      });
    });

    // Shop approved event
    const unsubscribeApproved = subscribe('shop.approved', (data: unknown) => {
      const event = data as ShopEvent;

      // Invalidate shop data
      queryClient.invalidateQueries({ queryKey: ['shop', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });

      // Show toast notification
      toast.success(`Магазин "${event.shop_name}" одобрен! 🎉`, {
        icon: '✅',
        duration: 5000,
      });
    });

    // Shop rejected event
    const unsubscribeRejected = subscribe('shop.rejected', (data: unknown) => {
      const event = data as ShopEvent;

      // Invalidate shop data
      queryClient.invalidateQueries({ queryKey: ['shop', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });

      // Show toast notification with reason
      const reason = event.rejection_reason || 'Не указана причина';
      toast.error(`Магазин "${event.shop_name}" отклонен`, {
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

    // Shop activated event
    const unsubscribeActivated = subscribe('shop.activated', (data: unknown) => {
      const event = data as ShopEvent;

      // Invalidate shop data
      queryClient.invalidateQueries({ queryKey: ['shop', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });

      // Show toast notification
      toast.success(`Магазин "${event.shop_name}" активирован`, {
        icon: '✅',
        duration: 4000,
      });
    });

    // Shop deactivated event
    const unsubscribeDeactivated = subscribe('shop.deactivated', (data: unknown) => {
      const event = data as ShopEvent;

      // Invalidate shop data
      queryClient.invalidateQueries({ queryKey: ['shop', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'shops'] });

      // Show toast notification with reason
      const reason = event.deactivation_reason || 'Не указана причина';
      toast.warning(`Магазин "${event.shop_name}" деактивирован`, {
        icon: '⚠️',
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
      unsubscribeActivated();
      unsubscribeDeactivated();
    };
  }, [isConnected, subscribe, queryClient]);
}
