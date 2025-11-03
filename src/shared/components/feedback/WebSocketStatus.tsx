/**
 * WebSocketStatus Component
 * Shows connection status indicator for WebSocket
 */

import { useWebSocketStore } from '@/features/websocket';
import { cn } from '@/shared/lib/utils';

interface WebSocketStatusProps {
  className?: string;
  showText?: boolean;
}

export const WebSocketStatus = ({
  className,
  showText = true,
}: WebSocketStatusProps) => {
  const isConnected = useWebSocketStore((state) => state.isConnected);
  const isConnecting = useWebSocketStore((state) => state.isConnecting);
  const reconnectAttempts = useWebSocketStore((state) => state.reconnectAttempts);

  const getStatusConfig = () => {
    if (isConnected) {
      return {
        color: 'bg-green-500',
        text: 'Подключено',
        pulse: false,
      };
    }
    if (isConnecting || reconnectAttempts > 0) {
      return {
        color: 'bg-yellow-500',
        text: reconnectAttempts > 0 ? `Переподключение... (${reconnectAttempts}/5)` : 'Подключение...',
        pulse: true,
      };
    }
    return {
      color: 'bg-red-500',
      text: 'Не подключено',
      pulse: false,
    };
  };

  const status = getStatusConfig();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex h-3 w-3">
        <span
          className={cn(
            'absolute inline-flex h-full w-full rounded-full opacity-75',
            status.color,
            status.pulse && 'animate-ping'
          )}
        />
        <span className={cn('relative inline-flex h-3 w-3 rounded-full', status.color)} />
      </div>
      {showText && (
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {status.text}
        </span>
      )}
    </div>
  );
};
