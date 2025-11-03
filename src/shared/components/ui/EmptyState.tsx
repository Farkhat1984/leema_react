/**
 * EmptyState Component
 * Display when a list or table has no data
 *
 * Usage:
 * <EmptyState
 *   title="Нет продуктов"
 *   description="Начните добавлять продукты для отображения здесь"
 *   icon={<PackageIcon />}
 *   action={{ label: "Добавить продукт", onClick: handleAdd }}
 * />
 */

import { type ReactNode } from 'react';
import { InboxIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  message?: string; // Alias for description (backward compatibility)
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  className?: string;
}

export const EmptyState = ({
  title,
  description,
  message, // Support both description and message
  icon,
  action,
  className,
}: EmptyStateProps) => {
  const actualDescription = description || message;
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {/* Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-4">
        {icon || <InboxIcon className="h-8 w-8" />}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

      {/* Description */}
      {actualDescription && (
        <p className="mt-2 max-w-md text-sm text-gray-500">{actualDescription}</p>
      )}

      {/* Action Button */}
      {action && (
        <div className="mt-6">
          <Button
            variant={action.variant || 'primary'}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
