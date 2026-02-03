import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useFloatingChat } from '@/contexts/FloatingChatContext';
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
import ReviewForm from '@/components/reviews/ReviewForm';

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
  const { openChat } = useFloatingChat();
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
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);
  
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
    approved: orders.filter(o => o.buyer_approved === true).length,
    unapproved: orders.filter(o => o.buyer_approved === false && o.status !== 'pending').length,
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
      
      // Status filter (including approval status)
      const matchesStatus = statusFilter === 'all' || 
        order.status === statusFilter ||
        (statusFilter === 'approved' && order.buyer_approved === true) ||
        (statusFilter === 'unapproved' && order.buyer_approved === false && order.status !== 'pending');
      
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
            <Skeleton key={i} className="h-28 rounded border" />
          ))}
        </div>
        <Skeleton className="h-96 rounded border" />
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
        <div className="bg-white border rounded p-8">
          <div className="text-base text-slate-700 mb-2">Total Orders</div>
          <div className="text-4xl font-semibold text-slate-900">{stats.total}</div>
        </div>

        <div className="bg-white border rounded p-8">
          <div className="text-base text-slate-700 mb-2">Pending</div>
          <div className="text-4xl font-semibold text-orange-600">{stats.pending}</div>
        </div>

        <div className="bg-white border rounded p-8">
          <div className="text-base text-slate-700 mb-2">Delivered</div>
          <div className="text-4xl font-semibold text-violet-600">{stats.delivered}</div>
        </div>

        <div className="bg-white border rounded p-8">
          <div className="text-base text-slate-700 mb-2">Completed</div>
          <div className="text-4xl font-semibold text-emerald-600">{stats.completed}</div>
        </div>

        <div className="bg-white border rounded p-8">
          <div className="text-base text-slate-700 mb-2">Total Spent</div>
          <div className="text-4xl font-semibold text-green-600">{formatAmountOnly(stats.totalSpent)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded p-4 space-y-4">
        {/* Search, Date, Sort Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by product, seller, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded border-black focus:ring-2 focus:ring-[#FF90E8]/50"
            />
          </div>

          {/* Date Filter */}
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto gap-2 rounded border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
                      "w-full text-left px-3 py-2 rounded text-sm transition-colors",
                      datePreset === preset ? "bg-[#FF90E8] text-black border border-black" : "hover:bg-slate-50"
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
                    "w-full text-left px-3 py-2 rounded text-sm transition-colors",
                    datePreset === 'custom' ? "bg-[#FF90E8] text-black border border-black" : "hover:bg-slate-50"
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
            <SelectTrigger className="w-full sm:w-[160px] rounded border-black">
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
        <div className="bg-white border rounded p-2">
          <div className="flex flex-wrap gap-1">
            {[
              { value: 'all', label: 'All', count: stats.total },
              { value: 'pending', label: 'Pending', count: stats.pending },
              { value: 'delivered', label: 'Delivered', count: stats.delivered },
              { value: 'approved', label: 'Approved', count: stats.approved },
              { value: 'unapproved', label: 'Unapproved', count: stats.unapproved },
              { value: 'completed', label: 'Completed', count: stats.completed },
              { value: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "px-4 py-2 rounded text-sm font-medium transition-all",
                  statusFilter === tab.value
                    ? "bg-[#FF90E8] text-black border border-black"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    "ml-1.5 px-1.5 py-0.5 rounded text-xs",
                    statusFilter === tab.value ? "bg-black/10" : "bg-slate-200"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List - Clean Card Style */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white border rounded p-10 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white border rounded p-4 transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <div className="flex items-start gap-4">
                {/* Product Image */}
                {order.product?.icon_url ? (
                  <img 
                    src={order.product.icon_url} 
                    alt="" 
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Title + Status Row */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-slate-900 truncate text-[15px] leading-tight">
                      {order.product?.name || 'Unknown Product'}
                    </h3>
                    {getStatusBadge(order.status)}
                  </div>
                  
                  {/* Seller */}
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={order.seller?.store_logo_url || ''} />
                      <AvatarFallback className="text-[8px] bg-slate-100">{order.seller?.store_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-slate-500">{order.seller?.store_name || 'Store'}</span>
                  </div>
                  
                  {/* Price, Date, Order ID */}
                  <div className="flex items-center gap-2 mt-2 text-sm flex-wrap">
                    <span className="font-semibold text-slate-900">{formatAmountOnly(order.amount)}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400 text-xs font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#FF90E8] text-black font-medium text-sm rounded border border-black transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>

              {/* Action for delivered orders */}
              {order.status === 'delivered' && !order.buyer_approved && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="p-4 bg-[#FFF5FB] border border-black rounded">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <p className="text-sm text-slate-700">Order delivered! Please confirm to release payment.</p>
                      <button
                        onClick={() => handleApproveDelivery(order.id)}
                        disabled={approving}
                        className="px-4 py-2 bg-[#FF90E8] text-black font-medium text-sm rounded border border-black transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50 w-full sm:w-auto"
                      >
                        Confirm Delivery
                      </button>
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

              <div className="grid grid-cols-2 gap-4 p-4 bg-white border rounded">
                <div>
                  <p className="text-xs text-slate-500">Order ID</p>
                  <p className="font-mono text-sm text-slate-900">{selectedOrder.id.slice(0, 8)}...</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Amount</p>
                  <p className="font-semibold text-emerald-600">{formatAmountOnly(selectedOrder.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Order Date</p>
                  <p className="text-sm text-slate-900">{format(new Date(selectedOrder.created_at), 'PPP')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>

              {selectedOrder.credentials && selectedOrder.status !== 'pending' && (
                <div className="p-4 bg-[#FFF5FB] border border-black rounded">
                  <p className="text-xs text-slate-700 font-medium mb-2">Delivery Credentials</p>
                  <pre className="text-sm whitespace-pre-wrap bg-white p-3 rounded border border-black">
                    {selectedOrder.credentials}
                  </pre>
                </div>
              )}

              <div className="flex gap-2">
                <button 
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#FF90E8] text-black font-medium text-sm rounded border border-black transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  onClick={() => {
                    if (selectedOrder?.seller && selectedOrder?.product) {
                      openChat({
                        sellerId: selectedOrder.seller.id,
                        sellerName: selectedOrder.seller.store_name,
                        productId: selectedOrder.product.id,
                        productName: selectedOrder.product.name,
                        type: 'seller'
                      });
                      setSelectedOrder(null);
                    }
                  }}
                >
                  <MessageSquare className="w-4 h-4" />
                  Contact Seller
                </button>
                {selectedOrder.status === 'completed' && (
                  <button 
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white text-black font-medium text-sm rounded border border-black transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    onClick={() => {
                      setReviewingOrder(selectedOrder);
                      setShowReviewModal(true);
                      setSelectedOrder(null);
                    }}
                  >
                    <Star className="w-4 h-4" />
                    Leave Review
                  </button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
          </DialogHeader>
          {reviewingOrder && reviewingOrder.product && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white border rounded">
                {reviewingOrder.product.icon_url ? (
                  <img 
                    src={reviewingOrder.product.icon_url} 
                    alt="" 
                    className="w-12 h-12 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-slate-100 flex items-center justify-center">
                    <Package className="w-6 h-6 text-slate-400" />
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-slate-900">{reviewingOrder.product.name}</h4>
                  <p className="text-sm text-slate-500">{reviewingOrder.seller?.store_name}</p>
                </div>
              </div>
              <ReviewForm 
                productId={reviewingOrder.product.id}
                orderId={reviewingOrder.id}
                onSuccess={() => {
                  setShowReviewModal(false);
                  setReviewingOrder(null);
                }}
                onCancel={() => {
                  setShowReviewModal(false);
                  setReviewingOrder(null);
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuyerOrders;
