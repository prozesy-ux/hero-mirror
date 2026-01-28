/**
 * Session Heartbeat Hook - Enterprise Grade
 * 
 * Monitors session health in the background and proactively refreshes
 * tokens before they expire. 
 * 
 * CRITICAL RULES:
 * 1. NEVER call signOut() or redirect users
 * 2. NEVER force logout within 12 hours of login
 * 3. On failure, set sessionExpired state - let UI show soft banner
 * 4. Resilient to network hiccups and temporary failures
 * 5. Cleans up stale admin cache on session changes
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { isSessionValid } from '@/lib/session-persistence';

const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes
const TOKEN_REFRESH_THRESHOLD = 10 * 60; // 10 minutes before expiry

export const useSessionHeartbeat = () => {
  const { isAuthenticated, user, setSessionExpired, revalidateSession } = useAuthContext();
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
            // Check if within 12-hour window - if so, DON'T mark as expired
            if (isSessionValid()) {
              console.log('[Heartbeat] Session issue but within 12h window - staying logged in');
              return; // Don't mark as expired
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
            
            // Don't mark as expired if within 12h window
            if (isSessionValid()) {
              console.log('[Heartbeat] Refresh failed but within 12h window - staying logged in');
              return;
            }
            
            // Clear stale admin cache
            if (user?.id) {
              sessionStorage.removeItem(`admin_${user.id}`);
            }
            
            // Set expired state - DO NOT redirect
            setSessionExpired(true);
            return;
          }
          
          console.log('[Heartbeat] Token refreshed successfully');
          
          // Clear admin cache to force re-check after refresh
          if (user?.id) {
            sessionStorage.removeItem(`admin_${user.id}`);
          }
        }
      } catch (error) {
        // On error, don't mark as expired - just log and continue
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
  }, [isAuthenticated, user?.id, setSessionExpired, revalidateSession]);
};
