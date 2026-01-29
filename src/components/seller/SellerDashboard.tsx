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
  LineChart,
  Line,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  Package,
  Truck,
  Target,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format, subDays, eachDayOfInterval, isWithinInterval, startOfDay, subMonths, getMonth, getYear } from 'date-fns';
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

const SellerDashboard = () => {
  const { profile, wallet, products, orders, loading } = useSellerContext();
  const { formatAmountOnly } = useCurrency();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
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

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return orders;
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= dateRange.from! && orderDate <= dateRange.to!;
    });
  }, [orders, dateRange]);

  // Calculate metrics from real data
  const metrics = useMemo(() => {
    const now = new Date();
    const thisWeekStart = subDays(now, 7);
    const lastWeekStart = subDays(now, 14);
    const thisMonthStart = subMonths(now, 1);
    const lastMonthStart = subMonths(now, 2);

    // This week's orders
    const thisWeekOrders = orders.filter(o => new Date(o.created_at) >= thisWeekStart);
    const lastWeekOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= lastWeekStart && d < thisWeekStart;
    });

    // Revenue calculations
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    const thisWeekRevenue = thisWeekOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    const lastWeekRevenue = lastWeekOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    const revenueChange = lastWeekRevenue > 0 
      ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 
      : (thisWeekRevenue > 0 ? 100 : 0);

    // Pending balance
    const pendingBalance = wallet?.pending_balance || 0;
    
    // Orders count
    const totalOrders = filteredOrders.length;
    const thisWeekOrderCount = thisWeekOrders.length;
    const lastWeekOrderCount = lastWeekOrders.length;
    const ordersChange = lastWeekOrderCount > 0
      ? ((thisWeekOrderCount - lastWeekOrderCount) / lastWeekOrderCount) * 100
      : (thisWeekOrderCount > 0 ? 100 : 0);

    // Products count
    const activeProducts = products.filter(p => p.is_available && p.is_approved).length;

    // Completion rate
    const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Monthly data for line chart
    const thisMonthOrders = orders.filter(o => new Date(o.created_at) >= thisMonthStart);
    const lastMonthOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= lastMonthStart && d < thisMonthStart;
    });
    const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    const monthlyGrowth = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : (thisMonthRevenue > 0 ? 100 : 0);

    // Top products by revenue
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

    // Top buyers
    const buyerSales: Record<string, { email: string; revenue: number; orderCount: number }> = {};
    filteredOrders.forEach(order => {
      const buyerId = order.buyer_id;
      const buyerEmail = order.buyer?.email || 'Unknown';
      if (!buyerSales[buyerId]) {
        buyerSales[buyerId] = { email: buyerEmail, revenue: 0, orderCount: 0 };
      }
      buyerSales[buyerId].revenue += Number(order.seller_earning);
      buyerSales[buyerId].orderCount += 1;
    });
    const topBuyers = Object.values(buyerSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(b => ({
        ...b,
        percentage: totalRevenue > 0 ? (b.revenue / totalRevenue) * 100 : 0
      }));

    // Order status breakdown
    const statusBreakdown = {
      pending: filteredOrders.filter(o => o.status === 'pending').length,
      delivered: filteredOrders.filter(o => o.status === 'delivered').length,
      completed: filteredOrders.filter(o => o.status === 'completed').length,
      refunded: filteredOrders.filter(o => o.status === 'refunded').length
    };
    const statusTotal = Object.values(statusBreakdown).reduce((a, b) => a + b, 0) || 1;

    // Monthly trend data
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = getYear(now);
    const lastYear = currentYear - 1;
    
    const monthlyTrend = monthNames.map((month, index) => {
      const thisYearOrders = orders.filter(o => {
        const d = new Date(o.created_at);
        return getMonth(d) === index && getYear(d) === currentYear;
      });
      const lastYearOrders = orders.filter(o => {
        const d = new Date(o.created_at);
        return getMonth(d) === index && getYear(d) === lastYear;
      });
      return {
        month,
        thisYear: thisYearOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0),
        lastYear: lastYearOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0)
      };
    });

    // Period comparison (quarters)
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    const periodData = quarters.map((q, i) => {
      const startMonth = i * 3;
      const endMonth = startMonth + 2;
      const currentQuarterOrders = orders.filter(o => {
        const d = new Date(o.created_at);
        const m = getMonth(d);
        return m >= startMonth && m <= endMonth && getYear(d) === currentYear;
      });
      const prevQuarterOrders = orders.filter(o => {
        const d = new Date(o.created_at);
        const m = getMonth(d);
        return m >= startMonth && m <= endMonth && getYear(d) === lastYear;
      });
      return {
        period: q,
        currentPeriod: currentQuarterOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0),
        previousPeriod: prevQuarterOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0)
      };
    });

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
      monthlyGrowth,
      topProducts,
      maxProductRevenue,
      topBuyers,
      statusBreakdown,
      statusTotal,
      monthlyTrend,
      periodData
    };
  }, [orders, filteredOrders, products, wallet]);

  // Export function
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

  if (loading) {
    return (
      <div className="p-4 lg:p-6 bg-slate-50 min-h-screen space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen space-y-6">
      {/* Announcements Banner */}
      <AnnouncementBanner audience="seller" />

      {/* Header - Filters Only */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
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
            className="bg-orange-500 text-white hover:bg-orange-600 rounded-xl h-9 px-4"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stat Cards Row - 5 Cards with Left Border Accent */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Revenue */}
        <button 
          onClick={() => navigate('/seller/analytics')}
          className="bg-white rounded-xl p-4 border-l-4 border-l-orange-400 shadow-sm hover:shadow-md transition-all text-left"
        >
          <p className="text-[11px] text-slate-500 font-medium">Revenue</p>
          <p className="text-2xl lg:text-[28px] font-bold text-slate-800 mt-1">
            {formatAmountOnly(metrics.totalRevenue)}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[11px]">
            {metrics.revenueChange >= 0 ? (
              <>
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600 font-medium">{metrics.revenueChange.toFixed(2)}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-red-600 font-medium">{Math.abs(metrics.revenueChange).toFixed(2)}%</span>
              </>
            )}
            <span className="text-slate-400">Than Last Week</span>
          </div>
        </button>

        {/* Pending Balance */}
        <button 
          onClick={() => navigate('/seller/wallet')}
          className="bg-white rounded-xl p-4 border-l-4 border-l-orange-400 shadow-sm hover:shadow-md transition-all text-left"
        >
          <p className="text-[11px] text-slate-500 font-medium">Pending Balance</p>
          <p className="text-2xl lg:text-[28px] font-bold text-slate-800 mt-1">
            {formatAmountOnly(metrics.pendingBalance)}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[11px]">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span className="text-emerald-600 font-medium">{formatAmountOnly(wallet?.balance || 0)}</span>
            <span className="text-slate-400">Available</span>
          </div>
        </button>

        {/* Total Orders */}
        <button 
          onClick={() => navigate('/seller/orders')}
          className="bg-white rounded-xl p-4 border-l-4 border-l-orange-400 shadow-sm hover:shadow-md transition-all text-left"
        >
          <p className="text-[11px] text-slate-500 font-medium">Total Orders</p>
          <p className="text-2xl lg:text-[28px] font-bold text-slate-800 mt-1">
            {metrics.totalOrders.toLocaleString()}
          </p>
          <div className="flex items-center gap-1 mt-2 text-[11px]">
            {metrics.ordersChange >= 0 ? (
              <>
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600 font-medium">{metrics.ordersChange.toFixed(0)}</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-red-600 font-medium">{Math.abs(metrics.ordersChange).toFixed(0)}</span>
              </>
            )}
            <span className="text-slate-400">Than Last Week</span>
          </div>
        </button>

        {/* Active Products */}
        <button 
          onClick={() => navigate('/seller/products')}
          className="bg-white rounded-xl p-4 border-l-4 border-l-orange-400 shadow-sm hover:shadow-md transition-all text-left"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Active Products</p>
              <p className="text-2xl lg:text-[28px] font-bold text-slate-800 mt-1">
                {metrics.activeProducts.toLocaleString()}
              </p>
            </div>
            <Truck className="h-5 w-5 text-orange-400" />
          </div>
          <div className="flex items-center gap-1 mt-2 text-[11px]">
            <span className="text-slate-400">{products.length} total products</span>
          </div>
        </button>

        {/* Completion Rate */}
        <div className="bg-white rounded-xl p-4 border-l-4 border-l-orange-400 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Completion Rate</p>
              <p className="text-2xl lg:text-[28px] font-bold text-slate-800 mt-1">
                {metrics.completionRate.toFixed(0)}%
              </p>
            </div>
            <Target className="h-5 w-5 text-orange-400" />
          </div>
          <div className="flex items-center gap-1 mt-2 text-[11px]">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span className="text-emerald-600 font-medium">{metrics.statusBreakdown.completed} completed</span>
          </div>
        </div>
      </div>

      {/* Second Row - Order Status + Top Products + Top Buyers Horizontal Bars */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Status Bar */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Order Status Breakdown</h3>
          <div className="h-6 bg-slate-100 rounded-full overflow-hidden flex">
            {metrics.statusBreakdown.completed > 0 && (
              <div 
                className="h-full bg-emerald-500"
                style={{ width: `${(metrics.statusBreakdown.completed / metrics.statusTotal) * 100}%` }}
              />
            )}
            {metrics.statusBreakdown.delivered > 0 && (
              <div 
                className="h-full bg-blue-500"
                style={{ width: `${(metrics.statusBreakdown.delivered / metrics.statusTotal) * 100}%` }}
              />
            )}
            {metrics.statusBreakdown.pending > 0 && (
              <div 
                className="h-full bg-amber-500"
                style={{ width: `${(metrics.statusBreakdown.pending / metrics.statusTotal) * 100}%` }}
              />
            )}
            {metrics.statusBreakdown.refunded > 0 && (
              <div 
                className="h-full bg-red-500"
                style={{ width: `${(metrics.statusBreakdown.refunded / metrics.statusTotal) * 100}%` }}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Completed ({metrics.statusBreakdown.completed})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-slate-600">Delivered ({metrics.statusBreakdown.delivered})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-slate-600">Pending ({metrics.statusBreakdown.pending})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-600">Refunded ({metrics.statusBreakdown.refunded})</span>
            </div>
          </div>
        </div>

        {/* Top Performing Products - Horizontal Bar */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Top Performing Products</h3>
          <div className="space-y-3">
            {metrics.topProducts.length > 0 ? (
              metrics.topProducts.map((product, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-24 truncate">{product.name}</span>
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
                      style={{ width: `${(product.revenue / metrics.maxProductRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-16 text-right">
                    {formatAmountOnly(product.revenue)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No sales data yet</p>
            )}
          </div>
        </div>

        {/* Top Buyers - Horizontal Bar */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Top Buyers</h3>
          <div className="space-y-3">
            {metrics.topBuyers.length > 0 ? (
              metrics.topBuyers.map((buyer, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-24 truncate">{buyer.email.split('@')[0]}</span>
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
                      style={{ width: `${buyer.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-16 text-right">
                    {formatAmountOnly(buyer.revenue)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No buyers yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Third Row - Year Over Year Comparison Boxes */}
      <div className="flex gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm flex-1">
          <p className="text-xs text-slate-500 font-medium">Last Month</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatAmountOnly(metrics.lastMonthRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm flex-1">
          <p className="text-xs text-slate-500 font-medium">This Month</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatAmountOnly(metrics.thisMonthRevenue)}</p>
          <div className="flex items-center gap-1 mt-1">
            {metrics.monthlyGrowth >= 0 ? (
              <>
                <TrendingUp className="h-3 w-3 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-600">{metrics.monthlyGrowth.toFixed(2)}%</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-xs font-medium text-red-600">{Math.abs(metrics.monthlyGrowth).toFixed(2)}%</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Fourth Row - Line Chart + Top Buyers Table */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Trend Line Chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Year Over Year Growth</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-xs text-slate-600">This Year</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400" />
              <span className="text-xs text-slate-600">Last Year</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toString()}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 12, 
                    border: 'none', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    padding: '12px 16px', 
                    fontSize: 12,
                    backgroundColor: 'white'
                  }}
                  formatter={(value: number) => [formatAmountOnly(value), '']}
                />
                <Line 
                  type="monotone" 
                  dataKey="thisYear" 
                  stroke="#F97316" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: '#F97316' }}
                  name="This Year"
                />
                <Line 
                  type="monotone" 
                  dataKey="lastYear" 
                  stroke="#94A3B8" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: '#94A3B8' }}
                  name="Last Year"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Buyers Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <h3 className="text-sm font-semibold text-slate-800 p-4 border-b">Top Buyers</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-orange-50">
                <tr>
                  <th className="text-left p-3 text-xs font-semibold text-slate-600">Buyer</th>
                  <th className="text-right p-3 text-xs font-semibold text-slate-600">Orders</th>
                  <th className="text-right p-3 text-xs font-semibold text-slate-600">Revenue</th>
                  <th className="text-right p-3 text-xs font-semibold text-slate-600">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topBuyers.length > 0 ? (
                  metrics.topBuyers.map((buyer, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="p-3 text-slate-700">{buyer.email}</td>
                      <td className="p-3 text-right text-slate-600">{buyer.orderCount}</td>
                      <td className="p-3 text-right font-medium text-slate-800">{formatAmountOnly(buyer.revenue)}</td>
                      <td className="p-3 text-right">
                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-medium">
                          {buyer.percentage.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400">No buyers yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fifth Row - Grouped Bar Chart + Summary Stats */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quarter Over Quarter Trend */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Quarter Over Quarter Trend</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-xs text-slate-600">This Year</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-200" />
              <span className="text-xs text-slate-600">Last Year</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.periodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toString()}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 12, 
                    border: 'none', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    padding: '12px 16px', 
                    fontSize: 12,
                    backgroundColor: 'white'
                  }}
                  formatter={(value: number) => [formatAmountOnly(value), '']}
                />
                <Bar dataKey="currentPeriod" fill="#F97316" radius={[4, 4, 0, 0]} name="This Year" />
                <Bar dataKey="previousPeriod" fill="#FED7AA" radius={[4, 4, 0, 0]} name="Last Year" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Summary Stats */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Order Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500 font-medium">Total Revenue</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{formatAmountOnly(metrics.totalRevenue)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500 font-medium">Total Orders</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{metrics.totalOrders}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500 font-medium">Available Balance</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{formatAmountOnly(wallet?.balance || 0)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-xs text-slate-500 font-medium">Pending Balance</p>
              <p className="text-xl font-bold text-slate-800 mt-1">{formatAmountOnly(metrics.pendingBalance)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
