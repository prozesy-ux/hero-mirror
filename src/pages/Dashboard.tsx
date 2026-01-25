import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DashboardTopBar from '@/components/dashboard/DashboardTopBar';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import MobileNavigation from '@/components/dashboard/MobileNavigation';
import DashboardHome from '@/components/dashboard/DashboardHome';
import PromptsGrid from '@/components/dashboard/PromptsGrid';
import ProfileSection from '@/components/dashboard/ProfileSection';
import BillingSection from '@/components/dashboard/BillingSection';
import AIAccountsSection from '@/components/dashboard/AIAccountsSection';
import AccountDetailPage from '@/components/dashboard/AccountDetailPage';
import ProductFullViewPage from '@/components/dashboard/ProductFullViewPage';
import ChatSection from '@/components/dashboard/ChatSection';
import BuyerWallet from '@/components/dashboard/BuyerWallet';
import FloatingChatWidget from '@/components/dashboard/FloatingChatWidget';
import { SearchProvider } from '@/contexts/SearchContext';
import { SidebarProvider, useSidebarContext } from '@/contexts/SidebarContext';
import { FloatingChatProvider } from '@/contexts/FloatingChatContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import { Crown, Bell, BellRing, X } from 'lucide-react';

// MobileHeader removed - logo and notification moved to MobileNavigation

const DashboardContent = () => {
  const { isCollapsed } = useSidebarContext();

  return (
    <main className={`pb-24 lg:pb-0 pt-14 lg:pt-16 min-h-screen bg-gradient-to-br from-gray-50 via-gray-100/50 to-white transition-all duration-300 ${
      isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-60'
    }`}>
      <div className="relative p-3 sm:p-4 lg:p-8">
        <Routes>
          <Route index element={<Navigate to="/dashboard/prompts" replace />} />
          <Route path="prompts" element={<PromptsGrid />} />
          <Route path="favorites" element={<Navigate to="/dashboard/prompts" replace />} />
          <Route path="tools" element={<Navigate to="/dashboard/prompts" replace />} />
          <Route path="ai-accounts" element={<AIAccountsSection />} />
          <Route path="ai-accounts/:accountId" element={<AccountDetailPage />} />
          <Route path="ai-accounts/product/:productId" element={<ProductFullViewPage />} />
          <Route path="billing" element={<BillingSection />} />
          <Route path="wallet" element={<BuyerWallet />} />
          <Route path="profile" element={<ProfileSection />} />
          <Route path="chat" element={<ChatSection />} />
        </Routes>
      </div>
      
      {/* Floating Chat Widget */}
      <FloatingChatWidget />
    </main>
  );
};

const DashboardLayout = () => {
  const { isCollapsed } = useSidebarContext();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header removed - elements moved to bottom nav */}
      
      {/* Desktop Sidebar */}
      <DashboardSidebar />
      
      {/* Desktop Top Bar */}
      <DashboardTopBar sidebarCollapsed={isCollapsed} />
      
      {/* Mobile Bottom Navigation */}
      <MobileNavigation />
      
      {/* Main Content */}
      <DashboardContent />
    </div>
  );
};

const Dashboard = () => {
  return (
    <SidebarProvider>
      <SearchProvider>
        <FloatingChatProvider>
          <DashboardLayout />
        </FloatingChatProvider>
      </SearchProvider>
    </SidebarProvider>
  );
};

export default Dashboard;
