import { useEffect, useState, useMemo } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AnnouncementBanner } from '@/components/ui/announcement-banner';
import { 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { 
  Package,
  Truck,
  Target,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar as CalendarIcon,
  DollarSign,
  ShoppingCart,
  Clock,
  CheckCircle,
  Share2,
  Star,
  MessageSquare,
  Eye,
  ChevronRight,
  Zap
} from 'lucide-react';
import { format, subDays, getMonth, getYear, subMonths } from 'date-fns';
import { useNavigate, Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import StatCard from '@/components/marketplace/StatCard';
import ShareStoreModal from './ShareStoreModal';

const SellerDashboard = () => {
  const { profile, wallet, products, orders, loading } = useSellerContext();
  const { formatAmountOnly } = useCurrency();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const navigate = useNavigate();

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

  const filteredOrders = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return orders;
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= dateRange.from! && orderDate <= dateRange.to!;
    });
  }, [orders, dateRange]);

  const metrics = useMemo(() => {
    const now = new Date();
    const thisWeekStart = subDays(now, 7);
    const lastWeekStart = subDays(now, 14);
    const thisMonthStart = subMonths(now, 1);
    const lastMonthStart = subMonths(now, 2);

    const thisWeekOrders = orders.filter(o => new Date(o.created_at) >= thisWeekStart);
    const lastWeekOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= lastWeekStart && d < thisWeekStart;
    });

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    const thisWeekRevenue = thisWeekOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    const lastWeekRevenue = lastWeekOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    const revenueChange = lastWeekRevenue > 0 
      ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 
      : (thisWeekRevenue > 0 ? 100 : 0);

    const pendingBalance = wallet?.pending_balance || 0;
    
    const totalOrders = filteredOrders.length;
    const thisWeekOrderCount = thisWeekOrders.length;
    const lastWeekOrderCount = lastWeekOrders.length;
    const ordersChange = lastWeekOrderCount > 0
      ? ((thisWeekOrderCount - lastWeekOrderCount) / lastWeekOrderCount) * 100
      : (thisWeekOrderCount > 0 ? 100 : 0);

    const activeProducts = products.filter(p => p.is_available && p.is_approved).length;
    const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    const thisMonthOrders = orders.filter(o => new Date(o.created_at) >= thisMonthStart);
    const lastMonthOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= lastMonthStart && d < thisMonthStart;
    });
    const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);

    const productSales: Record<string, { name: string; revenue: number; count: number }> = {};
    filteredOrders.forEach(order => {
      const productId = order.product_id;
      const productName = order.product?.name || 'Unknown';
      if (!productSales[productId]) {
        productSales[productId] = { name: productName, revenue: 0, count: 0 };
      }
      productSales[productId].revenue += Number(order.seller_earning);
      productSales[productId].count += 1;
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    const maxProductRevenue = topProducts.length > 0 ? topProducts[0].revenue : 1;

    const statusBreakdown = {
      pending: filteredOrders.filter(o => o.status === 'pending').length,
      delivered: filteredOrders.filter(o => o.status === 'delivered').length,
      completed: filteredOrders.filter(o => o.status === 'completed').length,
      refunded: filteredOrders.filter(o => o.status === 'refunded').length
    };

    // Daily revenue for chart
    const dailyData: { date: string; revenue: number }[] = [];
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    for (let i = days - 1; i >= 0; i--) {
      const day = subDays(now, i);
      const dayStr = format(day, 'MMM dd');
      const dayRevenue = orders
        .filter(o => format(new Date(o.created_at), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
        .reduce((sum, o) => sum + Number(o.seller_earning), 0);
      dailyData.push({ date: dayStr, revenue: dayRevenue });
    }

    return {
      totalRevenue,
      revenueChange,
      pendingBalance,
      totalOrders,
      ordersChange,
      activeProducts,
      completionRate,
      thisMonthRevenue,
      lastMonthRevenue,
      topProducts,
      maxProductRevenue,
      statusBreakdown,
      dailyData
    };
  }, [orders, filteredOrders, products, wallet, period]);

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

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const recentOrders = orders.slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg border-2 border-black" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-lg border-2 border-black" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnnouncementBanner audience="seller" />

      {/* Header with Share Store */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {profile?.store_name || 'Seller'}! 🎉
          </h1>
          <p className="text-slate-500 mt-1">Here's how your store is performing.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-white border-slate-200 rounded-lg h-9 px-3 text-sm font-normal"
              >
                <CalendarIcon className="w-4 h-4 mr-2 text-slate-400" />
                {dateRange.from && dateRange.to ? (
                  <span className="text-slate-600">
                    {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                  </span>
                ) : (
                  <span>Pick dates</span>
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

          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-[100px] bg-white border-slate-200 rounded-lg h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={() => setShareModalOpen(true)}
            className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg h-9"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Store
          </Button>
        </div>
      </div>

      {/* Stats Row - 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Revenue"
          value={formatAmountOnly(metrics.totalRevenue)}
          icon={<DollarSign className="w-6 h-6" />}
          trend={{ value: metrics.revenueChange, label: 'vs last week' }}
          accentColor="emerald"
          variant="neobrutalism"
          onClick={() => navigate('/seller/analytics')}
        />
        <StatCard
          label="Available Balance"
          value={formatAmountOnly(wallet?.balance || 0)}
          icon={<DollarSign className="w-6 h-6" />}
          subValue={`${formatAmountOnly(metrics.pendingBalance)} pending`}
          accentColor="blue"
          variant="neobrutalism"
          onClick={() => navigate('/seller/wallet')}
        />
        <StatCard
          label="Total Orders"
          value={metrics.totalOrders}
          icon={<ShoppingCart className="w-6 h-6" />}
          trend={{ value: metrics.ordersChange, label: 'vs last week' }}
          accentColor="violet"
          variant="neobrutalism"
          onClick={() => navigate('/seller/orders')}
        />
        <StatCard
          label="Active Products"
          value={metrics.activeProducts}
          icon={<Package className="w-6 h-6" />}
          subValue={`${products.length} total`}
          accentColor="orange"
          variant="neobrutalism"
          onClick={() => navigate('/seller/products')}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/seller/orders">
          <div className="bg-white rounded-lg p-4 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center border-2 border-black">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">Pending Orders</p>
                <p className="text-xs text-slate-500">Needs attention</p>
              </div>
              <span className="text-2xl font-bold text-amber-600">{pendingOrdersCount}</span>
            </div>
          </div>
        </Link>

        <Link to="/seller/flash-sales">
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-4 text-white border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center border-2 border-black/20">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Flash Sales</p>
                <p className="text-xs text-white/80">Create offers</p>
              </div>
              <ChevronRight className="w-5 h-5 ml-auto opacity-60 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        <Link to="/seller/chat">
          <div className="bg-white rounded-lg p-4 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center border-2 border-black">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Messages</p>
                <p className="text-xs text-slate-500">Chat with buyers</p>
              </div>
              <ChevronRight className="w-5 h-5 ml-auto text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>

        <Button 
          onClick={handleExport}
          variant="outline"
          className="bg-white border-2 border-black rounded-lg h-auto p-4 justify-start shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center border-2 border-black">
              <Download className="w-5 h-5 text-slate-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-800">Export Report</p>
              <p className="text-xs text-slate-500">Download CSV</p>
            </div>
          </div>
        </Button>
      </div>

      {/* Performance Metrics Row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Completion Rate */}
        <div className="bg-white rounded-lg p-5 border-2 border-black shadow-neobrutalism">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-800">Completion Rate</h3>
            <Target className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-slate-900">{metrics.completionRate.toFixed(0)}%</span>
            <span className="text-sm text-slate-500 mb-1">of orders completed</span>
          </div>
          <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden border border-black">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${metrics.completionRate}%` }}
            />
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-lg p-5 border-2 border-black shadow-neobrutalism">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Order Status</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 border border-black" />
              <span className="text-xs text-slate-600">Completed</span>
              <span className="text-xs font-semibold text-slate-800 ml-auto">{metrics.statusBreakdown.completed}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 border border-black" />
              <span className="text-xs text-slate-600">Delivered</span>
              <span className="text-xs font-semibold text-slate-800 ml-auto">{metrics.statusBreakdown.delivered}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500 border border-black" />
              <span className="text-xs text-slate-600">Pending</span>
              <span className="text-xs font-semibold text-slate-800 ml-auto">{metrics.statusBreakdown.pending}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 border border-black" />
              <span className="text-xs text-slate-600">Refunded</span>
              <span className="text-xs font-semibold text-slate-800 ml-auto">{metrics.statusBreakdown.refunded}</span>
            </div>
          </div>
        </div>

        {/* Month Summary */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Monthly Comparison</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Last Month</span>
              <span className="text-lg font-semibold text-slate-800">{formatAmountOnly(metrics.lastMonthRevenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">This Month</span>
              <span className="text-lg font-semibold text-emerald-600">{formatAmountOnly(metrics.thisMonthRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900">Revenue Trend</h3>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-600">Revenue</span>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics.dailyData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748B' }} 
                tickFormatter={(v) => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: 12, 
                  border: 'none', 
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  padding: '12px 16px', 
                  fontSize: 13,
                  backgroundColor: 'white'
                }}
                formatter={(value: number) => [formatAmountOnly(value), 'Revenue']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10B981" 
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products & Recent Orders */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Top Products</h3>
            <Link to="/seller/product-analytics" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4 space-y-3">
            {metrics.topProducts.length > 0 ? (
              metrics.topProducts.map((product, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-slate-600 w-1/3 truncate">{product.name}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                      style={{ width: `${(product.revenue / metrics.maxProductRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 w-20 text-right">
                    {formatAmountOnly(product.revenue)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No sales data yet</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">Recent Orders</h3>
            <Link to="/seller/orders" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate('/seller/orders')}
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {order.product?.name || 'Order'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(order.created_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-slate-800">
                      {formatAmountOnly(order.seller_earning)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      order.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <ShoppingCart className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm text-slate-400">No orders yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Share Store Modal */}
      {profile && (
        <ShareStoreModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          storeSlug={profile.store_name?.toLowerCase().replace(/\s+/g, '-') || null}
          storeName={profile.store_name}
        />
      )}
    </div>
  );
};

export default SellerDashboard;
