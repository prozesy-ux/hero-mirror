import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { Suspense, lazy, useCallback, useState, useEffect } from 'react';
import DashboardTopBar from '@/components/dashboard/DashboardTopBar';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import MobileNavigation from '@/components/dashboard/MobileNavigation';
import FloatingChatWidget from '@/components/dashboard/FloatingChatWidget';
import { SearchProvider } from '@/contexts/SearchContext';
import { SidebarProvider, useSidebarContext } from '@/contexts/SidebarContext';
import { FloatingChatProvider } from '@/contexts/FloatingChatContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { SectionErrorBoundary } from '@/components/ui/section-error-boundary';
import { useConnectivityRecovery } from '@/hooks/useReliableFetch';
import { useLoadingWatchdog } from '@/hooks/useLoadingWatchdog';
import { recoverBackend } from '@/lib/backend-recovery';
import { Crown, Bell, Loader2, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

// Lazy load dashboard sections for better performance
const DashboardHome = lazy(() => import('@/components/dashboard/DashboardHome'));
const PromptsGrid = lazy(() => import('@/components/dashboard/PromptsGrid'));
const ProfileSection = lazy(() => import('@/components/dashboard/ProfileSection'));
const BillingSection = lazy(() => import('@/components/dashboard/BillingSection'));
const AIAccountsSection = lazy(() => import('@/components/dashboard/AIAccountsSection'));
const AccountDetailPage = lazy(() => import('@/components/dashboard/AccountDetailPage'));
const ProductFullViewPage = lazy(() => import('@/components/dashboard/ProductFullViewPage'));
const ChatSection = lazy(() => import('@/components/dashboard/ChatSection'));
const BuyerWallet = lazy(() => import('@/components/dashboard/BuyerWallet'));

// Loading fallback component
const SectionLoader = () => (
  <div className="flex items-center justify-center min-h-[300px]">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
  </div>
);

// Mobile Header Component with Profile Avatar
const MobileHeader = () => {
  const { profile } = useAuthContext();

  return (
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
  );
};

const DashboardContent = () => {
  const { isCollapsed } = useSidebarContext();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Track initial load completion
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);
  
  // Connectivity recovery - use recoverBackend instead of hard reload
  const handleReconnect = useCallback(async () => {
    toast.success('Back online! Reconnecting...');
    const result = await recoverBackend('reconnect');
    if (result.success) {
      toast.success('Connection restored!');
    }
  }, []);
  
  const isOnline = useConnectivityRecovery(handleReconnect);
  
  // Loading watchdog - triggers recovery if initial load takes too long
  useLoadingWatchdog(isInitialLoad, {
    timeout: 15000,
    reason: 'loading_timeout',
    onRecoveryComplete: () => {
      setIsInitialLoad(false);
    }
  });

  return (
    <main className={`pb-24 lg:pb-0 pt-16 lg:pt-16 min-h-screen bg-gradient-to-br from-gray-50 via-gray-100/50 to-white transition-all duration-300 ${
      isCollapsed ? 'lg:ml-[72px]' : 'lg:ml-60'
    }`}>
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-16 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-center text-sm flex items-center justify-center gap-2">
          <WifiOff size={16} />
          You're offline. Some features may not work.
        </div>
      )}
      
      <div className="relative p-3 sm:p-4 lg:p-8">
        <Suspense fallback={<SectionLoader />}>
          <Routes>
            <Route index element={<Navigate to="/dashboard/prompts" replace />} />
            <Route path="prompts" element={
              <SectionErrorBoundary onRetry={() => window.location.reload()}>
                <PromptsGrid />
              </SectionErrorBoundary>
            } />
            <Route path="favorites" element={<Navigate to="/dashboard/prompts" replace />} />
            <Route path="tools" element={<Navigate to="/dashboard/prompts" replace />} />
            <Route path="ai-accounts" element={
              <SectionErrorBoundary onRetry={() => window.location.reload()}>
                <AIAccountsSection />
              </SectionErrorBoundary>
            } />
            <Route path="ai-accounts/:accountId" element={
              <SectionErrorBoundary onRetry={() => window.location.reload()}>
                <AccountDetailPage />
              </SectionErrorBoundary>
            } />
            <Route path="ai-accounts/product/:productId" element={
              <SectionErrorBoundary onRetry={() => window.location.reload()}>
                <ProductFullViewPage />
              </SectionErrorBoundary>
            } />
            <Route path="billing" element={
              <SectionErrorBoundary onRetry={() => window.location.reload()}>
                <BillingSection />
              </SectionErrorBoundary>
            } />
            <Route path="wallet" element={
              <SectionErrorBoundary onRetry={() => window.location.reload()}>
                <BuyerWallet />
              </SectionErrorBoundary>
            } />
            <Route path="profile" element={
              <SectionErrorBoundary onRetry={() => window.location.reload()}>
                <ProfileSection />
              </SectionErrorBoundary>
            } />
            <Route path="chat" element={
              <SectionErrorBoundary onRetry={() => window.location.reload()}>
                <ChatSection />
              </SectionErrorBoundary>
            } />
          </Routes>
        </Suspense>
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
