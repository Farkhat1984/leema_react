import { forwardRef } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Textarea } from '../ui/Textarea';
import type { TextareaProps } from '../ui/Textarea';

export interface FormTextareaProps extends Omit<TextareaProps, 'error'> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  register?: UseFormRegisterReturn;
  showCharCount?: boolean;
  maxLength?: number;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      register,
      showCharCount,
      maxLength,
      className,
      id,
      value,
      ...props
    },
    ref
  ) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full space-y-1">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={textareaId}
              className="block text-sm font-medium text-gray-700"
            >
              {label}
              {required && <span className="ml-1 text-red-500">*</span>}
            </label>
            {showCharCount && maxLength && (
              <span className="text-sm text-gray-500">
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}
        <Textarea
          ref={ref}
          id={textareaId}
          error={error}
          maxLength={maxLength}
          value={value}
          className={className}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : helperText
                ? `${textareaId}-helper`
                : undefined
          }
          {...register}
          {...props}
        />
        {!error && helperText && (
          <p
            id={`${textareaId}-helper`}
            className="text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
