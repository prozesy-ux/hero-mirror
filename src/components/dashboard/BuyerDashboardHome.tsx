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
    revenueChartData: [
      { date: 'Mon', revenue: 4200, orders: 2800 },
      { date: 'Tue', revenue: 3800, orders: 2600 },
      { date: 'Wed', revenue: 5100, orders: 3200 },
      { date: 'Thu', revenue: 4600, orders: 3000 },
      { date: 'Fri', revenue: 5800, orders: 3500 },
      { date: 'Sat', revenue: 4900, orders: 3100 },
      { date: 'Sun', revenue: 5500, orders: 3400 },
      { date: 'Today', revenue: 6200, orders: 3800 },
    ],
    monthlyTarget: 100000,
    monthlyProgress: 85,
    targetAmount: 100000,
    revenueAmount: 85000,
    topCategories: [
      { name: 'Electronics', value: 40, color: '#FF7F00' },
      { name: 'Fashion', value: 25, color: '#FDBA74' },
      { name: 'Home & Kitchen', value: 20, color: '#FED7AA' },
      { name: 'Beauty & Care', value: 15, color: '#FFEDD5' },
    ],
    totalCategorySales: '$3.4M',
    activeUsers: 2758,
    activeUsersByCountry: [
      { country: 'United States', flag: '🇺🇸', percent: 36 },
      { country: 'United Kingdom', flag: '🇬🇧', percent: 24 },
      { country: 'Indonesia', flag: '🇮🇩', percent: 17.5 },
      { country: 'Russia', flag: '🇷🇺', percent: 15 },
    ],
    conversionFunnel: [
      { label: 'Product Views', value: '25K', percent: 100 },
      { label: 'Add to Cart', value: '12K', percent: 48 },
      { label: 'Checkout', value: '8.5K', percent: 34 },
      { label: 'Purchases', value: '6.2K', percent: 25 },
      { label: 'Abandoned', value: '3K', percent: 12 },
    ],
    trafficSources: [
      { name: 'Direct', percent: 40, color: '#FF7F00' },
      { name: 'Organic', percent: 30, color: '#FDBA74' },
      { name: 'Social', percent: 15, color: '#FED7AA' },
      { name: 'Referral', percent: 10, color: '#FFEDD5' },
      { name: 'Email', percent: 5, color: '#FFC482' },
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
