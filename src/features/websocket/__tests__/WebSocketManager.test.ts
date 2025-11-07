/**
 * WebSocket Manager Tests
 *
 * Tests WebSocket connection, disconnection, reconnection, and event handling
 *
 * @created 2025-11-06 - Phase 2 improvements
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useWebSocketStore } from '../WebSocketManager';
import type { WebSocketEvent } from '../types/events';

// Mock dependencies
vi.mock('@/shared/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/shared/lib/utils/error-handler', () => ({
  handleError: vi.fn(),
  createError: {
    websocket: {
      connectionError: vi.fn((data?: Record<string, unknown>) => new Error('WebSocket connection error')),
    },
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState: number = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 0);
  }

  send(data: string): void {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSED;
    const event = new CloseEvent('close', { code: code || 1000, reason: reason || '' });
    this.onclose?.(event);
  }

  // Helper to simulate receiving a message
  simulateMessage(data: Record<string, unknown>): void {
    if (this.readyState === MockWebSocket.OPEN) {
      const event = new MessageEvent('message', { data: JSON.stringify(data) });
      this.onmessage?.(event);
    }
  }

  // Helper to simulate an error
  simulateError(): void {
    const event = new Event('error');
    this.onerror?.(event);
  }
}

// Replace global WebSocket with mock
global.WebSocket = MockWebSocket as any;

describe('WebSocketManager', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useWebSocketStore());
    act(() => {
      result.current.disconnect();
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any open connections
    const { result } = renderHook(() => useWebSocketStore());
    act(() => {
      result.current.disconnect();
    });
  });

  describe('Connection', () => {
    it('should connect to WebSocket server', async () => {
      const { result } = renderHook(() => useWebSocketStore());

      act(() => {
        result.current.connect('test-token', 'shop');
      });

      // Wait for connection to open
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.clientType).toBe('shop');
      expect(result.current.reconnectAttempts).toBe(0);
    });

    it('should include token and client_type in WebSocket URL', () => {
      const { result } = renderHook(() => useWebSocketStore());

      act(() => {
        result.current.connect('my-token', 'admin');
      });

      expect(result.current.socket?.url).toContain('token=my-token');
      expect(result.current.socket?.url).toContain('client_type=admin');
      expect(result.current.socket?.url).toContain('platform=web');
    });

    it('should not reconnect if already connected', async () => {
      const { result } = renderHook(() => useWebSocketStore());

      act(() => {
        result.current.connect('test-token', 'shop');
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const firstSocket = result.current.socket;

      act(() => {
        result.current.connect('test-token', 'shop');
      });

      // Should be the same socket
      expect(result.current.socket).toBe(firstSocket);
    });

    it('should not reconnect if already connecting', () => {
      const { result } = renderHook(() => useWebSocketStore());

      act(() => {
        result.current.connect('test-token', 'shop');
      });

      // Try to connect again before first connection completes
      const firstSocket = result.current.socket;

      act(() => {
        result.current.connect('test-token', 'shop');
      });

      // Should be the same socket
      expect(result.current.socket).toBe(firstSocket);
    });

    it('should set connecting state during connection', () => {
      const { result } = renderHook(() => useWebSocketStore());

      expect(result.current.isConnecting).toBe(false);

      act(() => {
        result.current.connect('test-token', 'shop');
      });

      // Should be connecting immediately after connect() call
      expect(result.current.isConnecting).toBe(true);
    });
  });

  describe('Disconnection', () => {
    it('should disconnect from WebSocket server', async () => {
      const { result } = renderHook(() => useWebSocketStore());

      act(() => {
        result.current.connect('test-token', 'shop');
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(result.current.isConnected).toBe(true);

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.socket).toBe(null);
      expect(result.current.clientType).toBe(null);
    });

    it('should clear heartbeat interval on disconnect', async () => {
      const { result } = renderHook(() => useWebSocketStore());

      act(() => {
        result.current.connect('test-token', 'shop');
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(result.current.heartbeatInterval).not.toBe(null);

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.heartbeatInterval).toBe(null);
    });

    it('should clear reconnect timeout on disconnect', async () => {
      const { result } = renderHook(() => useWebSocketStore());

      act(() => {
        result.current.connect('test-token', 'shop');
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.reconnectTimeout).toBe(null);
    });

    it('should close socket with code 1000 on disconnect', async () => {
      const { result } = renderHook(() => useWebSocketStore());

      act(() => {
        result.current.connect('test-token', 'shop');
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const closeSpy = vi.spyOn(result.current.socket!, 'close');

      act(() => {
        result.current.disconnect();
      });

      expect(closeSpy).toHaveBeenCalledWith(1000, 'Client disconnect');
    });
  });

  describe('Reconnection', () => {
    it('should attempt reconnection on abnormal close', async () => {
      const { result } = renderHook(() => useWebSocketStore());

      act(() => {
        result.current.connect('test-token', 'shop');
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate abnormal close (not code 1000)
      act(() => {
        result.current.socket?.close(1006, 'Abnormal closure');
      });

      expect(result.current.reconnectAttempts).toBe(1);
    });

    it('should not attempt reconnection on normal close', async () => {
      const { result } = renderHook(() => useWebSocketStore());

      act(() => {
        result.current.connect('test-token', 'shop');
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate normal close (code 1000)
      act(() => {
        result.current.socket?.close(1000, 'Normal closure');
      });

      expect(result.current.reconnectAttempts).toBe(0);
    });

    it('should stop reconnecting after max attempts', async () => {
      const { result } = renderHook(() => useWebSocketStore());

      act(() => {
        result.current.connect('test-token', 'shop');
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Force reconnect attempts to max
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.socket?.close(1006, 'Abnormal closure');
        });
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Should have reached max attempts
      expect(result.current.reconnectAttempts).toBeGreaterThanOrEqual(5);
    });

    it('should reset reconnect attempts on successful connection', async () => {
      const { result } = renderHook(() => useWebSocketStore());

      act(() => {
        result.current.connect('test-token', 'shop');
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Manually set reconnect attempts
      act(() => {
        useWebSocketStore.setState({ reconnectAttempts: 3 });
      });

      expect(result.current.reconnectAttempts).toBe(3);

      // Simulate successful reconnection
      act(() => {
        result.current.socket?.close(1006, 'Abnormal closure');
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should reset to 0 on successful connection
      expect(result.current.reconnectAttempts).toBe(0);
    });
  });

  describe('Event Handling', () => {
    it('should subscribe to WebSocket events', async () => {
      const { result } = renderHook(() => useWebSocketStore());
      const handler = vi.fn();

      act(() => {
        result.current.subscribe('order:created', handler);
      });

      expect(result.current.eventHandlers.get('order:created')?.size).toBe(1);
    });

    it('should unsubscribe from WebSocket events', async () => {
      const { result } = renderHook(() => useWebSocketStore());
      const handler = vi.fn();

      let unsubscribe: () => void;

      act(() => {
        unsubscribe = result.current.subscribe('order:created', handler);
      });

      expect(result.current.eventHandlers.get('order:created')?.size).toBe(1);

      act(() => {
        unsubscribe();
      });

      expect(result.current.eventHandlers.get('order:created')).toBeUndefined();
    });

    it('should call event handlers when message is received', async () => {
      const { result } = renderHook(() => useWebSocketStore());
      const handler = vi.fn();

      act(() => {
        result.current.connect('test-token', 'shop');
        result.current.subscribe('order:created', handler);
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate receiving a message
      const mockEvent: WebSocketEvent = {
        event: 'order:created',
        data: {
          order_id: 123,
          order_number: 'ORD-123',
          user_name: 'Test User',
          total_amount: 1000,
          created_at: new Date().toISOString(),
        },
      };

      act(() => {
        (result.current.socket as any).simulateMessage(mockEvent);
      });

      expect(handler).toHaveBeenCalledWith(expect.objectContaining(mockEvent));
    });

    it('should support multiple handlers for the same event', async () => {
      const { result } = renderHook(() => useWebSocketStore());
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      act(() => {
        result.current.connect('test-token', 'shop');
        result.current.subscribe('order:created', handler1);
        result.current.subscribe('order:created', handler2);
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const mockEvent: WebSocketEvent = {
        event: 'order:created',
        data: {
          order_id: 123,
          order_number: 'ORD-123',
          user_name: 'Test User',
          total_amount: 1000,
          created_at: new Date().toISOString(),
        },
      };

      act(() => {
        (result.current.socket as any).simulateMessage(mockEvent);
      });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should ignore invalid event formats', async () => {
      const { result } = renderHook(() => useWebSocketStore());
      const handler = vi.fn();

      act(() => {
        result.current.connect('test-token', 'shop');
        result.current.subscribe('order:created', handler);
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate receiving an invalid message
      act(() => {
        (result.current.socket as any).simulateMessage({
          invalid: 'format',
        });
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should ignore pong events', async () => {
      const { result } = renderHook(() => useWebSocketStore());
      const handler = vi.fn();

      act(() => {
        result.current.connect('test-token', 'shop');
        result.current.subscribe('pong', handler);
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate receiving a pong message
      act(() => {
        (result.current.socket as any).simulateMessage({
          event: 'pong',
          data: {},
        });
      });

      // Pong should be handled internally, not passed to handlers
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Sending Messages', () => {
    it('should send messages when connected', async () => {
      const { result } = renderHook(() => useWebSocketStore());

      act(() => {
        result.current.connect('test-token', 'shop');
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const sendSpy = vi.spyOn(result.current.socket!, 'send');

      act(() => {
        result.current.send('mark_notification_read', { notification_id: 123 });
      });

      expect(sendSpy).toHaveBeenCalledWith(
        JSON.stringify({
          event: 'mark_notification_read',
          data: { notification_id: 123 },
        })
      );
    });

    it('should not send messages when not connected', () => {
      const { result } = renderHook(() => useWebSocketStore());

      // Try to send without connecting
      act(() => {
        result.current.send('mark_notification_read', { notification_id: 123 });
      });

      // Should not throw, just log warning
      expect(result.current.socket).toBe(null);
    });
  });

  describe('Heartbeat', () => {
    it('should start heartbeat interval on connection', async () => {
      const { result } = renderHook(() => useWebSocketStore());

      act(() => {
        result.current.connect('test-token', 'shop');
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(result.current.heartbeatInterval).not.toBe(null);
    });

    it('should send ping messages periodically', async () => {
      vi.useFakeTimers();

      const { result } = renderHook(() => useWebSocketStore());

      act(() => {
        result.current.connect('test-token', 'shop');
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(10);
      });

      const sendSpy = vi.spyOn(result.current.socket!, 'send');

      // Advance time to trigger heartbeat
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30000);
      });

      expect(sendSpy).toHaveBeenCalledWith(
        JSON.stringify({ type: 'ping' })
      );

      vi.useRealTimers();
    });

    it('should clear heartbeat interval on disconnect', async () => {
      const { result } = renderHook(() => useWebSocketStore());

      act(() => {
        result.current.connect('test-token', 'shop');
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const heartbeat = result.current.heartbeatInterval;
      expect(heartbeat).not.toBe(null);

      act(() => {
        result.current.disconnect();
      });

      expect(result.current.heartbeatInterval).toBe(null);
    });
  });
});
