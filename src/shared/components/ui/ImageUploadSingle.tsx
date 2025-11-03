import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';

interface ImageUploadSingleProps {
  value?: string | File | null;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
  maxSize?: number; // in bytes
  accept?: string[];
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  previewSize?: 'sm' | 'md' | 'lg';
  shape?: 'square' | 'circle';
}

export const ImageUploadSingle: React.FC<ImageUploadSingleProps> = ({
  value,
  onChange,
  onRemove,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  disabled = false,
  className = '',
  label,
  error,
  previewSize = 'md',
  shape = 'square',
}) => {
  const [preview, setPreview] = useState<string | null>(
    typeof value === 'string' ? value : null
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        onChange(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: accept.reduce((acc, mime) => ({ ...acc, [mime]: [] }), {}),
      maxSize,
      maxFiles: 1,
      disabled,
      multiple: false,
    });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onChange(null);
    onRemove?.();
  };

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
  };

  const shapeClasses = {
    square: 'rounded-lg',
    circle: 'rounded-full',
  };

  const fileError = fileRejections[0]?.errors[0];

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div
        {...getRootProps()}
        className={`
          relative ${sizeClasses[previewSize]} ${shapeClasses[shape]}
          border-2 border-dashed transition-colors cursor-pointer
          ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${error || fileError ? 'border-red-500' : ''}
        `}
      >
        <input {...getInputProps()} />

        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className={`w-full h-full object-cover ${shapeClasses[shape]}`}
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            {isDragActive ? (
              <>
                <Upload className="w-8 h-8 mb-2" />
                <p className="text-sm text-center">Drop image here</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-8 h-8 mb-2" />
                <p className="text-xs text-center px-2">
                  Click or drag image
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Max {(maxSize / 1024 / 1024).toFixed(0)}MB
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {(error || fileError) && (
        <p className="mt-1 text-sm text-red-600">
          {error || fileError?.message}
        </p>
      )}
    </div>
  );
};
