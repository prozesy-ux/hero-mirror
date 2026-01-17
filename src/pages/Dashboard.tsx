import { Routes, Route, Navigate, Link } from 'react-router-dom';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardTabBar from '@/components/dashboard/DashboardTabBar';
import MobileBottomNav from '@/components/dashboard/MobileBottomNav';
import PromptsGrid from '@/components/dashboard/PromptsGrid';
import ProfileSection from '@/components/dashboard/ProfileSection';
import BillingSection from '@/components/dashboard/BillingSection';
import AIAccountsSection from '@/components/dashboard/AIAccountsSection';
import ChatSection from '@/components/dashboard/ChatSection';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100/50 to-white">
      {/* Top Header - All screens */}
      <DashboardHeader />
      
      {/* Left Tab Bar - Desktop only */}
      <DashboardTabBar />
      
      {/* Bottom Nav - Mobile only */}
      <MobileBottomNav />
      
      {/* Main Content Area */}
      <main className="pt-16 pb-24 lg:pb-0 lg:pl-16 min-h-screen">
        <div className="p-3 sm:p-4 lg:p-8">
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
    </div>
  );
};

export default Dashboard;
