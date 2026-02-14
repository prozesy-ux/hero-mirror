import { Routes, Route, Navigate, Link } from 'react-router-dom';
import ErrorBoundary from '@/components/ui/error-boundary';
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
import BuyerLibrary from '@/components/dashboard/BuyerLibrary';
import BuyerReviewsGiven from '@/components/dashboard/BuyerReviewsGiven';
import BuyerRefundRequests from '@/components/dashboard/BuyerRefundRequests';
import BuyerSupportTickets from '@/components/dashboard/BuyerSupportTickets';
import BuyerRecentlyViewed from '@/components/dashboard/BuyerRecentlyViewed';
import BuyerServiceBookings from '@/components/dashboard/BuyerServiceBookings';
import CourseViewer from '@/components/dashboard/CourseViewer';
import DownloadManager from '@/components/dashboard/DownloadManager';
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
    <main className={`pb-24 lg:pb-0 pt-0 lg:pt-16 min-h-screen bg-[#f1f5f9] transition-all duration-300 ${
      isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-52'
    }`}>
      <div className="relative p-3 sm:p-4 lg:p-8">
        <ErrorBoundary>
          <Routes>
            <Route index element={<Navigate to="/dashboard/home" replace />} />
            <Route path="home" element={<BuyerDashboardHome />} />
            <Route path="prompts" element={<PromptsGrid />} />
            <Route path="favorites" element={<Navigate to="/dashboard/prompts" replace />} />
            <Route path="tools" element={<Navigate to="/dashboard/prompts" replace />} />
            <Route path="marketplace" element={<AIAccountsSection />} />
            <Route path="marketplace/:accountId" element={<AccountDetailPage />} />
            <Route path="marketplace/product/:productSlug" element={<ProductFullViewPage />} />
            <Route path="billing" element={<BillingSection />} />
            <Route path="wallet" element={<BuyerWallet />} />
            <Route path="orders" element={<BuyerOrders />} />
            <Route path="wishlist" element={<BuyerWishlist />} />
            <Route path="analytics" element={<BuyerAnalytics />} />
            <Route path="reports" element={<BuyerReports />} />
            <Route path="notifications" element={<BuyerNotifications />} />
            <Route path="library" element={<BuyerLibrary />} />
            <Route path="library/:productId" element={<DownloadManager />} />
            <Route path="course/:productId" element={<CourseViewer />} />
            <Route path="profile" element={<ProfileSection />} />
            <Route path="chat" element={<ChatSection />} />
             <Route path="my-reviews" element={<BuyerReviewsGiven />} />
             <Route path="refunds" element={<BuyerRefundRequests />} />
             <Route path="support" element={<BuyerSupportTickets />} />
             <Route path="recently-viewed" element={<BuyerRecentlyViewed />} />
             <Route path="service-bookings" element={<BuyerServiceBookings />} />
          </Routes>
        </ErrorBoundary>
      </div>
      
      {/* Floating Chat Widget */}
      <FloatingChatWidget />
    </main>
  );
};

const DashboardLayout = () => {
  const { isCollapsed } = useSidebarContext();

  return (
    <div className="min-h-screen bg-[#f1f5f9] overflow-x-hidden dashboard-inter">
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
