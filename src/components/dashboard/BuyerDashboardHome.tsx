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
import { format, subDays, startOfMonth, subMonths, eachDayOfInterval, startOfDay, isWithinInterval } from 'date-fns';

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
    
    if (result.isReconnecting) {
      setIsReconnecting(true);
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { data: cachedData } = JSON.parse(cached);
          setData(cachedData);
          setUsingCachedData(true);
        } catch (e) { /* ignore */ }
      }
      setLoading(false);
      setTimeout(() => fetchData(), 5000);
      return;
    }
    
    if (result.isUnauthorized) {
      if (!isSessionValid()) {
        setSessionExpiredLocal(true);
        setSessionExpired?.(true);
      } else {
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
  const orders = data?.sellerOrders || [];

  // Compute real daily spending from orders
  const dailyRevenue = useMemo(() => {
    const now = new Date();
    const from = subDays(now, 30);
    return eachDayOfInterval({ start: from, end: now }).map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return isWithinInterval(orderDate, { start: dayStart, end: dayEnd });
      });
      return {
        date: format(day, 'dd MMM'),
        revenue: dayOrders.reduce((sum, o) => sum + o.amount, 0),
      };
    });
  }, [orders]);

  // Monthly target calculations
  const monthlyMetrics = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = subDays(thisMonthStart, 1);

    const thisMonthOrders = orders.filter(o => new Date(o.created_at) >= thisMonthStart);
    const lastMonthOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });
    const thisMonthSpent = thisMonthOrders.reduce((sum, o) => sum + o.amount, 0);
    const lastMonthSpent = lastMonthOrders.reduce((sum, o) => sum + o.amount, 0);
    const monthlyTarget = Math.max(lastMonthSpent * 1.2, thisMonthSpent > 0 ? thisMonthSpent * 1.5 : 100);
    const monthlyChange = lastMonthSpent > 0 
      ? ((thisMonthSpent - lastMonthSpent) / lastMonthSpent) * 100 
      : (thisMonthSpent > 0 ? 100 : 0);

    return { thisMonthSpent, monthlyTarget, monthlyChange };
  }, [orders]);

  // Top products from orders
  const topCategories = useMemo(() => {
    const productSpending: Record<string, number> = {};
    orders.forEach(order => {
      const name = order.product?.name || 'Other';
      productSpending[name] = (productSpending[name] || 0) + order.amount;
    });
    const sorted = Object.entries(productSpending).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const colors = ['#ff7f00', '#fdba74', '#fed7aa', '#e5e7eb'];
    return sorted.map(([name, amount], i) => ({
      name,
      amount: formatAmountOnly(amount),
      color: colors[i] || '#e5e7eb',
    }));
  }, [orders, formatAmountOnly]);

  // Conversion funnel from real order data
  const conversionFunnel = useMemo(() => {
    const totalOrders = stats.total;
    const completed = stats.completed + stats.delivered;
    const pending = stats.pending;
    const cancelled = stats.cancelled;
    const wishlist = data?.wishlistCount || 0;

    return [
      { label: 'Wishlist', labelLine2: 'Items', value: wishlist.toLocaleString(), badge: `${wishlist}`, barHeight: '100%', barColor: '#ffe4c2' },
      { label: 'Total', labelLine2: 'Orders', value: totalOrders.toLocaleString(), badge: `${totalOrders}`, barHeight: `${Math.max((totalOrders / Math.max(wishlist, totalOrders, 1)) * 100, 15)}%`, barColor: '#ffd4a2' },
      { label: 'Pending', labelLine2: 'Orders', value: pending.toLocaleString(), badge: pending.toString(), barHeight: `${Math.max((pending / Math.max(totalOrders, 1)) * 100, 10)}%`, barColor: '#ffc482' },
      { label: 'Completed', labelLine2: 'Orders', value: completed.toLocaleString(), badge: `+${completed}`, barHeight: `${Math.max((completed / Math.max(totalOrders, 1)) * 100, 10)}%`, barColor: '#ffb362' },
      { label: 'Cancelled', labelLine2: '/ Refunded', value: cancelled.toLocaleString(), badge: `-${cancelled}`, isNegative: cancelled > 0, barHeight: `${Math.max((cancelled / Math.max(totalOrders, 1)) * 100, 5)}%`, barColor: '#ff9f42' },
    ];
  }, [stats, data?.wishlistCount]);

  const dashboardData: DashboardStatData = useMemo(() => ({
    totalSales: stats.totalSpent,
    totalSalesChange: 0,
    totalOrders: stats.total,
    totalOrdersChange: 0,
    totalVisitors: data?.wishlistCount || 0,
    totalVisitorsChange: 0,
    topCategories: topCategories.length > 0 ? topCategories : [
      { name: 'No purchases yet', amount: formatAmountOnly(0), color: '#e5e7eb' },
    ],
    totalCategorySales: formatAmountOnly(stats.totalSpent),
    activeUsers: stats.total,
    activeUsersByCountry: [
      { country: 'Completed', percent: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0, barColor: '#10b981' },
      { country: 'Delivered', percent: stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100) : 0, barColor: '#3b82f6' },
      { country: 'Pending', percent: stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0, barColor: '#f59e0b' },
      { country: 'Cancelled', percent: stats.total > 0 ? Math.round((stats.cancelled / stats.total) * 100) : 0, barColor: '#ef4444' },
    ],
    conversionFunnel,
    trafficSources: [
      { name: 'Wallet Balance', percent: wallet.balance > 0 ? 50 : 0, color: '#ffedd5' },
      { name: 'Total Spent', percent: stats.totalSpent > 0 ? 30 : 0, color: '#fed7aa' },
      { name: 'Wishlist', percent: (data?.wishlistCount || 0) > 0 ? 20 : 0, color: '#fdba74' },
    ],
    formatAmount: formatAmountOnly,
    dailyRevenue,
    monthlyTarget: monthlyMetrics.monthlyTarget,
    monthlyRevenue: monthlyMetrics.thisMonthSpent,
    monthlyTargetChange: monthlyMetrics.monthlyChange,
  }), [wallet.balance, stats, formatAmountOnly, topCategories, conversionFunnel, dailyRevenue, monthlyMetrics, data?.wishlistCount]);

  if (loading) {
    return (
      <div className="space-y-5" style={{ backgroundColor: '#F3EAE0', padding: '32px' }}>
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
    <div className="space-y-5" style={{ backgroundColor: '#F3EAE0', minHeight: '100vh', padding: '32px' }}>
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
