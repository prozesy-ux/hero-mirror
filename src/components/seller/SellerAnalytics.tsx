import { useState, useMemo } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  Line, 
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
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval, isWithinInterval } from 'date-fns';

type Period = '7d' | '30d' | 'all';

const SellerAnalytics = () => {
  const { orders, products, wallet, loading } = useSellerContext();
  const [period, setPeriod] = useState<Period>('7d');

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
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 100;

    const totalOrders = periodOrders.length;
    const prevOrderCount = prevOrders.length;
    const ordersChange = prevOrderCount > 0 ? ((totalOrders - prevOrderCount) / prevOrderCount) * 100 : 100;

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

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen space-y-6">
      {/* Header with Period Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics</h2>
          <p className="text-slate-500 text-sm mt-1">Track your store performance</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-slate-200">
          {(['7d', '30d', 'all'] as Period[]).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? 'default' : 'ghost'}
              onClick={() => setPeriod(p)}
              className={period === p ? 'bg-slate-900 text-white' : 'text-slate-600'}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'All Time'}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Revenue</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${analyticsData.totalRevenue.toFixed(2)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {analyticsData.revenueChange >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-200" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-200" />
                  )}
                  <span className={`text-xs font-medium ${
                    analyticsData.revenueChange >= 0 ? 'text-emerald-200' : 'text-red-200'
                  }`}>
                    {Math.abs(analyticsData.revenueChange).toFixed(1)}% vs prev
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Orders</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {analyticsData.totalOrders}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {analyticsData.ordersChange >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-blue-200" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-200" />
                  )}
                  <span className={`text-xs font-medium ${
                    analyticsData.ordersChange >= 0 ? 'text-blue-200' : 'text-red-200'
                  }`}>
                    {Math.abs(analyticsData.ordersChange).toFixed(1)}% vs prev
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Order Value */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-500 to-purple-600">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm font-medium">Avg Order</p>
                <p className="text-2xl font-bold text-white mt-1">
                  ${analyticsData.avgOrderValue.toFixed(2)}
                </p>
                <p className="text-xs text-violet-200 mt-2">Per order value</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500 to-orange-600">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Success Rate</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {analyticsData.conversionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-amber-200 mt-2">Orders completed</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-900">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData.dailyData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Pie */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-900">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {analyticsData.statusBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.statusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {analyticsData.statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px'
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value) => <span className="text-slate-600 text-sm">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  No order data yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Chart and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Orders Bar Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-900">Daily Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="shortDate" 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px'
                    }}
                  />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-slate-900">Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.topProducts.length > 0 ? (
              <div className="space-y-4">
                {analyticsData.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm line-clamp-1">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.sold} sold</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                      ${product.revenue.toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-400">
                No product sales yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerAnalytics;
