import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuthContext();
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);

  // Show helpful message if loading takes too long
  useEffect(() => {
    if (!loading) {
      setShowTimeoutMessage(false);
      return;
    }
    
    const timer = setTimeout(() => {
      setShowTimeoutMessage(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        {showTimeoutMessage && (
          <p className="text-sm text-muted-foreground animate-pulse">
            Restoring your session...
          </p>
        )}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
