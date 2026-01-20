import React, { forwardRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Simplified ProtectedRoute - session hydration is now handled globally by SessionHydrator.
 * This component only needs to check if user is authenticated and redirect if not.
 */
const ProtectedRoute = forwardRef<HTMLDivElement, ProtectedRouteProps>(({ children }, ref) => {
  const { isAuthenticated, loading } = useAuthContext();

  // Show loading while auth is being determined
  if (loading) {
    return (
      <div ref={ref} className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  // Redirect to signin if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <div ref={ref}>{children}</div>;
});

ProtectedRoute.displayName = 'ProtectedRoute';

export default ProtectedRoute;

