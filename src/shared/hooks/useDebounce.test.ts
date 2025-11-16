import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500));

    expect(result.current).toBe('test');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 500 });

    // Value should not update immediately
    expect(result.current).toBe('initial');

    // Fast-forward time but not enough
    vi.advanceTimersByTime(300);
    expect(result.current).toBe('initial');

    // Fast-forward past delay
    vi.advanceTimersByTime(200);

    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('should cancel previous timer when value changes rapidly', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'first' } }
    );

    // Rapid changes
    rerender({ value: 'second' });
    vi.advanceTimersByTime(200);

    rerender({ value: 'third' });
    vi.advanceTimersByTime(200);

    rerender({ value: 'final' });

    // Value should still be 'first'
    expect(result.current).toBe('first');

    // Fast-forward full delay
    vi.advanceTimersByTime(500);

    await waitFor(() => {
      expect(result.current).toBe('final');
    });
  });

  it('should use custom delay', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } }
    );

    rerender({ value: 'updated', delay: 1000 });

    vi.advanceTimersByTime(999);
    expect(result.current).toBe('initial');

    vi.advanceTimersByTime(1);

    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('should handle numeric values', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 0 } }
    );

    expect(result.current).toBe(0);

    rerender({ value: 42 });

    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current).toBe(42);
    });
  });

  it('should handle boolean values', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: false } }
    );

    expect(result.current).toBe(false);

    rerender({ value: true });

    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should handle object values', async () => {
    const initialObj = { name: 'John', age: 30 };
    const updatedObj = { name: 'Jane', age: 25 };

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: initialObj } }
    );

    expect(result.current).toEqual(initialObj);

    rerender({ value: updatedObj });

    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current).toEqual(updatedObj);
    });
  });

  it('should use default delay of 500ms when not specified', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    vi.advanceTimersByTime(499);
    expect(result.current).toBe('initial');

    vi.advanceTimersByTime(1);

    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('should cleanup timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    const { unmount } = renderHook(() => useDebounce('test', 500));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('should handle empty string values', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'test' } }
    );

    rerender({ value: '' });

    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current).toBe('');
    });
  });

  it('should handle null values', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'test' as string | null } }
    );

    rerender({ value: null });

    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current).toBeNull();
    });
  });

  it('should handle undefined values', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'test' as string | undefined } }
    );

    rerender({ value: undefined });

    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
  });
});
