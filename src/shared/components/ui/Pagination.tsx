/**
 * Pagination Component
 * Navigate through pages of data
 *
 * Usage:
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   onPageChange={setPage}
 *   totalItems={100}
 *   itemsPerPage={10}
 * />
 */

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
  showInfo?: boolean; // Show "1-10 of 100 items"
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  className,
  showInfo = true,
}: PaginationProps) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, current, and nearby pages
      if (currentPage <= 3) {
        // Near start
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const startItem = totalItems && itemsPerPage
    ? (currentPage - 1) * itemsPerPage + 1
    : null;
  const endItem = totalItems && itemsPerPage
    ? Math.min(currentPage * itemsPerPage, totalItems)
    : null;

  if (totalPages <= 1) return null;

  return (
    <div className={cn('flex items-center justify-between', className)}>
      {/* Info Text */}
      {showInfo && totalItems && startItem && endItem && (
        <p className="text-sm text-gray-700">
          Показано <span className="font-medium">{startItem}</span> -{' '}
          <span className="font-medium">{endItem}</span> из{' '}
          <span className="font-medium">{totalItems}</span>
        </p>
      )}

      {/* Pagination Buttons */}
      <nav className="flex items-center gap-1">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Button>

        {/* Page Numbers */}
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-gray-500"
              >
                ...
              </span>
            );
          }

          return (
            <Button
              key={page}
              variant={currentPage === page ? 'primary' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page as number)}
              className="min-w-[2.5rem]"
            >
              {page}
            </Button>
          );
        })}

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </Button>
      </nav>
    </div>
  );
};

export default Pagination;
