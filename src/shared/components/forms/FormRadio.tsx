import { forwardRef } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Radio } from '../ui/Radio';
import type { RadioProps } from '../ui/Radio';
import { cn } from '@/shared/lib/utils/cn';

export interface RadioOption {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface FormRadioProps extends Omit<RadioProps, 'value'> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  register?: UseFormRegisterReturn;
  options: RadioOption[];
  name: string;
  defaultValue?: string | number;
}

export const FormRadio = forwardRef<HTMLInputElement, FormRadioProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      register,
      options,
      name,
      defaultValue,
      className,
      ...props
    },
    ref
  ) => {
    const groupId = name || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <div
          className={cn('space-y-2', className)}
          role="radiogroup"
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${groupId}-error`
              : helperText
                ? `${groupId}-helper`
                : undefined
          }
        >
          {options.map((option, index) => {
            const optionId = `${groupId}-${option.value}`;
            return (
              <div key={option.value} className="flex items-start space-x-3">
                <Radio
                  ref={index === 0 ? ref : undefined}
                  id={optionId}
                  value={option.value}
                  defaultChecked={option.value === defaultValue}
                  disabled={option.disabled}
                  {...register}
                  {...props}
                />
                <div className="flex-1">
                  <label
                    htmlFor={optionId}
                    className={cn(
                      'block text-sm font-medium cursor-pointer select-none',
                      error ? 'text-red-700' : 'text-gray-700',
                      option.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {option.label}
                  </label>
                  {option.description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {error && (
          <p
            id={`${groupId}-error`}
            className="text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p
            id={`${groupId}-helper`}
            className="text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormRadio.displayName = 'FormRadio';
