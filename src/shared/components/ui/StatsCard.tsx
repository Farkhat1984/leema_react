/**
 * StatsCard Component
 * Display statistics with icon, title, value, and optional trend
 *
 * Usage:
 * <StatsCard
 *   title="Всего продуктов"
 *   value={125}
 *   icon={<PackageIcon />}
 *   trend={{ value: 12, isPositive: true }}
 * />
 */

import { type ReactNode } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Card } from '@/shared/components/feedback/Card';

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode | string; // Support both JSX elements and icon names
  variant?: string; // For future color variants (optional)
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string; // e.g., "vs last month"
  };
  className?: string;
  loading?: boolean;
}

export const StatsCard = ({
  title,
  value,
  icon,
  variant, // Accept but ignore for now (backward compatibility)
  trend,
  className,
  loading = false,
}: StatsCardProps) => {
  if (loading) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          </div>
          <div className="mt-4 h-8 w-32 bg-gray-200 rounded"></div>
          <div className="mt-2 h-4 w-20 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-6 hover:shadow-lg transition-shadow', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString('ru-RU') : value}
          </p>

          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-sm font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? (
                  <ArrowUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4" />
                )}
                {Math.abs(trend.value)}%
              </span>
              {trend.label && (
                <span className="text-sm text-gray-500">{trend.label}</span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              {icon}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatsCard;
