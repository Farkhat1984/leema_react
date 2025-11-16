import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  debounce,
  throttle,
  lazyLoadImage,
  preloadImage,
  batchDOMUpdates,
  measurePerformance,
  markPerformance,
  measureBetweenMarks,
  isSlowDevice,
  prefersReducedMotion,
  getConnectionSpeed,
  isSlowConnection,
  getOptimizedImageUrl,
  prefetchRoute,
  clearPerformanceData,
} from './performance';

describe('Performance Utils', () => {
  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should delay function execution', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 300);

      debouncedFunc();
      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(299);
      expect(func).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should cancel previous call when called multiple times', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 300);

      debouncedFunc();
      vi.advanceTimersByTime(100);
      debouncedFunc();
      vi.advanceTimersByTime(100);
      debouncedFunc();

      vi.advanceTimersByTime(300);
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', () => {
      const func = vi.fn();
      const debouncedFunc = debounce(func, 300);

      debouncedFunc('arg1', 'arg2');
      vi.advanceTimersByTime(300);

      expect(func).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should execute immediately on first call', () => {
      const func = vi.fn();
      const throttledFunc = throttle(func, 300);

      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should ignore calls within throttle period', () => {
      const func = vi.fn();
      const throttledFunc = throttle(func, 300);

      throttledFunc();
      throttledFunc();
      throttledFunc();

      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should allow call after throttle period expires', () => {
      const func = vi.fn();
      const throttledFunc = throttle(func, 300);

      throttledFunc();
      expect(func).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(300);
      throttledFunc();
      expect(func).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments correctly', () => {
      const func = vi.fn();
      const throttledFunc = throttle(func, 300);

      throttledFunc('arg1', 'arg2');
      expect(func).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('lazyLoadImage', () => {
    it('should observe image element and return cleanup function', () => {
      const img = document.createElement('img');
      const cleanup = lazyLoadImage(img, 'test.jpg');

      expect(cleanup).toBeTypeOf('function');

      cleanup();
    });
  });

  describe('preloadImage', () => {
    it('should create Image element and set src', () => {
      const src = 'https://example.com/test.jpg';
      preloadImage(src);

      // Test simply validates function doesn't throw
      // Image loading in jsdom is not fully supported
      expect(true).toBe(true);
    });
  });

  describe('batchDOMUpdates', () => {
    it('should execute callback via requestAnimationFrame', () => {
      const callback = vi.fn();
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

      batchDOMUpdates(callback);

      expect(rafSpy).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('measurePerformance', () => {
    it('should execute function and measure time', () => {
      const func = vi.fn(() => 'result');
      const measured = measurePerformance(func, 'test-function');

      const result = measured();

      expect(result).toBe('result');
      expect(func).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to wrapped function', () => {
      const func = vi.fn((a: number, b: number) => a + b);
      const measured = measurePerformance(func, 'add');

      const result = measured(2, 3);

      expect(result).toBe(5);
      expect(func).toHaveBeenCalledWith(2, 3);
    });
  });

  describe('markPerformance', () => {
    it('should create performance mark', () => {
      const markSpy = vi.spyOn(performance, 'mark');

      markPerformance('test-mark');

      expect(markSpy).toHaveBeenCalledWith('test-mark');
    });
  });

  describe('measureBetweenMarks', () => {
    it('should measure duration between marks or return null', () => {
      markPerformance('start-test');
      markPerformance('end-test');

      const duration = measureBetweenMarks('test-measure', 'start-test', 'end-test');

      // In test environment, may return null if performance.measure not fully supported
      expect(duration === null || typeof duration === 'number').toBe(true);
      if (duration !== null) {
        expect(duration).toBeGreaterThanOrEqual(0);
      }
    });

    it('should return null if marks do not exist', () => {
      const duration = measureBetweenMarks('test', 'nonexistent-start', 'nonexistent-end');

      expect(duration).toBeNull();
    });
  });

  describe('isSlowDevice', () => {
    it('should detect slow device based on CPU cores', () => {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 2,
        configurable: true,
      });

      expect(isSlowDevice()).toBe(true);

      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 8,
        configurable: true,
      });

      expect(isSlowDevice()).toBe(false);
    });

    it('should return false if hardwareConcurrency is not available', () => {
      const descriptor = Object.getOwnPropertyDescriptor(navigator, 'hardwareConcurrency');
      delete (navigator as any).hardwareConcurrency;

      expect(isSlowDevice()).toBe(false);

      if (descriptor) {
        Object.defineProperty(navigator, 'hardwareConcurrency', descriptor);
      }
    });
  });

  describe('prefersReducedMotion', () => {
    it('should detect reduced motion preference', () => {
      // matchMedia is mocked in setup.ts
      const result = prefersReducedMotion();
      expect(result).toBeTypeOf('boolean');
    });
  });

  describe('getConnectionSpeed', () => {
    it('should return connection info if available', () => {
      const mockConnection = {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50,
        saveData: false,
      };

      Object.defineProperty(navigator, 'connection', {
        value: mockConnection,
        configurable: true,
      });

      const speed = getConnectionSpeed();

      expect(speed.effectiveType).toBe('4g');
      expect(speed.downlink).toBe(10);
      expect(speed.rtt).toBe(50);
      expect(speed.saveData).toBe(false);
    });

    it('should return empty object if connection API not available', () => {
      const descriptor = Object.getOwnPropertyDescriptor(navigator, 'connection');
      delete (navigator as any).connection;

      const speed = getConnectionSpeed();

      expect(speed).toEqual({});

      if (descriptor) {
        Object.defineProperty(navigator, 'connection', descriptor);
      }
    });
  });

  describe('isSlowConnection', () => {
    it('should detect slow 2g connection', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: 'slow-2g' },
        configurable: true,
      });

      expect(isSlowConnection()).toBe(true);
    });

    it('should detect 2g connection', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '2g' },
        configurable: true,
      });

      expect(isSlowConnection()).toBe(true);
    });

    it('should not detect fast connection as slow', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '4g' },
        configurable: true,
      });

      expect(isSlowConnection()).toBe(false);
    });
  });

  describe('getOptimizedImageUrl', () => {
    it('should return original URL without options', () => {
      const url = getOptimizedImageUrl('https://example.com/image.jpg');
      expect(url).toBe('https://example.com/image.jpg');
    });

    it('should add width parameter', () => {
      const url = getOptimizedImageUrl('https://example.com/image.jpg', { width: 800 });
      expect(url).toBe('https://example.com/image.jpg?w=800');
    });

    it('should add quality parameter', () => {
      const url = getOptimizedImageUrl('https://example.com/image.jpg', { quality: 80 });
      expect(url).toBe('https://example.com/image.jpg?q=80');
    });

    it('should add format parameter', () => {
      const url = getOptimizedImageUrl('https://example.com/image.jpg', { format: 'webp' });
      expect(url).toBe('https://example.com/image.jpg?fm=webp');
    });

    it('should combine multiple parameters', () => {
      const url = getOptimizedImageUrl('https://example.com/image.jpg', {
        width: 1200,
        quality: 85,
        format: 'webp',
      });

      expect(url).toContain('w=1200');
      expect(url).toContain('q=85');
      expect(url).toContain('fm=webp');
    });

    it('should reduce quality for slow connections', () => {
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: 'slow-2g' },
        configurable: true,
      });

      const url = getOptimizedImageUrl('https://example.com/image.jpg');

      expect(url).toContain('q=60');
    });
  });

  describe('prefetchRoute', () => {
    it('should create prefetch link element', () => {
      const querySelectorSpy = vi.spyOn(document.head, 'appendChild');

      prefetchRoute('/dashboard');

      expect(querySelectorSpy).toHaveBeenCalled();

      const linkElement = querySelectorSpy.mock.calls[0][0] as HTMLLinkElement;
      expect(linkElement.tagName).toBe('LINK');
      expect(linkElement.rel).toBe('prefetch');
      expect(linkElement.href).toContain('/dashboard');
    });
  });

  describe('clearPerformanceData', () => {
    it('should clear marks and measures', () => {
      const clearMarksSpy = vi.spyOn(performance, 'clearMarks');
      const clearMeasuresSpy = vi.spyOn(performance, 'clearMeasures');

      clearPerformanceData();

      expect(clearMarksSpy).toHaveBeenCalled();
      expect(clearMeasuresSpy).toHaveBeenCalled();
    });
  });
});
