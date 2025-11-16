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
import {
  ArrowUpIcon,
  ArrowDownIcon,
  Users,
  Shirt,
  Package,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Box,
  BarChart3,
  Store,
  Clock,
  Check,
  Zap,
  XCircle,
  Pause,
  Star,
  Sparkles,
  UserPlus,
  Wallet,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Card } from '@/shared/components/feedback/Card';

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode | string; // Support both JSX elements and icon names
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'error' | 'info'; // Color variants
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string; // e.g., "vs last month"
  };
  className?: string;
  loading?: boolean;
}

const variantStyles = {
  primary: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
  },
  success: {
    bg: 'bg-green-100',
    text: 'text-green-600',
  },
  warning: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-600',
  },
  danger: {
    bg: 'bg-red-100',
    text: 'text-red-600',
  },
  error: {
    bg: 'bg-red-100',
    text: 'text-red-600',
  },
  info: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
  },
}

// Icon name to Lucide icon mapping
const iconMap: Record<string, LucideIcon> = {
  users: Users,
  tshirt: Shirt,
  shirt: Shirt,
  package: Package,
  box: Box,
  'shopping-bag': ShoppingBag,
  dollar: DollarSign,
  'trending-up': TrendingUp,
  chart: BarChart3,
  store: Store,
  clock: Clock,
  check: Check,
  zap: Zap,
  'x-circle': XCircle,
  pause: Pause,
  star: Star,
  sparkles: Sparkles,
  'user-plus': UserPlus,
  wallet: Wallet,
}

export const StatsCard = ({
  title,
  value,
  icon,
  variant = 'primary',
  trend,
  className,
  loading = false,
}: StatsCardProps) => {
  const colors = variantStyles[variant] || variantStyles.primary;

  // Convert string icon name to actual icon component
  const IconComponent = typeof icon === 'string' ? iconMap[icon] : null;
  const iconElement = IconComponent ? <IconComponent className="h-6 w-6" /> : icon;

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

        {iconElement && (
          <div className="flex-shrink-0">
            <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', colors.bg, colors.text)}>
              {iconElement}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatsCard;
