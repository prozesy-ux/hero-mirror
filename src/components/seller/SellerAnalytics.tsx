import { useState, useMemo } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Package,
  CalendarDays,
  ChevronDown
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, isWithinInterval, isToday as isTodayFn, isYesterday } from 'date-fns';

type Period = 'today' | 'yesterday' | '7d' | '30d' | 'thisMonth' | 'lastMonth' | 'custom' | 'all';

const periodLabels: Record<Period, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  thisMonth: 'This month',
  lastMonth: 'Last month',
  custom: 'Custom range',
  all: 'All time'
};

const SellerAnalytics = () => {
  const { orders, products, loading } = useSellerContext();
  const [period, setPeriod] = useState<Period>('30d');
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | null>(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Calculate date range based on period
  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'yesterday':
        const yesterday = subDays(now, 1);
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
      case '7d':
        return { start: subDays(now, 7), end: now };
      case '30d':
        return { start: subDays(now, 30), end: now };
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'custom':
        if (customRange) {
          return { start: customRange.from, end: customRange.to };
        }
        return { start: subDays(now, 30), end: now };
      default:
        return { start: subDays(now, 365), end: now };
    }
  };

  const periodDays = period === 'today' || period === 'yesterday' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 365;

  const analyticsData = useMemo(() => {
    const now = new Date();
    const startDate = subDays(now, periodDays);
    
    const periodOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return isWithinInterval(orderDate, { start: startDate, end: now });
    });

    const prevStartDate = subDays(startDate, periodDays);
    const prevOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return isWithinInterval(orderDate, { start: prevStartDate, end: startDate });
    });

    const days = eachDayOfInterval({ start: startDate, end: now });
    const dailyData = days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      
      const dayOrders = periodOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return isWithinInterval(orderDate, { start: dayStart, end: dayEnd });
      });

      return {
        date: format(day, 'MMM d'),
        revenue: dayOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0),
        orders: dayOrders.length
      };
    });

    const totalRevenue = periodOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    const prevRevenue = prevOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : (totalRevenue > 0 ? 100 : 0);

    const totalOrders = periodOrders.length;
    const prevOrderCount = prevOrders.length;
    const ordersChange = prevOrderCount > 0 ? ((totalOrders - prevOrderCount) / prevOrderCount) * 100 : (totalOrders > 0 ? 100 : 0);

    const statusBreakdown = [
      { name: 'Completed', value: periodOrders.filter(o => o.status === 'completed').length, color: '#10b981' },
      { name: 'Delivered', value: periodOrders.filter(o => o.status === 'delivered').length, color: '#3b82f6' },
      { name: 'Pending', value: periodOrders.filter(o => o.status === 'pending').length, color: '#f59e0b' },
      { name: 'Refunded', value: periodOrders.filter(o => o.status === 'refunded').length, color: '#ef4444' }
    ].filter(s => s.value > 0);

    const productSales: Record<string, { name: string; sold: number; revenue: number }> = {};
    periodOrders.forEach(order => {
      const productId = order.product_id;
      const productName = order.product?.name || 'Unknown';
      if (!productSales[productId]) {
        productSales[productId] = { name: productName, sold: 0, revenue: 0 };
      }
      productSales[productId].sold += 1;
      productSales[productId].revenue += Number(order.seller_earning);
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const successfulOrders = periodOrders.filter(o => o.status === 'delivered' || o.status === 'completed').length;
    const conversionRate = totalOrders > 0 ? (successfulOrders / totalOrders) * 100 : 0;

    // Find best day
    const bestDay = dailyData.reduce((best, day) => day.revenue > best.revenue ? day : best, { date: 'N/A', revenue: 0 });

    return {
      dailyData,
      totalRevenue,
      revenueChange,
      totalOrders,
      ordersChange,
      statusBreakdown,
      topProducts,
      conversionRate,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      bestDay: bestDay.date,
      bestDayRevenue: bestDay.revenue
    };
  }, [orders, periodDays]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 bg-slate-50 min-h-screen space-y-6 seller-dashboard">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const StatCard = ({ title, value, change, icon: Icon, gradient }: any) => (
    <div className={`relative rounded-xl sm:rounded-2xl p-3 sm:p-5 overflow-hidden ${gradient}`}>
      <div className="flex items-start justify-between relative z-10">
        <div className="min-w-0 flex-1">
          <p className="text-white/80 text-[10px] sm:text-xs font-medium uppercase tracking-wide truncate">{title}</p>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold text-white mt-0.5 sm:mt-1 truncate">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-1 sm:mt-2">
              {change >= 0 ? <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white/90" /> : <ArrowDownRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white/90" />}
              <span className="text-[10px] sm:text-xs font-semibold text-white/90">{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-slate-50 min-h-screen space-y-4 sm:space-y-6 seller-dashboard">
      {/* Period Selector - Extended Dropdown */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[160px] justify-between bg-white border-slate-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-500" />
                <span className="text-slate-700">{periodLabels[period]}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem onClick={() => setPeriod('today')} className="rounded-lg">
              Today
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPeriod('yesterday')} className="rounded-lg">
              Yesterday
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setPeriod('7d')} className="rounded-lg">
              Last 7 days
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPeriod('30d')} className="rounded-lg">
              Last 30 days
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setPeriod('thisMonth')} className="rounded-lg">
              This month
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPeriod('lastMonth')} className="rounded-lg">
              Last month
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setPeriod('all')} className="rounded-lg">
              All time
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => { setPeriod('custom'); setShowCustomPicker(true); }} 
              className="rounded-lg text-violet-600"
            >
              Custom range...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Custom Date Range Picker */}
        {period === 'custom' && (
          <Popover open={showCustomPicker} onOpenChange={setShowCustomPicker}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="ml-2 rounded-xl border-slate-200">
                {customRange 
                  ? `${format(customRange.from, 'MMM d')} - ${format(customRange.to, 'MMM d')}`
                  : 'Select dates'
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={customRange ? { from: customRange.from, to: customRange.to } : undefined}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setCustomRange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Stats Grid - 2 columns on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard title="Revenue" value={`$${analyticsData.totalRevenue.toFixed(2)}`} change={analyticsData.revenueChange} icon={DollarSign} gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
        <StatCard title="Orders" value={analyticsData.totalOrders} change={analyticsData.ordersChange} icon={ShoppingCart} gradient="bg-gradient-to-br from-blue-500 to-indigo-600" />
        <StatCard title="Avg Order" value={`$${analyticsData.avgOrderValue.toFixed(2)}`} icon={Target} gradient="bg-gradient-to-br from-violet-500 to-purple-600" />
        <StatCard title="Success" value={`${analyticsData.conversionRate.toFixed(0)}%`} icon={TrendingUp} gradient="bg-gradient-to-br from-amber-500 to-orange-600" />
      </div>

      {/* Insights Banner */}
      {analyticsData.totalOrders > 0 && (
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">Best performing day: <span className="text-violet-600">{analyticsData.bestDay}</span></p>
            <p className="text-xs text-slate-500">Generated ${analyticsData.bestDayRevenue.toFixed(2)} in revenue</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-0 shadow-md bg-white rounded-xl sm:rounded-2xl">
          <CardContent className="p-3 sm:p-5">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-3 sm:mb-4">Revenue Trend</h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.dailyData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={35} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card className="border-0 shadow-md bg-white rounded-2xl">
          <CardContent className="p-5">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Order Status</h3>
            {analyticsData.statusBreakdown.length > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analyticsData.statusBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value" strokeWidth={0}>
                        {analyticsData.statusBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {analyticsData.statusBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-slate-600">{item.name}</span>
                      <span className="text-xs font-semibold text-slate-900">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="border-0 shadow-md bg-white rounded-2xl">
        <CardContent className="p-5">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Top Products</h3>
          {analyticsData.topProducts.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.topProducts.map((product, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.sold} sold</p>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">${product.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No sales data yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerAnalytics;
