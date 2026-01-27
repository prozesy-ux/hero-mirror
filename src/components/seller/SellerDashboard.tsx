import { useEffect, useState, useMemo } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AnnouncementBanner } from '@/components/ui/announcement-banner';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  Package,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Award,
  Star,
  AlertTriangle,
  Download,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format, subDays, eachDayOfInterval, isWithinInterval, startOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';

interface TrustScore {
  trust_score: number;
  total_reports: number;
  successful_orders: number;
  buyer_approved_count: number;
}

const SellerDashboard = () => {
  const { profile, wallet, products, orders, loading } = useSellerContext();
  const { formatAmountOnly } = useCurrency();
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const navigate = useNavigate();

  // Update date range when period changes
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

  useEffect(() => {
    if (profile?.id) {
      fetchTrustScore();
      fetchQuickStats();
    }
  }, [profile?.id]);

  const fetchQuickStats = async () => {
    if (!profile?.id) return;
    
    // Fetch unread messages count
    const { count: msgCount } = await supabase
      .from('seller_chats')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', profile.id)
      .eq('is_read', false)
      .eq('sender_type', 'buyer');
    
    setUnreadMessages(msgCount || 0);
    
    // Fetch average rating from product reviews
    const { data: ratingData } = await supabase
      .from('product_reviews')
      .select('rating, seller_products!inner(seller_id)')
      .eq('seller_products.seller_id', profile.id);
    
    if (ratingData && ratingData.length > 0) {
      const avg = ratingData.reduce((sum, r) => sum + r.rating, 0) / ratingData.length;
      setAverageRating(avg);
      setReviewCount(ratingData.length);
    }
  };

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('trust-score-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seller_trust_scores',
        filter: `seller_id=eq.${profile.id}`
      }, () => {
        fetchTrustScore();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  const fetchTrustScore = async () => {
    if (!profile?.id) return;
    
    const { data } = await supabase
      .from('seller_trust_scores')
      .select('trust_score, total_reports, successful_orders, buyer_approved_count')
      .eq('seller_id', profile.id)
      .single();
    
    if (data) {
      setTrustScore(data);
    }
  };

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return orders;
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= dateRange.from! && orderDate <= dateRange.to!;
    });
  }, [orders, dateRange]);

  // Calculate stats from filtered orders
  const todayStart = startOfDay(new Date());
  const todayOrders = orders.filter(o => new Date(o.created_at) >= todayStart);
  const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
  const pendingOrders = filteredOrders.filter(o => o.status === 'pending').length;
  const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
  const refundedOrders = filteredOrders.filter(o => o.status === 'refunded').length;

  // Chart data from filtered orders
  const chartData = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];
    const dateInterval = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });

    return dateInterval.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      
      const dayOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return isWithinInterval(orderDate, { start: dayStart, end: dayEnd });
      });

      return {
        date: format(day, 'MMM d'),
        sales: dayOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0),
        orders: dayOrders.length
      };
    });
  }, [filteredOrders, dateRange]);

  // Recent orders for table
  const recentOrders = orders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Low stock products
  const lowStockProducts = products
    .filter(p => (p.stock ?? 0) <= 5 && p.is_available)
    .slice(0, 4);

  // Best selling products
  const bestSellers = products
    .filter(p => p.sold_count > 0)
    .sort((a, b) => b.sold_count - a.sold_count)
    .slice(0, 5);

  // Export function
  const handleExport = () => {
    if (filteredOrders.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csvContent = [
      ['Order ID', 'Product', 'Amount ($)', 'Status', 'Date'].join(','),
      ...filteredOrders.map(order => [
        order.id.slice(0, 8),
        `"${order.product?.name || 'Unknown'}"`,
        order.seller_earning.toFixed(2),
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
    toast.success('Report exported successfully!');
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 bg-[#F7F8FA] min-h-screen space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] font-semibold">Pending</Badge>;
      case 'delivered':
        return <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] font-semibold">Delivered</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] font-semibold">Completed</Badge>;
      case 'refunded':
        return <Badge className="bg-red-100 text-red-700 border-0 text-[10px] font-semibold">Refunded</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-0 text-[10px] font-semibold">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 lg:p-6 bg-[#F7F8FA] min-h-screen space-y-6 seller-dashboard">
      {/* Announcements Banner */}
      <AnnouncementBanner audience="seller" />
      {/* Dashboard Header - Shopeers Style */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-800 seller-heading">Dashboard</h1>
          {trustScore && (
            <Badge className={`px-2.5 py-1 text-xs font-semibold ${
              trustScore.trust_score >= 90 ? 'bg-emerald-100 text-emerald-700' :
              trustScore.trust_score >= 70 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <ShieldCheck className="w-3 h-3 mr-1" />
              {trustScore.trust_score}%
            </Badge>
          )}
        </div>
        
        {/* Date Filter + Period + Export */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Range Picker */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-white border-slate-200 rounded-xl h-9 px-3 text-sm font-normal text-slate-600 hover:bg-slate-50"
              >
                <CalendarIcon className="w-4 h-4 mr-2 text-slate-400" />
                {dateRange.from && dateRange.to ? (
                  <span>
                    {format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}
                  </span>
                ) : (
                  <span>Pick a date range</span>
                )}
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

          {/* Period Dropdown */}
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-[130px] bg-white border-slate-200 rounded-xl h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {/* Export Button */}
          <Button 
            onClick={handleExport}
            className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl h-9 px-4"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards - 4 Column Grid with Folder Icons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Orders */}
        <button 
          onClick={() => navigate('/seller/orders')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all text-left"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Today's Orders</p>
              <p className="text-[28px] lg:text-[32px] font-extrabold text-slate-800 mt-1 leading-tight">{todayOrders.length}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-600">+{pendingOrders} pending</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-orange-500" />
            </div>
          </div>
        </button>

        {/* Today's Sales */}
        <button 
          onClick={() => navigate('/seller/analytics')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all text-left"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Today's Sales</p>
              <p className="text-[28px] lg:text-[32px] font-extrabold text-slate-800 mt-1 leading-tight">{formatAmountOnly(todaySales)}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-600">{completedOrders} completed</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
        </button>

        {/* Total Balance */}
        <button 
          onClick={() => navigate('/seller/wallet')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all text-left"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Balance</p>
              <p className="text-[28px] lg:text-[32px] font-extrabold text-slate-800 mt-1 leading-tight">{formatAmountOnly(wallet?.balance || 0)}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[11px] font-medium text-slate-500">{formatAmountOnly(wallet?.pending_balance || 0)} pending</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </button>

        {/* Returns & Refunds */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Returns & Refunds</p>
              <p className="text-[28px] lg:text-[32px] font-extrabold text-slate-800 mt-1 leading-tight">{refundedOrders}</p>
              <div className="flex items-center gap-1.5 mt-2">
                {refundedOrders > 0 ? (
                  <>
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-[11px] font-semibold text-red-600">Needs attention</span>
                  </>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-600">All clear!</span>
                )}
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
              <Package className="h-6 w-6 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Row - Chart + Quick Stats */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sales Details Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Sales Details</h3>
              <p className="text-sm text-slate-500">Revenue over time</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="dashboardSalesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                  axisLine={false} 
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={v => formatAmountOnly(v)}
                  width={50}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 12, 
                    border: 'none', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    fontSize: 12,
                    backgroundColor: 'white'
                  }}
                  formatter={(value: number) => [formatAmountOnly(value), 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3B82F6" 
                  strokeWidth={2.5}
                  fill="url(#dashboardSalesGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-5">Quick Stats</h3>
          <div className="space-y-4">
            {/* Products - Click to navigate */}
            <button 
              onClick={() => navigate('/seller/products')}
              className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Products</p>
                  <p className="text-xs text-slate-500">{products.filter(p => p.is_approved).length} live</p>
                </div>
              </div>
              <span className="text-xl font-bold text-slate-800">{products.length}</span>
            </button>

            {/* Messages - Real unread count + click navigation */}
            <button 
              onClick={() => navigate('/seller/chat')}
              className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Messages</p>
                  <p className="text-xs text-slate-500">Unread chats</p>
                </div>
              </div>
              <span className={`text-xl font-bold ${unreadMessages > 0 ? 'text-blue-600' : 'text-slate-800'}`}>
                {unreadMessages}
              </span>
            </button>

            {/* Success Rate - Click to analytics */}
            <button 
              onClick={() => navigate('/seller/analytics')}
              className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Award className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Success Rate</p>
                  <p className="text-xs text-slate-500">Completion rate</p>
                </div>
              </div>
              <span className="text-xl font-bold text-emerald-600">
                {orders.length > 0 ? Math.round((completedOrders / orders.length) * 100) : 100}%
              </span>
            </button>

            {/* Rating - Real average from reviews */}
            <button 
              onClick={() => navigate('/seller/products')}
              className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Star className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Rating</p>
                  <p className="text-xs text-slate-500">{reviewCount} reviews</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {averageRating ? (
                  <>
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                      />
                    ))}
                  </>
                ) : (
                  <span className="text-sm text-slate-500">No reviews</span>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Content Row - Orders Table + Low Stock */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Details Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Order Details</h3>
              <p className="text-sm text-slate-500">Recent transactions</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/seller/orders')}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide p-4">Order ID</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide p-4">Product</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide p-4">Amount</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide p-4">Date</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.length > 0 ? recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <span className="text-sm font-medium text-slate-800">#{order.id.slice(0, 8)}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-600 line-clamp-1">{order.product?.name || 'Unknown'}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-semibold text-slate-800">{formatAmountOnly(Number(order.seller_earning))}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-500">{format(new Date(order.created_at), 'MMM d, HH:mm')}</span>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(order.status || 'pending')}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No orders yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-5">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-semibold text-slate-800">Low Stock</h3>
          </div>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {lowStockProducts.map(product => (
                <div key={product.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-white border border-amber-200 flex items-center justify-center">
                    <Package className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                    <p className="text-xs text-amber-600 font-semibold">{product.stock ?? 0} left</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">All products in stock</p>
            </div>
          )}
        </div>
      </div>

      {/* Best Sellers Row */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Best Selling Products</h3>
            <p className="text-sm text-slate-500">Top performers this period</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/seller/products')}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        {bestSellers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide p-3">#</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide p-3">Product</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide p-3">Sold</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide p-3">Price</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide p-3">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bestSellers.map((product, i) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                        {i + 1}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                          {product.icon_url ? (
                            <img src={product.icon_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-slate-800 line-clamp-1">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-sm font-semibold text-slate-800">{product.sold_count}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-slate-600">{formatAmountOnly(product.price)}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="text-sm text-slate-600">4.5</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No sales yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
