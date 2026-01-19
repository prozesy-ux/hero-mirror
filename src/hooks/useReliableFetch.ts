import { useState, useCallback, useRef, useEffect } from 'react';

interface UseReliableFetchOptions {
  maxRetries?: number;
  retryDelay?: number;
  staleTimeout?: number;
  onError?: (error: Error) => void;
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isStale: boolean;
}

/**
 * A reliable data fetching hook with automatic retry, stale detection,
 * and recovery mechanisms to prevent blank screens.
 */
export function useReliableFetch<T>(
  fetchFn: () => Promise<T>,
  options: UseReliableFetchOptions = {}
) {
  const {
    maxRetries = 2,
    retryDelay = 1000,
    staleTimeout = 30000,
    onError
  } = options;

  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
    isStale: false
  });

  const retryCountRef = useRef(0);
  const lastFetchRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (isRetry = false) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (!isRetry) {
      retryCountRef.current = 0;
      setState(prev => ({ ...prev, loading: true, error: null }));
    }

    try {
      const result = await fetchFn();
      lastFetchRef.current = Date.now();
      retryCountRef.current = 0;
      
      setState({
        data: result,
        loading: false,
        error: null,
        isStale: false
      });
      
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Check if we should retry
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.warn(`Fetch failed, retrying (${retryCountRef.current}/${maxRetries})...`, err.message);
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return execute(true);
      }
      
      // Max retries exceeded
      setState(prev => ({
        ...prev,
        loading: false,
        error: err
      }));
      
      onError?.(err);
      return null;
    }
  }, [fetchFn, maxRetries, retryDelay, onError]);

  const refresh = useCallback(() => {
    return execute(false);
  }, [execute]);

  // Check for stale data
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastFetchRef.current && Date.now() - lastFetchRef.current > staleTimeout) {
        setState(prev => ({ ...prev, isStale: true }));
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [staleTimeout]);

  // Auto-refresh on stale
  useEffect(() => {
    if (state.isStale && !state.loading) {
      execute(false);
    }
  }, [state.isStale, state.loading, execute]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    refresh,
    execute
  };
}

/**
 * Hook to detect online/offline status and trigger recovery
 */
export function useConnectivityRecovery(onReconnect: () => void) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Debounce recovery to allow connections to stabilize
      setTimeout(onReconnect, 500);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onReconnect]);

  return isOnline;
}

/**
 * Hook to add a loading timeout with auto-retry
 */
export function useLoadingTimeout(
  isLoading: boolean,
  onTimeout: () => void,
  timeout = 15000
) {
  useEffect(() => {
    if (!isLoading) return;

    const timer = setTimeout(() => {
      console.warn('Loading timeout exceeded, triggering recovery...');
      onTimeout();
    }, timeout);

    return () => clearTimeout(timer);
  }, [isLoading, onTimeout, timeout]);
}
