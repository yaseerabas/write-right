import { useState, useEffect, useCallback } from 'react';

interface UseLocalStorageOptions<T> {
  serializer?: {
    stringify: (value: T) => string;
    parse: (value: string) => T;
  };
  onError?: (error: Error) => void;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: UseLocalStorageOptions<T>
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const serializer = options?.serializer || {
    stringify: JSON.stringify,
    parse: JSON.parse
  };

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? serializer.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      options?.onError?.(error instanceof Error ? error : new Error(String(error)));
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, serializer.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
      options?.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }, [key, storedValue, serializer, options]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
      options?.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }, [key, initialValue]);

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(serializer.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, serializer]);

  return [storedValue, setValue, removeValue];
}