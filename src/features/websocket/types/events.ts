/**
 * WebSocket Event Types with Discriminated Unions
 * Type-safe WebSocket event handling system
 *
 * @created 2025-11-03
 * @task IMPROVEMENT_CHECKLIST.md - Task 6: Add types for WebSocket events
 */

import { z } from 'zod';

// ==================== BASE EVENT TYPES ====================

export type WebSocketEventType =
  // Product Events
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'product.approved'
  | 'product.rejected'
  // Order Events
  | 'order.created'
  | 'order.updated'
  | 'order.completed'
  | 'order.cancelled'
  // Balance Events
  | 'balance.updated'
  | 'transaction.completed'
  | 'transaction.failed'
  // Review Events
  | 'review.created'
  | 'review.replied'
  // Shop Events
  | 'shop.created'
  | 'shop.updated'
  | 'shop.deleted'
  | 'shop.approved'
  | 'shop.rejected'
  | 'shop.activated'
  | 'shop.deactivated'
  // Newsletter Events
  | 'newsletter.approved'
  | 'newsletter.rejected'
  // System Events
  | 'settings.updated'
  | 'whatsapp_status_changed'
  | 'notification.new'
  // Moderation Events
  | 'moderation_queue.added'
  | 'moderation_queue.removed'
  // Connection Events
  | 'connected'
  | 'ping'
  | 'pong';

// ==================== ZOD SCHEMAS FOR RUNTIME VALIDATION ====================

// Product Event Schema
export const productEventSchema = z.object({
  event: z.enum(['product.created', 'product.updated', 'product.deleted', 'product.approved', 'product.rejected'] as const),
  data: z.object({
    product_id: z.number(),
    product_name: z.string(),
    shop_id: z.number(),
    shop_name: z.string().optional(),
    action: z.string(),
    moderation_status: z.string().optional(),
    rejection_reason: z.string().optional(),
    is_active: z.boolean(),
    product: z.record(z.unknown()).optional(),
    timestamp: z.string(),
  }),
});

// Order Event Schema
export const orderEventSchema = z.object({
  event: z.enum(['order.created', 'order.updated', 'order.completed', 'order.cancelled'] as const),
  data: z.object({
    order_id: z.number(),
    order_number: z.string(),
    user_id: z.number().optional(),
    shop_id: z.number(),
    total_amount: z.number(),
    status: z.string(),
    action: z.string(),
    order: z.record(z.unknown()).optional(),
    timestamp: z.string(),
  }),
});

// Balance Event Schema
export const balanceEventSchema = z.object({
  event: z.literal('balance.updated'),
  data: z.object({
    user_id: z.number().optional(),
    shop_id: z.number().optional(),
    old_balance: z.number(),
    new_balance: z.number(),
    amount: z.number(),
    transaction_id: z.number().optional(),
    transaction_type: z.string().optional(),
    timestamp: z.string(),
  }),
});

// Transaction Event Schema
export const transactionEventSchema = z.object({
  event: z.enum(['transaction.completed', 'transaction.failed'] as const),
  data: z.object({
    transaction_id: z.number(),
    user_id: z.number().optional(),
    shop_id: z.number().optional(),
    amount: z.number(),
    type: z.string(),
    status: z.string(),
    description: z.string().optional(),
    timestamp: z.string(),
  }),
});

// Review Event Schema
export const reviewEventSchema = z.object({
  event: z.enum(['review.created', 'review.replied'] as const),
  data: z.object({
    review_id: z.number(),
    product_id: z.number(),
    user_id: z.number(),
    shop_id: z.number(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
    action: z.string(),
    timestamp: z.string(),
  }),
});

// Shop Event Schema
export const shopEventSchema = z.object({
  event: z.enum(['shop.created', 'shop.updated', 'shop.deleted', 'shop.approved', 'shop.rejected', 'shop.activated', 'shop.deactivated'] as const),
  data: z.object({
    shop_id: z.number(),
    shop_name: z.string(),
    owner_name: z.string(),
    action: z.string(),
    is_approved: z.boolean(),
    is_active: z.boolean(),
    rejection_reason: z.string().optional(),
    deactivation_reason: z.string().optional(),
    shop: z.record(z.unknown()).optional(),
    timestamp: z.string(),
  }),
});

// Newsletter Event Schema
export const newsletterEventSchema = z.object({
  event: z.enum(['newsletter.approved', 'newsletter.rejected'] as const),
  data: z.object({
    newsletter_id: z.number(),
    status: z.enum(['approved', 'rejected'] as const),
    rejection_reason: z.string().optional(),
    timestamp: z.string().optional(),
  }),
});

// Notification Event Schema
export const notificationEventSchema = z.object({
  event: z.literal('notification.new'),
  data: z.object({
    notification_id: z.number(),
    user_id: z.number().optional(),
    shop_id: z.number().optional(),
    type: z.string(),
    title: z.string(),
    message: z.string(),
    data: z.record(z.unknown()).optional(),
    timestamp: z.string(),
  }),
});

// WhatsApp Status Event Schema
export const whatsappStatusEventSchema = z.object({
  event: z.literal('whatsapp_status_changed'),
  data: z.object({
    shop_id: z.number(),
    status: z.enum(['connected', 'disconnected', 'connecting', 'error'] as const),
    phone_number: z.string().optional(),
    qr_code: z.string().optional(),
    timestamp: z.string(),
  }),
});

// Moderation Queue Event Schema
export const moderationQueueEventSchema = z.object({
  event: z.enum(['moderation_queue.added', 'moderation_queue.removed'] as const),
  data: z.object({
    action: z.enum(['added', 'removed'] as const),
    pending_count: z.number(),
    product_id: z.number().optional(),
    shop_id: z.number().optional(),
    timestamp: z.string(),
  }),
});

// Settings Event Schema
export const settingsEventSchema = z.object({
  event: z.literal('settings.updated'),
  data: z.object({
    setting_key: z.string(),
    old_value: z.unknown().optional(),
    new_value: z.unknown(),
    changed_by: z.number(),
    timestamp: z.string(),
  }),
});

// Connection Event Schema (ping/pong) - supports both 'event' and 'type' fields
export const connectionEventSchema = z.union([
  z.object({
    event: z.enum(['connected', 'ping', 'pong'] as const),
    client_type: z.string().optional(),
    client_id: z.number().optional(),
    timestamp: z.string().optional(),
    data: z.unknown().optional(),
  }),
  z.object({
    type: z.enum(['ping', 'pong'] as const),
    timestamp: z.unknown().optional(),
  }),
]);

// ==================== TYPESCRIPT TYPES (INFERRED FROM SCHEMAS) ====================

export type ProductEvent = z.infer<typeof productEventSchema>;
export type OrderEvent = z.infer<typeof orderEventSchema>;
export type BalanceEvent = z.infer<typeof balanceEventSchema>;
export type TransactionEvent = z.infer<typeof transactionEventSchema>;
export type ReviewEvent = z.infer<typeof reviewEventSchema>;
export type ShopEvent = z.infer<typeof shopEventSchema>;
export type NewsletterEvent = z.infer<typeof newsletterEventSchema>;
export type NotificationEvent = z.infer<typeof notificationEventSchema>;
export type WhatsAppStatusEvent = z.infer<typeof whatsappStatusEventSchema>;
export type ModerationQueueEvent = z.infer<typeof moderationQueueEventSchema>;
export type SettingsEvent = z.infer<typeof settingsEventSchema>;
export type ConnectionEvent = z.infer<typeof connectionEventSchema>;

// ==================== DISCRIMINATED UNION ====================

/**
 * Discriminated union of all WebSocket events
 * Use this for type-safe event handling
 */
export type WebSocketEvent =
  | ProductEvent
  | OrderEvent
  | BalanceEvent
  | TransactionEvent
  | ReviewEvent
  | ShopEvent
  | NewsletterEvent
  | NotificationEvent
  | WhatsAppStatusEvent
  | ModerationQueueEvent
  | SettingsEvent
  | ConnectionEvent;

// ==================== TYPE GUARDS ====================

export const isProductEvent = (event: WebSocketEvent): event is ProductEvent => {
  return 'event' in event && event.event.startsWith('product.');
};

export const isOrderEvent = (event: WebSocketEvent): event is OrderEvent => {
  return 'event' in event && event.event.startsWith('order.');
};

export const isBalanceEvent = (event: WebSocketEvent): event is BalanceEvent => {
  return 'event' in event && event.event === 'balance.updated';
};

export const isTransactionEvent = (event: WebSocketEvent): event is TransactionEvent => {
  return 'event' in event && event.event.startsWith('transaction.');
};

export const isReviewEvent = (event: WebSocketEvent): event is ReviewEvent => {
  return 'event' in event && event.event.startsWith('review.');
};

export const isShopEvent = (event: WebSocketEvent): event is ShopEvent => {
  return 'event' in event && event.event.startsWith('shop.');
};

export const isNewsletterEvent = (event: WebSocketEvent): event is NewsletterEvent => {
  return 'event' in event && event.event.startsWith('newsletter.');
};

export const isNotificationEvent = (event: WebSocketEvent): event is NotificationEvent => {
  return 'event' in event && event.event === 'notification.new';
};

export const isWhatsAppStatusEvent = (event: WebSocketEvent): event is WhatsAppStatusEvent => {
  return 'event' in event && event.event === 'whatsapp_status_changed';
};

export const isModerationQueueEvent = (event: WebSocketEvent): event is ModerationQueueEvent => {
  return 'event' in event && event.event.startsWith('moderation_queue.');
};

export const isSettingsEvent = (event: WebSocketEvent): event is SettingsEvent => {
  return 'event' in event && event.event === 'settings.updated';
};

export const isConnectionEvent = (event: WebSocketEvent): event is ConnectionEvent => {
  if ('event' in event) {
    return event.event === 'connected' || event.event === 'ping' || event.event === 'pong';
  }
  if ('type' in event) {
    return event.type === 'ping' || event.type === 'pong';
  }
  return false;
};

// ==================== VALIDATION HELPERS ====================

/**
 * Validate and parse a WebSocket message
 * @returns Validated event or null if invalid
 */
export const validateWebSocketEvent = (rawMessage: unknown): WebSocketEvent | null => {
  if (!rawMessage || typeof rawMessage !== 'object') {
    return null;
  }

  const message = rawMessage as { event?: string; type?: string };

  // Check for connection events first (support both 'event' and 'type' fields)
  if (message.event === 'connected' || message.event === 'ping' || message.event === 'pong' ||
      message.type === 'ping' || message.type === 'pong') {
    try {
      return connectionEventSchema.parse(rawMessage);
    } catch {
      return null;
    }
  }

  if (!message.event) {
    return null;
  }

  try {
    // Match event type and validate with appropriate schema
    if (message.event.startsWith('product.')) {
      return productEventSchema.parse(rawMessage);
    } else if (message.event.startsWith('order.')) {
      return orderEventSchema.parse(rawMessage);
    } else if (message.event === 'balance.updated') {
      return balanceEventSchema.parse(rawMessage);
    } else if (message.event.startsWith('transaction.')) {
      return transactionEventSchema.parse(rawMessage);
    } else if (message.event.startsWith('review.')) {
      return reviewEventSchema.parse(rawMessage);
    } else if (message.event.startsWith('shop.')) {
      return shopEventSchema.parse(rawMessage);
    } else if (message.event.startsWith('newsletter.')) {
      return newsletterEventSchema.parse(rawMessage);
    } else if (message.event === 'notification.new') {
      return notificationEventSchema.parse(rawMessage);
    } else if (message.event === 'whatsapp_status_changed') {
      return whatsappStatusEventSchema.parse(rawMessage);
    } else if (message.event.startsWith('moderation_queue.')) {
      return moderationQueueEventSchema.parse(rawMessage);
    } else if (message.event === 'settings.updated') {
      return settingsEventSchema.parse(rawMessage);
    }

    return null;
  } catch {
    // Validation failed
    return null;
  }
};

// ==================== EVENT HANDLER TYPES ====================

/**
 * Type-safe event handler map
 */
export type WebSocketEventHandlers = {
  [K in WebSocketEventType]?: (event: Extract<WebSocketEvent, { event: K }>) => void | Promise<void>;
};

/**
 * Generic event handler function
 */
export type EventHandler<T extends WebSocketEvent = WebSocketEvent> = (event: T) => void | Promise<void>;

// ==================== UTILITY TYPES ====================

/**
 * Extract data type from event type
 */
export type ExtractEventData<T extends WebSocketEventType> = Extract<
  WebSocketEvent,
  { event: T }
>['data'];

/**
 * Helper to get event category (prefix before the dot)
 */
export const getEventCategory = (eventType: WebSocketEventType): string => {
  const [category] = eventType.split('.');
  return category;
};

/**
 * Helper to get event action (suffix after the dot)
 */
export const getEventAction = (eventType: WebSocketEventType): string => {
  const parts = eventType.split('.');
  return parts[parts.length - 1];
};
