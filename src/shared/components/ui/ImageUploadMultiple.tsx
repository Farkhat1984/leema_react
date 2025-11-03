import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

export interface UploadedImage {
  id: string;
  file?: File;
  url: string;
  quality?: 'low' | 'medium' | 'high';
}

interface ImageUploadMultipleProps {
  value?: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: string[];
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  showQualityIndicator?: boolean;
  helperText?: string;
}

export const ImageUploadMultiple: React.FC<ImageUploadMultipleProps> = ({
  value = [],
  onChange,
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  disabled = false,
  className = '',
  label,
  error,
  showQualityIndicator = true,
  helperText,
}) => {
  const [images, setImages] = useState<UploadedImage[]>(value);

  // Detect image quality based on dimensions
  const detectQuality = (
    file: File
  ): Promise<'low' | 'medium' | 'high'> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        const pixels = img.width * img.height;

        if (pixels < 500000) {
          // < 0.5MP
          resolve('low');
        } else if (pixels < 2000000) {
          // < 2MP
          resolve('medium');
        } else {
          resolve('high');
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('medium');
      };

      img.src = url;
    });
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const remainingSlots = maxFiles - images.length;
      const filesToAdd = acceptedFiles.slice(0, remainingSlots);

      const newImages: UploadedImage[] = await Promise.all(
        filesToAdd.map(async (file) => {
          const quality = showQualityIndicator
            ? await detectQuality(file)
            : undefined;

          return {
            id: `${Date.now()}-${Math.random()}`,
            file,
            url: URL.createObjectURL(file),
            quality,
          };
        })
      );

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onChange(updatedImages);
    },
    [images, maxFiles, onChange, showQualityIndicator]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: accept.reduce((acc, mime) => ({ ...acc, [mime]: [] }), {}),
      maxSize,
      maxFiles,
      disabled: disabled || images.length >= maxFiles,
      multiple: true,
    });

  const handleRemove = (id: string) => {
    const updatedImages = images.filter((img) => img.id !== id);
    setImages(updatedImages);
    onChange(updatedImages);

    // Revoke object URL to prevent memory leaks
    const imageToRemove = images.find((img) => img.id === id);
    if (imageToRemove?.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url);
    }
  };

  const fileError = fileRejections[0]?.errors[0];

  const qualityColors = {
    low: 'bg-red-500',
    medium: 'bg-yellow-500',
    high: 'bg-green-500',
  };

  const qualityLabels = {
    low: 'Low Quality',
    medium: 'Medium Quality',
    high: 'High Quality',
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Upload Zone */}
      {images.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer
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

          <div className="flex flex-col items-center justify-center text-gray-500">
            {isDragActive ? (
              <>
                <Upload className="w-12 h-12 mb-3 text-indigo-500" />
                <p className="text-sm font-medium">Drop images here</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-12 h-12 mb-3" />
                <p className="text-sm font-medium mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-400">
                  PNG, JPG, WEBP up to {(maxSize / 1024 / 1024).toFixed(0)}MB
                </p>
                {helperText && (
                  <p className="text-xs text-gray-400 mt-1">{helperText}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {images.length}/{maxFiles} images uploaded
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={image.url}
                  alt="Upload preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Quality Indicator */}
              {showQualityIndicator && image.quality && (
                <div
                  className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium text-white ${
                    qualityColors[image.quality]
                  }`}
                  title={qualityLabels[image.quality]}
                >
                  {image.quality === 'low' && (
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                  )}
                  {image.quality[0].toUpperCase()}
                </div>
              )}

              {/* Remove Button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(image.id)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error Messages */}
      {(error || fileError) && (
        <div className="mt-2 flex items-center text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error || fileError?.message}
        </div>
      )}

      {/* Max files warning */}
      {images.length >= maxFiles && (
        <div className="mt-2 flex items-center text-sm text-amber-600">
          <AlertCircle className="w-4 h-4 mr-1" />
          Maximum {maxFiles} images reached
        </div>
      )}
    </div>
  );
};
