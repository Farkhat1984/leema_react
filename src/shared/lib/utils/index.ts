/**
 * Shared utility functions
 */

// Class name merging utility
export { cn } from './cn';

// Performance utilities
export {
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

// Logger utility
export { logger } from './logger';

// Error handling utilities
export {
  handleError,
  createError,
  isRetryableError,
  getUserMessage,
  AppError,
  ErrorCode,
  ErrorSeverity,
  type HandleErrorOptions,
} from './error-handler';

// Formatting utilities (commonly needed)
export function formatCurrency(amount: number | undefined | null, currency = 'KZT'): string {
  const safeAmount = amount ?? 0;
  return new Intl.NumberFormat('ru-KZ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeAmount);
}

export function formatNumber(value: number | undefined | null): string {
  const safeValue = value ?? 0;
  return safeValue.toLocaleString();
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('ru-KZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('ru-KZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'только что';
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays < 7) return `${diffDays} д назад`;

  return formatDate(date);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}
