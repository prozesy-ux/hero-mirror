import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { bffApi } from '@/lib/api-fetch';
import { isSessionValid } from '@/lib/session-persistence';
import { AlertCircle, WifiOff, Calendar as CalendarIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SessionExpiredBanner from '@/components/ui/session-expired-banner';
import EzMartDashboardGrid, { type DashboardStatData } from './EzMartDashboardGrid';
import { format, subDays, startOfMonth, subMonths, eachDayOfInterval, startOfDay, isWithinInterval } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

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

  // Date filter state
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Sync period to dateRange
  useEffect(() => {
    const now = new Date();
    switch (period) {
      case '7d':
        setDateRange({ from: subDays(now, 7), to: now });
        break;
      case '30d':
        setDateRange({ from: subDays(now, 30), to: now });
        break;
      case '90d':
        setDateRange({ from: subDays(now, 90), to: now });
        break;
    }
  }, [period]);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seller_orders', filter: `buyer_id=eq.${user.id}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_wallets', filter: `user_id=eq.${user.id}` }, fetchData)
      .subscribe();
  }, [user, fetchData]);

  useEffect(() => {
    setupRealtimeSubscriptions();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [setupRealtimeSubscriptions]);

  useEffect(() => {
    const handleSessionRefresh = () => {
      console.log('[BuyerDashboardHome] Session refreshed - resubscribing realtime');
      setupRealtimeSubscriptions();
    };
    window.addEventListener('session-refreshed', handleSessionRefresh);
    return () => window.removeEventListener('session-refreshed', handleSessionRefresh);
  }, [setupRealtimeSubscriptions]);

  const orders = data?.sellerOrders || [];
  const wallet = data?.wallet || { balance: 0 };

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return orders;
    return orders.filter(order => {
      const d = new Date(order.created_at);
      return d >= dateRange.from! && d <= dateRange.to!;
    });
  }, [orders, dateRange]);

  // Compute stats from filtered orders
  const stats = useMemo(() => {
    const total = filteredOrders.length;
    const pending = filteredOrders.filter(o => o.status === 'pending').length;
    const delivered = filteredOrders.filter(o => o.status === 'delivered').length;
    const completed = filteredOrders.filter(o => o.status === 'completed').length;
    const cancelled = filteredOrders.filter(o => o.status === 'cancelled' || o.status === 'refunded').length;
    const totalSpent = filteredOrders.reduce((sum, o) => sum + o.amount, 0);
    return { total, pending, delivered, completed, cancelled, totalSpent };
  }, [filteredOrders]);

  // Weekly change calculations
  const weeklyChanges = useMemo(() => {
    const now = new Date();
    const thisWeekStart = subDays(now, 7);
    const lastWeekStart = subDays(now, 14);
    const thisWeek = orders.filter(o => new Date(o.created_at) >= thisWeekStart);
    const lastWeek = orders.filter(o => { const d = new Date(o.created_at); return d >= lastWeekStart && d < thisWeekStart; });
    const thisSpent = thisWeek.reduce((s, o) => s + o.amount, 0);
    const lastSpent = lastWeek.reduce((s, o) => s + o.amount, 0);
    const salesChange = lastSpent > 0 ? ((thisSpent - lastSpent) / lastSpent) * 100 : (thisSpent > 0 ? 100 : 0);
    const ordersChange = lastWeek.length > 0 ? ((thisWeek.length - lastWeek.length) / lastWeek.length) * 100 : (thisWeek.length > 0 ? 100 : 0);
    return { salesChange, ordersChange };
  }, [orders]);

  // Daily revenue for chart
  const dailyRevenue = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];
    return eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      const dayOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return isWithinInterval(orderDate, { start: dayStart, end: dayEnd });
      });
      return {
        date: format(day, 'dd MMM'),
        revenue: dayOrders.reduce((sum, o) => sum + o.amount, 0),
      };
    });
  }, [filteredOrders, dateRange]);

  // Monthly target calculations
  const monthlyMetrics = useMemo(() => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = subDays(thisMonthStart, 1);
    const thisMonthOrders = orders.filter(o => new Date(o.created_at) >= thisMonthStart);
    const lastMonthOrders = orders.filter(o => { const d = new Date(o.created_at); return d >= lastMonthStart && d <= lastMonthEnd; });
    const thisMonthSpent = thisMonthOrders.reduce((sum, o) => sum + o.amount, 0);
    const lastMonthSpent = lastMonthOrders.reduce((sum, o) => sum + o.amount, 0);
    const monthlyTarget = Math.max(lastMonthSpent * 1.2, thisMonthSpent > 0 ? thisMonthSpent * 1.5 : 100);
    const monthlyChange = lastMonthSpent > 0 ? ((thisMonthSpent - lastMonthSpent) / lastMonthSpent) * 100 : (thisMonthSpent > 0 ? 100 : 0);
    return { thisMonthSpent, monthlyTarget, monthlyChange };
  }, [orders]);

  // Top products from filtered orders
  const topCategories = useMemo(() => {
    const productSpending: Record<string, number> = {};
    filteredOrders.forEach(order => {
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
  }, [filteredOrders, formatAmountOnly]);

  // Conversion funnel from filtered data
  const conversionFunnel = useMemo(() => {
    const wishlist = data?.wishlistCount || 0;
    return [
      { label: 'Wishlist', labelLine2: 'Items', value: wishlist.toLocaleString(), badge: `${wishlist}`, barHeight: '100%', barColor: '#ffe4c2' },
      { label: 'Total', labelLine2: 'Orders', value: stats.total.toLocaleString(), badge: `${stats.total}`, barHeight: `${Math.min(Math.max((stats.total / Math.max(wishlist, stats.total, 1)) * 100, 15), 100)}%`, barColor: '#ffd4a2' },
      { label: 'Pending', labelLine2: 'Orders', value: stats.pending.toLocaleString(), badge: stats.pending.toString(), barHeight: `${Math.min(Math.max((stats.pending / Math.max(stats.total, 1)) * 100, 10), 100)}%`, barColor: '#ffc482' },
      { label: 'Completed', labelLine2: 'Orders', value: (stats.completed + stats.delivered).toLocaleString(), badge: `+${stats.completed + stats.delivered}`, barHeight: `${Math.min(Math.max(((stats.completed + stats.delivered) / Math.max(stats.total, 1)) * 100, 10), 100)}%`, barColor: '#ffb362' },
      { label: 'Cancelled', labelLine2: '/ Refunded', value: stats.cancelled.toLocaleString(), badge: `-${stats.cancelled}`, isNegative: stats.cancelled > 0, barHeight: `${Math.min(Math.max((stats.cancelled / Math.max(stats.total, 1)) * 100, 5), 100)}%`, barColor: '#ff9f42' },
    ];
  }, [stats, data?.wishlistCount]);

  // Export handler
  const handleExport = () => {
    if (filteredOrders.length === 0) {
      toast.error('No data to export');
      return;
    }
    const csvContent = [
      ['Order ID', 'Product', 'Amount', 'Status', 'Date'].join(','),
      ...filteredOrders.map(order => [
        order.id.slice(0, 8),
        `"${order.product?.name || 'Unknown'}"`,
        order.amount.toFixed(2),
        order.status,
        format(new Date(order.created_at), 'yyyy-MM-dd HH:mm')
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${format(dateRange.from || new Date(), 'yyyy-MM-dd')}-to-${format(dateRange.to || new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report exported!');
  };

  // Recent orders for table
  const recentOrders = useMemo(() => {
    return filteredOrders.slice(0, 5).map((order) => ({
      id: order.id,
      orderId: order.id.slice(0, 8).toUpperCase(),
      customerName: order.seller?.store_name || 'Store',
      customerAvatar: undefined,
      productName: order.product?.name || 'Unknown Product',
      productIcon: order.product?.icon_url || undefined,
      qty: 1,
      total: formatAmountOnly(order.amount),
      status: order.status,
    }));
  }, [filteredOrders, formatAmountOnly]);

  // Recent activity feed
  const recentActivity = useMemo(() => {
    const activities: Array<{ id: string; icon: string; message: string; time: string; color?: string }> = [];
    filteredOrders.slice(0, 6).forEach(order => {
      const productName = order.product?.name || 'a product';
      if (order.status === 'completed' || order.status === 'delivered') {
        activities.push({ id: `act-${order.id}`, icon: 'purchase', message: `Your order for "${productName}" was ${order.status}`, time: format(new Date(order.created_at), 'MMM d, h:mm a'), color: '#ecfdf5' });
      } else if (order.status === 'pending') {
        activities.push({ id: `act-${order.id}`, icon: 'order', message: `Order placed for "${productName}"`, time: format(new Date(order.created_at), 'MMM d, h:mm a'), color: '#fff7ed' });
      } else if (order.status === 'cancelled' || order.status === 'refunded') {
        activities.push({ id: `act-${order.id}`, icon: 'stock', message: `Order for "${productName}" was ${order.status}`, time: format(new Date(order.created_at), 'MMM d, h:mm a'), color: '#fef2f2' });
      }
    });
    return activities.slice(0, 5);
  }, [filteredOrders]);

  const dashboardData: DashboardStatData = useMemo(() => ({
    totalSales: stats.totalSpent,
    totalSalesChange: weeklyChanges.salesChange,
    totalOrders: stats.total,
    totalOrdersChange: weeklyChanges.ordersChange,
    totalVisitors: data?.wishlistCount || 0,
    totalVisitorsChange: 0,
    thirdCardLabel: 'Wallet Balance',
    thirdCardValue: formatAmountOnly(wallet.balance),
    thirdCardIcon: 'dollar',
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
    trafficSources: (() => {
      const total = stats.total || 1;
      return [
        { name: 'Completed', percent: Math.round((stats.completed / total) * 100), color: '#10b981' },
        { name: 'Delivered', percent: Math.round((stats.delivered / total) * 100), color: '#3b82f6' },
        { name: 'Pending', percent: Math.round((stats.pending / total) * 100), color: '#f59e0b' },
        { name: 'Cancelled', percent: Math.round((stats.cancelled / total) * 100), color: '#ef4444' },
      ].filter(s => s.percent > 0);
    })(),
    formatAmount: formatAmountOnly,
    dailyRevenue,
    monthlyTarget: monthlyMetrics.monthlyTarget,
    monthlyRevenue: monthlyMetrics.thisMonthSpent,
    monthlyTargetChange: monthlyMetrics.monthlyChange,
    recentOrders,
    recentActivity,
  }), [wallet.balance, stats, formatAmountOnly, topCategories, conversionFunnel, dailyRevenue, monthlyMetrics, data?.wishlistCount, weeklyChanges, recentOrders, recentActivity]);

  if (loading) {
    return (
      <div className="space-y-5" style={{ backgroundColor: '#F3EAE0', padding: '32px' }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-5">
          <Skeleton className="h-72 rounded col-span-2" />
          <Skeleton className="h-72 rounded" />
          <Skeleton className="h-72 rounded" />
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
          <Button size="sm" variant="ghost" onClick={fetchData} className="ml-auto">Retry Now</Button>
        </div>
      )}
      
      {usingCachedData && !isReconnecting && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <WifiOff className="h-4 w-4" />
          <span>Using cached data - some info may be outdated</span>
          <Button size="sm" variant="ghost" onClick={fetchData} className="ml-auto">Refresh</Button>
        </div>
      )}

      {/* Header with greeting, date filter, export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">
            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}! 👋
          </h1>
          <p className="text-[#64748b] mt-1">Here's your purchase activity overview.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-white border-gray-200 rounded-lg h-9 px-3 text-sm font-normal">
                <CalendarIcon className="w-4 h-4 mr-2 text-[#6B7280]" />
                {dateRange.from && dateRange.to ? (
                  <span className="text-[#6B7280]">
                    {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                  </span>
                ) : <span>Pick dates</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange(range || { from: undefined, to: undefined });
                  if (range?.from && range?.to) {
                    setPeriod('custom');
                    setCalendarOpen(false);
                  }
                }}
                numberOfMonths={2}
                className="pointer-events-auto"
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-[100px] bg-white border-gray-200 rounded-lg h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleExport} className="bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90 rounded-lg h-9">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <EzMartDashboardGrid data={dashboardData} />
    </div>
  );
};

export default BuyerDashboardHome;
