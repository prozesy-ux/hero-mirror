import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const AUTH_TIMEOUT = 10000; // 10 seconds max for auth loading

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuthContext();
  const [timedOut, setTimedOut] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set a hard timeout to prevent infinite loading
    if (loading && !timedOut) {
      timeoutRef.current = setTimeout(async () => {
        console.warn('[ProtectedRoute] Auth loading timeout - attempting recovery');
        setIsRecovering(true);
        
        // Attempt session recovery
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error || !session) {
            console.log('[ProtectedRoute] No valid session after timeout - redirecting to signin');
            setTimedOut(true);
          } else {
            console.log('[ProtectedRoute] Session recovered after timeout');
            // Force a page reload to reset auth state
            window.location.reload();
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
  }, [loading, timedOut]);

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
            Recovering session...
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
