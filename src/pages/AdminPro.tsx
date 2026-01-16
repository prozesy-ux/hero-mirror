import { Routes, Route, useLocation } from 'react-router-dom';
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
import SecurityLogsManagement from '@/components/admin/SecurityLogsManagement';
import PaymentSettingsManagement from '@/components/admin/PaymentSettingsManagement';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, User, LogOut, AlertCircle } from 'lucide-react';
import { createAdminSession, deleteAdminSession, useAdminApi } from '@/hooks/useAdminApi';

const ADMIN_USERNAME = 'ProZesy';
const ADMIN_PASSWORD = 'ProMeida@18177';
const ADMIN_SESSION_KEY = 'adminpro_logged_in';
const ADMIN_SESSION_TOKEN_KEY = 'adminpro_session_token';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalPrompts: 0,
    totalUsers: 0,
    proUsers: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);
  const { fetchData, countData } = useAdminApi();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          promptsCount,
          profilesResult,
          purchasesResult
        ] = await Promise.all([
          countData('prompts'),
          fetchData<{ is_pro: boolean }>('profiles', { select: 'is_pro' }),
          fetchData<{ amount: number; payment_status: string }>('purchases', { 
            select: 'amount, payment_status' 
          })
        ]);

        const profiles = profilesResult.data || [];
        const purchases = purchasesResult.data || [];

        const totalUsers = profiles.length;
        const proUsers = profiles.filter(p => p.is_pro).length;
        const revenue = purchases
          .filter(p => p.payment_status === 'completed')
          .reduce((sum, p) => sum + Number(p.amount), 0);

        setStats({
          totalPrompts: promptsCount,
          totalUsers,
          proUsers,
          revenue
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [fetchData, countData]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6 hover:border-[#3f3f46] transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <span className="text-purple-400 text-xl">📝</span>
            </div>
            <div>
              <div className="text-zinc-400 text-sm font-medium">Total Prompts</div>
              <div className="text-2xl font-bold text-white mt-0.5">
                {loading ? '...' : stats.totalPrompts}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6 hover:border-[#3f3f46] transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <span className="text-blue-400 text-xl">👥</span>
            </div>
            <div>
              <div className="text-zinc-400 text-sm font-medium">Total Users</div>
              <div className="text-2xl font-bold text-white mt-0.5">
                {loading ? '...' : stats.totalUsers}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6 hover:border-[#3f3f46] transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <span className="text-amber-400 text-xl">👑</span>
            </div>
            <div>
              <div className="text-zinc-400 text-sm font-medium">Pro Users</div>
              <div className="text-2xl font-bold text-amber-400 mt-0.5">
                {loading ? '...' : stats.proUsers}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-6 hover:border-[#3f3f46] transition-colors">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <span className="text-green-400 text-xl">💰</span>
            </div>
            <div>
              <div className="text-zinc-400 text-sm font-medium">Revenue</div>
              <div className="text-2xl font-bold text-green-400 mt-0.5">
                ${loading ? '...' : stats.revenue.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminContent = ({ onLogout }: { onLogout: () => void }) => {
  const { isCollapsed } = useAdminSidebarContext();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/adminpro' || path === '/adminpro/') return 'Dashboard';
    if (path.includes('/prompts')) return 'Prompts Management';
    if (path.includes('/categories')) return 'Categories & Tools';
    if (path.includes('/users')) return 'Users Management';
    if (path.includes('/purchases')) return 'Purchases';
    if (path.includes('/wallets')) return 'Wallet Management';
    if (path.includes('/payments')) return 'Payment Settings';
    if (path.includes('/ai-accounts')) return 'AI Accounts';
    if (path.includes('/account-orders')) return 'Account Orders';
    if (path.includes('/refunds')) return 'Refund Requests';
    if (path.includes('/cancellations')) return 'Cancellation Requests';
    if (path.includes('/deletions')) return 'Deletion Requests';
    if (path.includes('/chats')) return 'Support Chats';
    if (path.includes('/security')) return 'Security Logs';
    return 'Admin Panel';
  };

  return (
    <main 
      className={`pt-16 lg:pt-0 min-h-screen transition-all duration-300 ${
        isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-72'
      }`}
    >
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-white">{getPageTitle()}</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="text-red-400 border-red-400/30 hover:bg-red-400/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
        
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="prompts" element={<PromptsManagement />} />
          <Route path="categories" element={<CategoriesManagement />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="purchases" element={<PurchasesManagement />} />
          <Route path="wallets" element={<WalletManagement />} />
          <Route path="payments" element={<PaymentSettingsManagement />} />
          <Route path="ai-accounts" element={<AIAccountsManagement />} />
          <Route path="account-orders" element={<AccountOrdersManagement />} />
          <Route path="refunds" element={<RefundRequestsManagement />} />
          <Route path="cancellations" element={<CancellationRequestsManagement />} />
          <Route path="deletions" element={<DeletionRequestsManagement />} />
          <Route path="chats" element={<ChatManagement />} />
          <Route path="security" element={<SecurityLogsManagement />} />
        </Routes>
      </div>
    </main>
  );
};

const AdminLoginForm = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simple credential check
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Generate a secure session token
      const sessionToken = crypto.randomUUID();
      
      // Create session in database
      const success = await createAdminSession(sessionToken);
      
      if (success) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        sessionStorage.setItem(ADMIN_SESSION_TOKEN_KEY, sessionToken);
        onLogin();
      } else {
        setError('Failed to create session. Please try again.');
      }
    } else {
      setError('Invalid username or password');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-[#111113] border border-[#27272a] rounded-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
              <Lock className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-zinc-400 mt-2">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-zinc-300">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 bg-[#0a0a0a] border-[#27272a] text-white placeholder:text-zinc-500 focus:border-purple-500"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-[#0a0a0a] border-[#27272a] text-white placeholder:text-zinc-500 focus:border-purple-500"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

const AdminPro = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if already logged in
    const adminSession = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (adminSession === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    const token = sessionStorage.getItem(ADMIN_SESSION_TOKEN_KEY);
    if (token) {
      await deleteAdminSession(token);
    }
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_TOKEN_KEY);
    setIsLoggedIn(false);
  };

  // Show login form if not logged in
  if (!isLoggedIn) {
    return <AdminLoginForm onLogin={handleLogin} />;
  }

  // Show admin panel if logged in
  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative">
      <div className="fixed inset-0 bg-[#0a0a0a] -z-10" />
      <AdminSidebar />
      <AdminContent onLogout={handleLogout} />
    </div>
  );
};

export default AdminPro;
