import { useEffect, useRef, useCallback } from 'react';
import { recoverBackend, RecoveryReason } from '@/lib/backend-recovery';

interface UseLoadingWatchdogOptions {
  /** Timeout in milliseconds before triggering recovery */
  timeout?: number;
  /** Reason to pass to recovery function */
  reason?: RecoveryReason;
  /** Callback when recovery completes */
  onRecoveryComplete?: () => void;
  /** Whether the watchdog is enabled */
  enabled?: boolean;
}

/**
 * Monitors a loading state and triggers recovery if it takes too long.
 * Prevents indefinite loading spinners.
 */
export function useLoadingWatchdog(
  isLoading: boolean,
  options: UseLoadingWatchdogOptions = {}
) {
  const {
    timeout = 15000,
    reason = 'loading_timeout',
    onRecoveryComplete,
    enabled = true
  } = options;

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasTriggeredRef = useRef(false);

  const triggerRecovery = useCallback(async () => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    console.warn(`[LoadingWatchdog] Loading timeout exceeded (${timeout}ms), triggering recovery`);
    
    const result = await recoverBackend(reason);
    
    if (result.success) {
      onRecoveryComplete?.();
    }
    
    // Reset after some time to allow re-triggering if needed
    setTimeout(() => {
      hasTriggeredRef.current = false;
    }, 5000);
  }, [timeout, reason, onRecoveryComplete]);

  useEffect(() => {
    if (!enabled) return;

    if (isLoading) {
      // Start the timeout
      timeoutRef.current = setTimeout(() => {
        triggerRecovery();
      }, timeout);
    } else {
      // Loading completed - clear timeout and reset trigger flag
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      hasTriggeredRef.current = false;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoading, timeout, enabled, triggerRecovery]);
}

export default useLoadingWatchdog;
