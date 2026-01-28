/**
 * Protected Route - Enterprise Grade
 * 
 * CRITICAL RULES:
 * 1. NEVER block UI for auth validation
 * 2. NEVER auto-redirect users (except when truly no session)
 * 3. If local session exists -> render IMMEDIATELY
 * 4. Background validation only sets state, never redirects
 * 5. Session expired -> show soft banner, NOT redirect
 */

import { useState, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { hasLocalSession, shouldRenderProtectedContent } from '@/lib/session-detector';
import AppShell from '@/components/ui/app-shell';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, sessionExpired } = useAuthContext();
  const location = useLocation();
  const initialCheckDone = useRef(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Determine shell variant based on route
  const getShellVariant = () => {
    if (location.pathname.startsWith('/seller')) return 'seller';
    if (location.pathname.startsWith('/dashboard')) return 'dashboard';
    return 'default';
  };

  // INSTANT CHECK: If no local session at all, redirect immediately
  useEffect(() => {
    if (initialCheckDone.current) return;
    initialCheckDone.current = true;

    // Only redirect if there's definitively no session
    if (!hasLocalSession()) {
      console.log('[ProtectedRoute] No local session found - redirecting to signin');
      sessionStorage.setItem('authRedirectPath', location.pathname);
      setShouldRedirect(true);
    }
  }, [location.pathname]);

  // Handle redirect
  if (shouldRedirect) {
    return <Navigate to="/signin" replace />;
  }

  // OPTIMISTIC RENDERING: If local session exists, render immediately
  // Don't wait for async auth - it happens in background
  if (shouldRenderProtectedContent()) {
    // If auth context finished loading and says not authenticated,
    // but we have local session, still render - auth might be stale
    if (!loading && !isAuthenticated && hasLocalSession()) {
      console.log('[ProtectedRoute] Auth context says no, but local session exists - rendering anyway');
    }
    
    return <>{children}</>;
  }

  // Auth context is still loading, but we have no local session
  // Show skeleton briefly while confirming redirect is needed
  if (loading) {
    return (
      <AppShell 
        variant={getShellVariant()} 
        stage="loading"
      />
    );
  }

  // Final check: No local session and auth confirms not authenticated
  if (!isAuthenticated) {
    sessionStorage.setItem('authRedirectPath', location.pathname);
    return <Navigate to="/signin" replace />;
  }

  // Authenticated - render children
  return <>{children}</>;
};

export default ProtectedRoute;
