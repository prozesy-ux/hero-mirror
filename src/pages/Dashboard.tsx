import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardSidebar, { useSidebarContext } from '@/components/dashboard/DashboardSidebar';
import DashboardHome from '@/components/dashboard/DashboardHome';
import PromptsGrid from '@/components/dashboard/PromptsGrid';
import ProfileSection from '@/components/dashboard/ProfileSection';
import BillingSection from '@/components/dashboard/BillingSection';
import AIAccountsSection from '@/components/dashboard/AIAccountsSection';
import ChatSection from '@/components/dashboard/ChatSection';
import { useState, useEffect } from 'react';

const DashboardContent = () => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });

  // Listen for storage changes to sync collapse state
  useEffect(() => {
    const handleStorageChange = () => {
      setIsCollapsed(localStorage.getItem('sidebar-collapsed') === 'true');
    };

    // Check periodically for changes (since storage event doesn't fire in same window)
    const interval = setInterval(handleStorageChange, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <main 
      className={`pb-20 lg:pb-0 min-h-screen bg-gradient-to-br from-gray-50 via-gray-100/50 to-white transition-all duration-300 ease-in-out ${
        isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-72'
      }`}
    >
      <div className="relative p-4 lg:p-8">
        <Routes>
          <Route index element={<DashboardHome />} />
          <Route path="prompts" element={<PromptsGrid />} />
          <Route path="favorites" element={<Navigate to="/dashboard/prompts" replace />} />
          <Route path="tools" element={<Navigate to="/dashboard" replace />} />
          <Route path="ai-accounts" element={<AIAccountsSection />} />
          <Route path="billing" element={<BillingSection />} />
          <Route path="profile" element={<ProfileSection />} />
          <Route path="chat" element={<ChatSection />} />
        </Routes>
      </div>
    </main>
  );
};

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar />
      <DashboardContent />
    </div>
  );
};

export default Dashboard;
