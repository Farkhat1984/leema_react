/**
 * Image Validation Utility
 *
 * Client-side image validation utilities for better UX.
 * Note: Backend performs final validation with these requirements:
 * - Product images: 800×1200px min (3:4 aspect ratio)
 * - Wardrobe images: 1000×1500px min (2:3 aspect ratio)
 * - Avatar images: 256×256px min (square)
 * - Max file size: 10MB for products/wardrobe, 5MB for avatars
 *
 * @created 2025-11-13 - Flutter app requirements alignment
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  dimensions?: ImageDimensions;
}

export type ImageType = 'product' | 'wardrobe' | 'avatar' | 'generic';

/**
 * Load image from File and get dimensions
 *
 * @param file - Image file to load
 * @returns Promise with image dimensions
 */
export async function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}

/**
 * Validate image dimensions based on type
 *
 * @param dimensions - Image dimensions to validate
 * @param imageType - Type of image (determines requirements)
 * @returns Validation result
 */
export function validateImageDimensions(
  dimensions: ImageDimensions,
  imageType: ImageType
): ImageValidationResult {
  const { width, height } = dimensions;

  switch (imageType) {
    case 'product':
      // Product images: 800×1200px minimum (3:4 aspect ratio)
      if (width < 800 || height < 1200) {
        return {
          valid: false,
          error: `Изображение товара слишком маленькое. Минимум: 800×1200px (получено: ${width}×${height}px)`,
          dimensions
        };
      }

      // Check aspect ratio (3:4 with 15% tolerance)
      const productRatio = width / height;
      const expectedProductRatio = 3 / 4;
      const productDeviation = Math.abs(productRatio - expectedProductRatio) / expectedProductRatio;

      if (productDeviation > 0.15) {
        return {
          valid: false,
          error: `Неправильное соотношение сторон. Ожидается 3:4 (портрет), получено ${width}×${height}`,
          dimensions
        };
      }
      break;

    case 'wardrobe':
      // Wardrobe images: 1000×1500px minimum (2:3 aspect ratio)
      if (width < 1000 || height < 1500) {
        return {
          valid: false,
          error: `Изображение для гардероба слишком маленькое. Минимум: 1000×1500px (получено: ${width}×${height}px). Требуется для AI виртуальной примерки.`,
          dimensions
        };
      }

      // Check aspect ratio (2:3 with 15% tolerance)
      const wardrobeRatio = width / height;
      const expectedWardrobeRatio = 2 / 3;
      const wardrobeDeviation = Math.abs(wardrobeRatio - expectedWardrobeRatio) / expectedWardrobeRatio;

      if (wardrobeDeviation > 0.15) {
        return {
          valid: false,
          error: `Неправильное соотношение сторон. Ожидается 2:3 (портрет), получено ${width}×${height}`,
          dimensions
        };
      }
      break;

    case 'avatar':
      // Avatar images: 256×256px minimum (square)
      if (width < 256 || height < 256) {
        return {
          valid: false,
          error: `Аватар слишком маленький. Минимум: 256×256px (получено: ${width}×${height}px)`,
          dimensions
        };
      }
      break;

    case 'generic':
      // Generic images: 100×100px minimum
      if (width < 100 || height < 100) {
        return {
          valid: false,
          error: `Изображение слишком маленькое. Минимум: 100×100px (получено: ${width}×${height}px)`,
          dimensions
        };
      }
      break;
  }

  return {
    valid: true,
    dimensions
  };
}

/**
 * Validate image file (type, size, dimensions)
 *
 * @param file - File to validate
 * @param imageType - Type of image (determines requirements)
 * @returns Promise with validation result
 */
export async function validateImageFile(
  file: File,
  imageType: ImageType = 'generic'
): Promise<ImageValidationResult> {
  // 1. Check file type
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Недопустимый формат файла: ${file.type}. Разрешены: JPEG, PNG, WebP`
    };
  }

  // 2. Check file size
  const MAX_SIZES = {
    product: 10 * 1024 * 1024,   // 10MB
    wardrobe: 10 * 1024 * 1024,  // 10MB
    avatar: 5 * 1024 * 1024,     // 5MB
    generic: 10 * 1024 * 1024    // 10MB
  };

  const maxSize = MAX_SIZES[imageType];
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Файл слишком большой: ${(file.size / 1024 / 1024).toFixed(1)}MB. Максимум: ${maxSize / 1024 / 1024}MB`
    };
  }

  // 3. Check dimensions
  try {
    const dimensions = await getImageDimensions(file);
    return validateImageDimensions(dimensions, imageType);
  } catch (error) {
    return {
      valid: false,
      error: 'Не удалось загрузить изображение для проверки размеров'
    };
  }
}

/**
 * Validate multiple image files
 *
 * @param files - Files to validate
 * @param imageType - Type of images (all files must be same type)
 * @returns Promise with validation result (fails on first invalid file)
 */
export async function validateImageFiles(
  files: File[],
  imageType: ImageType = 'generic'
): Promise<ImageValidationResult> {
  const MAX_FILES = 10;

  if (files.length === 0) {
    return {
      valid: false,
      error: 'Не выбраны файлы для загрузки'
    };
  }

  if (files.length > MAX_FILES) {
    return {
      valid: false,
      error: `Слишком много файлов. Максимум: ${MAX_FILES} за раз`
    };
  }

  // Validate each file
  for (const file of files) {
    const result = await validateImageFile(file, imageType);
    if (!result.valid) {
      return {
        valid: false,
        error: `${file.name}: ${result.error}`
      };
    }
  }

  return { valid: true };
}
