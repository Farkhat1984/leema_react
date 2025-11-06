/**
 * WebSocket Manager using Zustand
 * Handles real-time WebSocket connections with automatic reconnection
 */

import { create } from 'zustand';
import toast from 'react-hot-toast';
import { CONFIG } from '@/shared/constants/config';
import { logger } from '@/shared/lib/utils/logger';
import { handleError, createError } from '@/shared/lib/utils/error-handler';
import {
  type WebSocketEvent,
  type WebSocketEventType,
  type EventHandler,
  validateWebSocketEvent,
} from './types/events';

interface WSState {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  clientType: 'user' | 'shop' | 'admin' | null;
  eventHandlers: Map<WebSocketEventType, Set<EventHandler>>;
  heartbeatInterval: ReturnType<typeof setInterval> | null;
  reconnectTimeout: ReturnType<typeof setTimeout> | null;
  connect: (token: string, clientType?: 'user' | 'shop' | 'admin') => void;
  disconnect: () => void;
  subscribe: <T extends WebSocketEventType>(
    event: T,
    handler: EventHandler<Extract<WebSocketEvent, { event: T }>>
  ) => () => void;
  send: <T extends WebSocketEventType>(
    event: T,
    data: Extract<WebSocketEvent, { event: T }>['data']
  ) => void;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 5000; // 5 seconds
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export const useWebSocketStore = create<WSState>((set, get) => ({
  socket: null,
  isConnected: false,
  isConnecting: false,
  reconnectAttempts: 0,
  clientType: null,
  eventHandlers: new Map(),
  heartbeatInterval: null,
  reconnectTimeout: null,

  /**
   * Connect to WebSocket server
   */
  connect: (token: string, clientType: 'user' | 'shop' | 'admin' = 'shop') => {
    const state = get();

    // Don't reconnect if already connected or connecting
    if (state.socket?.readyState === WebSocket.OPEN || state.isConnecting) {
      return;
    }

    set({ isConnecting: true, clientType });

    try {
      const wsUrl = `${CONFIG.WS_URL}?token=${token}&client_type=${clientType}&platform=web`;
      const socket = new WebSocket(wsUrl);

      // Connection opened
      socket.onopen = () => {
        const wasReconnecting = get().reconnectAttempts > 0;
        logger.info('[WebSocket] Connected', {
          clientType: get().clientType,
          attempt: wasReconnecting ? get().reconnectAttempts + 1 : 1,
          wasReconnecting,
        });

        // Show success notification if reconnected
        if (wasReconnecting) {
          toast.success('Подключение восстановлено');
        }

        // Clear any existing heartbeat
        const existingHeartbeat = get().heartbeatInterval;
        if (existingHeartbeat) {
          clearInterval(existingHeartbeat);
        }

        // Start new heartbeat
        const heartbeatInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, HEARTBEAT_INTERVAL);

        set({
          isConnected: true,
          isConnecting: false,
          reconnectAttempts: 0,
          heartbeatInterval,
        });
      };

      // Message received
      socket.onmessage = (event) => {
        try {
          const rawMessage = JSON.parse(event.data);

          // Validate and parse the event with Zod schemas
          const validatedEvent = validateWebSocketEvent(rawMessage);

          if (!validatedEvent) {
            logger.warn('[WebSocket] Received invalid event format', rawMessage);
            return;
          }

          // Handle pong response
          if (validatedEvent.event === 'pong') {
            return;
          }

          // Execute all handlers for this event
          const handlers = state.eventHandlers.get(validatedEvent.event);
          if (handlers) {
            handlers.forEach((handler) => {
              try {
                handler(validatedEvent);
              } catch (error) {
                handleError(error, {
                  showToast: false, // Don't spam user with handler errors
                  logError: true,
                  context: { eventType: validatedEvent.event },
                });
              }
            });
          }
        } catch (error) {
          handleError(error, {
            showToast: false,
            logError: true,
            context: { source: 'websocket_message_parsing' },
          });
        }
      };

      // Connection closed
      socket.onclose = (event) => {
        logger.info('[WebSocket] Disconnected', { code: event.code, reason: event.reason });

        // Clear heartbeat on disconnect
        const heartbeat = get().heartbeatInterval;
        if (heartbeat) {
          clearInterval(heartbeat);
        }

        set({ isConnected: false, isConnecting: false, heartbeatInterval: null });

        // Attempt reconnection if not a normal closure
        if (event.code !== 1000) {
          const attempts = get().reconnectAttempts;
          if (attempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = RECONNECT_DELAY * Math.pow(2, attempts); // Exponential backoff
            logger.info(
              `[WebSocket] Reconnecting... (attempt ${attempts + 1}/${MAX_RECONNECT_ATTEMPTS})`,
              { clientType: get().clientType, delay: `${delay}ms` }
            );
            const reconnectTimeout = setTimeout(() => {
              set({ reconnectAttempts: attempts + 1, reconnectTimeout: null });
              const savedClientType = get().clientType || 'shop';
              get().connect(token, savedClientType);
            }, delay);
            set({ reconnectTimeout });
          } else {
            handleError(createError.websocket.connectionError({
              maxAttempts: MAX_RECONNECT_ATTEMPTS
            }), {
              showToast: true,
              logError: true,
              customMessage: 'Не удалось подключиться к серверу уведомлений. Проверьте подключение к интернету.',
            });
          }
        }
      };

      // Connection error
      socket.onerror = (error) => {
        set({ isConnecting: false });

        // Don't show toast on first attempt - it usually succeeds on retry
        // Only log the error for debugging
        handleError(createError.websocket.connectionError(), {
          showToast: false,  // Changed: don't show toast, reconnect usually works
          logError: true,
        });
      };

      set({ socket });
    } catch (error) {
      set({ isConnecting: false });
      handleError(createError.websocket.connectionError(), {
        showToast: true,
        logError: true,
      });
    }
  },

  /**
   * Disconnect from WebSocket server
   */
  disconnect: () => {
    const state = get();

    // Clear heartbeat interval
    if (state.heartbeatInterval) {
      clearInterval(state.heartbeatInterval);
    }

    // Clear reconnect timeout
    if (state.reconnectTimeout) {
      clearTimeout(state.reconnectTimeout);
    }

    // Close socket
    if (state.socket) {
      state.socket.close(1000, 'Client disconnect');
    }

    set({
      socket: null,
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
      clientType: null,
      heartbeatInterval: null,
      reconnectTimeout: null,
    });
  },

  /**
   * Subscribe to WebSocket events (type-safe)
   * Returns unsubscribe function
   */
  subscribe: (event, handler) => {
    const state = get();
    const handlers = state.eventHandlers.get(event) || new Set();
    handlers.add(handler as EventHandler);
    state.eventHandlers.set(event, handlers);

    // Return unsubscribe function
    return () => {
      const currentHandlers = get().eventHandlers.get(event);
      if (currentHandlers) {
        currentHandlers.delete(handler as EventHandler);
        if (currentHandlers.size === 0) {
          get().eventHandlers.delete(event);
        }
      }
    };
  },

  /**
   * Send message to WebSocket server (type-safe)
   */
  send: (event, data) => {
    const socket = get().socket;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ event, data }));
    } else {
      logger.warn('[WebSocket] Cannot send message: not connected');
    }
  },
}));
