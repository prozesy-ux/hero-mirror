/**
 * Session Heartbeat Hook
 * 
 * Monitors session health in the background and proactively refreshes
 * tokens before they expire. This prevents sudden logouts during user activity.
 * 
 * Features:
 * - Runs every 5 minutes when authenticated
 * - Proactively refreshes tokens 10 minutes before expiry
 * - Redirects to signin if session becomes invalid
 * - Cleans up stale admin cache on session changes
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

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
        
        if (error || !session) {
          console.warn('[Heartbeat] No valid session found - signing out');
          await signOut();
          window.location.href = '/signin';
          return;
        }

        // Check if token is near expiry
        const exp = session.expires_at;
        const now = Math.floor(Date.now() / 1000);

        if (exp && (exp - now) < TOKEN_REFRESH_THRESHOLD) {
          console.log('[Heartbeat] Token expiring in', exp - now, 'seconds - refreshing...');
          
          const { error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('[Heartbeat] Refresh failed:', refreshError.message);
            
            // Clear stale admin cache before redirecting
            if (user?.id) {
              sessionStorage.removeItem(`admin_${user.id}`);
            }
            
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
        console.error('[Heartbeat] Error:', error);
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
