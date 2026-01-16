import { ReactNode } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import AdminLogin from '@/pages/AdminLogin';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { isAuthenticated, isAdmin, loading } = useAuthContext();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Show admin login if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  // Show access denied if authenticated but not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-zinc-400 mb-6">You don't have permission to access the admin panel.</p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#111113] border border-[#27272a] rounded-lg text-white hover:border-[#3f3f46] transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // User is admin - show children
  return <>{children}</>;
};

export default AdminProtectedRoute;
