import { useState, useCallback } from 'react';
import { fetchWithRecovery } from '@/lib/backend-recovery';

interface UseFetchWithRecoveryOptions {
  timeout?: number;
  context?: string;
  retryOnce?: boolean;
}

/**
 * Hook that wraps fetch operations with automatic timeout and recovery
 * Use this for critical data fetches that should self-heal on failure
 */
export function useFetchWithRecovery() {
  const [isRecovering, setIsRecovering] = useState(false);

  const executeFetch = useCallback(async <T>(
    fetchFn: () => Promise<T>,
    options: UseFetchWithRecoveryOptions = {}
  ): Promise<T> => {
    const { timeout = 10000, context = 'data fetch', retryOnce = true } = options;
    
    try {
      setIsRecovering(false);
      return await fetchWithRecovery(fetchFn, { timeout, context, retryOnce });
    } catch (error) {
      setIsRecovering(true);
      throw error;
    } finally {
      setIsRecovering(false);
    }
  }, []);

  return { executeFetch, isRecovering };
}
