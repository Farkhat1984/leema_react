/**
 * WebSocket Event Tests
 *
 * Tests event validation, handling, and type safety
 *
 * @created 2025-11-06 - Phase 2 improvements
 */

import { describe, it, expect } from 'vitest';
import {
  validateWebSocketEvent,
  productEventSchema,
  orderEventSchema,
  balanceEventSchema,
  type WebSocketEvent,
} from '../types/events';

describe('WebSocket Event Validation', () => {
  describe('Product Events', () => {
    it('should validate product.created event', () => {
      const event = {
        event: 'product.created',
        data: {
          product_id: 1,
          product_name: 'Test Product',
          shop_id: 1,
          shop_name: 'Test Shop',
          action: 'created',
          is_active: true,
          timestamp: new Date().toISOString(),
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
      expect(result?.event).toBe('product.created');
      expect(result?.data.product_id).toBe(1);
    });

    it('should validate product.approved event with moderation_status', () => {
      const event = {
        event: 'product.approved',
        data: {
          product_id: 1,
          product_name: 'Test Product',
          shop_id: 1,
          action: 'approved',
          moderation_status: 'approved',
          is_active: true,
          timestamp: new Date().toISOString(),
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
      expect(result?.data.moderation_status).toBe('approved');
    });

    it('should validate product.rejected event with rejection_reason', () => {
      const event = {
        event: 'product.rejected',
        data: {
          product_id: 1,
          product_name: 'Test Product',
          shop_id: 1,
          action: 'rejected',
          moderation_status: 'rejected',
          rejection_reason: 'Inappropriate content',
          is_active: false,
          timestamp: new Date().toISOString(),
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
      expect(result?.data.rejection_reason).toBe('Inappropriate content');
    });

    it('should reject invalid product event missing required fields', () => {
      const event = {
        event: 'product.created',
        data: {
          product_id: 1,
          // Missing required fields
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).toBe(null);
    });

    it('should reject product event with wrong data types', () => {
      const event = {
        event: 'product.created',
        data: {
          product_id: '1', // Should be number
          product_name: 'Test Product',
          shop_id: 1,
          action: 'created',
          is_active: true,
          timestamp: new Date().toISOString(),
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).toBe(null);
    });
  });

  describe('Order Events', () => {
    it('should validate order.created event', () => {
      const event = {
        event: 'order.created',
        data: {
          order_id: 123,
          order_number: 'ORD-123',
          shop_id: 1,
          total_amount: 1000,
          status: 'pending',
          action: 'created',
          timestamp: new Date().toISOString(),
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
      expect(result?.event).toBe('order.created');
      expect(result?.data.order_number).toBe('ORD-123');
    });

    it('should validate order.updated event with user_id', () => {
      const event = {
        event: 'order.updated',
        data: {
          order_id: 123,
          order_number: 'ORD-123',
          user_id: 456,
          shop_id: 1,
          total_amount: 1000,
          status: 'processing',
          action: 'updated',
          timestamp: new Date().toISOString(),
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
      expect(result?.data.user_id).toBe(456);
    });

    it('should validate order.completed event', () => {
      const event = {
        event: 'order.completed',
        data: {
          order_id: 123,
          order_number: 'ORD-123',
          shop_id: 1,
          total_amount: 1000,
          status: 'completed',
          action: 'completed',
          timestamp: new Date().toISOString(),
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
      expect(result?.data.status).toBe('completed');
    });

    it('should validate order.cancelled event', () => {
      const event = {
        event: 'order.cancelled',
        data: {
          order_id: 123,
          order_number: 'ORD-123',
          shop_id: 1,
          total_amount: 1000,
          status: 'cancelled',
          action: 'cancelled',
          timestamp: new Date().toISOString(),
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
      expect(result?.data.status).toBe('cancelled');
    });

    it('should reject invalid order event missing required fields', () => {
      const event = {
        event: 'order.created',
        data: {
          order_id: 123,
          // Missing required fields
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).toBe(null);
    });
  });

  describe('Balance Events', () => {
    it('should validate balance.updated event for shop', () => {
      const event = {
        event: 'balance.updated',
        data: {
          shop_id: 1,
          old_balance: 1000,
          new_balance: 2000,
          amount: 1000,
          transaction_type: 'payment',
          timestamp: new Date().toISOString(),
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
      expect(result?.data.new_balance).toBe(2000);
      expect(result?.data.amount).toBe(1000);
    });

    it('should validate balance.updated event for user', () => {
      const event = {
        event: 'balance.updated',
        data: {
          user_id: 123,
          old_balance: 500,
          new_balance: 1500,
          amount: 1000,
          timestamp: new Date().toISOString(),
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
      expect(result?.data.user_id).toBe(123);
    });

    it('should validate balance.updated event with transaction_id', () => {
      const event = {
        event: 'balance.updated',
        data: {
          shop_id: 1,
          old_balance: 1000,
          new_balance: 2000,
          amount: 1000,
          transaction_id: 456,
          transaction_type: 'order_payment',
          timestamp: new Date().toISOString(),
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
      expect(result?.data.transaction_id).toBe(456);
    });

    it('should reject balance event with invalid amount type', () => {
      const event = {
        event: 'balance.updated',
        data: {
          shop_id: 1,
          old_balance: 1000,
          new_balance: 2000,
          amount: '1000', // Should be number
          timestamp: new Date().toISOString(),
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).toBe(null);
    });
  });

  describe('Shop Events', () => {
    it('should validate shop.approved event', () => {
      const event = {
        event: 'shop.approved',
        data: {
          shop_id: 1,
          shop_name: 'Test Shop',
          owner_name: 'Test Owner',
          action: 'approved',
          is_approved: true,
          is_active: true,
          timestamp: new Date().toISOString(),
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
      expect(result?.event).toBe('shop.approved');
    });

    it('should validate shop.rejected event', () => {
      const event = {
        event: 'shop.rejected',
        data: {
          shop_id: 1,
          shop_name: 'Test Shop',
          owner_name: 'Test Owner',
          action: 'rejected',
          is_approved: false,
          is_active: false,
          rejection_reason: 'Invalid documentation',
          timestamp: new Date().toISOString(),
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
      expect(result?.data.rejection_reason).toBe('Invalid documentation');
    });

    it('should validate shop.activated event', () => {
      const event = {
        event: 'shop.activated',
        data: {
          shop_id: 1,
          shop_name: 'Test Shop',
          owner_name: 'Test Owner',
          action: 'activated',
          is_approved: true,
          is_active: true,
          timestamp: new Date().toISOString(),
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
      expect(result?.data.is_active).toBe(true);
    });

    it('should validate shop.deactivated event', () => {
      const event = {
        event: 'shop.deactivated',
        data: {
          shop_id: 1,
          shop_name: 'Test Shop',
          owner_name: 'Test Owner',
          action: 'deactivated',
          is_approved: true,
          is_active: false,
          deactivation_reason: 'Violation of terms',
          timestamp: new Date().toISOString(),
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
      expect(result?.data.is_active).toBe(false);
    });
  });

  describe('Notification Events', () => {
    it('should validate notification.new event', () => {
      const event = {
        event: 'notification.new',
        data: {
          notification_id: 1,
          user_id: 123,
          type: 'order',
          title: 'New Order',
          message: 'You have a new order',
          is_read: false,
          timestamp: new Date().toISOString(),
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
      expect(result?.data.title).toBe('New Order');
    });
  });

  describe('Settings Events', () => {
    it('should validate settings.updated event', () => {
      const event = {
        event: 'settings.updated',
        data: {
          setting_key: 'theme',
          old_value: 'light',
          new_value: 'dark',
          changed_by: 1,
          timestamp: new Date().toISOString(),
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
      expect(result?.data.new_value).toBe('dark');
    });

    it('should validate whatsapp_status_changed event', () => {
      const event = {
        event: 'whatsapp_status_changed',
        data: {
          shop_id: 1,
          status: 'connected',
          phone_number: '+77001234567',
          timestamp: new Date().toISOString(),
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
      expect(result?.data.status).toBe('connected');
    });
  });

  describe('Connection Events', () => {
    it('should validate connected event', () => {
      const event = {
        event: 'connected',
        data: {
          client_id: 'client-123',
          timestamp: new Date().toISOString(),
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
    });

    it('should validate ping event', () => {
      const event = {
        event: 'ping',
        data: {},
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
    });

    it('should validate pong event', () => {
      const event = {
        event: 'pong',
        data: {},
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
    });
  });

  describe('Schema Validation', () => {
    it('should validate product event with productEventSchema', () => {
      const event = {
        event: 'product.created',
        data: {
          product_id: 1,
          product_name: 'Test Product',
          shop_id: 1,
          action: 'created',
          is_active: true,
          timestamp: new Date().toISOString(),
        },
      };

      const result = productEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('should validate order event with orderEventSchema', () => {
      const event = {
        event: 'order.created',
        data: {
          order_id: 123,
          order_number: 'ORD-123',
          shop_id: 1,
          total_amount: 1000,
          status: 'pending',
          action: 'created',
          timestamp: new Date().toISOString(),
        },
      };

      const result = orderEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('should validate balance event with balanceEventSchema', () => {
      const event = {
        event: 'balance.updated',
        data: {
          shop_id: 1,
          old_balance: 1000,
          new_balance: 2000,
          amount: 1000,
          timestamp: new Date().toISOString(),
        },
      };

      const result = balanceEventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should reject completely invalid event structure', () => {
      const event = {
        invalid: 'structure',
      };

      const result = validateWebSocketEvent(event);
      expect(result).toBe(null);
    });

    it('should reject event with unknown event type', () => {
      const event = {
        event: 'unknown.event',
        data: {},
      };

      const result = validateWebSocketEvent(event);
      expect(result).toBe(null);
    });

    it('should reject event with null data', () => {
      const event = {
        event: 'product.created',
        data: null,
      };

      const result = validateWebSocketEvent(event);
      expect(result).toBe(null);
    });

    it('should reject event with missing data field', () => {
      const event = {
        event: 'product.created',
      };

      const result = validateWebSocketEvent(event);
      expect(result).toBe(null);
    });

    it('should handle events with additional fields gracefully', () => {
      const event = {
        event: 'product.created',
        data: {
          product_id: 1,
          product_name: 'Test Product',
          shop_id: 1,
          action: 'created',
          is_active: true,
          timestamp: new Date().toISOString(),
          extra_field: 'should be ignored',
        },
      };

      const result = validateWebSocketEvent(event);
      expect(result).not.toBe(null);
      // Zod should strip unknown fields or pass them through depending on config
    });
  });
});
