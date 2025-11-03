import { forwardRef } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Input } from '../ui/Input';
import { cn } from '@/shared/lib/utils/cn';

export interface FormDatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  register?: UseFormRegisterReturn;
  min?: string;
  max?: string;
  includeTime?: boolean;
}

export const FormDatePicker = forwardRef<
  HTMLInputElement,
  FormDatePickerProps
>(
  (
    {
      label,
      error,
      helperText,
      required,
      register,
      min,
      max,
      includeTime = false,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const datePickerId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const inputType = includeTime ? 'datetime-local' : 'date';

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={datePickerId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <Input
          ref={ref}
          id={datePickerId}
          type={inputType}
          min={min}
          max={max}
          error={error}
          className={cn('block', className)}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${datePickerId}-error`
              : helperText
                ? `${datePickerId}-helper`
                : undefined
          }
          {...register}
          {...props}
        />
        {!error && helperText && (
          <p
            id={`${datePickerId}-helper`}
            className="text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormDatePicker.displayName = 'FormDatePicker';
