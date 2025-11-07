/**
 * Form Validation Schema Tests
 *
 * Tests all validation schemas to ensure they catch invalid data
 * and accept valid data correctly
 *
 * @created 2025-11-06 - Phase 2 improvements
 */

import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  productSchema,
  newsletterSchema,
  shopRegistrationSchema,
  profileUpdateSchema,
} from '../schemas';

describe('Form Validation Schemas', () => {
  describe('Login Schema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty email', () => {
      const invalidData = {
        email: '',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Email is required');
      }
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'notanemail',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email');
      }
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '12345',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 6 characters');
      }
    });
  });

  describe('Shop Registration Schema', () => {
    it('should validate correct shop registration data', () => {
      const validData = {
        name: 'My Shop',
        description: 'This is a great shop with amazing products',
        contact_phone: '+77001234567',
        whatsapp_phone: '+77001234567',
        address: '123 Main Street, Almaty',
        avatar: 'https://example.com/avatar.jpg',
      };

      const result = shopRegistrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject shop name that is too short', () => {
      const invalidData = {
        name: 'M',
        description: 'This is a great shop',
        contact_phone: '+77001234567',
        address: '123 Main Street',
      };

      const result = shopRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('не менее 2 символов');
      }
    });

    it('should reject shop name that is too long', () => {
      const invalidData = {
        name: 'A'.repeat(101),
        description: 'This is a great shop',
        contact_phone: '+77001234567',
        address: '123 Main Street',
      };

      const result = shopRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('не более 100 символов');
      }
    });

    it('should reject description that is too short', () => {
      const invalidData = {
        name: 'My Shop',
        description: 'Too short',
        contact_phone: '+77001234567',
        address: '123 Main Street',
      };

      const result = shopRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('не менее 10 символов');
      }
    });

    it('should reject description that is too long', () => {
      const invalidData = {
        name: 'My Shop',
        description: 'A'.repeat(1001),
        contact_phone: '+77001234567',
        address: '123 Main Street',
      };

      const result = shopRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('не более 1000 символов');
      }
    });

    it('should reject invalid phone format', () => {
      const invalidData = {
        name: 'My Shop',
        description: 'This is a great shop',
        contact_phone: 'notaphone',
        address: '123 Main Street',
      };

      const result = shopRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('корректный номер');
      }
    });

    it('should accept empty whatsapp phone', () => {
      const validData = {
        name: 'My Shop',
        description: 'This is a great shop',
        contact_phone: '+77001234567',
        whatsapp_phone: '',
        address: '123 Main Street',
      };

      const result = shopRegistrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject address that is too short', () => {
      const invalidData = {
        name: 'My Shop',
        description: 'This is a great shop',
        contact_phone: '+77001234567',
        address: '123',
      };

      const result = shopRegistrationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('не менее 5 символов');
      }
    });

    it('should accept valid avatar URL', () => {
      const validData = {
        name: 'My Shop',
        description: 'This is a great shop',
        contact_phone: '+77001234567',
        address: '123 Main Street',
        avatar: 'https://example.com/avatar.jpg',
      };

      const result = shopRegistrationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Product Schema', () => {
    it('should validate correct product data', () => {
      const validData = {
        name: 'Test Product',
        description: 'This is a great product with excellent quality',
        price: 99.99,
        category_id: 1,
        images: ['https://example.com/image1.jpg'],
        stock: 10,
        sizes: 'S, M, L',
        colors: 'Red, Blue',
      };

      const result = productSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject product name that is too short', () => {
      const invalidData = {
        name: 'A',
        description: 'This is a great product',
        price: 99.99,
        category_id: 1,
        sizes: 'M',
        colors: 'Red',
      };

      const result = productSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });

    it('should reject product name that is too long', () => {
      const invalidData = {
        name: 'A'.repeat(201),
        description: 'This is a great product',
        price: 99.99,
        category_id: 1,
        sizes: 'M',
        colors: 'Red',
      };

      const result = productSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than 200 characters');
      }
    });

    it('should reject description that is too short', () => {
      const invalidData = {
        name: 'Test Product',
        description: 'Too short',
        price: 99.99,
        category_id: 1,
        sizes: 'M',
        colors: 'Red',
      };

      const result = productSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 10 characters');
      }
    });

    it('should reject price of zero or negative', () => {
      const invalidData = {
        name: 'Test Product',
        description: 'This is a great product',
        price: 0,
        category_id: 1,
        sizes: 'M',
        colors: 'Red',
      };

      const result = productSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('greater than 0');
      }
    });

    it('should accept price as string and convert to number', () => {
      const validData = {
        name: 'Test Product',
        description: 'This is a great product',
        price: '99.99',
        category_id: 1,
        sizes: 'M',
        colors: 'Red',
      };

      const result = productSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.price).toBe('number');
      }
    });

    it('should reject more than 10 images', () => {
      const invalidData = {
        name: 'Test Product',
        description: 'This is a great product',
        price: 99.99,
        category_id: 1,
        images: Array(11).fill('https://example.com/image.jpg'),
        sizes: 'M',
        colors: 'Red',
      };

      const result = productSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Maximum 10 images');
      }
    });

    it('should accept sizes as array', () => {
      const validData = {
        name: 'Test Product',
        description: 'This is a great product',
        price: 99.99,
        category_id: 1,
        sizes: ['S', 'M', 'L'],
        colors: 'Red',
      };

      const result = productSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept colors as array', () => {
      const validData = {
        name: 'Test Product',
        description: 'This is a great product',
        price: 99.99,
        category_id: 1,
        sizes: 'M',
        colors: ['Red', 'Blue', 'Green'],
      };

      const result = productSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Newsletter Schema', () => {
    it('should validate correct newsletter data with text', () => {
      const validData = {
        title: 'Newsletter Title',
        description: 'Newsletter description',
        texts: [
          { content: 'Hello everyone!', order: 0 },
        ],
        images: [],
        recipient_type: 'all' as const,
        recipient_ids: [],
      };

      const result = newsletterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate correct newsletter data with images', () => {
      const validData = {
        title: 'Newsletter Title',
        texts: [],
        images: [
          {
            id: '1',
            url: 'https://example.com/image.jpg',
            quality: 'high' as const,
          },
        ],
        recipient_type: 'all' as const,
        recipient_ids: [],
      };

      const result = newsletterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject newsletter with neither text nor images', () => {
      const invalidData = {
        title: 'Newsletter Title',
        texts: [],
        images: [],
        recipient_type: 'all' as const,
        recipient_ids: [],
      };

      const result = newsletterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least one text message or image');
      }
    });

    it('should reject title that is too short', () => {
      const invalidData = {
        title: 'Ab',
        texts: [{ content: 'Hello', order: 0 }],
        images: [],
        recipient_type: 'all' as const,
        recipient_ids: [],
      };

      const result = newsletterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 3 characters');
      }
    });

    it('should reject title that is too long', () => {
      const invalidData = {
        title: 'A'.repeat(201),
        texts: [{ content: 'Hello', order: 0 }],
        images: [],
        recipient_type: 'all' as const,
        recipient_ids: [],
      };

      const result = newsletterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('too long');
      }
    });

    it('should reject selected recipient type with no recipients', () => {
      const invalidData = {
        title: 'Newsletter Title',
        texts: [{ content: 'Hello', order: 0 }],
        images: [],
        recipient_type: 'selected' as const,
        recipient_ids: [],
      };

      const result = newsletterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least one contact');
      }
    });

    it('should accept selected recipient type with recipients', () => {
      const validData = {
        title: 'Newsletter Title',
        texts: [{ content: 'Hello', order: 0 }],
        images: [],
        recipient_type: 'selected' as const,
        recipient_ids: [1, 2, 3],
      };

      const result = newsletterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject text with empty content', () => {
      const invalidData = {
        title: 'Newsletter Title',
        texts: [{ content: '', order: 0 }],
        images: [],
        recipient_type: 'all' as const,
        recipient_ids: [],
      };

      const result = newsletterSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be empty');
      }
    });

    it('should accept optional scheduled_at', () => {
      const validData = {
        title: 'Newsletter Title',
        texts: [{ content: 'Hello', order: 0 }],
        images: [],
        recipient_type: 'all' as const,
        recipient_ids: [],
        scheduled_at: '2025-12-31T23:59:59Z',
      };

      const result = newsletterSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Profile Update Schema', () => {
    it('should validate correct profile data', () => {
      const validData = {
        name: 'John Doe',
        phone: '+77001234567',
        avatar: 'https://example.com/avatar.jpg',
      };

      const result = profileUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject name that is too short', () => {
      const invalidData = {
        name: 'A',
        phone: '+77001234567',
      };

      const result = profileUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters');
      }
    });

    it('should reject name that is too long', () => {
      const invalidData = {
        name: 'A'.repeat(51),
        phone: '+77001234567',
      };

      const result = profileUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than 50 characters');
      }
    });

    it('should reject invalid phone format', () => {
      const invalidData = {
        name: 'John Doe',
        phone: '123',
      };

      const result = profileUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid phone format');
      }
    });

    it('should accept optional phone', () => {
      const validData = {
        name: 'John Doe',
      };

      const result = profileUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid avatar URL', () => {
      const invalidData = {
        name: 'John Doe',
        avatar: 'notaurl',
      };

      const result = profileUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid avatar URL');
      }
    });
  });

  describe('Register Schema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+77001234567',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'different',
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("don't match");
      }
    });

    it('should accept optional phone', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
