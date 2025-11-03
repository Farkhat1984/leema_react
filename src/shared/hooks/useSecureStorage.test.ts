import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSecureStorage } from './useSecureStorage'

describe('useSecureStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('Basic functionality - localStorage', () => {
    it('should initialize with initial value when storage is empty', () => {
      const { result } = renderHook(() => useSecureStorage('test-key', 'initial'))

      expect(result.current[0]).toBe('initial')
    })

    it('should initialize with stored value if exists', () => {
      localStorage.setItem('test-key', JSON.stringify('stored'))

      const { result } = renderHook(() => useSecureStorage('test-key', 'initial'))

      expect(result.current[0]).toBe('stored')
    })

    it('should store value in localStorage', () => {
      const { result } = renderHook(() => useSecureStorage('test-key', 'initial'))

      act(() => {
        result.current[1]('new value')
      })

      expect(result.current[0]).toBe('new value')
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify('new value'))
    })

    it('should remove value from localStorage', () => {
      localStorage.setItem('test-key', JSON.stringify('stored'))

      const { result } = renderHook(() => useSecureStorage('test-key', 'initial'))

      act(() => {
        result.current[2]() // removeValue
      })

      expect(result.current[0]).toBe('initial')
      expect(localStorage.getItem('test-key')).toBeNull()
    })
  })

  describe('sessionStorage', () => {
    it('should use sessionStorage when type is session', () => {
      const { result } = renderHook(() =>
        useSecureStorage('test-key', 'initial', { type: 'session' })
      )

      act(() => {
        result.current[1]('session value')
      })

      expect(result.current[0]).toBe('session value')
      expect(sessionStorage.getItem('test-key')).toBe(JSON.stringify('session value'))
      expect(localStorage.getItem('test-key')).toBeNull()
    })

    it('should retrieve from sessionStorage', () => {
      sessionStorage.setItem('test-key', JSON.stringify('stored in session'))

      const { result } = renderHook(() =>
        useSecureStorage('test-key', 'initial', { type: 'session' })
      )

      expect(result.current[0]).toBe('stored in session')
    })
  })

  describe('Complex data types', () => {
    it('should handle objects', () => {
      const initialObj = { name: 'test', count: 0 }
      const { result } = renderHook(() => useSecureStorage('test-key', initialObj))

      const newObj = { name: 'updated', count: 5 }

      act(() => {
        result.current[1](newObj)
      })

      expect(result.current[0]).toEqual(newObj)
    })

    it('should handle arrays', () => {
      const initialArray = [1, 2, 3]
      const { result } = renderHook(() => useSecureStorage('test-key', initialArray))

      const newArray = [4, 5, 6]

      act(() => {
        result.current[1](newArray)
      })

      expect(result.current[0]).toEqual(newArray)
    })

    it('should handle numbers', () => {
      const { result } = renderHook(() => useSecureStorage('test-key', 0))

      act(() => {
        result.current[1](42)
      })

      expect(result.current[0]).toBe(42)
    })

    it('should handle booleans', () => {
      const { result } = renderHook(() => useSecureStorage('test-key', false))

      act(() => {
        result.current[1](true)
      })

      expect(result.current[0]).toBe(true)
    })
  })

  describe('Functional updates', () => {
    it('should support functional updates', () => {
      const { result } = renderHook(() => useSecureStorage('counter', 0))

      act(() => {
        result.current[1]((prev) => prev + 1)
      })

      expect(result.current[0]).toBe(1)

      act(() => {
        result.current[1]((prev) => prev + 1)
      })

      expect(result.current[0]).toBe(2)
    })

    it('should work with object updates', () => {
      const { result } = renderHook(() =>
        useSecureStorage('user', { name: 'John', age: 25 })
      )

      act(() => {
        result.current[1]((prev) => ({ ...prev, age: 26 }))
      })

      expect(result.current[0]).toEqual({ name: 'John', age: 26 })
    })
  })

  describe('Custom serialization', () => {
    it('should use custom serialize function', () => {
      const serialize = (value: number) => `custom-${value}`
      const deserialize = (value: string) => parseInt(value.replace('custom-', ''), 10)

      const { result } = renderHook(() =>
        useSecureStorage('test-key', 0, { serialize, deserialize })
      )

      act(() => {
        result.current[1](42)
      })

      expect(localStorage.getItem('test-key')).toBe('custom-42')
      expect(result.current[0]).toBe(42)
    })
  })

  describe('Error handling', () => {
    it('should handle JSON parse errors gracefully', async () => {
      // Import logger to spy on it
      const { logger } = await import('@/shared/lib/utils/logger')

      localStorage.setItem('test-key', 'invalid json {')

      const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useSecureStorage('test-key', 'fallback'))

      expect(result.current[0]).toBe('fallback')
      expect(loggerSpy).toHaveBeenCalled()

      loggerSpy.mockRestore()
    })

    it('should handle storage quota exceeded', async () => {
      // Import logger to spy on it
      const { logger } = await import('@/shared/lib/utils/logger')

      const { result } = renderHook(() => useSecureStorage('test-key', 'initial'))

      // Mock setItem to throw quota exceeded error
      const originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError')
      })

      const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})

      act(() => {
        result.current[1]('new value')
      })

      expect(loggerSpy).toHaveBeenCalled()

      // Restore
      Storage.prototype.setItem = originalSetItem
      loggerSpy.mockRestore()
    })
  })

  describe('Cross-tab synchronization', () => {
    it('should dispatch custom event on setValue', async () => {
      const { result } = renderHook(() => useSecureStorage('test-key', 'initial'))

      const eventSpy = vi.fn()
      window.addEventListener('storage-change', eventSpy)

      act(() => {
        result.current[1]('new value')
      })

      // Wait for event to be dispatched
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(eventSpy).toHaveBeenCalled()
      const event = eventSpy.mock.calls[0][0] as CustomEvent
      expect(event.detail).toEqual({
        key: 'test-key',
        value: 'new value',
        type: 'local',
      })

      window.removeEventListener('storage-change', eventSpy)
    })

    it('should dispatch custom event on removeValue', () => {
      const { result } = renderHook(() => useSecureStorage('test-key', 'initial'))

      const eventSpy = vi.fn()
      window.addEventListener('storage-change', eventSpy)

      act(() => {
        result.current[2]()
      })

      expect(eventSpy).toHaveBeenCalled()
      const event = eventSpy.mock.calls[0][0] as CustomEvent
      expect(event.detail.key).toBe('test-key')
      expect(event.detail.value).toBeNull()

      window.removeEventListener('storage-change', eventSpy)
    })

    it('should respond to storage events from other tabs', () => {
      const { result } = renderHook(() => useSecureStorage('test-key', 'initial'))

      // Simulate storage event from another tab
      const storageEvent = new StorageEvent('storage', {
        key: 'test-key',
        newValue: JSON.stringify('from other tab'),
        storageArea: localStorage,
      })

      act(() => {
        window.dispatchEvent(storageEvent)
      })

      expect(result.current[0]).toBe('from other tab')
    })

    it('should respond to custom storage-change events', () => {
      const { result } = renderHook(() => useSecureStorage('test-key', 'initial'))

      const customEvent = new CustomEvent('storage-change', {
        detail: {
          key: 'test-key',
          value: 'from custom event',
          type: 'local',
        },
      })

      act(() => {
        window.dispatchEvent(customEvent)
      })

      expect(result.current[0]).toBe('from custom event')
    })

    it('should ignore storage events for different keys', () => {
      const { result } = renderHook(() => useSecureStorage('test-key', 'initial'))

      const storageEvent = new StorageEvent('storage', {
        key: 'different-key',
        newValue: JSON.stringify('different value'),
        storageArea: localStorage,
      })

      act(() => {
        window.dispatchEvent(storageEvent)
      })

      expect(result.current[0]).toBe('initial')
    })
  })

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() => useSecureStorage('test-key', 'initial'))

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'storage',
        expect.any(Function)
      )
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'storage-change',
        expect.any(Function)
      )

      removeEventListenerSpy.mockRestore()
    })
  })
})
