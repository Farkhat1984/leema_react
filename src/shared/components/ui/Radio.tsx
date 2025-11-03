import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/shared/lib/utils/cn';

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            ref={ref}
            type="radio"
            className={cn(
              'h-4 w-4 border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-500',
              className
            )}
            {...props}
          />
          {label && <span className="text-sm text-gray-700">{label}</span>}
        </label>
        {error && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
