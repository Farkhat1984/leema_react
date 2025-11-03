/**
 * Skeleton Card Component
 * Displays a skeleton loading state for cards
 */

import { Skeleton } from './Skeleton';
import { Card } from './Card';

export interface SkeletonCardProps {
  /**
   * Number of cards to display
   */
  count?: number;
  /**
   * Card variant (stats, profile, etc.)
   */
  variant?: 'stats' | 'profile' | 'list-item' | 'default';
}

export function SkeletonCard({ count = 1, variant = 'default' }: SkeletonCardProps) {
  const renderCardContent = () => {
    switch (variant) {
      case 'stats':
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        );
      case 'profile':
        return (
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        );
      case 'list-item':
        return (
          <div className="p-4 flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        );
      default:
        return (
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        );
    }
  };

  if (count === 1) {
    return <Card>{renderCardContent()}</Card>;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>{renderCardContent()}</Card>
      ))}
    </>
  );
}
