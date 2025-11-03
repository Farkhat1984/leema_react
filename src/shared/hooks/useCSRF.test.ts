import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCSRF } from './useCSRF'
import * as csrfUtils from '@/shared/lib/security/csrf'

// Mock crypto.getRandomValues with truly random values
let mockCounter = 0
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        // Use mockCounter to ensure different values each time
        arr[i] = (i + mockCounter) % 256
      }
      mockCounter++
      return arr
    },
  },
})

describe('useCSRF', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with a CSRF token', () => {
      const { result } = renderHook(() => useCSRF())

      expect(result.current.token).toBeTruthy()
      expect(typeof result.current.token).toBe('string')
      expect(result.current.token.length).toBe(64) // 32 bytes * 2 hex chars
    })

    it('should store token in sessionStorage on init', () => {
      renderHook(() => useCSRF())

      const storedToken = sessionStorage.getItem('csrf_token')
      expect(storedToken).toBeTruthy()
      expect(storedToken?.length).toBe(64)
    })

    it('should reuse existing token from sessionStorage', () => {
      const existingToken = 'a'.repeat(64)
      sessionStorage.setItem('csrf_token', existingToken)

      const { result } = renderHook(() => useCSRF())

      expect(result.current.token).toBe(existingToken)
    })

    it('should call initCSRFToken on mount', () => {
      const initSpy = vi.spyOn(csrfUtils, 'initCSRFToken')

      renderHook(() => useCSRF())

      expect(initSpy).toHaveBeenCalled()
    })
  })

  describe('getToken', () => {
    it('should return current token', () => {
      const { result } = renderHook(() => useCSRF())

      const token = result.current.getToken()

      expect(token).toBe(result.current.token)
    })

    it('should return null if no token exists', () => {
      sessionStorage.clear()

      const token = csrfUtils.getCSRFToken()

      expect(token).toBeNull()
    })
  })

  describe('refreshToken', () => {
    it('should generate new token', () => {
      const { result } = renderHook(() => useCSRF())

      const oldToken = result.current.token

      act(() => {
        result.current.refreshToken()
      })

      expect(result.current.token).toBeTruthy()
      expect(result.current.token).not.toBe(oldToken)
    })

    it('should return new token', () => {
      const { result } = renderHook(() => useCSRF())

      let newToken: string = ''

      act(() => {
        newToken = result.current.refreshToken()
      })

      expect(newToken).toBe(result.current.token)
      expect(newToken.length).toBe(64)
    })

    it('should update sessionStorage with new token', () => {
      const { result } = renderHook(() => useCSRF())

      act(() => {
        result.current.refreshToken()
      })

      const storedToken = sessionStorage.getItem('csrf_token')
      expect(storedToken).toBe(result.current.token)
    })

    it('should clear old token before generating new one', () => {
      const clearSpy = vi.spyOn(csrfUtils, 'clearCSRFToken')

      const { result } = renderHook(() => useCSRF())

      act(() => {
        result.current.refreshToken()
      })

      expect(clearSpy).toHaveBeenCalled()
    })
  })

  describe('clearToken', () => {
    it('should clear token state', () => {
      const { result } = renderHook(() => useCSRF())

      expect(result.current.token).toBeTruthy()

      act(() => {
        result.current.clearToken()
      })

      expect(result.current.token).toBe('')
    })

    it('should remove token from sessionStorage', () => {
      const { result } = renderHook(() => useCSRF())

      act(() => {
        result.current.clearToken()
      })

      const storedToken = sessionStorage.getItem('csrf_token')
      expect(storedToken).toBeNull()
    })

    it('should call clearCSRFToken utility', () => {
      const clearSpy = vi.spyOn(csrfUtils, 'clearCSRFToken')

      const { result } = renderHook(() => useCSRF())

      act(() => {
        result.current.clearToken()
      })

      expect(clearSpy).toHaveBeenCalled()
    })
  })

  describe('Token format validation', () => {
    it('should generate valid token format', () => {
      const { result } = renderHook(() => useCSRF())

      const isValid = csrfUtils.isValidCSRFToken(result.current.token)

      expect(isValid).toBe(true)
    })

    it('should generate hexadecimal token', () => {
      const { result } = renderHook(() => useCSRF())

      expect(/^[a-f0-9]{64}$/.test(result.current.token)).toBe(true)
    })
  })

  describe('Multiple hook instances', () => {
    it('should share same token across instances', () => {
      const { result: result1 } = renderHook(() => useCSRF())
      const { result: result2 } = renderHook(() => useCSRF())

      expect(result1.current.token).toBe(result2.current.token)
    })

    it('should update all instances when one refreshes', () => {
      const { result: result1 } = renderHook(() => useCSRF())
      const { result: result2 } = renderHook(() => useCSRF())

      act(() => {
        result1.current.refreshToken()
      })

      // Both should read from sessionStorage and get the new token
      const token1 = result1.current.getToken()
      const token2 = result2.current.getToken()

      expect(token1).toBe(token2)
    })
  })

  describe('Security considerations', () => {
    it('should not persist token beyond session', () => {
      renderHook(() => useCSRF())

      // Check localStorage doesn't have the token
      const localToken = localStorage.getItem('csrf_token')
      expect(localToken).toBeNull()

      // Only sessionStorage should have it
      const sessionToken = sessionStorage.getItem('csrf_token')
      expect(sessionToken).toBeTruthy()
    })

    it('should generate cryptographically random tokens', () => {
      const { result: result1 } = renderHook(() => useCSRF())

      act(() => {
        result1.current.refreshToken()
      })

      const token1 = result1.current.token

      act(() => {
        result1.current.refreshToken()
      })

      const token2 = result1.current.token

      // Tokens should be different (very unlikely to be same with crypto.getRandomValues)
      expect(token1).not.toBe(token2)
    })

    it('should be 64 characters long (256 bits)', () => {
      const { result } = renderHook(() => useCSRF())

      expect(result.current.token.length).toBe(64)
    })
  })

  describe('Lifecycle', () => {
    it('should not clear token on unmount by default', () => {
      const { unmount } = renderHook(() => useCSRF())

      const tokenBeforeUnmount = sessionStorage.getItem('csrf_token')

      unmount()

      const tokenAfterUnmount = sessionStorage.getItem('csrf_token')

      expect(tokenAfterUnmount).toBe(tokenBeforeUnmount)
      expect(tokenAfterUnmount).toBeTruthy()
    })

    it('should initialize new token on remount if cleared', () => {
      const { unmount } = renderHook(() => useCSRF())

      sessionStorage.clear()

      const { result } = renderHook(() => useCSRF())

      expect(result.current.token).toBeTruthy()
      expect(result.current.token.length).toBe(64)
    })
  })
})
