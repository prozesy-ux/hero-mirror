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
  ChevronRight, Star, Eye, Sparkles, DollarSign, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import SessionExpiredBanner from '@/components/ui/session-expired-banner';
import FlashSaleSection from '@/components/flash-sale/FlashSaleSection';

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

  // Load cache on mount
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

  const recentOrders = data?.sellerOrders?.slice(0, 5) || [];
  const stats = data?.orderStats || { total: 0, pending: 0, delivered: 0, completed: 0, totalSpent: 0 };
  const wishlistCount = data?.wishlistCount || 0;
  const wallet = data?.wallet || { balance: 0 };

  if (loading) {
    return (
      <div className="space-y-6 p-4 lg:p-8">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#FFF5EB' }}>
          <AlertCircle className="w-10 h-10" style={{ color: '#FF8A00' }} />
        </div>
        <h3 className="text-lg font-bold mb-2" style={{ color: '#333' }}>Something went wrong</h3>
        <p className="mb-6" style={{ color: '#666' }}>{error}</p>
        <Button onClick={fetchData} style={{ backgroundColor: '#FF8A00' }} className="text-white hover:opacity-90">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Expired Banner */}
      {sessionExpiredLocal && !isReconnecting && <SessionExpiredBanner onDismiss={() => setSessionExpiredLocal(false)} />}
      
      {/* Reconnecting Notice */}
      {isReconnecting && (
        <div className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: '#FFB366', backgroundColor: '#FFF5EB', color: '#333' }}>
          <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#FF8A00', borderTopColor: 'transparent' }} />
          <span>Reconnecting to server...</span>
          <Button size="sm" variant="ghost" onClick={fetchData} className="ml-auto">
            Retry Now
          </Button>
        </div>
      )}
      
      {/* Offline/Cached Notice */}
      {usingCachedData && !isReconnecting && (
        <div className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm" style={{ borderColor: '#FFCC99', backgroundColor: '#FFF5EB', color: '#333' }}>
          <WifiOff className="h-4 w-4" style={{ color: '#FF8A00' }} />
          <span>Using cached data - some info may be outdated</span>
          <Button size="sm" variant="ghost" onClick={fetchData} className="ml-auto">
            Refresh
          </Button>
        </div>
      )}

      {/* EzMart Page Title */}
      <h1 className="text-[32px] font-bold" style={{ color: '#333' }}>Dashboard</h1>

      {/* Stats Row - 3 Column EzMart Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Balance */}
        <Link to="/dashboard/wallet">
          <div className="ezmart-card group cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: '#666' }}>Wallet Balance</p>
                <p className="text-[28px] font-bold" style={{ color: '#333' }}>{formatAmountOnly(wallet.balance)}</p>
                <p className="text-xs mt-2 flex items-center gap-1" style={{ color: '#10B981' }}>
                  <TrendingUp className="w-3 h-3" />
                  Available to spend
                </p>
              </div>
              <div className="ezmart-icon-box">
                <Wallet className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </Link>

        {/* Total Spent */}
        <div className="ezmart-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: '#666' }}>Total Spent</p>
              <p className="text-[28px] font-bold" style={{ color: '#333' }}>{formatAmountOnly(stats.totalSpent)}</p>
              <p className="text-xs mt-2" style={{ color: '#999' }}>Lifetime purchases</p>
            </div>
            <div className="ezmart-icon-box">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Total Orders - Highlight */}
        <Link to="/dashboard/orders">
          <div className="ezmart-card group cursor-pointer" style={{ backgroundColor: '#FFECD1' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: '#666' }}>Total Orders</p>
                <p className="text-[28px] font-bold" style={{ color: '#333' }}>{stats.total}</p>
                <p className="text-xs mt-2 flex items-center gap-1" style={{ color: '#10B981' }}>
                  <CheckCircle className="w-3 h-3" />
                  {stats.completed} completed
                </p>
              </div>
              <div className="ezmart-icon-box">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions - 3 Column EzMart Style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link to="/dashboard/billing">
          <div className="ezmart-card group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#10B981' }}>
                <Plus className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: '#333' }}>Add Funds</p>
                <p className="text-xs" style={{ color: '#999' }}>Top up your wallet</p>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: '#999' }} />
            </div>
          </div>
        </Link>

        <Link to="/dashboard/marketplace">
          <div className="ezmart-card group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#3B82F6' }}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: '#333' }}>Marketplace</p>
                <p className="text-xs" style={{ color: '#999' }}>Discover products</p>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: '#999' }} />
            </div>
          </div>
        </Link>

        <Link to="/dashboard/wishlist">
          <div className="ezmart-card group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EC4899' }}>
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: '#333' }}>Wishlist</p>
                <p className="text-xs" style={{ color: '#999' }}>{wishlistCount} saved items</p>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: '#999' }} />
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Orders - EzMart Card */}
      <div className="bg-white rounded-xl border p-0 transition-all hover:shadow-lg" style={{ borderColor: '#F0F0F0' }}>
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#F0F0F0' }}>
          <h2 className="text-lg font-semibold" style={{ color: '#333' }}>Recent Orders</h2>
          <Link 
            to="/dashboard/orders" 
            className="text-sm font-medium flex items-center gap-1 hover:opacity-80"
            style={{ color: '#FF8A00' }}
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#FFF5EB' }}>
              <ShoppingBag className="w-8 h-8" style={{ color: '#FF8A00' }} />
            </div>
            <h3 className="text-base font-semibold mb-1" style={{ color: '#333' }}>No orders yet</h3>
            <p className="text-sm mb-4 max-w-sm" style={{ color: '#666' }}>
              Start exploring our marketplace to find the perfect products for your needs.
            </p>
            <Button 
              onClick={() => navigate('/dashboard/marketplace')}
              className="text-white hover:opacity-90"
              style={{ backgroundColor: '#FF8A00' }}
            >
              Browse Marketplace
            </Button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#F0F0F0' }}>
            {recentOrders.map((order) => (
              <div 
                key={order.id} 
                className="flex items-center gap-4 p-4 hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                onClick={() => navigate(`/dashboard/orders`)}
              >
                {order.product?.icon_url ? (
                  <img 
                    src={order.product.icon_url} 
                    alt={order.product.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FFF5EB' }}>
                    <Package className="w-5 h-5" style={{ color: '#FF8A00' }} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate text-[15px]" style={{ color: '#333' }}>
                    {order.product?.name || 'Order'}
                  </h4>
                  <p className="text-sm mt-0.5" style={{ color: '#999' }}>
                    {order.seller?.store_name && `by ${order.seller.store_name} • `}
                    {format(new Date(order.created_at), 'MMM d, yyyy')}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-semibold" style={{ color: '#333' }}>{formatAmountOnly(order.amount)}</p>
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

                <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: '#CCC' }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Stats - 4 Column Small Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="ezmart-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#10B981' }}>
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: '#999' }}>Completed</p>
              <p className="text-xl font-bold" style={{ color: '#333' }}>{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="ezmart-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#3B82F6' }}>
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: '#999' }}>Delivered</p>
              <p className="text-xl font-bold" style={{ color: '#333' }}>{stats.delivered}</p>
            </div>
          </div>
        </div>

        <div className="ezmart-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F59E0B' }}>
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: '#999' }}>Pending</p>
              <p className="text-xl font-bold" style={{ color: '#333' }}>{stats.pending}</p>
            </div>
          </div>
        </div>

        <Link to="/dashboard/wishlist">
          <div className="ezmart-card group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EC4899' }}>
                <Heart className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: '#999' }}>Wishlist</p>
                <p className="text-xl font-bold" style={{ color: '#333' }}>{wishlistCount}</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default BuyerDashboardHome;
