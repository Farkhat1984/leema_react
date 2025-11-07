/**
 * Web Vitals Monitoring
 *
 * Tracks Core Web Vitals metrics to measure real-world user experience.
 * Monitors performance and sends metrics to analytics/monitoring services.
 *
 * Core Web Vitals (Google's metrics for good UX):
 * - LCP (Largest Contentful Paint) - Loading performance - target <2.5s
 * - INP (Interaction to Next Paint) - Interactivity - target <200ms (replaces deprecated FID)
 * - CLS (Cumulative Layout Shift) - Visual stability - target <0.1
 *
 * Additional metrics:
 * - FCP (First Contentful Paint) - When first content renders
 * - TTFB (Time to First Byte) - Server response time
 *
 * @see https://web.dev/vitals/
 * @see https://github.com/GoogleChrome/web-vitals
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric, ReportOpts } from 'web-vitals';
import { CONFIG } from '@/shared/constants/config';
import { logger } from '@/shared/lib/utils/logger';

/**
 * Web Vitals metric thresholds (from web.dev recommendations)
 */
export const METRIC_THRESHOLDS = {
  LCP: {
    good: 2500, // 2.5s
    needsImprovement: 4000, // 4s
  },
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  FCP: {
    good: 1800, // 1.8s
    needsImprovement: 3000, // 3s
  },
  TTFB: {
    good: 800, // 800ms
    needsImprovement: 1800, // 1.8s
  },
  INP: {
    good: 200, // 200ms
    needsImprovement: 500, // 500ms
  },
} as const;

/**
 * Metric rating based on value
 */
type MetricRating = 'good' | 'needs-improvement' | 'poor';

/**
 * Extended metric with rating and context
 */
export interface EnrichedMetric extends Metric {
  rating: MetricRating;
  threshold: { good: number; needsImprovement: number };
}

/**
 * Get rating for a metric based on thresholds
 */
function getMetricRating(name: string, value: number): MetricRating {
  const threshold = METRIC_THRESHOLDS[name as keyof typeof METRIC_THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Enrich metric with rating and threshold info
 */
function enrichMetric(metric: Metric): EnrichedMetric {
  const threshold = METRIC_THRESHOLDS[metric.name as keyof typeof METRIC_THRESHOLDS] || {
    good: 0,
    needsImprovement: 0,
  };

  return {
    ...metric,
    rating: getMetricRating(metric.name, metric.value),
    threshold,
  };
}

/**
 * Format metric value for display
 */
function formatMetricValue(metric: Metric): string {
  const { name, value } = metric;

  // CLS is a unitless score
  if (name === 'CLS') {
    return value.toFixed(3);
  }

  // INP is in milliseconds
  if (name === 'INP') {
    return `${Math.round(value)}ms`;
  }

  // LCP, FCP, TTFB are in milliseconds
  return `${Math.round(value)}ms`;
}

/**
 * Get emoji indicator for metric rating
 */
function getRatingEmoji(rating: MetricRating): string {
  switch (rating) {
    case 'good':
      return '✅';
    case 'needs-improvement':
      return '⚠️';
    case 'poor':
      return '❌';
  }
}

/**
 * Log metric to console (development only)
 */
function logMetric(metric: EnrichedMetric): void {
  if (!CONFIG.IS_DEV) return;

  const formattedValue = formatMetricValue(metric);
  const emoji = getRatingEmoji(metric.rating);

  logger.info(
    `${emoji} Web Vital: ${metric.name} = ${formattedValue} (${metric.rating})`,
    {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      navigationType: metric.navigationType,
      threshold: metric.threshold,
    }
  );
}

/**
 * Send metric to analytics/monitoring service
 * TODO: Integrate with backend analytics endpoint or third-party service
 */
function sendMetricToAnalytics(metric: EnrichedMetric): void {
  // Skip in development
  if (CONFIG.IS_DEV) return;

  // TODO: Send to backend analytics endpoint
  // Example implementation:
  // const body = {
  //   name: metric.name,
  //   value: metric.value,
  //   rating: metric.rating,
  //   id: metric.id,
  //   navigationType: metric.navigationType,
  //   url: window.location.href,
  //   userAgent: navigator.userAgent,
  //   timestamp: Date.now(),
  // };
  //
  // fetch(`${CONFIG.API_URL}/analytics/web-vitals`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(body),
  //   keepalive: true, // Send even if page is unloading
  // }).catch((error) => {
  //   logger.error('Failed to send web vitals', error);
  // });

  // For now, just log that we would send
  logger.debug('Would send metric to analytics', {
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
  });

  // Send to Sentry (if available) for performance monitoring
  if (window.__SENTRY__) {
    // Sentry will automatically capture performance metrics if configured
    logger.debug('Metric captured by Sentry', { metric: metric.name });
  }
}

/**
 * Handle Web Vitals metric report
 */
function handleMetric(metric: Metric): void {
  const enriched = enrichMetric(metric);

  // Log to console in development
  logMetric(enriched);

  // Send to analytics in production
  sendMetricToAnalytics(enriched);

  // Warn if metric is poor
  if (enriched.rating === 'poor') {
    logger.warn(`Poor Web Vital detected: ${metric.name}`, {
      value: formatMetricValue(metric),
      threshold: enriched.threshold,
      page: window.location.pathname,
    });
  }
}

/**
 * Configuration for Web Vitals reporting
 */
const reportOpts: ReportOpts = {
  // Report all metrics, even after page becomes hidden
  reportAllChanges: CONFIG.IS_DEV,
};

/**
 * Initialize Web Vitals tracking
 * Call this in main.tsx at app startup
 */
export function initializeWebVitals(): void {
  try {
    // Track Largest Contentful Paint (loading performance)
    onLCP(handleMetric, reportOpts);

    // Track Interaction to Next Paint (interactivity metric, replaces deprecated FID)
    // Wrap in try-catch in case of compatibility issues
    try {
      onINP(handleMetric, reportOpts);
    } catch (inpError) {
      // INP metric might not be supported in all browsers
      if (CONFIG.IS_DEV) {
        logger.debug('INP metric not supported', { error: inpError });
      }
    }

    // Track Cumulative Layout Shift (visual stability)
    onCLS(handleMetric, reportOpts);

    // Track First Contentful Paint (rendering)
    onFCP(handleMetric, reportOpts);

    // Track Time to First Byte (server response)
    onTTFB(handleMetric, reportOpts);

    logger.debug('Web Vitals monitoring initialized', {
      environment: CONFIG.ENV,
      reportAllChanges: reportOpts.reportAllChanges,
    });
  } catch (error) {
    logger.error('Failed to initialize Web Vitals', error);
  }
}

/**
 * Get current Web Vitals summary (for debugging/admin panel)
 * Returns a promise that resolves with current metrics
 */
export async function getWebVitalsSummary(): Promise<Record<string, EnrichedMetric>> {
  const metrics: Record<string, EnrichedMetric> = {};

  const collectMetric = (metric: Metric) => {
    metrics[metric.name] = enrichMetric(metric);
  };

  try {
    // Collect all current metrics
    onLCP(collectMetric, { reportAllChanges: true });

    // INP might have compatibility issues
    try {
      onINP(collectMetric, { reportAllChanges: true });
    } catch (e) {
      // Skip INP if not supported
    }

    onCLS(collectMetric, { reportAllChanges: true });
    onFCP(collectMetric, { reportAllChanges: true });
    onTTFB(collectMetric, { reportAllChanges: true });
  } catch (error) {
    logger.error('Error collecting web vitals', error);
  }

  // Wait a bit for metrics to be collected
  await new Promise((resolve) => setTimeout(resolve, 100));

  return metrics;
}

/**
 * Check if Web Vitals are healthy
 * Returns true if all core metrics are "good"
 */
export async function areWebVitalsHealthy(): Promise<boolean> {
  const metrics = await getWebVitalsSummary();
  const coreMetrics = ['LCP', 'CLS', 'INP']; // Core Web Vitals (FID is deprecated)

  return coreMetrics.every((name) => {
    const metric = metrics[name];
    return !metric || metric.rating === 'good';
  });
}

// Type augmentation for window (Sentry check)
declare global {
  interface Window {
    __SENTRY__?: unknown;
  }
}
