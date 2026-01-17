import { Routes, Route, Navigate, Link } from 'react-router-dom';
import DashboardSidebar, { useSidebarContext } from '@/components/dashboard/DashboardSidebar';
import DashboardTopHeader from '@/components/dashboard/DashboardTopHeader';
import DashboardHome from '@/components/dashboard/DashboardHome';
import PromptsGrid from '@/components/dashboard/PromptsGrid';
import ProfileSection from '@/components/dashboard/ProfileSection';
import BillingSection from '@/components/dashboard/BillingSection';
import AIAccountsSection from '@/components/dashboard/AIAccountsSection';
import ChatSection from '@/components/dashboard/ChatSection';
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Crown } from 'lucide-react';

// Mobile Header Component with Profile Avatar
const MobileHeader = () => {
  const { profile } = useAuthContext();

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm safe-area-top">
      <div className="flex items-center justify-end px-4 py-3">
        <Link
          to="/dashboard/profile"
          className="relative"
        >
          <div className="rounded-full bg-gradient-to-br from-violet-500 to-purple-600 p-0.5 w-9 h-9 transition-all duration-300 hover:scale-105 active:scale-95">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Avatar" 
                className="w-full h-full rounded-full object-cover bg-white"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-violet-500 flex items-center justify-center text-white font-bold text-sm">
                {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          {/* PRO Crown badge */}
          {profile?.is_pro && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center ring-1.5 ring-white shadow-md">
              <Crown size={8} className="text-black" />
            </div>
          )}
        </Link>
      </div>
    </header>
  );
};

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
      className={`pb-24 lg:pb-0 pt-16 lg:pt-16 min-h-screen bg-gradient-to-br from-gray-50 via-gray-100/50 to-white transition-all duration-300 ease-in-out ${
        isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-72'
      }`}
    >
      <div className="relative p-3 sm:p-4 lg:p-8">
        <Routes>
          <Route index element={<Navigate to="/dashboard/prompts" replace />} />
          <Route path="prompts" element={<PromptsGrid />} />
          <Route path="favorites" element={<Navigate to="/dashboard/prompts" replace />} />
          <Route path="tools" element={<Navigate to="/dashboard/prompts" replace />} />
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
      <MobileHeader />
      <DashboardTopHeader />
      <DashboardSidebar />
      <DashboardContent />
    </div>
  );
};

export default Dashboard;
