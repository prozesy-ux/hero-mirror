import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { bffApi } from '@/lib/api-fetch';
import { isSessionValid } from '@/lib/session-persistence';
import { 
  Wallet, ShoppingBag, TrendingUp, Clock, Package, ArrowRight, 
  Plus, Heart, Store, CheckCircle, AlertCircle, WifiOff, Zap, 
  ChevronRight, Star, Eye, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import SessionExpiredBanner from '@/components/ui/session-expired-banner';
import FlashSaleSection from '@/components/flash-sale/FlashSaleSection';
import StatCard from '@/components/marketplace/StatCard';

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

  const recentOrders = data?.sellerOrders?.slice(0, 5) || [];
  const stats = data?.orderStats || { total: 0, pending: 0, delivered: 0, completed: 0, totalSpent: 0 };
  const wishlistCount = data?.wishlistCount || 0;
  const wallet = data?.wallet || { balance: 0 };

  if (loading) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Something went wrong</h3>
        <p className="text-slate-500 mb-6">{error}</p>
        <Button onClick={fetchData} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Expired Banner - only show if truly expired */}
      {sessionExpiredLocal && !isReconnecting && <SessionExpiredBanner onDismiss={() => setSessionExpiredLocal(false)} />}
      
      {/* Reconnecting Notice - soft state, not "expired" */}
      {isReconnecting && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Reconnecting to server...</span>
          <Button size="sm" variant="ghost" onClick={fetchData} className="ml-auto">
            Retry Now
          </Button>
        </div>
      )}
      
      {/* Offline/Cached Notice */}
      {usingCachedData && !isReconnecting && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <WifiOff className="h-4 w-4" />
          <span>Using cached data - some info may be outdated</span>
          <Button size="sm" variant="ghost" onClick={fetchData} className="ml-auto">
            Refresh
          </Button>
        </div>
      )}

      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl uptoza-heading text-slate-900">
            Your empire awaits{user?.email ? `, ${user.email.split('@')[0]}` : ''}! <span className="wave-emoji">👋</span>
          </h1>
          <p className="text-slate-500 mt-1">Here's what's happening in your world.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/dashboard/marketplace')}
            className="uptoza-button"
          >
            <Store className="w-4 h-4 mr-2" />
            Explore Marketplace
          </Button>
        </div>
      </div>

      {/* Flash Deals */}
      <FlashSaleSection className="bg-white rounded-lg border-2 border-black shadow-neobrutalism" />

      {/* Stats Row - 4 Cards with UPTOZA variant */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Your Balance"
          value={formatAmountOnly(wallet.balance)}
          icon={<Wallet className="w-6 h-6" />}
          accentColor="violet"
          variant="uptoza"
          featured
          href="/dashboard/wallet"
        />
        <StatCard
          label="Money Spent"
          value={formatAmountOnly(stats.totalSpent)}
          icon={<TrendingUp className="w-6 h-6" />}
          accentColor="emerald"
          variant="uptoza"
          subValue="All-time"
        />
        <StatCard
          label="Orders Made"
          value={stats.total}
          icon={<ShoppingBag className="w-6 h-6" />}
          accentColor="blue"
          variant="uptoza"
          subValue={`${stats.completed} completed`}
          href="/dashboard/orders"
        />
        <StatCard
          label="In Transit"
          value={stats.pending + stats.delivered}
          icon={<Clock className="w-6 h-6" />}
          accentColor="orange"
          variant="uptoza"
          subValue={stats.delivered > 0 ? `${stats.delivered} ready for review` : undefined}
        />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Add Funds - Primary CTA */}
        <Link to="/dashboard/billing">
          <div className="uptoza-gradient rounded-[20px] p-5 text-white border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Top Up Wallet</p>
                <p className="text-sm text-white/80">Add funds now</p>
              </div>
              <ChevronRight className="w-5 h-5 ml-auto opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>

        {/* Browse Marketplace */}
        <Link to="/dashboard/marketplace">
          <div className="bg-[hsl(30,20%,98%)] rounded-[20px] p-5 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 flex items-center justify-center border border-violet-100">
                <Sparkles className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Discover</p>
                <p className="text-sm text-slate-500">Find new products</p>
              </div>
              <ChevronRight className="w-5 h-5 ml-auto text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>

        {/* View Wishlist */}
        <Link to="/dashboard/wishlist">
          <div className="bg-[hsl(30,20%,98%)] rounded-[20px] p-5 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center border border-pink-100">
                <Heart className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Saved Items</p>
                <p className="text-sm text-slate-500">{wishlistCount} in your list</p>
              </div>
              <ChevronRight className="w-5 h-5 ml-auto text-slate-400 group-hover:text-pink-600 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-[hsl(30,20%,98%)] rounded-[20px] border-2 border-black shadow-neobrutalism">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-lg uptoza-heading text-slate-900">Recent Orders</h2>
          <Link 
            to="/dashboard/orders" 
            className="text-sm font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No orders yet</h3>
            <p className="text-slate-500 text-sm mb-4 max-w-sm">
              Start exploring our marketplace to find the perfect products for your needs.
            </p>
            <Button 
              onClick={() => navigate('/dashboard/marketplace')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Browse Marketplace
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentOrders.map((order) => (
              <div 
                key={order.id} 
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/dashboard/orders`)}
              >
                {/* Product Image/Icon */}
                {order.product?.icon_url ? (
                  <img 
                    src={order.product.icon_url} 
                    alt={order.product.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <Package className="w-5 h-5 text-slate-400" />
                  </div>
                )}

                {/* Order Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 truncate text-[15px]">
                    {order.product?.name || 'Order'}
                  </h4>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {order.seller?.store_name && `by ${order.seller.store_name} • `}
                    {format(new Date(order.created_at), 'MMM d, yyyy')}
                  </p>
                </div>

                {/* Status & Amount */}
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-slate-900">{formatAmountOnly(order.amount)}</p>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${
                    order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    order.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {order.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                    {order.status === 'pending' && <Clock className="w-3 h-3" />}
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Completed</p>
              <p className="text-xl font-bold text-emerald-600">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Delivered</p>
              <p className="text-xl font-bold text-blue-600">{stats.delivered}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Pending</p>
              <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
            </div>
          </div>
        </div>

        <Link to="/dashboard/wishlist">
          <div className="bg-white rounded-lg p-4 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center">
                <Heart className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Wishlist</p>
                <p className="text-xl font-bold text-slate-800">{wishlistCount}</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default BuyerDashboardHome;
