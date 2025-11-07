/**
 * WebSocket Event Types and Handlers
 * Centralized WebSocket event definitions based on BUSINESS_FLOW_DOCUMENTATION.md
 *
 * @deprecated Use types from '@/features/websocket/types/events' instead
 * @updated 2025-11-03 - Migrated to new type system with discriminated unions and Zod validation
 */

import { logger } from '@/shared/lib/utils/logger';

// Re-export new type-safe types for backwards compatibility
export * from '../types/events';

// Import types for use in this file
import type {
  ProductEvent,
  OrderEvent,
  BalanceEvent,
  NotificationEvent,
  ShopEvent,
  ModerationQueueEvent,
} from '../types/events';

// Additional helper function for financial events (not in types/events.ts)
export const isFinancialEvent = (event: string): boolean => {
  return event.startsWith('balance.') || event.startsWith('transaction.');
};

// ==================== DEFAULT EVENT HANDLERS ====================

/**
 * Default product event handler
 * @param event - Full product event with event type and data
 */
export const handleProductEvent = (event: ProductEvent): void => {
  logger.debug(`[WebSocket] Product event: ${event.event}`, {
    productName: event.data.product_name,
    action: event.data.action,
  });

  // You can add default behavior here, like:
  // - Showing toast notifications
  // - Updating React Query cache
  // - Triggering analytics events
};

/**
 * Default order event handler
 * @param event - Full order event with event type and data
 */
export const handleOrderEvent = (event: OrderEvent): void => {
  logger.debug(`[WebSocket] Order event: ${event.event}`, {
    orderNumber: event.data.order_number,
    action: event.data.action,
  });
};

/**
 * Default balance event handler
 * @param event - Full balance event with event type and data
 */
export const handleBalanceEvent = (event: BalanceEvent): void => {
  logger.debug('[WebSocket] Balance updated', {
    old: event.data.old_balance,
    new: event.data.new_balance,
    change: event.data.amount,
  });
};

/**
 * Default notification event handler
 * @param event - Full notification event with event type and data
 */
export const handleNotificationEvent = (event: NotificationEvent): void => {
  logger.debug('[WebSocket] New notification', { title: event.data.title });

  // You can add toast notification here
  // toast.info(event.data.title, { description: event.data.message });
};

/**
 * Default shop event handler
 * @param event - Full shop event with event type and data
 */
export const handleShopEvent = (event: ShopEvent): void => {
  logger.debug(`[WebSocket] Shop event: ${event.event}`, {
    shopName: event.data.shop_name,
    action: event.data.action,
  });
};

/**
 * Default moderation queue event handler
 * @param event - Full moderation queue event with event type and data
 */
export const handleModerationQueueEvent = (event: ModerationQueueEvent): void => {
  logger.debug(`[WebSocket] Moderation queue ${event.data.action}`, {
    pendingCount: event.data.pending_count,
  });
};

// ==================== EXPORT ALL ====================

/**
 * Default event handlers for common WebSocket events
 * These handlers provide basic logging and can be extended for custom behavior
 */
export const defaultEventHandlers = {
  'product.created': handleProductEvent,
  'product.updated': handleProductEvent,
  'product.deleted': handleProductEvent,
  'product.approved': handleProductEvent,
  'product.rejected': handleProductEvent,
  'order.created': handleOrderEvent,
  'order.updated': handleOrderEvent,
  'order.completed': handleOrderEvent,
  'order.cancelled': handleOrderEvent,
  'balance.updated': handleBalanceEvent,
  'notification.new': handleNotificationEvent,
  'shop.created': handleShopEvent,
  'shop.updated': handleShopEvent,
  'shop.approved': handleShopEvent,
  'shop.rejected': handleShopEvent,
  'moderation_queue.added': handleModerationQueueEvent,
  'moderation_queue.removed': handleModerationQueueEvent,
} as const;
