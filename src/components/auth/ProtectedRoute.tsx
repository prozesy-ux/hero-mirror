import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const AUTH_TIMEOUT = 10000; // 10 seconds max for auth loading
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
  const [timedOut, setTimedOut] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set a hard timeout to prevent infinite loading
    if (loading && !timedOut) {
      timeoutRef.current = setTimeout(async () => {
        console.warn('[ProtectedRoute] Auth loading timeout - attempting server-side validation');
        setIsRecovering(true);
        
        try {
          // Get session from Supabase
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error || !session?.access_token) {
            console.log('[ProtectedRoute] No session available - redirecting to signin');
            setTimedOut(true);
            setIsRecovering(false);
            return;
          }

          // Validate server-side
          const isValid = await validateSessionServer(session.access_token);
          
          if (!isValid) {
            console.log('[ProtectedRoute] Server validation failed - clearing session');
            // Clear stale admin cache
            if (user?.id) {
              sessionStorage.removeItem(`admin_${user.id}`);
            }
            await supabase.auth.signOut();
            setTimedOut(true);
          } else {
            console.log('[ProtectedRoute] Server validated session - auth context may still be loading');
            // Session is valid, but auth context is slow. Give it 3 more seconds
            setTimeout(() => {
              if (!isAuthenticated) {
                console.log('[ProtectedRoute] Auth context still not ready after validation - redirecting');
                setTimedOut(true);
              }
            }, 3000);
          }
        } catch (e) {
          console.error('[ProtectedRoute] Recovery failed:', e);
          setTimedOut(true);
        }
        
        setIsRecovering(false);
      }, AUTH_TIMEOUT);
    }

    // Clear timeout when loading finishes
    if (!loading && timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loading, timedOut, isAuthenticated, user?.id]);

  // Timed out - redirect to signin
  if (timedOut) {
    return <Navigate to="/signin" replace />;
  }

  // Still loading (within timeout window)
  if (loading || isRecovering) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        {isRecovering && (
          <p className="text-sm text-muted-foreground animate-pulse">
            Validating session...
          </p>
        )}
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
