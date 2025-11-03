/**
 * FilterPanel Component
 * Panel with filters for lists and tables
 *
 * Usage:
 * <FilterPanel
 *   filters={[
 *     { label: 'Статус', value: status, options: [...], onChange: setStatus },
 *     { label: 'Категория', value: category, options: [...], onChange: setCategory }
 *   ]}
 *   onClear={handleClearFilters}
 * />
 */

import { XIcon, FilterIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/Button';
import { Select } from '@/shared/components/ui/Select';

export interface Filter {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface FilterPanelProps {
  filters: Filter[];
  onClear?: () => void;
  className?: string;
  showClearButton?: boolean;
}

export const FilterPanel = ({
  filters,
  onClear,
  className,
  showClearButton = true,
}: FilterPanelProps) => {
  const hasActiveFilters = filters.some((filter) => filter.value !== '');

  return (
    <div className={cn('flex items-center gap-3 flex-wrap', className)}>
      {/* Filter Icon */}
      <div className="flex items-center gap-2 text-gray-600">
        <FilterIcon className="h-5 w-5" />
        <span className="text-sm font-medium">Фильтры:</span>
      </div>

      {/* Filter Selects */}
      {filters.map((filter, index) => (
        <div key={index} className="min-w-[200px]">
          <Select
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
            className="w-full"
          >
            <option value="">
              {filter.placeholder || `Все ${filter.label.toLowerCase()}`}
            </option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      ))}

      {/* Clear Button */}
      {showClearButton && hasActiveFilters && onClear && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          className="flex items-center gap-2"
        >
          <XIcon className="h-4 w-4" />
          Очистить
        </Button>
      )}
    </div>
  );
};

export default FilterPanel;
