import { useState, useMemo } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Users,
  Star
} from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval, isWithinInterval } from 'date-fns';

type Period = '7d' | '30d' | 'all';

const SellerAnalytics = () => {
  const { orders, products, wallet, loading } = useSellerContext();
  const [period, setPeriod] = useState<Period>('30d');

  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 365;

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    const now = new Date();
    const startDate = subDays(now, periodDays);
    
    // Filter orders within period
    const periodOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return isWithinInterval(orderDate, { start: startDate, end: now });
    });

    // Previous period for comparison
    const prevStartDate = subDays(startDate, periodDays);
    const prevOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return isWithinInterval(orderDate, { start: prevStartDate, end: startDate });
    });

    // Daily data
    const days = eachDayOfInterval({ start: startDate, end: now });
    const dailyData = days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      
      const dayOrders = periodOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return isWithinInterval(orderDate, { start: dayStart, end: dayEnd });
      });

      const revenue = dayOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
      const count = dayOrders.length;

      return {
        date: format(day, 'MMM d'),
        shortDate: format(day, 'd'),
        revenue,
        orders: count,
        completed: dayOrders.filter(o => o.status === 'completed').length,
        pending: dayOrders.filter(o => o.status === 'pending').length
      };
    });

    // Totals
    const totalRevenue = periodOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    const prevRevenue = prevOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : (totalRevenue > 0 ? 100 : 0);

    const totalOrders = periodOrders.length;
    const prevOrderCount = prevOrders.length;
    const ordersChange = prevOrderCount > 0 ? ((totalOrders - prevOrderCount) / prevOrderCount) * 100 : (totalOrders > 0 ? 100 : 0);

    // Order status breakdown
    const statusBreakdown = [
      { name: 'Completed', value: periodOrders.filter(o => o.status === 'completed').length, color: '#10b981' },
      { name: 'Delivered', value: periodOrders.filter(o => o.status === 'delivered').length, color: '#3b82f6' },
      { name: 'Pending', value: periodOrders.filter(o => o.status === 'pending').length, color: '#f59e0b' },
      { name: 'Refunded', value: periodOrders.filter(o => o.status === 'refunded').length, color: '#ef4444' }
    ].filter(s => s.value > 0);

    // Top products
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
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Conversion rate (delivered+completed / total)
    const successfulOrders = periodOrders.filter(o => 
      o.status === 'delivered' || o.status === 'completed'
    ).length;
    const conversionRate = totalOrders > 0 ? (successfulOrders / totalOrders) * 100 : 0;

    return {
      dailyData,
      totalRevenue,
      revenueChange,
      totalOrders,
      ordersChange,
      statusBreakdown,
      topProducts,
      conversionRate,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
    };
  }, [orders, periodDays]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 bg-slate-50 min-h-screen space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100">
          <p className="text-sm font-medium text-slate-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'Revenue' ? `$${entry.value.toFixed(2)}` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen space-y-6">
      {/* Header with Period Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
          {(['7d', '30d', 'all'] as Period[]).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? 'default' : 'ghost'}
              onClick={() => setPeriod(p)}
              className={`rounded-lg ${period === p ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md' : 'text-slate-600'}`}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'All Time'}
            </Button>
          ))}
        </div>
      </div>

      {/* Premium Stats Cards with Gradients */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600" />
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-xs font-medium uppercase tracking-wide">Revenue</p>
                <p className="text-3xl font-bold text-white mt-1">
                  ${analyticsData.totalRevenue.toFixed(2)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {analyticsData.revenueChange >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-200" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-200" />
                  )}
                  <span className={`text-xs font-semibold ${
                    analyticsData.revenueChange >= 0 ? 'text-emerald-200' : 'text-red-200'
                  }`}>
                    {Math.abs(analyticsData.revenueChange).toFixed(1)}%
                  </span>
                  <span className="text-xs text-emerald-200/70">vs prev</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600" />
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wide">Orders</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {analyticsData.totalOrders}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {analyticsData.ordersChange >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-blue-200" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-200" />
                  )}
                  <span className={`text-xs font-semibold ${
                    analyticsData.ordersChange >= 0 ? 'text-blue-200' : 'text-red-200'
                  }`}>
                    {Math.abs(analyticsData.ordersChange).toFixed(1)}%
                  </span>
                  <span className="text-xs text-blue-200/70">vs prev</span>
                </div>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <ShoppingCart className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Order Value Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-violet-600 to-purple-600" />
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-xs font-medium uppercase tracking-wide">Avg Order</p>
                <p className="text-3xl font-bold text-white mt-1">
                  ${analyticsData.avgOrderValue.toFixed(2)}
                </p>
                <p className="text-xs text-violet-200/70 mt-2">Per transaction</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Target className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Rate Card */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600" />
          <CardContent className="p-5 relative">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-xs font-medium uppercase tracking-wide">Success Rate</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {analyticsData.conversionRate.toFixed(0)}%
                </p>
                <p className="text-xs text-amber-200/70 mt-2">Completed orders</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Orders Combo Chart */}
        <Card className="lg:col-span-2 border-0 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Performance Overview</h3>
                <p className="text-sm text-slate-500">Revenue and orders trend</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-slate-600">Orders</span>
                </div>
              </div>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analyticsData.dailyData}>
                  <defs>
                    <linearGradient id="colorRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue"
                    stroke="#10b981" 
                    strokeWidth={3}
                    fill="url(#colorRevenueGradient)" 
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Donut */}
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Order Status</h3>
              <p className="text-sm text-slate-500">Distribution breakdown</p>
            </div>
            <div className="h-[280px]">
              {analyticsData.statusBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.statusBreakdown}
                      cx="50%"
                      cy="45%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {analyticsData.statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px -5px rgba(0,0,0,0.15)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  No order data yet
                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {analyticsData.statusBreakdown.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-600">{item.name}</span>
                  <span className="text-xs font-semibold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Orders Bar Chart */}
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Daily Orders</h3>
              <p className="text-sm text-slate-500">Order volume over time</p>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.dailyData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="shortDate" 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <Bar 
                    dataKey="orders" 
                    name="Orders"
                    fill="url(#barGradient)" 
                    radius={[6, 6, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Top Products</h3>
              <p className="text-sm text-slate-500">Best performers by revenue</p>
            </div>
            {analyticsData.topProducts.length > 0 ? (
              <div className="space-y-3">
                {analyticsData.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100/50 hover:from-slate-100 hover:to-slate-100 transition-colors border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                        index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                        index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600' :
                        index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                        'bg-gradient-to-br from-slate-300 to-slate-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm line-clamp-1">{product.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-500">{product.sold} sold</span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 font-semibold">
                      ${product.revenue.toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-slate-400">
                <Package className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-sm">No product sales yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerAnalytics;