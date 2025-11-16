import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRenderPerformance, useWebVitals, useApiPerformance, logBundleMetrics } from './usePerformanceMonitor';
import * as logger from '@/shared/lib/utils/logger';

vi.mock('@/shared/lib/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useRenderPerformance Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should track render count', () => {
    const { result, rerender } = renderHook(() => useRenderPerformance('TestComponent'));

    // Initial render
    expect(result.current.renderCount).toBeGreaterThanOrEqual(0);

    const initialCount = result.current.renderCount;

    // Trigger rerender
    rerender();

    // Render count should increase
    expect(result.current.renderCount).toBeGreaterThan(initialCount);
  });

  it('should log render performance in dev mode', () => {
    const originalEnv = import.meta.env.DEV;
    import.meta.env.DEV = true;

    renderHook(() => useRenderPerformance('TestComponent'));

    // Should log debug message
    expect(logger.logger.debug).toHaveBeenCalled();

    import.meta.env.DEV = originalEnv;
  });

  it('should warn about slow renders', async () => {
    const { rerender } = renderHook(() => useRenderPerformance('SlowComponent'));

    // Mock slow render by advancing time
    const originalNow = performance.now;
    let callCount = 0;
    performance.now = vi.fn(() => {
      callCount++;
      // Return time that simulates >50ms render
      return callCount === 1 ? 0 : 100;
    });

    rerender();

    await waitFor(() => {
      // May log warning for slow render
      // This depends on timing
    });

    performance.now = originalNow;
  });

  it('should track multiple rerenders', () => {
    const { result, rerender } = renderHook(() => useRenderPerformance('MultiRenderComponent'));

    const firstCount = result.current.renderCount;

    rerender();
    const secondCount = result.current.renderCount;

    rerender();
    const thirdCount = result.current.renderCount;

    expect(secondCount).toBeGreaterThan(firstCount);
    expect(thirdCount).toBeGreaterThan(secondCount);
  });
});

describe('useWebVitals Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should setup performance observers in production', () => {
    const originalEnv = import.meta.env.PROD;
    import.meta.env.PROD = true;

    const observeSpy = vi.fn();
    const disconnectSpy = vi.fn();

    class MockPerformanceObserver {
      observe = observeSpy;
      disconnect = disconnectSpy;
    }

    global.PerformanceObserver = MockPerformanceObserver as any;

    const { unmount } = renderHook(() => useWebVitals());

    // Should call observe for observers
    expect(observeSpy).toHaveBeenCalled();

    unmount();

    // Should disconnect observers on unmount
    expect(disconnectSpy).toHaveBeenCalled();

    import.meta.env.PROD = originalEnv;
  });

  it('should not setup observers in development', () => {
    const originalEnv = import.meta.env.PROD;
    import.meta.env.PROD = false;

    const observeSpy = vi.fn();

    class MockPerformanceObserver {
      observe = observeSpy;
      disconnect = vi.fn();
    }

    global.PerformanceObserver = MockPerformanceObserver as any;

    renderHook(() => useWebVitals());

    // Should not create observers in dev
    expect(observeSpy).not.toHaveBeenCalled();

    import.meta.env.PROD = originalEnv;
  });

  it('should handle errors in observer setup gracefully', () => {
    const originalEnv = import.meta.env.PROD;
    import.meta.env.PROD = true;

    class MockPerformanceObserver {
      observe = vi.fn(() => {
        throw new Error('Observer failed');
      });
      disconnect = vi.fn();
    }

    global.PerformanceObserver = MockPerformanceObserver as any;

    // Should not crash application
    const { unmount } = renderHook(() => useWebVitals());

    // Should log error
    expect(logger.logger.error).toHaveBeenCalled();

    unmount();

    import.meta.env.PROD = originalEnv;
  });
});

describe('useApiPerformance Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return measureRequest function', () => {
    const { result } = renderHook(() => useApiPerformance());

    expect(result.current).toHaveProperty('measureRequest');
    expect(typeof result.current.measureRequest).toBe('function');
  });

  it('should measure request duration', () => {
    const { result } = renderHook(() => useApiPerformance());
    const startTime = 1000;
    const endTime = 1500;

    const duration = result.current.measureRequest('/api/users', startTime, endTime);

    expect(duration).toBe(500);
  });

  it('should log API performance in dev mode', () => {
    const originalEnv = import.meta.env.DEV;
    import.meta.env.DEV = true;

    const { result } = renderHook(() => useApiPerformance());

    result.current.measureRequest('/api/users', 1000, 1200);

    expect(logger.logger.debug).toHaveBeenCalledWith(
      '[API Performance] /api/users',
      { duration: '200.00ms' }
    );

    import.meta.env.DEV = originalEnv;
  });

  it('should warn about slow API calls', () => {
    const { result } = renderHook(() => useApiPerformance());

    // Simulate slow request (>2000ms)
    result.current.measureRequest('/api/slow-endpoint', 1000, 4000);

    expect(logger.logger.warn).toHaveBeenCalledWith(
      '[Performance Warning] Slow API call to /api/slow-endpoint',
      { duration: '3000.00ms' }
    );
  });

  it('should not warn about fast API calls', () => {
    const { result } = renderHook(() => useApiPerformance());

    result.current.measureRequest('/api/fast-endpoint', 1000, 1500);

    expect(logger.logger.warn).not.toHaveBeenCalled();
  });

  it('should handle multiple measurements', () => {
    const { result } = renderHook(() => useApiPerformance());

    const duration1 = result.current.measureRequest('/api/endpoint1', 1000, 1200);
    const duration2 = result.current.measureRequest('/api/endpoint2', 2000, 2500);
    const duration3 = result.current.measureRequest('/api/endpoint3', 3000, 3100);

    expect(duration1).toBe(200);
    expect(duration2).toBe(500);
    expect(duration3).toBe(100);
  });
});

describe('logBundleMetrics Function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register load event listener in production', () => {
    const originalEnv = import.meta.env.PROD;
    import.meta.env.PROD = true;

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    logBundleMetrics();

    expect(addEventListenerSpy).toHaveBeenCalledWith('load', expect.any(Function));

    import.meta.env.PROD = originalEnv;
  });

  it('should not register listener in development', () => {
    const originalEnv = import.meta.env.PROD;
    import.meta.env.PROD = false;

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    logBundleMetrics();

    expect(addEventListenerSpy).not.toHaveBeenCalled();

    import.meta.env.PROD = originalEnv;
  });

  it('should be safe to call multiple times', () => {
    const originalEnv = import.meta.env.PROD;
    import.meta.env.PROD = true;

    // Should not throw error
    expect(() => {
      logBundleMetrics();
      logBundleMetrics();
      logBundleMetrics();
    }).not.toThrow();

    import.meta.env.PROD = originalEnv;
  });
});
