import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import CategoriesManagement from '@/components/admin/CategoriesManagement';
import PromptsManagement from '@/components/admin/PromptsManagement';
import UsersManagement from '@/components/admin/UsersManagement';
import PurchasesManagement from '@/components/admin/PurchasesManagement';
import { supabase } from '@/integrations/supabase/client';
import { Users, FileText, FolderOpen, DollarSign, TrendingUp } from 'lucide-react';

const AdminDashboardHome = () => {
  const [stats, setStats] = useState({
    users: 0,
    prompts: 0,
    categories: 0,
    revenue: 0,
    proUsers: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [
      { data: profiles },
      { data: prompts },
      { data: categories },
      { data: purchases }
    ] = await Promise.all([
      supabase.from('profiles').select('id, is_pro'),
      supabase.from('prompts').select('id'),
      supabase.from('categories').select('id'),
      supabase.from('purchases').select('amount, payment_status')
    ]);

    const revenue = (purchases || [])
      .filter(p => p.payment_status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const proUsers = (profiles || []).filter(p => p.is_pro).length;

    setStats({
      users: profiles?.length || 0,
      prompts: prompts?.length || 0,
      categories: categories?.length || 0,
      revenue,
      proUsers
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/20 rounded-xl">
              <Users size={24} className="text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white">{stats.users}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600/20 rounded-xl">
              <FileText size={24} className="text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Prompts</p>
              <p className="text-2xl font-bold text-white">{stats.prompts}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-600/20 rounded-xl">
              <DollarSign size={24} className="text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-white">${stats.revenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-600/20 rounded-xl">
              <TrendingUp size={24} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pro Users</p>
              <p className="text-2xl font-bold text-white">{stats.proUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a href="/admin/prompts" className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white">
              <FileText size={18} /> Add New Prompt
            </a>
            <a href="/admin/categories" className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white">
              <FolderOpen size={18} /> Manage Categories
            </a>
            <a href="/admin/users" className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white">
              <Users size={18} /> View All Users
            </a>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Categories</span>
              <span className="text-white font-medium">{stats.categories}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Free Prompts</span>
              <span className="text-white font-medium">4</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Premium Prompts</span>
              <span className="text-white font-medium">{stats.prompts - 4}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Admin = () => {
  const { isAdminAuthenticated, isLoading } = useAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <AdminSidebar />
      
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          <Routes>
            <Route index element={<AdminDashboardHome />} />
            <Route path="prompts" element={<PromptsManagement />} />
            <Route path="categories" element={<CategoriesManagement />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="purchases" element={<PurchasesManagement />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Admin;