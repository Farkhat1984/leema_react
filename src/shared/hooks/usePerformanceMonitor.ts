/**
 * Performance Monitoring Hook
 * Tracks component render performance and web vitals
 */

import { useEffect, useRef } from 'react';
import { logger } from '@/shared/lib/utils/logger';

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  startTime: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

/**
 * Hook to measure component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderCountRef = useRef(0);
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    renderCountRef.current += 1;
    const renderTime = performance.now() - startTimeRef.current;

    if (import.meta.env.DEV) {
      logger.debug(
        `[Performance] ${componentName} - Render #${renderCountRef.current} - ${renderTime.toFixed(2)}ms`
      );
    }

    // Log slow renders (>50ms)
    if (renderTime > 50) {
      logger.warn(
        `[Performance Warning] Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`
      );
    }

    startTimeRef.current = performance.now();
  });

  return {
    renderCount: renderCountRef.current,
  };
}

/**
 * Hook to track Web Vitals (LCP, FID, CLS, FCP, TTFB)
 */
export function useWebVitals(): void {
  useEffect(() => {
    // Only track in production
    if (import.meta.env.PROD && 'PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcp = lastEntry.startTime;
        logger.info('[Web Vitals] LCP', { lcp: lcp.toFixed(2) + 'ms' });
      });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEventTiming;
          const fid = fidEntry.processingStart - fidEntry.startTime;
          logger.info('[Web Vitals] FID', { fid: fid.toFixed(2) + 'ms' });
        });
      });

      // Cumulative Layout Shift (CLS)
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const clsEntry = entry as LayoutShiftEntry;
          if (!clsEntry.hadRecentInput) {
            clsScore += clsEntry.value;
          }
        }
        logger.info('[Web Vitals] CLS', { cls: clsScore.toFixed(4) });
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        fidObserver.observe({ entryTypes: ['first-input'] });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        logger.error('Error setting up performance observers', e);
      }

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
      };
    }
    return undefined;
  }, []);
}

/**
 * Hook to measure API request performance
 */
export function useApiPerformance() {
  const measureRequest = (
    endpoint: string,
    startTime: number,
    endTime: number
  ) => {
    const duration = endTime - startTime;

    if (import.meta.env.DEV) {
      logger.debug(`[API Performance] ${endpoint}`, { duration: duration.toFixed(2) + 'ms' });
    }

    // Log slow API calls (>2000ms)
    if (duration > 2000) {
      logger.warn(
        `[Performance Warning] Slow API call to ${endpoint}`, { duration: duration.toFixed(2) + 'ms' }
      );
    }

    return duration;
  };

  return { measureRequest };
}

/**
 * Utility to measure bundle size metrics
 */
export function logBundleMetrics() {
  if (import.meta.env.PROD && 'performance' in window) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paintData = performance.getEntriesByType('paint');

        logger.info('[Bundle Metrics]', {
          'DNS Lookup': `${(perfData.domainLookupEnd - perfData.domainLookupStart).toFixed(2)}ms`,
          'TCP Connection': `${(perfData.connectEnd - perfData.connectStart).toFixed(2)}ms`,
          'Request Time': `${(perfData.responseStart - perfData.requestStart).toFixed(2)}ms`,
          'Response Time': `${(perfData.responseEnd - perfData.responseStart).toFixed(2)}ms`,
          'DOM Processing': `${(perfData.domComplete - perfData.domLoading).toFixed(2)}ms`,
          'Total Load Time': `${(perfData.loadEventEnd - perfData.fetchStart).toFixed(2)}ms`,
        });

        paintData.forEach((entry) => {
          logger.info(`[Paint Metric] ${entry.name}`, { time: `${entry.startTime.toFixed(2)}ms` });
        });
      }, 0);
    });
  }
}
