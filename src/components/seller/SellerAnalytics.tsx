import { useState, useMemo } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
  TrendingDown,
  Package
} from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval, isWithinInterval } from 'date-fns';

type Period = '7d' | '30d' | 'all';

const SellerAnalytics = () => {
  const { orders, products, loading } = useSellerContext();
  const [period, setPeriod] = useState<Period>('30d');

  const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 365;

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
      { name: 'Completed', value: periodOrders.filter(o => o.status === 'completed').length, color: '#23a094' },
      { name: 'Delivered', value: periodOrders.filter(o => o.status === 'delivered').length, color: '#000000' },
      { name: 'Pending', value: periodOrders.filter(o => o.status === 'pending').length, color: '#ff90e8' },
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
      <div className="p-6 space-y-6 seller-dashboard">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-72 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl seller-dashboard">
      {/* Period Selector */}
      <div className="flex justify-end mb-6">
        <div className="flex items-center gap-1 bg-white border border-black/10 rounded-lg p-1">
          {(['7d', '30d', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                period === p 
                  ? 'bg-black text-white' 
                  : 'text-black/60 hover:text-black'
              }`}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-black/10 rounded-lg p-4">
          <p className="text-sm text-black/50 mb-1">Revenue</p>
          <p className="text-2xl font-semibold text-black">${analyticsData.totalRevenue.toFixed(2)}</p>
          <div className="flex items-center gap-1 mt-1">
            {analyticsData.revenueChange >= 0 ? (
              <TrendingUp size={14} className="text-[#23a094]" />
            ) : (
              <TrendingDown size={14} className="text-red-500" />
            )}
            <span className={`text-xs font-medium ${analyticsData.revenueChange >= 0 ? 'text-[#23a094]' : 'text-red-500'}`}>
              {Math.abs(analyticsData.revenueChange).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="bg-white border border-black/10 rounded-lg p-4">
          <p className="text-sm text-black/50 mb-1">Orders</p>
          <p className="text-2xl font-semibold text-black">{analyticsData.totalOrders}</p>
          <div className="flex items-center gap-1 mt-1">
            {analyticsData.ordersChange >= 0 ? (
              <TrendingUp size={14} className="text-[#23a094]" />
            ) : (
              <TrendingDown size={14} className="text-red-500" />
            )}
            <span className={`text-xs font-medium ${analyticsData.ordersChange >= 0 ? 'text-[#23a094]' : 'text-red-500'}`}>
              {Math.abs(analyticsData.ordersChange).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="bg-white border border-black/10 rounded-lg p-4">
          <p className="text-sm text-black/50 mb-1">Avg Order</p>
          <p className="text-2xl font-semibold text-black">${analyticsData.avgOrderValue.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-black/10 rounded-lg p-4">
          <p className="text-sm text-black/50 mb-1">Success Rate</p>
          <p className="text-2xl font-semibold text-black">{analyticsData.conversionRate.toFixed(0)}%</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white border border-black/10 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-black mb-4">Revenue Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.dailyData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff90e8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ff90e8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#666' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e5e5e5', boxShadow: 'none' }} />
                <Area type="monotone" dataKey="revenue" stroke="#ff90e8" strokeWidth={2} fill="url(#revenueGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white border border-black/10 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-black mb-4">Order Status</h3>
          {analyticsData.statusBreakdown.length > 0 ? (
            <>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analyticsData.statusBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {analyticsData.statusBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {analyticsData.statusBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-black/60">{item.name}</span>
                    <span className="text-xs font-semibold text-black">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-black/40 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white border border-black/10 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-black mb-4">Top Products</h3>
        {analyticsData.topProducts.length > 0 ? (
          <div className="space-y-3">
            {analyticsData.topProducts.map((product, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-black/5 flex items-center justify-center text-xs font-semibold text-black/60">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">{product.name}</p>
                  <p className="text-xs text-black/50">{product.sold} sold</p>
                </div>
                <span className="text-sm font-semibold text-black">${product.revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Package className="w-10 h-10 text-black/20 mx-auto mb-2" />
            <p className="text-sm text-black/40">No sales data yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerAnalytics;