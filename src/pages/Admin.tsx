import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
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
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

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
        <div className="bg-[#0a0a0b] border border-[#151516] rounded-none p-6 hover:bg-[#0e0e10] transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/5 rounded-sm">
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
        <div className="bg-[#0a0a0b] border border-[#151516] rounded-none p-6 hover:bg-[#0e0e10] transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/5 rounded-sm">
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
        <div className="bg-[#0a0a0b] border border-[#151516] rounded-none p-6 hover:bg-[#0e0e10] transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/5 rounded-sm">
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
        <div className="bg-[#0a0a0b] border border-[#151516] rounded-none p-6 hover:bg-[#0e0e10] transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/5 rounded-sm">
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

const Admin = () => {
  const { isAuthenticated, isAdmin, loading } = useAuthContext();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Add timeout fallback - if loading takes too long, redirect
  useEffect(() => {
    const timer = setTimeout(() => setLoadingTimeout(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Show loading while checking auth (with timeout fallback)
  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // If still loading after timeout, send to admin login
  if (loading && loadingTimeout) {
    return <Navigate to="/admin/login" replace />;
  }

  // Redirect to admin login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Redirect to dashboard if not admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden relative">
      {/* Clean solid background - no patterns */}
      <div className="fixed inset-0 bg-[#0a0a0a] -z-10" />
      <AdminSidebar />
      <AdminContent />
    </div>
  );
};

export default Admin;
