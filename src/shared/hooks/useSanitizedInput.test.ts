import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSanitizedInput } from './useSanitizedInput'

describe('useSanitizedInput', () => {
  beforeEach(() => {
    // Clear any state between tests
  })

  describe('Basic functionality', () => {
    it('should initialize with sanitized value', () => {
      const { result } = renderHook(() => useSanitizedInput('  hello  '))

      expect(result.current.value).toBe('hello')
      expect(result.current.error).toBeNull()
    })

    it('should sanitize input on initialization', () => {
      const { result } = renderHook(() => useSanitizedInput('hello<script>alert(1)</script>'))

      expect(result.current.value).toBe('helloscriptalert(1)/script')
      expect(result.current.error).toBeNull()
    })

    it('should handle empty initial value', () => {
      const { result } = renderHook(() => useSanitizedInput())

      expect(result.current.value).toBe('')
      expect(result.current.error).toBeNull()
    })
  })

  describe('onChange', () => {
    it('should update value when valid', () => {
      const { result } = renderHook(() => useSanitizedInput())

      act(() => {
        result.current.onChange('new value')
      })

      expect(result.current.value).toBe('new value')
      expect(result.current.error).toBeNull()
    })

    it('should sanitize input on change', () => {
      const { result } = renderHook(() => useSanitizedInput())

      act(() => {
        result.current.onChange('  test  ')
      })

      expect(result.current.value).toBe('test')
    })

    it('should remove angle brackets', () => {
      const { result } = renderHook(() => useSanitizedInput())

      act(() => {
        result.current.onChange('hello<script>')
      })

      expect(result.current.value).toBe('helloscript')
    })
  })

  describe('Options - maxLength', () => {
    it('should enforce max length', () => {
      const { result } = renderHook(() => useSanitizedInput('', { maxLength: 5 }))

      act(() => {
        result.current.onChange('123456')
      })

      expect(result.current.value).toBe('') // Value not updated
      expect(result.current.error).toBe('Maximum length is 5 characters')
    })

    it('should accept value within max length', () => {
      const { result } = renderHook(() => useSanitizedInput('', { maxLength: 5 }))

      act(() => {
        result.current.onChange('123')
      })

      expect(result.current.value).toBe('123')
      expect(result.current.error).toBeNull()
    })

    it('should accept value exactly at max length', () => {
      const { result } = renderHook(() => useSanitizedInput('', { maxLength: 5 }))

      act(() => {
        result.current.onChange('12345')
      })

      expect(result.current.value).toBe('12345')
      expect(result.current.error).toBeNull()
    })
  })

  describe('Options - pattern', () => {
    it('should validate with pattern', () => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const { result } = renderHook(() => useSanitizedInput('', { pattern: emailPattern }))

      act(() => {
        result.current.onChange('invalid')
      })

      expect(result.current.value).toBe('') // Value not updated
      expect(result.current.error).toBe('Invalid format')
    })

    it('should accept valid pattern', () => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const { result } = renderHook(() => useSanitizedInput('', { pattern: emailPattern }))

      act(() => {
        result.current.onChange('test@example.com')
      })

      expect(result.current.value).toBe('test@example.com')
      expect(result.current.error).toBeNull()
    })

    it('should work with numeric pattern', () => {
      const numericPattern = /^\d+$/
      const { result } = renderHook(() => useSanitizedInput('', { pattern: numericPattern }))

      act(() => {
        result.current.onChange('abc')
      })

      expect(result.current.error).toBe('Invalid format')

      act(() => {
        result.current.onChange('123')
      })

      expect(result.current.value).toBe('123')
      expect(result.current.error).toBeNull()
    })
  })

  describe('Options - transform', () => {
    it('should apply custom transformation', () => {
      const toUpperCase = (val: string) => val.toUpperCase()
      const { result } = renderHook(() => useSanitizedInput('', { transform: toUpperCase }))

      act(() => {
        result.current.onChange('hello')
      })

      expect(result.current.value).toBe('HELLO')
    })

    it('should apply transformation after sanitization', () => {
      const toUpperCase = (val: string) => val.toUpperCase()
      const { result } = renderHook(() => useSanitizedInput('', { transform: toUpperCase }))

      act(() => {
        result.current.onChange('  hello  ')
      })

      expect(result.current.value).toBe('HELLO')
    })

    it('should chain transformation with maxLength validation', () => {
      const toUpperCase = (val: string) => val.toUpperCase()
      const { result } = renderHook(() =>
        useSanitizedInput('', { transform: toUpperCase, maxLength: 3 })
      )

      act(() => {
        result.current.onChange('ab')
      })

      expect(result.current.value).toBe('AB')
      expect(result.current.error).toBeNull()

      act(() => {
        result.current.onChange('abcd')
      })

      expect(result.current.error).toBe('Maximum length is 3 characters')
    })
  })

  describe('Combined options', () => {
    it('should work with maxLength and pattern together', () => {
      const numericPattern = /^\d+$/
      const { result } = renderHook(() =>
        useSanitizedInput('', { maxLength: 5, pattern: numericPattern })
      )

      act(() => {
        result.current.onChange('abc')
      })

      expect(result.current.error).toBe('Invalid format')

      act(() => {
        result.current.onChange('123456')
      })

      expect(result.current.error).toBe('Maximum length is 5 characters')

      act(() => {
        result.current.onChange('123')
      })

      expect(result.current.value).toBe('123')
      expect(result.current.error).toBeNull()
    })
  })

  describe('reset', () => {
    it('should reset to initial value', () => {
      const { result } = renderHook(() => useSanitizedInput('initial'))

      act(() => {
        result.current.onChange('changed')
      })

      expect(result.current.value).toBe('changed')

      act(() => {
        result.current.reset()
      })

      expect(result.current.value).toBe('initial')
      expect(result.current.error).toBeNull()
    })

    it('should clear error on reset', () => {
      const { result } = renderHook(() => useSanitizedInput('', { maxLength: 3 }))

      act(() => {
        result.current.onChange('12345')
      })

      expect(result.current.error).toBe('Maximum length is 3 characters')

      act(() => {
        result.current.reset()
      })

      expect(result.current.error).toBeNull()
    })

    it('should sanitize initial value on reset', () => {
      const { result } = renderHook(() => useSanitizedInput('  reset  '))

      act(() => {
        result.current.onChange('changed')
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.value).toBe('reset')
    })
  })
})
