import React, { forwardRef, useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { Calendar, X } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import type { DateRange } from '@/shared/types/common';

interface FormDateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  minDate?: Date;
  maxDate?: Date;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  showPresets?: boolean;
  presets?: { label: string; getValue: () => DateRange }[];
  className?: string;
  dateFormat?: string;
  clearable?: boolean;
}

// Custom Input Component
const CustomInput = forwardRef<
  HTMLButtonElement,
  {
    value?: string;
    onClick?: () => void;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    onClear?: () => void;
    clearable?: boolean;
  }
>(({ value, onClick, placeholder, disabled, error, onClear, clearable }, ref) => (
  <div className="relative">
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full px-4 py-2 pr-10 text-left border rounded-lg transition-colors
        ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
        }
        ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
        focus:outline-none focus:ring-2
      `}
    >
      <span className={value ? 'text-gray-900' : 'text-gray-400'}>
        {value || placeholder || 'Выберите диапазон дат'}
      </span>
    </button>
    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
      {value && clearable && !disabled ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear?.();
          }}
          className="pointer-events-auto text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      ) : (
        <Calendar className="w-4 h-4 text-gray-400" />
      )}
    </div>
  </div>
));

CustomInput.displayName = 'CustomInput';

// Default Presets
const getDefaultPresets = (): { label: string; getValue: () => DateRange }[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return [
    {
      label: 'Сегодня',
      getValue: () => ({
        from: today,
        to: today,
      }),
    },
    {
      label: 'Последние 7 дней',
      getValue: () => {
        const start = new Date(today);
        start.setDate(start.getDate() - 6);
        return { from: start, to: today };
      },
    },
    {
      label: 'Последние 30 дней',
      getValue: () => {
        const start = new Date(today);
        start.setDate(start.getDate() - 29);
        return { from: start, to: today };
      },
    },
    {
      label: 'Последние 3 месяца',
      getValue: () => {
        const start = new Date(today);
        start.setMonth(start.getMonth() - 3);
        return { from: start, to: today };
      },
    },
    {
      label: 'Последние 6 месяцев',
      getValue: () => {
        const start = new Date(today);
        start.setMonth(start.getMonth() - 6);
        return { from: start, to: today };
      },
    },
    {
      label: 'Последний год',
      getValue: () => {
        const start = new Date(today);
        start.setFullYear(start.getFullYear() - 1);
        return { from: start, to: today };
      },
    },
    {
      label: 'Текущий месяц',
      getValue: () => {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        return { from: start, to: end };
      },
    },
    {
      label: 'Прошлый месяц',
      getValue: () => {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        return { from: start, to: end };
      },
    },
  ];
};

export const FormDateRangePicker: React.FC<FormDateRangePickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  label,
  placeholder,
  error,
  disabled = false,
  required = false,
  showPresets = true,
  presets: customPresets,
  className = '',
  dateFormat = 'MMM d, yyyy',
  clearable = true,
}) => {
  const [startDate, setStartDate] = useState<Date | null>(value?.from || null);
  const [endDate, setEndDate] = useState<Date | null>(value?.to || null);

  const presets = customPresets || getDefaultPresets();

  // Sync with external value
  useEffect(() => {
    setStartDate(value?.from || null);
    setEndDate(value?.to || null);
  }, [value]);

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);

    // Only call onChange when both dates are selected or cleared
    if ((start && end) || (!start && !end)) {
      onChange({ from: start || undefined, to: end || undefined });
    }
  };

  const handlePresetClick = (preset: { label: string; getValue: () => DateRange }) => {
    const range = preset.getValue();
    setStartDate(range.from || null);
    setEndDate(range.to || null);
    onChange(range);
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    onChange({ from: undefined, to: undefined });
  };

  const formatDateRange = (start: Date | null, end: Date | null): string => {
    if (!start || !end) return '';

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="flex gap-4">
        <div className="flex-1">
          <DatePicker
            selected={startDate}
            onChange={handleDateChange}
            startDate={startDate}
            endDate={endDate}
            selectsRange
            minDate={minDate}
            maxDate={maxDate}
            disabled={disabled}
            dateFormat={dateFormat}
            customInput={
              <CustomInput
                placeholder={placeholder}
                error={error}
                disabled={disabled}
                onClear={handleClear}
                clearable={clearable}
              />
            }
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>

        {showPresets && (
          <div className="flex flex-col gap-2">
            {presets.map((preset, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handlePresetClick(preset)}
                disabled={disabled}
                className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormDateRangePicker;
