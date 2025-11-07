/**
 * Monitoring utilities barrel export
 */

// Web Vitals (Performance monitoring)
export {
  initializeWebVitals,
  getWebVitalsSummary,
  areWebVitalsHealthy,
  METRIC_THRESHOLDS,
} from './webVitals';
export type { EnrichedMetric } from './webVitals';

// Sentry (Error tracking)
export {
  initializeSentry,
  captureSentryException,
  captureSentryMessage,
  setSentryUser,
  clearSentryUser,
  addSentryBreadcrumb,
} from './sentry.tsx';
