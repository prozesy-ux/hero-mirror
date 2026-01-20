import { forwardRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = forwardRef<HTMLDivElement, ProtectedRouteProps>(
  ({ children }, ref) => {
    const { isAuthenticated, loading } = useAuthContext();

    if (loading) {
      return (
        <div ref={ref} className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <Navigate to="/signin" replace />;
    }

    return <div ref={ref}>{children}</div>;
  }
);

ProtectedRoute.displayName = 'ProtectedRoute';

export default ProtectedRoute;
