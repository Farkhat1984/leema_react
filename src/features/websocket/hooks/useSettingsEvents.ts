/**
 * useSettingsEvents Hook
 * Handles settings update WebSocket events with React Query cache invalidation
 * Phase 6: Additional WebSocket Features
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useWebSocketStore } from '../WebSocketManager';
import type { SettingsEvent } from '../services/websocketEvents';

/**
 * Settings Events Hook
 * Automatically invalidates React Query cache when system settings are updated
 * Used by admin dashboard for system-wide settings changes
 */
export function useSettingsEvents() {
  const queryClient = useQueryClient();
  const subscribe = useWebSocketStore((state) => state.subscribe);
  const isConnected = useWebSocketStore((state) => state.isConnected);

  useEffect(() => {
    if (!isConnected) return;

    // Settings updated event
    const unsubscribeSettings = subscribe('settings.updated', (data: unknown) => {
      const event = data as SettingsEvent;

      // Invalidate settings-related queries
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['shop', 'settings'] });

      // Invalidate specific setting if setting_key is provided
      if (event.setting_key) {
        queryClient.invalidateQueries({ queryKey: ['settings', event.setting_key] });
      }

      // Show toast notification for important settings changes
      const toastConfig = {
        duration: 4000,
      };

      // Categorize settings by key prefix
      const settingCategory = event.setting_key.split('.')[0];

      switch (settingCategory) {
        case 'commission':
          toast.info('Комиссия обновлена', {
            ...toastConfig,
            icon: '💰',
            description: `Настройка: ${event.setting_key}`,
          });
          break;

        case 'payment':
          toast.info('Настройки оплаты обновлены', {
            ...toastConfig,
            icon: '💳',
            description: `Настройка: ${event.setting_key}`,
          });
          break;

        case 'moderation':
          toast.info('Настройки модерации обновлены', {
            ...toastConfig,
            icon: '👮',
            description: `Настройка: ${event.setting_key}`,
          });
          break;

        case 'notification':
          toast.info('Настройки уведомлений обновлены', {
            ...toastConfig,
            icon: '🔔',
            description: `Настройка: ${event.setting_key}`,
          });
          break;

        case 'security':
          toast.warning('Настройки безопасности обновлены', {
            ...toastConfig,
            icon: '🔒',
            description: `Настройка: ${event.setting_key}`,
          });
          break;

        case 'feature':
          toast.info('Функция обновлена', {
            ...toastConfig,
            icon: '⚙️',
            description: `${event.setting_key}: ${event.new_value ? 'включена' : 'выключена'}`,
          });
          break;

        case 'maintenance':
          toast.warning('Режим обслуживания', {
            ...toastConfig,
            icon: '🔧',
            description: event.new_value
              ? 'Сайт переведен в режим обслуживания'
              : 'Режим обслуживания отключен',
          });
          break;

        default:
          // For generic settings, only show toast if it's a critical change
          if (event.setting_key.includes('critical') || event.setting_key.includes('important')) {
            toast.info('Системная настройка обновлена', {
              ...toastConfig,
              icon: '⚙️',
              description: `${event.setting_key}`,
            });
          }
      }
    });

    // Cleanup subscription
    return () => {
      unsubscribeSettings();
    };
  }, [isConnected, subscribe, queryClient]);
}
