import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

// This page is now deprecated - admin access is controlled via user_roles table
// Users with admin role can access /admin directly after signing in
const AdminLogin = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, loading } = useAuthContext();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && isAdmin) {
        navigate('/admin');
      } else if (isAuthenticated) {
        navigate('/dashboard');
      } else {
        navigate('/signin');
      }
    }
  }, [isAuthenticated, isAdmin, loading, navigate]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-white text-center">
        <p>Redirecting...</p>
      </div>
    </div>
  );
};

export default AdminLogin;
