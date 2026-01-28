/**
 * Session Heartbeat Hook
 * 
 * Monitors session health in the background and proactively refreshes
 * tokens before they expire. This prevents sudden logouts during user activity.
 * 
 * Features:
 * - Runs every 5 minutes when authenticated
 * - Proactively refreshes tokens 10 minutes before expiry
 * - 12-hour grace period: won't force logout within 12h of login
 * - Resilient to network hiccups and temporary failures
 * - Cleans up stale admin cache on session changes
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { isSessionValid, clearSessionTimestamp } from '@/lib/session-persistence';

const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes
const TOKEN_REFRESH_THRESHOLD = 10 * 60; // 10 minutes before expiry

export const useSessionHeartbeat = () => {
  const { isAuthenticated, signOut, user } = useAuthContext();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear interval when not authenticated
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const heartbeat = async () => {
      // Prevent concurrent runs
      if (isRunningRef.current) return;
      isRunningRef.current = true;

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // If no session, try to recover before giving up
        if (error || !session) {
          console.warn('[Heartbeat] No session found - attempting recovery...');
          
          // Try to refresh the session
          const { data, error: refreshError } = await supabase.auth.refreshSession();
          
        if (refreshError || !data.session) {
            // Check if within 12-hour window - if so, don't force logout
            if (isSessionValid()) {
              console.log('[Heartbeat] Session issue but within 12h window - staying logged in');
              return; // Don't sign out, stay logged in
            }
            
            // Only sign out if truly expired (12h+ since login)
            console.warn('[Heartbeat] 12h window expired and refresh failed - signing out');
            
            if (user?.id) {
              sessionStorage.removeItem(`admin_${user.id}`);
            }
            clearSessionTimestamp();
            await signOut();
            window.location.href = '/signin';
            return;
          }
          
          console.log('[Heartbeat] Session recovered successfully');
          return;
        }

        // Check if token is near expiry - proactive refresh
        const exp = session.expires_at;
        const now = Math.floor(Date.now() / 1000);

        if (exp && (exp - now) < TOKEN_REFRESH_THRESHOLD) {
          console.log('[Heartbeat] Token expiring in', exp - now, 'seconds - refreshing...');
          
          const { error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('[Heartbeat] Proactive refresh failed:', refreshError.message);
            
            // Don't sign out on refresh failure if within 12h window
            if (isSessionValid()) {
              console.log('[Heartbeat] Refresh failed but within 12h window - staying logged in');
              return;
            }
            
            // Clear stale admin cache before redirecting
            if (user?.id) {
              sessionStorage.removeItem(`admin_${user.id}`);
            }
            clearSessionTimestamp();
            await signOut();
            window.location.href = '/signin';
            return;
          }
          
          console.log('[Heartbeat] Token refreshed successfully');
          
          // Clear admin cache to force re-check after refresh
          if (user?.id) {
            sessionStorage.removeItem(`admin_${user.id}`);
          }
        }
      } catch (error) {
        // On error, don't sign out - just log and continue
        console.error('[Heartbeat] Error (staying logged in):', error);
      } finally {
        isRunningRef.current = false;
      }
    };

    // Run immediately on mount
    heartbeat();
    
    // Set up interval
    intervalRef.current = setInterval(heartbeat, HEARTBEAT_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, signOut, user?.id]);
};
