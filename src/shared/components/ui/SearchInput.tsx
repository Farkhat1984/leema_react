/**
 * SearchInput Component
 * Search input with debounce functionality
 *
 * Usage:
 * <SearchInput
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   placeholder="Поиск продуктов..."
 *   debounceMs={300}
 * />
 */

import { useState, useEffect, useCallback } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  disabled?: boolean;
  onClear?: () => void;
}

export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Поиск...',
  debounceMs = 300,
  className,
  disabled = false,
  onClear,
}: SearchInputProps) => {
  const [localValue, setLocalValue] = useState(value);

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange, value]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
    onClear?.();
  }, [onChange, onClear]);

  return (
    <div className={cn('relative', className)}>
      {/* Search Icon */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <SearchIcon className="h-5 w-5 text-gray-400" />
      </div>

      {/* Input */}
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'block w-full rounded-lg border-gray-300 pl-10 pr-10 py-2',
          'focus:border-primary-500 focus:ring-primary-500',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          'transition-colors'
        )}
      />

      {/* Clear Button */}
      {localValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
        >
          <XIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
