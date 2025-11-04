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
          // Check if disconnection was due to number change
          const reason = (event as any).reason;
          if (reason === 'whatsapp_number_changed') {
            toast.warning('WhatsApp отключен', {
              ...toastConfig,
              duration: 8000,
              icon: '🔄',
              description: (event as any).message || 'Номер WhatsApp был изменен. Пожалуйста, подключите новый номер.',
            });
          } else {
            toast.error('WhatsApp отключен', {
              ...toastConfig,
              icon: '📵',
              description: 'Необходимо повторное подключение через QR-код',
            });
          }
          break;

        case 'phone_mismatch':
          toast.error('Номер WhatsApp не совпадает!', {
            ...toastConfig,
            duration: 10000,
            icon: '⚠️',
            description: (event as any).message || 'Номер WhatsApp не совпадает с номером в профиле. Пожалуйста, отсканируйте QR код с правильным номером.',
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

    // WhatsApp disconnected event (for profile updates)
    const unsubscribeWhatsAppDisconnected = subscribe('whatsapp_disconnected', (data: unknown) => {
      const event = data as any;

      // Invalidate WhatsApp-related queries
      queryClient.invalidateQueries({ queryKey: ['shop', 'whatsapp'] });
      queryClient.invalidateQueries({ queryKey: ['shop', 'whatsapp', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['shop', 'whatsapp', 'qr'] });

      // Show notification
      toast.warning('WhatsApp отключен', {
        duration: 8000,
        icon: '🔄',
        description: event.message || 'Номер WhatsApp был изменен. Пожалуйста, подключите новый номер.',
      });
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeWhatsAppStatus();
      unsubscribeWhatsAppDisconnected();
    };
  }, [isConnected, subscribe, queryClient]);
}
