import { describe, it, expect, beforeEach } from 'vitest';
import {
  getImageDimensions,
  validateImageDimensions,
  validateImageFile,
  validateImageFiles,
  type ImageDimensions,
  type ImageType,
} from './image-validator';

describe('Image Validator Utils', () => {
  describe('validateImageDimensions', () => {
    describe('product images', () => {
      it('should validate correct product image dimensions', () => {
        const dimensions: ImageDimensions = { width: 800, height: 1200 };
        const result = validateImageDimensions(dimensions, 'product');

        expect(result.valid).toBe(true);
        expect(result.dimensions).toEqual(dimensions);
        expect(result.error).toBeUndefined();
      });

      it('should reject product image below minimum width', () => {
        const dimensions: ImageDimensions = { width: 700, height: 1200 };
        const result = validateImageDimensions(dimensions, 'product');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('слишком маленькое');
        expect(result.error).toContain('800×1200');
      });

      it('should reject product image below minimum height', () => {
        const dimensions: ImageDimensions = { width: 800, height: 1000 };
        const result = validateImageDimensions(dimensions, 'product');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('слишком маленькое');
      });

      it('should reject product image with wrong aspect ratio', () => {
        const dimensions: ImageDimensions = { width: 1200, height: 1200 };
        const result = validateImageDimensions(dimensions, 'product');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('соотношение сторон');
        expect(result.error).toContain('3:4');
      });

      it('should accept product image within aspect ratio tolerance', () => {
        // 3:4 ratio with slight deviation within 15% tolerance
        const dimensions: ImageDimensions = { width: 900, height: 1200 };
        const result = validateImageDimensions(dimensions, 'product');

        expect(result.valid).toBe(true);
      });

      it('should accept larger product images with correct ratio', () => {
        const dimensions: ImageDimensions = { width: 1600, height: 2400 };
        const result = validateImageDimensions(dimensions, 'product');

        expect(result.valid).toBe(true);
      });
    });

    describe('wardrobe images', () => {
      it('should validate correct wardrobe image dimensions', () => {
        const dimensions: ImageDimensions = { width: 1000, height: 1500 };
        const result = validateImageDimensions(dimensions, 'wardrobe');

        expect(result.valid).toBe(true);
        expect(result.dimensions).toEqual(dimensions);
      });

      it('should reject wardrobe image below minimum dimensions', () => {
        const dimensions: ImageDimensions = { width: 900, height: 1500 };
        const result = validateImageDimensions(dimensions, 'wardrobe');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('слишком маленькое');
        expect(result.error).toContain('1000×1500');
        expect(result.error).toContain('AI виртуальной примерки');
      });

      it('should reject wardrobe image with wrong aspect ratio', () => {
        const dimensions: ImageDimensions = { width: 1500, height: 1500 };
        const result = validateImageDimensions(dimensions, 'wardrobe');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('соотношение сторон');
        expect(result.error).toContain('2:3');
      });

      it('should accept larger wardrobe images with correct ratio', () => {
        const dimensions: ImageDimensions = { width: 2000, height: 3000 };
        const result = validateImageDimensions(dimensions, 'wardrobe');

        expect(result.valid).toBe(true);
      });
    });

    describe('avatar images', () => {
      it('should validate correct avatar dimensions', () => {
        const dimensions: ImageDimensions = { width: 256, height: 256 };
        const result = validateImageDimensions(dimensions, 'avatar');

        expect(result.valid).toBe(true);
      });

      it('should reject avatar below minimum size', () => {
        const dimensions: ImageDimensions = { width: 200, height: 200 };
        const result = validateImageDimensions(dimensions, 'avatar');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('Аватар слишком маленький');
        expect(result.error).toContain('256×256');
      });

      it('should accept larger avatar images', () => {
        const dimensions: ImageDimensions = { width: 512, height: 512 };
        const result = validateImageDimensions(dimensions, 'avatar');

        expect(result.valid).toBe(true);
      });

      it('should accept non-square avatars', () => {
        // Avatar only checks minimum size, not aspect ratio
        const dimensions: ImageDimensions = { width: 300, height: 400 };
        const result = validateImageDimensions(dimensions, 'avatar');

        expect(result.valid).toBe(true);
      });
    });

    describe('generic images', () => {
      it('should validate correct generic image dimensions', () => {
        const dimensions: ImageDimensions = { width: 200, height: 200 };
        const result = validateImageDimensions(dimensions, 'generic');

        expect(result.valid).toBe(true);
      });

      it('should reject generic image below minimum size', () => {
        const dimensions: ImageDimensions = { width: 50, height: 50 };
        const result = validateImageDimensions(dimensions, 'generic');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('слишком маленькое');
        expect(result.error).toContain('100×100');
      });

      it('should accept any aspect ratio for generic images', () => {
        const dimensions: ImageDimensions = { width: 100, height: 500 };
        const result = validateImageDimensions(dimensions, 'generic');

        expect(result.valid).toBe(true);
      });
    });
  });

  describe('getImageDimensions', () => {
    it('should be a function that returns a promise', () => {
      const blob = new Blob(['test'], { type: 'image/png' });
      const file = new File([blob], 'test.png', { type: 'image/png' });

      const result = getImageDimensions(file);

      expect(result).toBeInstanceOf(Promise);
    });

    it('should reject when image fails to load', async () => {
      // Create an invalid file
      const blob = new Blob(['invalid image data'], { type: 'image/png' });
      const file = new File([blob], 'invalid.png', { type: 'image/png' });

      await expect(getImageDimensions(file)).rejects.toThrow();
    });
  });

  describe('validateImageFile', () => {
    describe('file type validation', () => {

      it('should reject non-image files', async () => {
        const blob = new Blob(['text content'], { type: 'text/plain' });
        const file = new File([blob], 'document.txt', { type: 'text/plain' });

        const result = await validateImageFile(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('Недопустимый формат файла');
        expect(result.error).toContain('text/plain');
      });

      it('should reject SVG images', async () => {
        const blob = new Blob(['<svg></svg>'], { type: 'image/svg+xml' });
        const file = new File([blob], 'image.svg', { type: 'image/svg+xml' });

        const result = await validateImageFile(file);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('Недопустимый формат файла');
      });
    });

    describe('file size validation', () => {
      it('should accept product image under 10MB', async () => {
        const sizeBytes = 5 * 1024 * 1024; // 5MB
        const blob = new Blob([new Uint8Array(sizeBytes)], { type: 'image/png' });
        const file = new File([blob], 'test.png', { type: 'image/png' });

        const result = await validateImageFile(file, 'product');

        // Should pass file size check (5MB < 10MB limit)
        // Will fail on dimensions check since we can't create real image in jsdom
        expect(result.error).not.toContain('слишком большой');
      });

      it('should reject product image over 10MB', async () => {
        const sizeBytes = 11 * 1024 * 1024; // 11MB
        const blob = new Blob([new Uint8Array(sizeBytes)], { type: 'image/png' });
        const file = new File([blob], 'test.png', { type: 'image/png' });

        const result = await validateImageFile(file, 'product');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('слишком большой');
        expect(result.error).toContain('Максимум: 10MB');
      });

      it('should reject avatar image over 5MB', async () => {
        const sizeBytes = 6 * 1024 * 1024; // 6MB
        const blob = new Blob([new Uint8Array(sizeBytes)], { type: 'image/png' });
        const file = new File([blob], 'test.png', { type: 'image/png' });

        const result = await validateImageFile(file, 'avatar');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('слишком большой');
        expect(result.error).toContain('Максимум: 5MB');
      });
    });
  });

  describe('validateImageFiles', () => {

    it('should reject empty file array', async () => {
      const result = await validateImageFiles([]);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Не выбраны файлы');
    });

    it('should reject too many files', async () => {
      const blob = new Blob(['test'], { type: 'image/png' });
      const files = Array.from(
        { length: 11 },
        (_, i) => new File([blob], `image${i}.png`, { type: 'image/png' })
      );

      const result = await validateImageFiles(files);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Слишком много файлов');
      expect(result.error).toContain('Максимум: 10');
    });
  });
});
