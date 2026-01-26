import { useState, useMemo } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
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
  BarChart,
  Bar,
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
  Eye,
  Users,
  MousePointerClick,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  CalendarDays,
  ChevronDown,
  RefreshCw,
  Download
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, eachDayOfInterval, isWithinInterval, getDay } from 'date-fns';

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

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SellerAnalytics = () => {
  const { orders, products, loading, refreshAll } = useSellerContext();
  const [period, setPeriod] = useState<Period>('30d');
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | null>(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);

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

    // Day of week breakdown
    const dayOfWeekData = dayNames.map((name, index) => {
      const dayOrders = periodOrders.filter(order => getDay(new Date(order.created_at)) === index);
      return {
        day: name,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0)
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

    // Unique buyers
    const uniqueBuyers = new Set(periodOrders.map(o => o.buyer_id)).size;

    // Find best day
    const bestDay = dailyData.reduce((best, day) => day.revenue > best.revenue ? day : best, { date: 'N/A', revenue: 0 });

    // Most active day of week
    const mostActiveDay = dayOfWeekData.reduce((best, day) => day.orders > best.orders ? day : best, { day: 'N/A', orders: 0 });

    return {
      dailyData,
      dayOfWeekData,
      totalRevenue,
      revenueChange,
      totalOrders,
      ordersChange,
      statusBreakdown,
      topProducts,
      conversionRate,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      bestDay: bestDay.date,
      bestDayRevenue: bestDay.revenue,
      uniqueBuyers,
      mostActiveDay: mostActiveDay.day
    };
  }, [orders, periodDays]);

  if (loading) {
    return (
      <div className="p-4 lg:p-6 bg-[#F7F8FA] min-h-screen space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const StatCard = ({ title, value, change, icon: Icon, iconBg, iconColor }: any) => (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-2xl lg:text-3xl font-extrabold text-slate-800 mt-1 seller-stat-number">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              {change >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
              )}
              <span className={`text-xs font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {Math.abs(change).toFixed(1)}% vs last period
              </span>
            </div>
          )}
        </div>
        <div className={`h-12 w-12 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 bg-[#F7F8FA] min-h-screen space-y-6 seller-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 seller-heading">Analytics</h1>
          <p className="text-sm text-slate-500">Track your store performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refreshAll()}
            className="bg-white border-slate-200 rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          {/* Period Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[160px] justify-between bg-white border-slate-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-700">{periodLabels[period]}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuItem onClick={() => setPeriod('today')} className="rounded-lg">Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod('yesterday')} className="rounded-lg">Yesterday</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPeriod('7d')} className="rounded-lg">Last 7 days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod('30d')} className="rounded-lg">Last 30 days</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPeriod('thisMonth')} className="rounded-lg">This month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod('lastMonth')} className="rounded-lg">Last month</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPeriod('all')} className="rounded-lg">All time</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={`$${analyticsData.totalRevenue.toFixed(0)}`} 
          change={analyticsData.revenueChange} 
          icon={DollarSign} 
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatCard 
          title="Total Orders" 
          value={analyticsData.totalOrders} 
          change={analyticsData.ordersChange} 
          icon={ShoppingCart} 
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard 
          title="Unique Buyers" 
          value={analyticsData.uniqueBuyers} 
          icon={Users} 
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
        />
        <StatCard 
          title="Avg. Order Value" 
          value={`$${analyticsData.avgOrderValue.toFixed(2)}`} 
          icon={TrendingUp} 
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart - 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Total Profit</h3>
              <p className="text-sm text-slate-500">Revenue trend over time</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-600">${analyticsData.totalRevenue.toFixed(2)}</p>
              <div className="flex items-center justify-end gap-1">
                {analyticsData.revenueChange >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                )}
                <span className={`text-xs font-medium ${analyticsData.revenueChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {Math.abs(analyticsData.revenueChange).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.dailyData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} width={50} />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} 
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2.5} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Active Days - 1/3 width */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Most Active Days</h3>
              <p className="text-sm text-slate-500">Orders by day of week</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.dayOfWeekData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="day" type="category" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={35} />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                  formatter={(value: number, name: string) => [value, name === 'orders' ? 'Orders' : 'Revenue']}
                />
                <Bar dataKey="orders" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Status Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Order Status</h3>
          {analyticsData.statusBreakdown.length > 0 ? (
            <>
              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={analyticsData.statusBreakdown} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={50} 
                      outerRadius={70} 
                      paddingAngle={4} 
                      dataKey="value" 
                      strokeWidth={0}
                    >
                      {analyticsData.statusBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {analyticsData.statusBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-slate-600">{item.name}</span>
                    <span className="text-xs font-bold text-slate-800 ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Repeat Customer Rate */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Success Metrics</h3>
          <div className="space-y-4">
            {/* Conversion Rate */}
            <div className="p-4 bg-emerald-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Conversion Rate</span>
                <span className="text-xl font-bold text-emerald-600">{analyticsData.conversionRate.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(analyticsData.conversionRate, 100)}%` }}
                />
              </div>
            </div>

            {/* Best Day */}
            <div className="p-4 bg-blue-50 rounded-xl">
              <span className="text-sm font-medium text-slate-700">Best Day</span>
              <p className="text-lg font-bold text-blue-600 mt-1">{analyticsData.bestDay}</p>
              <p className="text-xs text-slate-500">${analyticsData.bestDayRevenue.toFixed(2)} revenue</p>
            </div>

            {/* Most Active Day of Week */}
            <div className="p-4 bg-violet-50 rounded-xl">
              <span className="text-sm font-medium text-slate-700">Most Active Day</span>
              <p className="text-lg font-bold text-violet-600 mt-1">{analyticsData.mostActiveDay}</p>
              <p className="text-xs text-slate-500">Highest order volume</p>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Best Selling Products</h3>
          {analyticsData.topProducts.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.topProducts.map((product, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
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
        </div>
      </div>
    </div>
  );
};

export default SellerAnalytics;
