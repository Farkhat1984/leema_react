/**
 * Common Types - Shared across the application
 * Centralized type definitions for better consistency
 */

// ==================== DATE TYPES ====================

/**
 * Unified Date Range type
 * Used by FormDateRangePicker and all date range filters
 */
export interface DateRange {
  from?: Date;
  to?: Date;
}

/**
 * Alternative date range format (for compatibility)
 */
export interface DateRangeAlt {
  startDate?: Date;
  endDate?: Date;
}

/**
 * Convert DateRange to DateRangeAlt
 */
export function toDateRangeAlt(range: DateRange): DateRangeAlt {
  return {
    startDate: range.from,
    endDate: range.to,
  };
}

/**
 * Convert DateRangeAlt to DateRange
 */
export function toDateRange(range: DateRangeAlt): DateRange {
  return {
    from: range.startDate,
    to: range.endDate,
  };
}

// ==================== TABLE TYPES ====================

/**
 * Simple column definition (for custom tables)
 */
export interface SimpleColumn<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Pagination state
 */
export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

/**
 * Sort state
 */
export interface SortState<T = any> {
  key: keyof T;
  direction: 'asc' | 'desc';
}

// ==================== IMAGE TYPES ====================

/**
 * Image quality levels
 */
export type ImageQuality = 'low' | 'medium' | 'high';

/**
 * Uploaded image with metadata
 */
export interface UploadedImage {
  id: string;
  url: string;
  quality?: ImageQuality;
  file?: File; // Optional: original File object
}

/**
 * Create UploadedImage from File
 */
export function createUploadedImage(file: File, url: string): UploadedImage {
  return {
    id: Math.random().toString(36).substring(7),
    url,
    file,
    quality: 'medium',
  };
}

/**
 * Create UploadedImage array from Files
 */
export function createUploadedImages(files: File[], urls: string[]): UploadedImage[] {
  return files.map((file, index) => createUploadedImage(file, urls[index]));
}

// ==================== STATS TYPES ====================

/**
 * Trend data for StatsCard
 */
export interface TrendData {
  value: number; // Percentage change (15 = 15%)
  isPositive: boolean; // true for increase, false for decrease
  label?: string; // Optional custom label
}

/**
 * Create TrendData from string (e.g., "↑ 15%")
 */
export function parseTrend(trendStr?: string): TrendData | undefined {
  if (!trendStr) return undefined;

  const isPositive = trendStr.includes('↑');
  const valueMatch = trendStr.match(/(\d+\.?\d*)/);
  const value = valueMatch ? parseFloat(valueMatch[1]) : 0;

  return { value, isPositive, label: trendStr };
}

/**
 * Format TrendData to string
 */
export function formatTrend(trend: TrendData): string {
  const arrow = trend.isPositive ? '↑' : '↓';
  return `${arrow} ${trend.value}%`;
}

// ==================== FILTER TYPES ====================

/**
 * Generic filter state
 */
export interface FilterState<T = any> {
  search?: string;
  status?: string;
  dateRange?: DateRange;
  customFilters?: Partial<T>;
}

/**
 * Filter change handler
 */
export type FilterChangeHandler<T = any> = (filters: Partial<FilterState<T>>) => void;

// ==================== API TYPES ====================

/**
 * Generic API response with pagination
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

/**
 * Generic API error
 */
export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

// ==================== FORM TYPES ====================

/**
 * Form submission state
 */
export interface FormState {
  isSubmitting: boolean;
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Generic form values
 */
export type FormValues = Record<string, any>;

// All types are already exported above, no need to re-export
