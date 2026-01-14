import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdmin } from '@/contexts/AdminContext';
import AdminSidebar from '@/components/admin/AdminSidebar';
import PromptsManagement from '@/components/admin/PromptsManagement';
import CategoriesManagement from '@/components/admin/CategoriesManagement';
import UsersManagement from '@/components/admin/UsersManagement';
import PurchasesManagement from '@/components/admin/PurchasesManagement';
import AIAccountsManagement from '@/components/admin/AIAccountsManagement';
import AccountOrdersManagement from '@/components/admin/AccountOrdersManagement';
import RefundRequestsManagement from '@/components/admin/RefundRequestsManagement';
import CancellationRequestsManagement from '@/components/admin/CancellationRequestsManagement';

const AdminDashboard = () => (
  <div>
    <h1 className="text-3xl font-bold text-white mb-6">Admin Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="text-gray-400 text-sm">Total Prompts</div>
        <div className="text-3xl font-bold text-white mt-1">--</div>
      </div>
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="text-gray-400 text-sm">Total Users</div>
        <div className="text-3xl font-bold text-white mt-1">--</div>
      </div>
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="text-gray-400 text-sm">Pro Users</div>
        <div className="text-3xl font-bold text-purple-400 mt-1">--</div>
      </div>
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="text-gray-400 text-sm">Revenue</div>
        <div className="text-3xl font-bold text-green-400 mt-1">$--</div>
      </div>
    </div>
  </div>
);

const Admin = () => {
  const { isAdminAuthenticated } = useAdmin();

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <AdminSidebar />
      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="prompts" element={<PromptsManagement />} />
            <Route path="categories" element={<CategoriesManagement />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="purchases" element={<PurchasesManagement />} />
            <Route path="ai-accounts" element={<AIAccountsManagement />} />
            <Route path="account-orders" element={<AccountOrdersManagement />} />
            <Route path="refunds" element={<RefundRequestsManagement />} />
            <Route path="cancellations" element={<CancellationRequestsManagement />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default Admin;