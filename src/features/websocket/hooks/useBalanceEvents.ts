/**
 * useBalanceEvents Hook
 * Handles balance and transaction WebSocket events with React Query cache invalidation
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useWebSocketStore } from '../WebSocketManager';
import type { BalanceEvent, TransactionEvent } from '../services/websocketEvents';

/**
 * Balance Events Hook
 * Automatically invalidates React Query cache and shows toast notifications for balance changes
 */
export function useBalanceEvents() {
  const queryClient = useQueryClient();
  const subscribe = useWebSocketStore((state) => state.subscribe);
  const isConnected = useWebSocketStore((state) => state.isConnected);

  useEffect(() => {
    if (!isConnected) return;

    // Balance updated event
    const unsubscribeBalanceUpdated = subscribe('balance.updated', (data: unknown) => {
      const event = data as BalanceEvent;

      // Invalidate balance queries
      queryClient.invalidateQueries({ queryKey: ['user', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['shop', 'balance'] });

      // Determine if increase or decrease
      const isIncrease = event.new_balance > event.old_balance;
      const diff = Math.abs(event.amount);

      // Show toast notification
      if (isIncrease) {
        toast.success(`Баланс пополнен на ${diff.toLocaleString('ru-RU')} ₸`, {
          icon: '💰',
          duration: 5000,
        });
      } else {
        toast.info(`Баланс списан: ${diff.toLocaleString('ru-RU')} ₸`, {
          icon: '💳',
          duration: 4000,
        });
      }
    });

    // Transaction completed event
    const unsubscribeTransactionCompleted = subscribe('transaction.completed', (data: unknown) => {
      const event = data as TransactionEvent;

      // Invalidate balance and transaction history
      queryClient.invalidateQueries({ queryKey: ['user', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['shop', 'balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      // Show toast notification based on transaction type
      const amount = event.amount.toLocaleString('ru-RU');
      const description = event.description || event.type;

      if (event.type === 'refund' || event.type === 'deposit') {
        toast.success(`Транзакция завершена: +${amount} ₸`, {
          icon: '✅',
          duration: 5000,
        });
      } else if (event.type === 'withdrawal' || event.type === 'payment') {
        toast.info(`Транзакция завершена: -${amount} ₸`, {
          icon: '💳',
          duration: 4000,
        });
      } else {
        toast.success(`Транзакция завершена: ${description}`, {
          icon: '✅',
          duration: 4000,
        });
      }
    });

    // Transaction failed event
    const unsubscribeTransactionFailed = subscribe('transaction.failed', (data: unknown) => {
      const event = data as TransactionEvent;

      // Invalidate transaction history
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      // Show error toast
      const description = event.description || 'Неизвестная ошибка';
      toast.error(`Транзакция не удалась: ${description}`, {
        icon: '❌',
        duration: 6000,
      });
    });

    // Cleanup all subscriptions
    return () => {
      unsubscribeBalanceUpdated();
      unsubscribeTransactionCompleted();
      unsubscribeTransactionFailed();
    };
  }, [isConnected, subscribe, queryClient]);
}
