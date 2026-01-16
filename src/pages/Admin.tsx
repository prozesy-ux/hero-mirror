import { Routes, Route } from 'react-router-dom';
import AdminSidebar, { useAdminSidebarContext } from '@/components/admin/AdminSidebar';
import PromptsManagement from '@/components/admin/PromptsManagement';
import CategoriesManagement from '@/components/admin/CategoriesManagement';
import UsersManagement from '@/components/admin/UsersManagement';
import PurchasesManagement from '@/components/admin/PurchasesManagement';
import AIAccountsManagement from '@/components/admin/AIAccountsManagement';
import AccountOrdersManagement from '@/components/admin/AccountOrdersManagement';
import RefundRequestsManagement from '@/components/admin/RefundRequestsManagement';
import CancellationRequestsManagement from '@/components/admin/CancellationRequestsManagement';
import DeletionRequestsManagement from '@/components/admin/DeletionRequestsManagement';
import ChatManagement from '@/components/admin/ChatManagement';
import WalletManagement from '@/components/admin/WalletManagement';
import PaymentSettingsManagement from '@/components/admin/PaymentSettingsManagement';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock, User, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import promptheroIcon from '@/assets/prompthero-icon.png';

const ADMIN_SESSION_KEY = 'admin_session_token';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalPrompts: 0,
    totalUsers: 0,
    proUsers: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [
        { count: promptsCount },
        { data: profiles },
        { data: purchases }
      ] = await Promise.all([
        supabase.from('prompts').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('is_pro'),
        supabase.from('purchases').select('amount, payment_status')
      ]);

      const totalUsers = profiles?.length || 0;
      const proUsers = profiles?.filter(p => p.is_pro).length || 0;
      const revenue = purchases
        ?.filter(p => p.payment_status === 'completed')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setStats({
        totalPrompts: promptsCount || 0,
        totalUsers,
        proUsers,
        revenue
      });
      setLoading(false);
    };

    fetchStats();
  }, []);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="text-gray-400 text-sm">Total Prompts</div>
          <div className="text-3xl font-bold text-white mt-1">
            {loading ? '...' : stats.totalPrompts}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="text-gray-400 text-sm">Total Users</div>
          <div className="text-3xl font-bold text-white mt-1">
            {loading ? '...' : stats.totalUsers}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="text-gray-400 text-sm">Pro Users</div>
          <div className="text-3xl font-bold text-amber-400 mt-1">
            {loading ? '...' : stats.proUsers}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="text-gray-400 text-sm">Revenue</div>
          <div className="text-3xl font-bold text-green-400 mt-1">
            ${loading ? '...' : stats.revenue.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminContent = () => {
  const { isCollapsed } = useAdminSidebarContext();

  return (
    <main 
      className={`pt-16 lg:pt-0 min-h-screen transition-all duration-300 ${
        isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-72'
      }`}
    >
      <div className="p-6 lg:p-8">
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="prompts" element={<PromptsManagement />} />
          <Route path="categories" element={<CategoriesManagement />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="purchases" element={<PurchasesManagement />} />
          <Route path="wallets" element={<WalletManagement />} />
          <Route path="payment-settings" element={<PaymentSettingsManagement />} />
          <Route path="ai-accounts" element={<AIAccountsManagement />} />
          <Route path="account-orders" element={<AccountOrdersManagement />} />
          <Route path="refunds" element={<RefundRequestsManagement />} />
          <Route path="cancellations" element={<CancellationRequestsManagement />} />
          <Route path="deletions" element={<DeletionRequestsManagement />} />
          <Route path="chats" element={<ChatManagement />} />
        </Routes>
      </div>
    </main>
  );
};

const AdminLoginForm = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter username and password');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ username: username.trim(), password }),
        }
      );

      const data = await response.json();

      if (data.success && data.token) {
        localStorage.setItem(ADMIN_SESSION_KEY, data.token);
        toast.success('Login successful!');
        onLogin();
      } else {
        toast.error(data.error || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src={promptheroIcon} 
            alt="Admin" 
            className="h-16 w-16 rounded-2xl shadow-lg shadow-purple-500/20" 
          />
        </div>

        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-gray-400 text-sm">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2.5 rounded-xl transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In to Admin'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <Link 
              to="/"
              className="flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem(ADMIN_SESSION_KEY);
      
      if (!token) {
        setCheckingSession(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-validate-session`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ token }),
          }
        );

        const data = await response.json();

        if (data.valid) {
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem(ADMIN_SESSION_KEY);
        }
      } catch (error) {
        console.error('Session validation error:', error);
        localStorage.removeItem(ADMIN_SESSION_KEY);
      } finally {
        setCheckingSession(false);
      }
    };

    validateSession();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsLoggedIn(false);
    toast.success('Logged out successfully');
  };

  // Show loading while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Show login form if not logged in
  if (!isLoggedIn) {
    return <AdminLoginForm onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminSidebar onLogout={handleLogout} />
      <AdminContent />
    </div>
  );
};

export default Admin;