import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocketEvent } from '@/features/websocket/hooks/useWebSocketEvent';
import toast from 'react-hot-toast';

/**
 * Hook to handle Kaspi WebSocket events
 * Automatically updates React Query cache and shows notifications
 */
export function useKaspiEvents() {
  const queryClient = useQueryClient();

  // New order created
  useWebSocketEvent('kaspi:order_created', (event) => {
    const { data } = event;

    // Show notification
    toast.success(
      `Новый заказ Kaspi #${data.kaspi_order_code} от ${data.customer_name}`,
      {
        duration: 5000,
        icon: '📦',
      }
    );

    // Invalidate orders list
    queryClient.invalidateQueries({ queryKey: ['kaspi', 'orders'] });
    queryClient.invalidateQueries({ queryKey: ['kaspi', 'stats'] });
  });

  // Order status changed
  useWebSocketEvent('kaspi:order_status_changed', (event) => {
    const { data } = event;

    // Show notification
    toast.success(
      `Заказ Kaspi #${data.kaspi_order_code}: ${data.old_status} → ${data.new_status}`,
      {
        duration: 4000,
        icon: '🔄',
      }
    );

    // Invalidate specific order and orders list
    queryClient.invalidateQueries({ queryKey: ['kaspi', 'order', data.order_id] });
    queryClient.invalidateQueries({ queryKey: ['kaspi', 'orders'] });
    queryClient.invalidateQueries({ queryKey: ['kaspi', 'stats'] });

    // If WhatsApp was sent, also invalidate notifications
    if (data.whatsapp_sent) {
      queryClient.invalidateQueries({ queryKey: ['kaspi', 'notifications'] });
    }
  });
}
