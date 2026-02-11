import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { bffApi } from '@/lib/api-fetch';
import { isSessionValid } from '@/lib/session-persistence';
import { AlertCircle, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import SessionExpiredBanner from '@/components/ui/session-expired-banner';
import EzMartDashboardGrid, { type DashboardStatData } from './EzMartDashboardGrid';

interface Order {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  product?: {
    name: string;
    icon_url: string | null;
  };
  seller?: {
    store_name: string;
  };
}

interface DashboardData {
  wallet: { balance: number };
  sellerOrders: Order[];
  wishlistCount: number;
  orderStats: {
    total: number;
    pending: number;
    delivered: number;
    completed: number;
    cancelled: number;
    totalSpent: number;
  };
}

const CACHE_KEY = 'buyer_dashboard_cache';

const BuyerDashboardHome = () => {
  const { user, setSessionExpired } = useAuthContext();
  const { formatAmountOnly } = useCurrency();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpiredLocal, setSessionExpiredLocal] = useState(false);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const navigate = useNavigate();

  // Load cached data on mount for instant UI
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setData(cachedData);
          setLoading(false);
        }
      } catch (e) { /* ignore parse errors */ }
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!loading) setLoading(true);
    setError(null);
    setIsReconnecting(false);
    
    const result = await bffApi.getBuyerDashboard();
    
    // SOFT RECONNECTING STATE: If within 12h grace and just reconnecting
    if (result.isReconnecting) {
      setIsReconnecting(true);
      // Keep existing data visible, show reconnecting notice
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { data: cachedData } = JSON.parse(cached);
          setData(cachedData);
          setUsingCachedData(true);
        } catch (e) { /* ignore */ }
      }
      setLoading(false);
      // Auto-retry in 5 seconds
      setTimeout(() => fetchData(), 5000);
      return;
    }
    
    // UNAUTHORIZED: Check if truly expired or just transient
    if (result.isUnauthorized) {
      // Only show expired banner if truly outside 12h window
      if (!isSessionValid()) {
        setSessionExpiredLocal(true);
        setSessionExpired?.(true);
      } else {
        // Within 12h - treat as reconnecting, not expired
        setIsReconnecting(true);
        setTimeout(() => fetchData(), 5000);
      }
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { data: cachedData } = JSON.parse(cached);
          setData(cachedData);
          setUsingCachedData(true);
        } catch (e) { /* ignore */ }
      }
      setLoading(false);
      return;
    }
    
    if (result.error) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { data: cachedData } = JSON.parse(cached);
          setData(cachedData);
          setUsingCachedData(true);
          setError('Using cached data - refresh when online');
        } catch (e) {
          setError(result.error);
        }
      } else {
        setError(result.error);
      }
      setLoading(false);
      return;
    }
    
    if (result.data) {
      const newData = {
        wallet: result.data.wallet,
        sellerOrders: result.data.sellerOrders,
        wishlistCount: result.data.wishlistCount,
        orderStats: result.data.orderStats
      };
      setData(newData);
      setUsingCachedData(false);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: newData, timestamp: Date.now() }));
    }
    setLoading(false);
  }, [setSessionExpired]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const setupRealtimeSubscriptions = useCallback(() => {
    if (!user) return;
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    
    channelRef.current = supabase
      .channel('buyer-dashboard-home')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'seller_orders',
        filter: `buyer_id=eq.${user.id}`
      }, fetchData)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_wallets',
        filter: `user_id=eq.${user.id}`
      }, fetchData)
      .subscribe();
  }, [user, fetchData]);

  useEffect(() => {
    setupRealtimeSubscriptions();
    return () => { 
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current); 
      }
    };
  }, [setupRealtimeSubscriptions]);

  useEffect(() => {
    const handleSessionRefresh = () => {
      console.log('[BuyerDashboardHome] Session refreshed - resubscribing realtime');
      setupRealtimeSubscriptions();
    };
    
    window.addEventListener('session-refreshed', handleSessionRefresh);
    return () => window.removeEventListener('session-refreshed', handleSessionRefresh);
  }, [setupRealtimeSubscriptions]);

  const stats = data?.orderStats || { total: 0, pending: 0, delivered: 0, completed: 0, totalSpent: 0, cancelled: 0 };
  const wallet = data?.wallet || { balance: 0 };

  const dashboardData: DashboardStatData = useMemo(() => ({
    totalSales: wallet.balance + stats.totalSpent,
    totalSalesChange: 3.34,
    totalOrders: stats.total,
    totalOrdersChange: -2.89,
    totalVisitors: 237782,
    totalVisitorsChange: 8.02,
    topCategories: [
      { name: 'Electronics', amount: '$1,200,000', color: '#ff7f00' },
      { name: 'Fashion', amount: '$950,000', color: '#fdba74' },
      { name: 'Home & Kitchen', amount: '$750,000', color: '#fed7aa' },
      { name: 'Beauty & Care', amount: '$500,000', color: '#e5e7eb' },
    ],
    totalCategorySales: '$3.4M',
    activeUsers: 2758,
    activeUsersByCountry: [
      { country: 'United States', percent: 36, barColor: '#f97316' },
      { country: 'United Kingdom', percent: 24, barColor: '#fdba74' },
      { country: 'Indonesia', percent: 17.5, barColor: '#f97316' },
      { country: 'Russia', percent: 15, barColor: '#fed7aa' },
    ],
    conversionFunnel: [
      { label: 'Product', labelLine2: 'Views', value: '25,000', badge: '+9%', barHeight: '100%', barColor: '#ffe4c2' },
      { label: 'Add to', labelLine2: 'Cart', value: '12,000', badge: '+6%', barHeight: '60%', barColor: '#ffd4a2' },
      { label: 'Proceed to', labelLine2: 'Checkout', value: '8,500', badge: '+4%', barHeight: '40%', barColor: '#ffc482' },
      { label: 'Completed', labelLine2: 'Purchases', value: '6,200', badge: '+7%', barHeight: '30%', barColor: '#ffb362' },
      { label: 'Abandoned', labelLine2: 'Carts', value: '3,000', badge: '-5%', isNegative: true, barHeight: '15%', barColor: '#ff9f42' },
    ],
    trafficSources: [
      { name: 'Direct Traffic', percent: 40, color: '#ffedd5' },
      { name: 'Organic Search', percent: 30, color: '#fed7aa' },
      { name: 'Social Media', percent: 15, color: '#fdba74' },
      { name: 'Referral Traffic', percent: 10, color: '#fb923c' },
      { name: 'Email Campaigns', percent: 5, color: '#f97316' },
    ],
    formatAmount: formatAmountOnly,
  }), [wallet.balance, stats, formatAmountOnly]);

  if (loading) {
    return (
      <div className="space-y-5 p-4 lg:p-6" style={{ backgroundColor: '#f4f5f7' }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-5">
          <Skeleton className="h-72 rounded-2xl col-span-2" />
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-[#1F2937] mb-2">Something went wrong</h3>
        <p className="text-[#6B7280] mb-6">{error}</p>
        <Button onClick={fetchData} className="bg-[#FF7F00] hover:bg-[#FF7F00]/90 text-white">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 lg:p-6" style={{ backgroundColor: '#f4f5f7', minHeight: '100vh' }}>
      {sessionExpiredLocal && !isReconnecting && <SessionExpiredBanner onDismiss={() => setSessionExpiredLocal(false)} />}
      
      {isReconnecting && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Reconnecting to server...</span>
          <Button size="sm" variant="ghost" onClick={fetchData} className="ml-auto">
            Retry Now
          </Button>
        </div>
      )}
      
      {usingCachedData && !isReconnecting && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <WifiOff className="h-4 w-4" />
          <span>Using cached data - some info may be outdated</span>
          <Button size="sm" variant="ghost" onClick={fetchData} className="ml-auto">
            Refresh
          </Button>
        </div>
      )}

      <EzMartDashboardGrid data={dashboardData} />
    </div>
  );
};

export default BuyerDashboardHome;
