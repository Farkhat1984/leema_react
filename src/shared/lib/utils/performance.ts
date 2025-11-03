/// <reference types="node" />
/**
 * Performance Utilities
 * Helpers for optimizing React application performance
 */

import { logger } from './logger';

/**
 * Debounce function - delays execution until after wait time
 * Useful for search inputs, window resize, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - limits execution to once per wait time
 * Useful for scroll events, mouse move, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Lazy load images with Intersection Observer
 */
export function lazyLoadImage(
  imageElement: HTMLImageElement,
  src: string,
  options?: IntersectionObserverInit
) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = src;
        observer.unobserve(img);
      }
    });
  }, options);

  observer.observe(imageElement);

  return () => observer.disconnect();
}

/**
 * Preload critical images
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Batch DOM updates using requestAnimationFrame
 */
export function batchDOMUpdates(callback: () => void): void {
  requestAnimationFrame(() => {
    callback();
  });
}

/**
 * Measure function execution time
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  func: T,
  label?: string
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = func(...args);
    const end = performance.now();

    logger.debug(
      `[Performance] ${label || func.name || 'Anonymous'}`, { duration: `${(end - start).toFixed(2)}ms` }
    );

    return result;
  }) as T;
}

/**
 * Create a performance mark
 */
export function markPerformance(name: string): void {
  if ('performance' in window && 'mark' in performance) {
    performance.mark(name);
  }
}

/**
 * Measure performance between two marks
 */
export function measureBetweenMarks(
  measureName: string,
  startMark: string,
  endMark: string
): number | null {
  if ('performance' in window && 'measure' in performance) {
    try {
      performance.measure(measureName, startMark, endMark);
      const measure = performance.getEntriesByName(measureName)[0];
      return measure.duration;
    } catch (e) {
      logger.error('Error measuring performance', e);
      return null;
    }
  }
  return null;
}

/**
 * Check if code is running on slow device
 */
export function isSlowDevice(): boolean {
  if ('navigator' in window && 'hardwareConcurrency' in navigator) {
    return navigator.hardwareConcurrency <= 4;
  }
  return false;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get connection speed info
 */
export function getConnectionSpeed(): {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
} {
  const connection = (navigator as any).connection;

  if (connection) {
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }

  return {};
}

/**
 * Check if connection is slow
 */
export function isSlowConnection(): boolean {
  const { effectiveType } = getConnectionSpeed();
  return effectiveType === 'slow-2g' || effectiveType === '2g';
}

/**
 * Optimize images based on device and connection
 */
export function getOptimizedImageUrl(
  baseUrl: string,
  options?: {
    width?: number;
    quality?: number;
    format?: 'webp' | 'jpeg' | 'png';
  }
): string {
  const { width, quality, format } = options || {};
  const params = new URLSearchParams();

  if (width) params.set('w', width.toString());
  if (quality) params.set('q', quality.toString());
  if (format) params.set('fm', format);

  // Reduce quality for slow connections
  if (isSlowConnection() && !quality) {
    params.set('q', '60');
  }

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Prefetch route/component for faster navigation
 */
export function prefetchRoute(routePath: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = routePath;
  document.head.appendChild(link);
}

/**
 * Cleanup performance marks and measures
 */
export function clearPerformanceData(): void {
  if ('performance' in window) {
    performance.clearMarks();
    performance.clearMeasures();
  }
}
