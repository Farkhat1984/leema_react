/**
 * Hook for sanitized input handling
 */

import { useState, useCallback } from 'react';
import { sanitizeInput } from '@/shared/lib/security';

interface UseSanitizedInputOptions {
  maxLength?: number;
  pattern?: RegExp;
  transform?: (value: string) => string;
}

export const useSanitizedInput = (
  initialValue: string = '',
  options: UseSanitizedInputOptions = {}
) => {
  const [value, setValue] = useState(sanitizeInput(initialValue));
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback(
    (newValue: string) => {
      let sanitized = sanitizeInput(newValue);

      // Apply custom transformation
      if (options.transform) {
        sanitized = options.transform(sanitized);
      }

      // Check max length
      if (options.maxLength && sanitized.length > options.maxLength) {
        setError(`Maximum length is ${options.maxLength} characters`);
        return;
      }

      // Check pattern
      if (options.pattern && !options.pattern.test(sanitized)) {
        setError('Invalid format');
        return;
      }

      setError(null);
      setValue(sanitized);
    },
    [options]
  );

  const reset = useCallback(() => {
    setValue(sanitizeInput(initialValue));
    setError(null);
  }, [initialValue]);

  return {
    value,
    error,
    onChange: handleChange,
    reset,
  };
};
