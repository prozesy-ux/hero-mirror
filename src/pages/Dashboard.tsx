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

// Mobile Header Component with Profile Avatar
const MobileHeader = () => {
  const { profile } = useAuthContext();
  const { permission, isSubscribed, isLoading: pushLoading, subscribe, isSupported } = usePushNotifications();
  const [pushBannerDismissed, setPushBannerDismissed] = useState(true);

  // Check if push banner was dismissed for mobile
  useEffect(() => {
    const dismissed = localStorage.getItem('push_banner_dismissed_mobile');
    if (!dismissed) {
      setPushBannerDismissed(false);
    } else {
      const dismissedTime = parseInt(dismissed);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      setPushBannerDismissed(Date.now() - dismissedTime < sevenDays);
    }
  }, []);

  const dismissPushBanner = () => {
    localStorage.setItem('push_banner_dismissed_mobile', Date.now().toString());
    setPushBannerDismissed(true);
  };

  const handleEnablePush = async () => {
    await subscribe();
    setPushBannerDismissed(true);
  };

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          {/* App Logo/Title placeholder for balance */}
          <div className="w-9" />
          
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button className="relative p-2 rounded-xl text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-all duration-200">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            {/* Profile Avatar */}
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
        </div>
      </header>

      {/* Mobile Push Notification Banner */}
      {isSupported && permission === 'default' && !pushBannerDismissed && !isSubscribed && (
        <div className="fixed bottom-20 left-4 right-4 z-50 lg:hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl shadow-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Enable Push Notifications</p>
                <p className="text-xs text-white/80 truncate">Never miss orders & messages</p>
              </div>
              <Button
                size="sm"
                onClick={handleEnablePush}
                disabled={pushLoading}
                className="bg-white text-violet-700 hover:bg-white/90 font-semibold shrink-0"
              >
                {pushLoading ? '...' : 'Enable'}
              </Button>
              <button
                onClick={dismissPushBanner}
                className="text-white/60 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const DashboardContent = () => {
  const { isCollapsed } = useSidebarContext();

  return (
    <main className={`pb-24 lg:pb-0 pt-16 lg:pt-16 min-h-screen bg-gradient-to-br from-gray-50 via-gray-100/50 to-white transition-all duration-300 ${
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
      {/* Mobile Header */}
      <MobileHeader />
      
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
