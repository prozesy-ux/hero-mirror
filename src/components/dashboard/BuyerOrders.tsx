import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { bffApi } from '@/lib/api-fetch';
import { isSessionValid } from '@/lib/session-persistence';
import { ShoppingBag, Package, Clock, CheckCircle, XCircle, Search, Eye, MessageSquare, Star, Calendar, ArrowUpDown, ArrowDown, ArrowUp, AlertCircle, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, subDays, startOfDay, endOfDay, isWithinInterval, startOfWeek, startOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import SessionExpiredBanner from '@/components/ui/session-expired-banner';

interface Order {
  id: string;
  amount: number;
  seller_earning: number;
  status: string;
  credentials: string | null;
  delivered_at: string | null;
  created_at: string;
  buyer_approved: boolean;
  product: {
    id: string;
    name: string;
    icon_url: string | null;
    description: string | null;
  } | null;
  seller: {
    id: string;
    store_name: string;
    store_logo_url: string | null;
  } | null;
}

type DatePreset = 'all' | 'today' | 'yesterday' | 'week' | 'month' | '30days' | 'custom';
type SortOption = 'newest' | 'oldest' | 'amount_high' | 'amount_low';

const CACHE_KEY = 'buyer_orders_cache';

const BuyerOrders = () => {
  const { formatAmountOnly } = useCurrency();
  const { user, setSessionExpired } = useAuthContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [approving, setApproving] = useState(false);
  const [sessionExpiredLocal, setSessionExpiredLocal] = useState(false);
  const [usingCachedData, setUsingCachedData] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  
  // Advanced filters
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load cached data on mount
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          setOrders(cachedData);
          setLoading(false);
        }
      } catch (e) { /* ignore */ }
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!loading) setLoading(true);
    setError(null);
    setIsReconnecting(false);
    
    const result = await bffApi.getBuyerDashboard();
    
    // SOFT RECONNECTING STATE
    if (result.isReconnecting) {
      setIsReconnecting(true);
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { data: cachedData } = JSON.parse(cached);
          setOrders(cachedData);
          setUsingCachedData(true);
        } catch (e) { /* ignore */ }
      }
      setLoading(false);
      setTimeout(() => fetchOrders(), 5000);
      return;
    }
    
    // UNAUTHORIZED: Check if truly expired
    if (result.isUnauthorized) {
      if (!isSessionValid()) {
        setSessionExpiredLocal(true);
        setSessionExpired?.(true);
      } else {
        setIsReconnecting(true);
        setTimeout(() => fetchOrders(), 5000);
      }
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          const { data: cachedData } = JSON.parse(cached);
          setOrders(cachedData);
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
          setOrders(cachedData);
          setUsingCachedData(true);
          setError('Using cached data');
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
      const orderData = result.data.sellerOrders as Order[];
      setOrders(orderData);
      setUsingCachedData(false);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: orderData, timestamp: Date.now() }));
    }
    setLoading(false);
  }, [setSessionExpired]);

  // Initial load from BFF
  useEffect(() => {
    if (user) fetchOrders();
  }, [user, fetchOrders]);

  // Setup realtime subscriptions
  const setupRealtimeSubscriptions = useCallback(() => {
    if (!user) return;
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    
    channelRef.current = supabase
      .channel('buyer-orders')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'seller_orders',
        filter: `buyer_id=eq.${user.id}`
      }, fetchOrders)
      .subscribe();
  }, [user, fetchOrders]);

  // Realtime for instant updates
  useEffect(() => {
    setupRealtimeSubscriptions();
    return () => { 
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current); 
      }
    };
  }, [setupRealtimeSubscriptions]);

  // Resubscribe on token refresh
  useEffect(() => {
    const handleSessionRefresh = () => {
      console.log('[BuyerOrders] Session refreshed - resubscribing realtime');
      setupRealtimeSubscriptions();
    };
    
    window.addEventListener('session-refreshed', handleSessionRefresh);
    return () => window.removeEventListener('session-refreshed', handleSessionRefresh);
  }, [setupRealtimeSubscriptions]);

  // Stats
  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    completed: orders.filter(o => o.status === 'completed').length,
    totalSpent: orders.reduce((sum, o) => sum + o.amount, 0)
  }), [orders]);

  // Get date range based on preset
  const getDateRange = useMemo(() => {
    const now = new Date();
    switch (datePreset) {
      case 'today':
        return { from: startOfDay(now), to: endOfDay(now) };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
      case 'week':
        return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfDay(now) };
      case 'month':
        return { from: startOfMonth(now), to: endOfDay(now) };
      case '30days':
        return { from: subDays(now, 30), to: endOfDay(now) };
      case 'custom':
        return { from: customDateRange.from, to: customDateRange.to };
      default:
        return { from: undefined, to: undefined };
    }
  }, [datePreset, customDateRange]);

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let result = orders.filter(order => {
      // Search filter
      const matchesSearch = order.product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           order.seller?.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           order.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      // Date filter
      let matchesDate = true;
      if (getDateRange.from && getDateRange.to) {
        const orderDate = new Date(order.created_at);
        matchesDate = isWithinInterval(orderDate, { start: getDateRange.from, end: getDateRange.to });
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });

    // Sort
    switch (sortOption) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'amount_high':
        result.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount_low':
        result.sort((a, b) => a.amount - b.amount);
        break;
    }

    return result;
  }, [orders, searchQuery, statusFilter, getDateRange, sortOption]);

  const handleApproveDelivery = async (orderId: string) => {
    setApproving(true);
    try {
      const { error } = await supabase.rpc('approve_seller_delivery', {
        p_order_id: orderId,
        p_buyer_id: user?.id
      });

      if (error) throw error;
      toast.success('Delivery approved! Seller has been paid.');
      fetchOrders();
      setSelectedOrder(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve delivery');
    } finally {
      setApproving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50"><Package className="w-3 h-3 mr-1" /> Delivered</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50"><CheckCircle className="w-3 h-3 mr-1" /> Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50"><XCircle className="w-3 h-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDateLabel = () => {
    switch (datePreset) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case '30days': return 'Last 30 Days';
      case 'custom': 
        if (customDateRange.from && customDateRange.to) {
          return `${format(customDateRange.from, 'MMM d')} - ${format(customDateRange.to, 'MMM d')}`;
        }
        return 'Custom';
      default: return 'All Time';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-slate-600 mb-4">{error}</p>
        <Button onClick={fetchOrders} variant="outline">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Expired Banner - only if truly expired */}
      {sessionExpiredLocal && !isReconnecting && <SessionExpiredBanner onDismiss={() => setSessionExpiredLocal(false)} />}
      
      {/* Reconnecting Notice */}
      {isReconnecting && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Reconnecting...</span>
          <Button size="sm" variant="ghost" onClick={fetchOrders} className="ml-auto">Retry Now</Button>
        </div>
      )}
      
      {/* Cached Data Notice */}
      {usingCachedData && !isReconnecting && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <WifiOff className="h-4 w-4" />
          <span>Using cached data</span>
          <Button size="sm" variant="ghost" onClick={fetchOrders} className="ml-auto">Refresh</Button>
        </div>
      )}
      
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-5 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Orders</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Delivered</p>
              <p className="text-2xl font-bold text-violet-600">{stats.delivered}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Completed</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-bold text-lg">{formatAmountOnly(1).charAt(0)}</span>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Spent</p>
              <p className="text-2xl font-bold text-green-600">{formatAmountOnly(stats.totalSpent)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border-2 border-black shadow-neobrutalism p-4 space-y-4">
        {/* Search, Date, Sort Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by product, seller, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-xl border-slate-200"
            />
          </div>

          {/* Date Filter */}
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto gap-2 rounded-xl border-slate-200">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span>{getDateLabel()}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-2 space-y-1 border-b">
                {(['all', 'today', 'yesterday', 'week', 'month', '30days'] as DatePreset[]).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => { setDatePreset(preset); if (preset !== 'custom') setShowDatePicker(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      datePreset === preset ? "bg-violet-100 text-violet-700" : "hover:bg-slate-100"
                    )}
                  >
                    {preset === 'all' ? 'All Time' : 
                     preset === 'today' ? 'Today' :
                     preset === 'yesterday' ? 'Yesterday' :
                     preset === 'week' ? 'This Week' :
                     preset === 'month' ? 'This Month' :
                     'Last 30 Days'}
                  </button>
                ))}
                <button
                  onClick={() => setDatePreset('custom')}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                    datePreset === 'custom' ? "bg-violet-100 text-violet-700" : "hover:bg-slate-100"
                  )}
                >
                  Custom Range
                </button>
              </div>
              {datePreset === 'custom' && (
                <CalendarComponent
                  mode="range"
                  selected={{ from: customDateRange.from, to: customDateRange.to }}
                  onSelect={(range) => {
                    setCustomDateRange({ from: range?.from, to: range?.to });
                    if (range?.from && range?.to) setShowDatePicker(false);
                  }}
                  className="p-3 pointer-events-auto"
                />
              )}
            </PopoverContent>
          </Popover>

          {/* Sort */}
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
            <SelectTrigger className="w-full sm:w-[160px] rounded-xl border-slate-200">
              <ArrowUpDown className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <span className="flex items-center gap-2"><ArrowDown className="w-3 h-3" /> Newest</span>
              </SelectItem>
              <SelectItem value="oldest">
                <span className="flex items-center gap-2"><ArrowUp className="w-3 h-3" /> Oldest</span>
              </SelectItem>
              <SelectItem value="amount_high">Amount (High)</SelectItem>
              <SelectItem value="amount_low">Amount (Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All', count: stats.total },
            { value: 'pending', label: 'Pending', count: stats.pending },
            { value: 'delivered', label: 'Delivered', count: stats.delivered },
            { value: 'completed', label: 'Completed', count: stats.completed },
            { value: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                statusFilter === tab.value
                  ? "bg-violet-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  "ml-1.5 px-1.5 py-0.5 rounded-full text-xs",
                  statusFilter === tab.value ? "bg-white/20" : "bg-slate-200"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List - Dokani Card Style */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Order Header - Dokani Style */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 flex-wrap">
                  <span>Seller: <strong className="text-slate-800">{order.seller?.store_name || 'Store'}</strong></span>
                  <span className="text-slate-300 hidden sm:inline">|</span>
                  <span>Date: <strong className="text-slate-800">{format(new Date(order.created_at), 'dd MMM, yyyy')}</strong></span>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  Order ID: #{order.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              
              {/* Product Row */}
              <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Product Image */}
                {order.product?.icon_url ? (
                  <img 
                    src={order.product.icon_url} 
                    alt="" 
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">{order.product?.name || 'Unknown Product'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={order.seller?.store_logo_url || ''} />
                      <AvatarFallback className="text-[10px] bg-slate-100">{order.seller?.store_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-slate-500">{order.seller?.store_name}</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">Quantity: 1</p>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-slate-800">{formatAmountOnly(order.amount)}</p>
                  <p className="text-xs text-slate-400">{format(new Date(order.created_at), 'h:mm a')}</p>
                </div>
                
                {/* Status Badge */}
                {getStatusBadge(order.status)}
                
                {/* Actions */}
                <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedOrder(order)}
                    className="flex-1 sm:flex-none rounded-lg"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>

              {/* Action for delivered orders */}
              {order.status === 'delivered' && !order.buyer_approved && (
                <div className="px-4 pb-4">
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <p className="text-sm text-blue-700">Order delivered! Please confirm to release payment to seller.</p>
                      <Button
                        size="sm"
                        onClick={() => handleApproveDelivery(order.id)}
                        disabled={approving}
                        className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                      >
                        Confirm Delivery
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedOrder.product?.icon_url ? (
                  <img 
                    src={selectedOrder.product.icon_url} 
                    alt="" 
                    className="w-16 h-16 rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Package className="w-8 h-8 text-slate-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{selectedOrder.product?.name}</h3>
                  <p className="text-sm text-slate-500">{selectedOrder.seller?.store_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-xs text-slate-500">Order ID</p>
                  <p className="font-mono text-sm">{selectedOrder.id.slice(0, 8)}...</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Amount</p>
                  <p className="font-semibold text-emerald-600">{formatAmountOnly(selectedOrder.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Order Date</p>
                  <p className="text-sm">{format(new Date(selectedOrder.created_at), 'PPP')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>

              {selectedOrder.credentials && selectedOrder.status !== 'pending' && (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-xs text-emerald-600 font-medium mb-2">Delivery Credentials</p>
                  <pre className="text-sm whitespace-pre-wrap bg-white p-3 rounded-lg border">
                    {selectedOrder.credentials}
                  </pre>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Seller
                </Button>
                {selectedOrder.status === 'completed' && (
                  <Button variant="outline" className="flex-1">
                    <Star className="w-4 h-4 mr-2" />
                    Leave Review
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuyerOrders;
