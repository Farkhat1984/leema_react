/**
 * useWhatsAppEvents Hook
 * Handles WhatsApp status WebSocket events with React Query cache invalidation
 * Phase 6: Additional WebSocket Features
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useWebSocketStore } from '../WebSocketManager';
import type { WhatsAppStatusEvent } from '../services/websocketEvents';

/**
 * WhatsApp Events Hook
 * Automatically invalidates React Query cache and shows status notifications
 */
export function useWhatsAppEvents() {
  const queryClient = useQueryClient();
  const subscribe = useWebSocketStore((state) => state.subscribe);
  const isConnected = useWebSocketStore((state) => state.isConnected);

  useEffect(() => {
    if (!isConnected) return;

    // WhatsApp status changed event
    const unsubscribeWhatsAppStatus = subscribe('whatsapp_status_changed', (data: unknown) => {
      const event = data as WhatsAppStatusEvent;

      // Invalidate WhatsApp-related queries
      queryClient.invalidateQueries({ queryKey: ['shop', 'whatsapp'] });
      queryClient.invalidateQueries({ queryKey: ['shop', 'whatsapp', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['shop', 'whatsapp', 'qr'] });

      // Show toast notification based on status
      const toastConfig = {
        duration: 5000,
      };

      switch (event.status) {
        case 'connected':
          toast.success('WhatsApp подключен', {
            ...toastConfig,
            icon: '📱',
            description: event.phone_number
              ? `Номер: ${event.phone_number}`
              : 'Подключение успешно установлено',
          });
          break;

        case 'disconnected':
          toast.error('WhatsApp отключен', {
            ...toastConfig,
            icon: '📵',
            description: 'Необходимо повторное подключение через QR-код',
          });
          break;

        case 'connecting':
          toast.loading('Подключение WhatsApp...', {
            ...toastConfig,
            icon: '⏳',
            description: 'Отсканируйте QR-код в мобильном приложении WhatsApp',
          });
          break;

        case 'error':
          toast.error('Ошибка подключения WhatsApp', {
            ...toastConfig,
            icon: '❌',
            description: 'Попробуйте переподключиться через настройки',
          });
          break;

        default:
          toast.info('Статус WhatsApp изменен', {
            ...toastConfig,
            icon: '📱',
            description: `Новый статус: ${event.status}`,
          });
      }
    });

    // Cleanup subscription
    return () => {
      unsubscribeWhatsAppStatus();
    };
  }, [isConnected, subscribe, queryClient]);
}
