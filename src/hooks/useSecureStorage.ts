import { useState, useEffect, useCallback } from 'react';
import { encryptWithAppKey, decryptWithAppKey, isEncrypted } from '@/utils/encryption';

interface UseSecureStorageOptions<T> {
  onError?: (error: Error) => void;
}

/**
 * A hook that provides encrypted localStorage persistence
 * Automatically encrypts values before storing and decrypts on retrieval
 */
export function useSecureStorage<T>(
  key: string,
  initialValue: T,
  options?: UseSecureStorageOptions<T>
): [T, (value: T | ((prev: T) => T)) => void, () => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isReady, setIsReady] = useState(false);

  // Load and decrypt value on mount
  useEffect(() => {
    const loadValue = async () => {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          // Check if the data is encrypted
          if (isEncrypted(item)) {
            try {
              const decrypted = await decryptWithAppKey(item);
              setStoredValue(JSON.parse(decrypted));
            } catch (decryptError) {
              // If decryption fails, might be old plaintext data
              console.warn(`Failed to decrypt ${key}, trying plaintext fallback`);
              try {
                const parsed = JSON.parse(item);
                setStoredValue(parsed);
                // Re-encrypt in background
                encryptWithAppKey(item).then(encrypted => {
                  window.localStorage.setItem(key, encrypted);
                });
              } catch {
                setStoredValue(initialValue);
              }
            }
          } else {
            // Plaintext data - migrate to encrypted
            try {
              const parsed = JSON.parse(item);
              setStoredValue(parsed);
              // Encrypt in background
              const encrypted = await encryptWithAppKey(item);
              window.localStorage.setItem(key, encrypted);
            } catch {
              setStoredValue(initialValue);
            }
          }
        }
      } catch (error) {
        console.error(`Error reading secure storage key "${key}":`, error);
        options?.onError?.(error instanceof Error ? error : new Error(String(error)));
        setStoredValue(initialValue);
      } finally {
        setIsReady(true);
      }
    };

    loadValue();
  }, [key, initialValue, options]);

  const setValue = useCallback(async (value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      const serialized = JSON.stringify(valueToStore);
      const encrypted = await encryptWithAppKey(serialized);
      window.localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error(`Error setting secure storage key "${key}":`, error);
      options?.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }, [key, storedValue, options]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing secure storage key "${key}":`, error);
      options?.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }, [key, initialValue, options]);

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          if (isEncrypted(e.newValue)) {
            const decrypted = await decryptWithAppKey(e.newValue);
            setStoredValue(JSON.parse(decrypted));
          } else {
            setStoredValue(JSON.parse(e.newValue));
          }
        } catch (error) {
          console.error(`Error parsing secure storage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue, isReady];
}

/**
 * Clear all app-related data from localStorage
 */
export function clearAllSecureData(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('llm') ||
      key.startsWith('ai_') ||
      key.includes('writing') ||
      key.includes('generation') ||
      key.includes('history') ||
      key.includes('draft')
    )) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}
