/**
 * useWebSocketEvent Hook
 * Type-safe WebSocket event subscription with automatic cleanup
 */

import { useEffect, useRef } from 'react';
import { useWebSocketStore } from '../WebSocketManager';
import type { WebSocketEvent, WebSocketEventType } from '../types/events';

/**
 * Subscribe to a WebSocket event (type-safe)
 * @param event - Event name to listen to
 * @param handler - Callback function when event is received
 *
 * @example
 * ```typescript
 * useWebSocketEvent('product.created', (event) => {
 *   // event.data is properly typed as ProductEvent['data']
 *   console.log(event.data.product_name);
 * });
 * ```
 */
export const useWebSocketEvent = <T extends WebSocketEventType>(
  event: T,
  handler: (event: Extract<WebSocketEvent, { event: T }>) => void
) => {
  const subscribe = useWebSocketStore((state) => state.subscribe);
  const handlerRef = useRef(handler);

  // Update handler ref on each render to always use latest handler
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const wrappedHandler = (eventData: Extract<WebSocketEvent, { event: T }>) => {
      handlerRef.current(eventData);
    };

    const unsubscribe = subscribe(event, wrappedHandler);
    return unsubscribe;
    // Only re-subscribe when event changes, subscribe is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);
};

/**
 * Subscribe to multiple WebSocket events (type-safe)
 * @param events - Object mapping event names to handlers
 *
 * @example
 * ```typescript
 * useWebSocketEvents({
 *   'product.created': (event) => {
 *     console.log(event.data.product_name);
 *   },
 *   'order.created': (event) => {
 *     console.log(event.data.order_number);
 *   },
 * });
 * ```
 */
export const useWebSocketEvents = <T extends Partial<Record<WebSocketEventType, (event: WebSocketEvent) => void>>>(
  events: T
) => {
  const subscribe = useWebSocketStore((state) => state.subscribe);
  const eventsRef = useRef(events);

  // Update events ref on each render to always use latest handlers
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    const wrappedEvents: Record<WebSocketEventType, (event: WebSocketEvent) => void> = {} as Record<WebSocketEventType, (event: WebSocketEvent) => void>;

    (Object.keys(events) as WebSocketEventType[]).forEach((eventType) => {
      wrappedEvents[eventType] = (event: WebSocketEvent) => {
        const handler = eventsRef.current[eventType];
        if (handler) {
          handler(event);
        }
      };
    });

    const unsubscribes = (Object.entries(wrappedEvents) as [WebSocketEventType, (event: WebSocketEvent) => void][]).map(
      ([eventType, handler]) => subscribe(eventType, handler as never)
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
    // Only re-subscribe when event keys change, subscribe is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(events).join(',')]);
};
