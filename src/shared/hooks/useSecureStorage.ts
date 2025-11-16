/**
 * Hook for secure storage operations
 */

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/shared/lib/utils/logger';

type StorageType = 'local' | 'session';

interface UseSecureStorageOptions<T> {
  type?: StorageType;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}

export const useSecureStorage = <T>(
  key: string,
  initialValue: T,
  options: UseSecureStorageOptions<T> = {}
) => {
  const { type = 'local', serialize = JSON.stringify, deserialize = JSON.parse } = options;

  const storage = type === 'local' ? localStorage : sessionStorage;

  // Get stored value
  const getStoredValue = useCallback((): T => {
    try {
      const item = storage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch {
      logger.error(`Error reading from ${type}Storage`, error);
      return initialValue;
    }
  }, [key, initialValue, storage, type, deserialize]);

  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  // Update stored value
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        storage.setItem(key, serialize(valueToStore));

        // Dispatch custom event for cross-tab synchronization
        window.dispatchEvent(
          new CustomEvent('storage-change', {
            detail: { key, value: valueToStore, type },
          })
        );
      } catch {
        logger.error(`Error writing to ${type}Storage`, error);
      }
    },
    [key, storedValue, storage, type, serialize]
  );

  // Remove value
  const removeValue = useCallback(() => {
    try {
      storage.removeItem(key);
      setStoredValue(initialValue);

      window.dispatchEvent(
        new CustomEvent('storage-change', {
          detail: { key, value: null, type },
        })
      );
    } catch {
      logger.error(`Error removing from ${type}Storage`, error);
    }
  }, [key, storage, initialValue, type]);

  // Listen for storage changes (cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if (e instanceof StorageEvent) {
        // Native storage event (cross-tab)
        if (e.key === key && e.storageArea === storage) {
          try {
            const newValue = e.newValue ? deserialize(e.newValue) : initialValue;
            setStoredValue(newValue);
          } catch {
            logger.error('Error parsing storage event', error);
          }
        }
      } else {
        // Custom event (same tab)
        const detail = (e as CustomEvent).detail;
        if (detail.key === key && detail.type === type) {
          setStoredValue(detail.value ?? initialValue);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange as EventListener);
    window.addEventListener('storage-change', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener('storage-change', handleStorageChange as EventListener);
    };
  }, [key, storage, initialValue, type, deserialize]);

  return [storedValue, setValue, removeValue] as const;
};
