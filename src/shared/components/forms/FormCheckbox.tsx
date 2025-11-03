import { forwardRef } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Checkbox } from '../ui/Checkbox';
import type { CheckboxProps } from '../ui/Checkbox';
import { cn } from '@/shared/lib/utils/cn';

export interface FormCheckboxProps extends Omit<CheckboxProps, 'error'> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  register?: UseFormRegisterReturn;
  description?: string;
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      register,
      description,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full space-y-1">
        <div className="flex items-start space-x-3">
          <Checkbox
            ref={ref}
            id={checkboxId}
            className={className}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${checkboxId}-error`
                : description
                  ? `${checkboxId}-description`
                  : helperText
                    ? `${checkboxId}-helper`
                    : undefined
            }
            {...register}
            {...props}
          />
          {label && (
            <div className="flex-1">
              <label
                htmlFor={checkboxId}
                className={cn(
                  'block text-sm font-medium cursor-pointer select-none',
                  error ? 'text-red-700' : 'text-gray-700'
                )}
              >
                {label}
                {required && <span className="ml-1 text-red-500">*</span>}
              </label>
              {description && (
                <p
                  id={`${checkboxId}-description`}
                  className="mt-1 text-sm text-gray-500"
                >
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${checkboxId}-error`}
            className="text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p
            id={`${checkboxId}-helper`}
            className="text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormCheckbox.displayName = 'FormCheckbox';
