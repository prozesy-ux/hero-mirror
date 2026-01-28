/**
 * Session Heartbeat Hook - Enterprise Grade
 * 
 * Monitors session health in the background with:
 * - Proactive token refresh before expiry
 * - Tab visibility recovery (refresh on tab focus)
 * - Network reconnection recovery
 * - Exponential backoff on failures
 * - Session expiry warning (5 minutes before)
 * 
 * CRITICAL RULES:
 * 1. NEVER call signOut() or redirect users
 * 2. NEVER force logout within 12 hours of login
 * 3. On failure, set sessionExpired state - let UI show soft banner
 * 4. Resilient to network hiccups and temporary failures
 * 5. Cleans up stale admin cache on session changes
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { isSessionValid } from '@/lib/session-persistence';
import { sessionRecovery } from '@/lib/session-recovery';

const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes
const TOKEN_REFRESH_THRESHOLD = 10 * 60; // 10 minutes before expiry
const WARNING_THRESHOLD = 5 * 60; // 5 minutes before expiry
const MAX_BACKOFF = 5 * 60 * 1000; // 5 minutes max backoff

export const useSessionHeartbeat = () => {
  const { isAuthenticated, user, setSessionExpired, setSessionWarning } = useAuthContext();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);
  const failureCountRef = useRef(0);

  // Calculate interval with exponential backoff
  const getNextInterval = useCallback(() => {
    if (failureCountRef.current === 0) return HEARTBEAT_INTERVAL;
    return Math.min(
      HEARTBEAT_INTERVAL * Math.pow(2, failureCountRef.current),
      MAX_BACKOFF
    );
  }, []);

  // Main heartbeat function
  const heartbeat = useCallback(async () => {
    // Prevent concurrent runs
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      // If no session, try to recover before giving up
      if (error || !session) {
        console.warn('[Heartbeat] No session found - attempting recovery...');

        // Use centralized recovery manager
        const recovered = await sessionRecovery.recover();

        if (!recovered) {
          // Check if within 12-hour window - if so, DON'T mark as expired
          if (isSessionValid()) {
            console.log('[Heartbeat] Session issue but within 12h window - staying logged in');
            failureCountRef.current++;
            return;
          }

          // Only mark as expired if truly expired (12h+ since login)
          console.warn('[Heartbeat] 12h window expired and refresh failed - marking session expired');

          // Clear stale admin cache
          if (user?.id) {
            sessionStorage.removeItem(`admin_${user.id}`);
          }

          // Set expired state - UI will show soft banner
          // DO NOT signOut() or redirect
          setSessionExpired(true);
          setSessionWarning?.(null);
          return;
        }

        console.log('[Heartbeat] Session recovered successfully');
        failureCountRef.current = 0;
        setSessionWarning?.(null);
        return;
      }

      // Check token expiry timing
      const exp = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = exp ? exp - now : Infinity;

      // Show warning if within 5 minutes of expiry
      if (timeUntilExpiry <= WARNING_THRESHOLD && timeUntilExpiry > 0) {
        const minutesRemaining = Math.ceil(timeUntilExpiry / 60);
        console.log('[Heartbeat] Session expires in', minutesRemaining, 'minutes - showing warning');
        setSessionWarning?.(minutesRemaining);
      } else {
        setSessionWarning?.(null);
      }

      // Proactive refresh if within 10 minutes of expiry
      if (timeUntilExpiry < TOKEN_REFRESH_THRESHOLD) {
        console.log('[Heartbeat] Token expiring in', timeUntilExpiry, 'seconds - refreshing...');

        const recovered = await sessionRecovery.recover();

        if (!recovered) {
          console.error('[Heartbeat] Proactive refresh failed');

          // Don't mark as expired if within 12h window
          if (isSessionValid()) {
            console.log('[Heartbeat] Refresh failed but within 12h window - staying logged in');
            failureCountRef.current++;
            return;
          }

          // Clear stale admin cache
          if (user?.id) {
            sessionStorage.removeItem(`admin_${user.id}`);
          }

          // Set expired state - DO NOT redirect
          setSessionExpired(true);
          setSessionWarning?.(null);
          return;
        }

        console.log('[Heartbeat] Token refreshed successfully');
        failureCountRef.current = 0;
        setSessionWarning?.(null);

        // Clear admin cache to force re-check after refresh
        if (user?.id) {
          sessionStorage.removeItem(`admin_${user.id}`);
        }
      }

      // Session is healthy - reset failure count
      failureCountRef.current = 0;

    } catch (error) {
      // On error, don't mark as expired - just log and increment failure count
      console.error('[Heartbeat] Error (staying logged in):', error);
      failureCountRef.current++;
    } finally {
      isRunningRef.current = false;
    }
  }, [user?.id, setSessionExpired, setSessionWarning]);

  // Manual refresh function (for warning banner button)
  const refreshSession = useCallback(async () => {
    const success = await sessionRecovery.recover();
    if (success) {
      failureCountRef.current = 0;
      setSessionWarning?.(null);
    }
    return success;
  }, [setSessionWarning]);

  // Main interval effect
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear interval when not authenticated
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      failureCountRef.current = 0;
      return;
    }

    // Run immediately on mount
    heartbeat();

    // Set up interval with potential backoff
    const scheduleNextHeartbeat = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(heartbeat, getNextInterval());
    };

    scheduleNextHeartbeat();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, heartbeat, getNextInterval]);

  // Tab visibility change handler
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Heartbeat] Tab became visible - checking session');
        heartbeat();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, heartbeat]);

  // Network online handler
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleOnline = () => {
      console.log('[Heartbeat] Network reconnected - revalidating session');
      // Small delay to let network stabilize
      setTimeout(heartbeat, 1000);
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isAuthenticated, heartbeat]);

  return { refreshSession };
};
