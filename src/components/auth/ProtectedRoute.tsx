import { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppShell from '@/components/ui/app-shell';
import { isSessionValid, clearSessionTimestamp } from '@/lib/session-persistence';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Reduced timeout for faster perceived performance
const AUTH_TIMEOUT = 5000; // 5 seconds (down from 10)
const SLOW_THRESHOLD = 3000; // Show "slow" message after 3 seconds
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Validate session server-side using the validate-session edge function
 * Returns true if session is valid, false otherwise
 */
async function validateSessionServer(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/validate-session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn('[ProtectedRoute] Server validation request failed:', response.status);
      return false;
    }

    const result = await response.json();
    return result.data?.valid === true;
  } catch (error) {
    console.error('[ProtectedRoute] Server validation error:', error);
    return false;
  }
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, user } = useAuthContext();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'loading' | 'validating' | 'slow'>('loading');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const slowTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determine shell variant based on route
  const getShellVariant = () => {
    if (location.pathname.startsWith('/seller')) return 'seller';
    if (location.pathname.startsWith('/dashboard')) return 'dashboard';
    return 'default';
  };

  useEffect(() => {
    if (loading && !timedOut) {
      // Progressive loading messages
      slowTimeoutRef.current = setTimeout(() => {
        setLoadingStage('slow');
      }, SLOW_THRESHOLD);

      // Hard timeout for auth loading
      timeoutRef.current = setTimeout(async () => {
        console.warn('[ProtectedRoute] Auth loading timeout - attempting server-side validation');
        setIsRecovering(true);
        setLoadingStage('validating');
        
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error || !session?.access_token) {
            console.log('[ProtectedRoute] No session available - redirecting to signin');
            // Store intended destination for post-login redirect
            sessionStorage.setItem('authRedirectPath', location.pathname);
            setTimedOut(true);
            setIsRecovering(false);
            return;
          }

          const isValid = await validateSessionServer(session.access_token);
          
          if (!isValid) {
            // Check 12-hour window before forcing logout
            if (isSessionValid()) {
              console.log('[ProtectedRoute] Server validation failed but within 12h window - attempting refresh');
              const { error: refreshError } = await supabase.auth.refreshSession();
              if (!refreshError) {
                console.log('[ProtectedRoute] Session refreshed successfully');
                setIsRecovering(false);
                return; // Stay logged in
              }
            }
            
            console.log('[ProtectedRoute] Server validation failed and 12h expired - clearing session');
            if (user?.id) {
              sessionStorage.removeItem(`admin_${user.id}`);
            }
            clearSessionTimestamp();
            await supabase.auth.signOut();
            sessionStorage.setItem('authRedirectPath', location.pathname);
            setTimedOut(true);
          } else {
            console.log('[ProtectedRoute] Server validated session - giving auth context more time');
            // Session is valid, give auth context 2 more seconds (reduced from 3)
            setTimeout(() => {
              if (!isAuthenticated) {
                console.log('[ProtectedRoute] Auth context still not ready - redirecting');
                sessionStorage.setItem('authRedirectPath', location.pathname);
                setTimedOut(true);
              }
            }, 2000);
          }
        } catch (e) {
          console.error('[ProtectedRoute] Recovery failed:', e);
          setTimedOut(true);
        }
        
        setIsRecovering(false);
      }, AUTH_TIMEOUT);
    }

    // Clear timeouts when loading finishes
    if (!loading) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (slowTimeoutRef.current) {
        clearTimeout(slowTimeoutRef.current);
        slowTimeoutRef.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (slowTimeoutRef.current) clearTimeout(slowTimeoutRef.current);
    };
  }, [loading, timedOut, isAuthenticated, user?.id, location.pathname]);

  // Timed out - redirect to signin
  if (timedOut) {
    return <Navigate to="/signin" replace />;
  }

  // Still loading - show branded skeleton shell
  if (loading || isRecovering) {
    return (
      <AppShell 
        variant={getShellVariant()} 
        stage={isRecovering ? 'validating' : loadingStage}
      />
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    // Store intended path for redirect after login
    sessionStorage.setItem('authRedirectPath', location.pathname);
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
