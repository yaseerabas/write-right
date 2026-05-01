import { useState, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export function useCache<T>(defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default
  const [cache, setCache] = useState<Map<string, CacheEntry<T>>>(new Map());

  const get = useCallback((key: string): T | null => {
    const entry = cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      return null;
    }

    return entry.data;
  }, [cache]);

  const set = useCallback((key: string, data: T, ttl: number = defaultTTL) => {
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      });
      return newCache;
    });
  }, [defaultTTL]);

  const clear = useCallback(() => {
    setCache(new Map());
  }, []);

  const remove = useCallback((key: string) => {
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(key);
      return newCache;
    });
  }, []);

  return { get, set, clear, remove };
}