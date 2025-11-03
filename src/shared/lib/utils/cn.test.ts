import { describe, it, expect } from 'vitest'
import { cn } from './cn'

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    const result = cn('foo', false && 'bar', 'baz')
    expect(result).toBe('foo baz')
  })

  it('should resolve Tailwind conflicts', () => {
    // Later class should override earlier class when they conflict
    const result = cn('p-4', 'p-8')
    expect(result).toBe('p-8')
  })

  it('should handle arrays', () => {
    const result = cn(['foo', 'bar'], 'baz')
    expect(result).toBe('foo bar baz')
  })

  it('should handle objects', () => {
    const result = cn({ foo: true, bar: false, baz: true })
    expect(result).toBe('foo baz')
  })

  it('should handle undefined and null', () => {
    const result = cn('foo', undefined, null, 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle empty input', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should merge complex Tailwind classes correctly', () => {
    const result = cn('bg-red-500 text-white', 'bg-blue-500')
    expect(result).toBe('text-white bg-blue-500')
  })
})
