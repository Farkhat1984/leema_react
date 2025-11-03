/**
 * StatusBadge Component
 * Display status with color-coded badges
 *
 * Usage:
 * <StatusBadge status="approved" />
 * <StatusBadge status="pending" />
 * <StatusBadge status="rejected" />
 */

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const statusBadgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset',
  {
    variants: {
      status: {
        // Product/Shop Statuses
        pending: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
        approved: 'bg-green-50 text-green-800 ring-green-600/20',
        rejected: 'bg-red-50 text-red-800 ring-red-600/20',
        active: 'bg-green-50 text-green-800 ring-green-600/20',
        inactive: 'bg-gray-50 text-gray-800 ring-gray-600/20',
        deactivated: 'bg-red-50 text-red-800 ring-red-600/20',
        suspended: 'bg-orange-50 text-orange-800 ring-orange-600/20',

        // Newsletter Statuses
        draft: 'bg-gray-50 text-gray-800 ring-gray-600/20',
        sending: 'bg-blue-50 text-blue-800 ring-blue-600/20',
        completed: 'bg-green-50 text-green-800 ring-green-600/20',
        failed: 'bg-red-50 text-red-800 ring-red-600/20',

        // Order Statuses
        paid: 'bg-green-50 text-green-800 ring-green-600/20',
        shipped: 'bg-blue-50 text-blue-800 ring-blue-600/20',
        delivered: 'bg-green-50 text-green-800 ring-green-600/20',
        cancelled: 'bg-red-50 text-red-800 ring-red-600/20',
        refunded: 'bg-purple-50 text-purple-800 ring-purple-600/20',

        // Refund Statuses
        processing: 'bg-blue-50 text-blue-800 ring-blue-600/20',
        processed: 'bg-green-50 text-green-800 ring-green-600/20',

        // Generic
        success: 'bg-green-50 text-green-800 ring-green-600/20',
        warning: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
        error: 'bg-red-50 text-red-800 ring-red-600/20',
        info: 'bg-blue-50 text-blue-800 ring-blue-600/20',
        critical: 'bg-red-50 text-red-800 ring-red-600/20',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-xs',
        lg: 'px-4 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      status: 'pending',
      size: 'md',
    },
  }
);

// Status text mapping (Russian)
const statusTextMap: Record<string, string> = {
  pending: 'Ожидает',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  active: 'Активно',
  inactive: 'Неактивно',
  deactivated: 'Деактивировано',
  suspended: 'Заблокировано',
  draft: 'Черновик',
  sending: 'Отправляется',
  completed: 'Завершено',
  failed: 'Ошибка',
  paid: 'Оплачено',
  shipped: 'Отправлено',
  delivered: 'Доставлено',
  cancelled: 'Отменено',
  refunded: 'Возврат',
  processing: 'Обработка',
  processed: 'Обработано',
  success: 'Успешно',
  warning: 'Внимание',
  error: 'Ошибка',
  info: 'Инфо',
  critical: 'Критично',
};

export interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  status?: NonNullable<VariantProps<typeof statusBadgeVariants>['status']>;
  variant?: string; // Alias for status (backward compatibility)
  className?: string;
  customText?: string; // Override default text
}

export const StatusBadge = ({ status, variant, size, className, customText }: StatusBadgeProps) => {
  // Support both 'status' and 'variant' props
  const actualStatus = (status || variant || 'pending') as NonNullable<VariantProps<typeof statusBadgeVariants>['status']>;
  const text = customText || statusTextMap[actualStatus] || actualStatus;

  return (
    <span className={cn(statusBadgeVariants({ status: actualStatus, size }), className)}>
      {text}
    </span>
  );
};

export default StatusBadge;
