import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import AdminSidebar, { useAdminSidebarContext } from '@/components/admin/AdminSidebar';
import PromptsManagement from '@/components/admin/PromptsManagement';
import CategoriesManagement from '@/components/admin/CategoriesManagement';
import UsersManagement from '@/components/admin/UsersManagement';
import PurchasesManagement from '@/components/admin/PurchasesManagement';
import AIAccountsManagement from '@/components/admin/AIAccountsManagement';
import AccountOrdersManagement from '@/components/admin/AccountOrdersManagement';
import RefundRequestsManagement from '@/components/admin/RefundRequestsManagement';
import CancellationRequestsManagement from '@/components/admin/CancellationRequestsManagement';
import ChatManagement from '@/components/admin/ChatManagement';
import WalletManagement from '@/components/admin/WalletManagement';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
      <h1 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h1>
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
          <Route path="ai-accounts" element={<AIAccountsManagement />} />
          <Route path="account-orders" element={<AccountOrdersManagement />} />
          <Route path="refunds" element={<RefundRequestsManagement />} />
          <Route path="cancellations" element={<CancellationRequestsManagement />} />
          <Route path="chats" element={<ChatManagement />} />
        </Routes>
      </div>
    </main>
  );
};

const Admin = () => {
  const { isAdminAuthenticated } = useAdmin();

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AdminSidebar />
      <AdminContent />
    </div>
  );
};

export default Admin;
