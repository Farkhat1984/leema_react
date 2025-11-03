import { describe, it, expect } from 'vitest'
import {
  sanitizeHTML,
  sanitizeInput,
  isValidUrl,
  sanitizeUrl,
  isValidEmail,
  isValidPhone,
  isValidJWT,
  sanitizeRequestBody,
} from './sanitize'

describe('Security Utilities', () => {
  describe('sanitizeHTML', () => {
    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>World</strong></p>'
      const result = sanitizeHTML(input)
      expect(result).toBe('<p>Hello <strong>World</strong></p>')
    })

    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>'
      const result = sanitizeHTML(input)
      expect(result).not.toContain('<script>')
      expect(result).toContain('<p>Hello</p>')
    })

    it('should remove onclick attributes', () => {
      const input = '<a href="#" onclick="alert(1)">Click</a>'
      const result = sanitizeHTML(input)
      expect(result).not.toContain('onclick')
    })

    it('should allow safe links', () => {
      const input = '<a href="https://example.com" target="_blank">Link</a>'
      const result = sanitizeHTML(input)
      expect(result).toContain('href="https://example.com"')
    })

    it('should remove dangerous tags like iframe', () => {
      const input = '<iframe src="evil.com"></iframe>'
      const result = sanitizeHTML(input)
      expect(result).not.toContain('iframe')
    })
  })

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      const result = sanitizeInput('  hello  ')
      expect(result).toBe('hello')
    })

    it('should remove angle brackets', () => {
      const result = sanitizeInput('hello<script>alert(1)</script>')
      expect(result).toBe('helloscriptalert(1)/script')
    })

    it('should handle empty string', () => {
      const result = sanitizeInput('')
      expect(result).toBe('')
    })

    it('should preserve other special characters', () => {
      const result = sanitizeInput('hello@example.com')
      expect(result).toBe('hello@example.com')
    })
  })

  describe('isValidUrl', () => {
    it('should validate http URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true)
    })

    it('should validate https URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
    })

    it('should reject javascript: URLs', () => {
      expect(isValidUrl('javascript:alert(1)')).toBe(false)
    })

    it('should reject data: URLs', () => {
      expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
    })

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false)
    })

    it('should reject ftp URLs', () => {
      expect(isValidUrl('ftp://example.com')).toBe(false)
    })

    it('should reject file URLs', () => {
      expect(isValidUrl('file:///etc/passwd')).toBe(false)
    })
  })

  describe('sanitizeUrl', () => {
    it('should return valid URLs unchanged', () => {
      const url = 'https://example.com'
      expect(sanitizeUrl(url)).toBe(url)
    })

    it('should return empty string for invalid URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('')
      expect(sanitizeUrl('not a url')).toBe('')
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('test @example.com')).toBe(false)
    })

    it('should handle empty string', () => {
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('isValidPhone', () => {
    it('should validate Kazakhstan phone numbers', () => {
      expect(isValidPhone('+77771234567')).toBe(true)
      expect(isValidPhone('77771234567')).toBe(true)
    })

    it('should validate with formatting', () => {
      expect(isValidPhone('+7 777 123 4567')).toBe(true)
      expect(isValidPhone('+7 (777) 123-45-67')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false)
      expect(isValidPhone('+1234567890')).toBe(false)
      expect(isValidPhone('not a phone')).toBe(false)
    })

    it('should handle empty string', () => {
      expect(isValidPhone('')).toBe(false)
    })
  })

  describe('isValidJWT', () => {
    it('should validate JWT format', () => {
      const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      expect(isValidJWT(validJWT)).toBe(true)
    })

    it('should reject invalid JWT format', () => {
      expect(isValidJWT('invalid.token')).toBe(false)
      expect(isValidJWT('not-a-jwt')).toBe(false)
      expect(isValidJWT('')).toBe(false)
    })

    it('should reject JWT with only 2 parts', () => {
      expect(isValidJWT('header.payload')).toBe(false)
    })
  })

  describe('sanitizeRequestBody', () => {
    it('should sanitize string values', () => {
      const input = {
        name: '  John  ',
        description: 'Test<script>alert(1)</script>',
      }
      const result = sanitizeRequestBody(input)
      expect(result.name).toBe('John')
      expect(result.description).not.toContain('<script>')
    })

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: '  Jane  ',
          email: 'jane@example.com',
        },
      }
      const result = sanitizeRequestBody(input)
      expect(result.user).toEqual({
        name: 'Jane',
        email: 'jane@example.com',
      })
    })

    it('should preserve non-string values', () => {
      const input = {
        age: 25,
        active: true,
        score: null,
      }
      const result = sanitizeRequestBody(input)
      expect(result).toEqual(input)
    })

    it('should handle arrays', () => {
      const input = {
        tags: ['  tag1  ', 'tag2<script>'],
      }
      const result = sanitizeRequestBody(input)
      // Arrays are converted to objects with numeric keys
      expect(Array.isArray(result.tags)).toBe(false)
      expect(result.tags).toEqual({ '0': 'tag1', '1': 'tag2script' })
    })

    it('should handle empty object', () => {
      const result = sanitizeRequestBody({})
      expect(result).toEqual({})
    })

    it('should handle deeply nested objects', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              name: '  Deep  ',
            },
          },
        },
      }
      const result = sanitizeRequestBody(input)
      expect(result.level1.level2.level3.name).toBe('Deep')
    })
  })
})
