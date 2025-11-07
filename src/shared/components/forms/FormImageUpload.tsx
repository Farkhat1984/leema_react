import { forwardRef, useState, useCallback } from 'react';
import type { ChangeEvent } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { Button } from '../ui/Button';
import { cn } from '@/shared/lib/utils/cn';

export interface FormImageUploadProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  register?: UseFormRegisterReturn;
  onChange?: (file: File | null, preview: string | null) => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  showPreview?: boolean;
  previewUrl?: string;
}

export const FormImageUpload = forwardRef<
  HTMLInputElement,
  FormImageUploadProps
>(
  (
    {
      label,
      error,
      helperText,
      required,
      register,
      onChange,
      maxSizeMB = 5,
      acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      showPreview = true,
      previewUrl,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const [preview, setPreview] = useState<string | null>(previewUrl || null);
    const [fileName, setFileName] = useState<string>('');
    const [localError, setLocalError] = useState<string>('');

    const uploadId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const handleFileChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setLocalError('');

        if (!file) {
          setPreview(null);
          setFileName('');
          onChange?.(null, null);
          return;
        }

        // Validate file type
        if (!acceptedFormats.includes(file.type)) {
          setLocalError(
            `Неверный формат файла. Допустимые форматы: ${acceptedFormats
              .map((f) => f.split('/')[1])
              .join(', ')}`
          );
          e.target.value = '';
          return;
        }

        // Validate file size
        const fileSizeMB = file.size / 1024 / 1024;
        if (fileSizeMB > maxSizeMB) {
          setLocalError(
            `Размер файла превышает ${maxSizeMB}МБ. Пожалуйста, выберите меньший файл.`
          );
          e.target.value = '';
          return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
          const previewUrl = reader.result as string;
          setPreview(previewUrl);
          setFileName(file.name);
          onChange?.(file, previewUrl);
        };
        reader.readAsDataURL(file);
      },
      [acceptedFormats, maxSizeMB, onChange]
    );

    const handleRemove = useCallback(() => {
      setPreview(null);
      setFileName('');
      setLocalError('');
      onChange?.(null, null);
      if (ref && 'current' in ref && ref.current) {
        ref.current.value = '';
      }
    }, [onChange, ref]);

    const displayError = error || localError;

    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={uploadId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        <div
          className={cn(
            'relative rounded-lg border-2 border-dashed p-6 transition-colors',
            displayError
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50',
            className
          )}
        >
          <input
            ref={ref}
            id={uploadId}
            type="file"
            accept={acceptedFormats.join(',')}
            className="sr-only"
            onChange={handleFileChange}
            aria-invalid={!!displayError}
            aria-describedby={
              displayError
                ? `${uploadId}-error`
                : helperText
                  ? `${uploadId}-helper`
                  : undefined
            }
            {...register}
            {...props}
          />

          {showPreview && preview ? (
            <div className="space-y-3">
              <div className="relative mx-auto w-fit">
                <img
                  src={preview}
                  alt="Предпросмотр загрузки"
                  className="max-h-64 rounded-lg object-contain"
                />
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleRemove}
                  className="absolute -right-2 -top-2"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
              </div>
              <p className="text-center text-sm text-gray-600">{fileName}</p>
            </div>
          ) : (
            <label
              htmlFor={uploadId}
              className="flex cursor-pointer flex-col items-center space-y-2"
            >
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">
                  Нажмите для загрузки или перетащите файл
                </p>
                <p className="text-xs text-gray-500">
                  {acceptedFormats.map((f) => f.split('/')[1].toUpperCase()).join(', ')} до{' '}
                  {maxSizeMB}МБ
                </p>
              </div>
            </label>
          )}
        </div>

        {displayError && (
          <p
            id={`${uploadId}-error`}
            className="text-sm text-red-600"
            role="alert"
          >
            {displayError}
          </p>
        )}
        {!displayError && helperText && (
          <p
            id={`${uploadId}-helper`}
            className="text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormImageUpload.displayName = 'FormImageUpload';
