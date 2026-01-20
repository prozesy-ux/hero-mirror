import { useRef, useCallback, useEffect } from 'react';

/**
 * Request deduplication hook to prevent duplicate API calls
 * during rapid navigation or component remounts
 */
export function useRequestDeduplication<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: { ttl?: number } = {}
) {
  const { ttl = 2000 } = options;
  const pendingRef = useRef<Map<string, Promise<T>>>(new Map());
  const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (): Promise<T | null> => {
    // Check cache first
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    // Check if request is already pending
    const pending = pendingRef.current.get(key);
    if (pending) {
      return pending;
    }

    // Cancel any previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    // Create new request
    const promise = fetchFn().then((data) => {
      // Cache the result
      cacheRef.current.set(key, { data, timestamp: Date.now() });
      pendingRef.current.delete(key);
      return data;
    }).catch((error) => {
      pendingRef.current.delete(key);
      throw error;
    });

    pendingRef.current.set(key, promise);
    return promise;
  }, [key, fetchFn, ttl]);

  const invalidate = useCallback(() => {
    cacheRef.current.delete(key);
    pendingRef.current.delete(key);
  }, [key]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  return { execute, invalidate };
}

/**
 * Global request queue for managing concurrent requests
 */
const globalRequestQueue = new Map<string, Promise<unknown>>();

export function dedupedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const existing = globalRequestQueue.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = fetchFn().finally(() => {
    globalRequestQueue.delete(key);
  });

  globalRequestQueue.set(key, promise);
  return promise;
}
