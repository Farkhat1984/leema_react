import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/lib/utils/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('animate-pulse rounded-md bg-gray-200', className)}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';
