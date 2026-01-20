import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { recoverBackend } from '@/lib/backend-recovery';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Ensures auth is fully hydrated after full page reload BEFORE rendering children.
 * This prevents "works until refresh" issues where the first queries run without a session.
 */
const ProtectedRoute = forwardRef<HTMLDivElement, ProtectedRouteProps>(({ children }, ref) => {
  const { isAuthenticated, loading } = useAuthContext();
  const location = useLocation();
  const [sessionReady, setSessionReady] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      setSessionReady(false);
      return;
    }
    if (initRef.current) return;
    initRef.current = true;

    let cancelled = false;

    const hydrate = async () => {
      try {
        // 1) Ensure client has the latest session loaded after hard refresh
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // Attempt a refresh; if it still doesn't exist, run a full recovery pass.
          await supabase.auth.refreshSession();
          const { data: { session: afterRefresh } } = await supabase.auth.getSession();

          if (!afterRefresh) {
            await recoverBackend('page_load');
          }
        }
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [loading, isAuthenticated, location.pathname]);

  if (loading || (isAuthenticated && !sessionReady)) {
    return (
      <div ref={ref} className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <div ref={ref}>{children}</div>;
});

ProtectedRoute.displayName = 'ProtectedRoute';

export default ProtectedRoute;

