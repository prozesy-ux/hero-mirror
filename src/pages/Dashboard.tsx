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
import BuyerOrders from '@/components/dashboard/BuyerOrders';
import BuyerWishlist from '@/components/dashboard/BuyerWishlist';
import BuyerAnalytics from '@/components/dashboard/BuyerAnalytics';
import BuyerNotifications from '@/components/dashboard/BuyerNotifications';
import BuyerDashboardHome from '@/components/dashboard/BuyerDashboardHome';
import BuyerReports from '@/components/dashboard/BuyerReports';
import FloatingChatWidget from '@/components/dashboard/FloatingChatWidget';
import SessionExpiredBanner from '@/components/ui/session-expired-banner';
import SessionWarningBanner from '@/components/ui/session-warning-banner';
import { SearchProvider } from '@/contexts/SearchContext';
import { SidebarProvider, useSidebarContext } from '@/contexts/SidebarContext';
import { FloatingChatProvider } from '@/contexts/FloatingChatContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useSessionHeartbeat } from '@/hooks/useSessionHeartbeat';
import { Button } from '@/components/ui/button';
import { Crown, Bell, BellRing, X } from 'lucide-react';

// MobileHeader removed - logo and notification moved to MobileNavigation

const DashboardContent = () => {
  const { isCollapsed } = useSidebarContext();

  return (
    <main className={`pb-24 lg:pb-0 pt-0 lg:pt-0 min-h-screen bg-gradient-to-br from-gray-50 via-gray-100/50 to-white transition-all duration-300 ${
      isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[240px]'
    }`}>
      <div className="relative p-3 sm:p-4 lg:p-8">
        <Routes>
          <Route index element={<Navigate to="/dashboard/home" replace />} />
          <Route path="home" element={<BuyerDashboardHome />} />
          <Route path="prompts" element={<PromptsGrid />} />
          <Route path="favorites" element={<Navigate to="/dashboard/prompts" replace />} />
          <Route path="tools" element={<Navigate to="/dashboard/prompts" replace />} />
          <Route path="ai-accounts" element={<AIAccountsSection />} />
          <Route path="ai-accounts/:accountId" element={<AccountDetailPage />} />
          <Route path="ai-accounts/product/:productId" element={<ProductFullViewPage />} />
          <Route path="billing" element={<BillingSection />} />
          <Route path="wallet" element={<BuyerWallet />} />
          <Route path="orders" element={<BuyerOrders />} />
          <Route path="wishlist" element={<BuyerWishlist />} />
          <Route path="analytics" element={<BuyerAnalytics />} />
          <Route path="reports" element={<BuyerReports />} />
          <Route path="notifications" element={<BuyerNotifications />} />
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
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
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
  const { sessionExpired, sessionWarning } = useAuthContext();
  
  // Start background session monitoring
  const { refreshSession } = useSessionHeartbeat();
  
  return (
    <CurrencyProvider>
      <SidebarProvider>
        <SearchProvider>
          <FloatingChatProvider>
            <DashboardLayout />
            {/* Session warning banner (5 min before expiry) */}
            {sessionWarning !== null && !sessionExpired && (
              <SessionWarningBanner 
                minutesRemaining={sessionWarning}
                onRefresh={refreshSession}
              />
            )}
            {/* Session expired banner floats above all content */}
            {sessionExpired && <SessionExpiredBanner />}
          </FloatingChatProvider>
        </SearchProvider>
      </SidebarProvider>
    </CurrencyProvider>
  );
};

export default Dashboard;
