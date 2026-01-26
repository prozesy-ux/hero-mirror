import { useState, useMemo } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  ShoppingCart, 
  DollarSign,
  Wallet,
  RotateCcw,
  Globe,
  MessageSquare,
  TrendingUp,
  Star,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Download
} from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval, isWithinInterval, getDay } from 'date-fns';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SellerAnalytics = () => {
  const { orders, products, wallet, loading, refreshAll } = useSellerContext();
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);

  const analyticsData = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = subDays(todayStart, 1);
    const last30Days = subDays(now, 30);
    
    // Today's orders
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= todayStart;
    });

    // Yesterday's orders for comparison
    const yesterdayOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= yesterdayStart && orderDate < todayStart;
    });

    // Last 30 days orders
    const recentOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= last30Days;
    });

    // Today's stats
    const todayOrderCount = todayOrders.length;
    const yesterdayOrderCount = yesterdayOrders.length;
    const ordersChange = yesterdayOrderCount > 0 
      ? ((todayOrderCount - yesterdayOrderCount) / yesterdayOrderCount) * 100 
      : (todayOrderCount > 0 ? 100 : 0);

    const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    const yesterdaySales = yesterdayOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    const salesChange = yesterdaySales > 0 
      ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 
      : (todaySales > 0 ? 100 : 0);

    // Returns & Refunds
    const returnsRefunds = orders.filter(o => o.status === 'refunded').length;

    // Daily data for chart
    const days = eachDayOfInterval({ start: last30Days, end: now });
    const dailyData = days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      
      const dayOrders = recentOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return isWithinInterval(orderDate, { start: dayStart, end: dayEnd });
      });

      const revenue = dayOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);

      return {
        date: format(day, 'MMM d'),
        value: revenue,
        orders: dayOrders.length
      };
    });

    // For percentage-based Y-axis display
    const maxRevenue = Math.max(...dailyData.map(d => d.value), 1);
    const percentageData = dailyData.map(d => ({
      ...d,
      percentage: (d.value / maxRevenue) * 100
    }));

    // Day of week breakdown
    const dayOfWeekData = dayNames.map((name, index) => {
      const dayOrders = recentOrders.filter(order => getDay(new Date(order.created_at)) === index);
      return {
        day: name,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0)
      };
    });

    // Order status breakdown
    const statusBreakdown = [
      { name: 'Completed', value: orders.filter(o => o.status === 'completed').length, color: '#10B981' },
      { name: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, color: '#3B82F6' },
      { name: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: '#F59E0B' },
      { name: 'Refunded', value: orders.filter(o => o.status === 'refunded').length, color: '#EF4444' }
    ].filter(s => s.value > 0);

    // Top products
    const productSales: Record<string, { name: string; sold: number; revenue: number }> = {};
    recentOrders.forEach(order => {
      const productId = order.product_id;
      const productName = order.product?.name || 'Unknown';
      if (!productSales[productId]) {
        productSales[productId] = { name: productName, sold: 0, revenue: 0 };
      }
      productSales[productId].sold += 1;
      productSales[productId].revenue += Number(order.seller_earning);
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Simulated metrics
    const pageViews = Math.max(todayOrderCount * 15, Math.floor(Math.random() * 500) + 100);
    const visitors = Math.max(todayOrderCount * 8, Math.floor(Math.random() * 300) + 50);
    const clicks = Math.max(todayOrderCount * 5, Math.floor(Math.random() * 200) + 30);
    const conversionRate = todayOrderCount > 0 ? Math.min(((todayOrderCount / Math.max(clicks, 1)) * 100), 100) : 0;

    // Messages count (simulated)
    const buyerMessages = Math.floor(Math.random() * 20) + 5;

    // Customer feedback (average rating)
    const avgRating = 4.2;

    return {
      todayOrders: todayOrderCount,
      ordersChange,
      todaySales,
      salesChange,
      totalBalance: wallet?.balance || 0,
      returnsRefunds,
      pageViews,
      visitors,
      clicks,
      dailyData: percentageData,
      dayOfWeekData,
      statusBreakdown,
      topProducts,
      conversionRate,
      buyerMessages,
      avgRating,
      maxRevenue
    };
  }, [orders, wallet]);

  if (loading) {
    return (
      <div className="p-4 lg:p-6 bg-[#F7F8FA] min-h-screen space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  // Stat Card Component - Amazon Seller Central Style
  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon 
  }: { 
    title: string; 
    value: string | number; 
    change?: number;
    icon: React.ElementType;
  }) => (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
          <p className="text-[28px] lg:text-[32px] font-extrabold text-slate-800 mt-1 leading-tight">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              {change >= 0 ? (
                <>
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[11px] font-semibold text-emerald-600">
                    {Math.abs(change).toFixed(1)}% Up from yesterday
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-[11px] font-semibold text-red-600">
                    {Math.abs(change).toFixed(1)}% Down from yesterday
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        {/* Amazon Orange Icon */}
        <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
          <Icon className="h-6 w-6 text-orange-500" />
        </div>
      </div>
    </div>
  );

  // Quick Stat Item Component
  const QuickStatItem = ({ 
    icon: Icon, 
    iconColor, 
    value, 
    label 
  }: { 
    icon: React.ElementType; 
    iconColor: string; 
    value: React.ReactNode; 
    label: string; 
  }) => (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <div className="flex items-center gap-3">
        <Icon className={`h-6 w-6 ${iconColor}`} />
        <div>
          <div className="text-2xl font-bold text-slate-800">{value}</div>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 bg-[#F7F8FA] min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
          <p className="text-sm text-slate-500">Track your store performance</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white border-slate-200 rounded-xl w-fit"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Top Stats Grid - Amazon Seller Central Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Today's Order" 
          value={analyticsData.todayOrders.toString().padStart(2, '0')} 
          change={analyticsData.ordersChange}
          icon={ShoppingCart}
        />
        <StatCard 
          title="Today's Sale" 
          value={`$${analyticsData.todaySales.toLocaleString()}`} 
          change={analyticsData.salesChange}
          icon={DollarSign}
        />
        <StatCard 
          title="Total Balance" 
          value={`$${analyticsData.totalBalance.toLocaleString()}`}
          icon={Wallet}
        />
        <StatCard 
          title="Returns & Refunds" 
          value={analyticsData.returnsRefunds.toString().padStart(2, '0')}
          icon={RotateCcw}
        />
      </div>

      {/* Main Content Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sales Details Chart - 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-slate-800">Sales Details</h3>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-32 h-9 rounded-lg border-slate-200 bg-white">
                <SelectValue placeholder="January" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {months.map(month => (
                  <SelectItem key={month} value={month}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.dailyData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
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
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  domain={[0, 100]}
                  width={45}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 12, 
                    border: 'none', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)', 
                    fontSize: 12,
                    backgroundColor: 'white'
                  }} 
                  formatter={(value: number, name: string, props: any) => [
                    `$${props.payload.value.toFixed(2)}`, 
                    'Revenue'
                  ]}
                  labelFormatter={(label) => label}
                />
                <Area 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#3B82F6" 
                  strokeWidth={2.5} 
                  fill="url(#salesGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats 2x2 Grid - 1/3 width */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-800">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <QuickStatItem 
              icon={Globe} 
              iconColor="text-blue-500" 
              value="01" 
              label="Market Place" 
            />
            <QuickStatItem 
              icon={MessageSquare} 
              iconColor="text-blue-500" 
              value={analyticsData.buyerMessages.toString().padStart(2, '0')} 
              label="Buyer's Message" 
            />
            <QuickStatItem 
              icon={TrendingUp} 
              iconColor="text-emerald-500" 
              value={`${analyticsData.conversionRate.toFixed(0)}%`} 
              label="Buy Box Wins" 
            />
            <div className="bg-white rounded-xl p-4 border border-slate-100">
              <div className="flex items-center gap-3">
                <Star className="h-6 w-6 text-amber-500" />
                <div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4].map(i => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                    <Star className="h-4 w-4 text-slate-300" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Customer Feedback</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Status Donut Chart */}
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
                      {analyticsData.statusBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: 12, 
                        border: 'none', 
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)', 
                        fontSize: 12,
                        backgroundColor: 'white'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {analyticsData.statusBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-slate-600">{item.name}</span>
                    <span className="text-xs font-bold text-slate-800 ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No orders yet
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Top Products</h3>
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
                  <span className="text-sm font-semibold text-emerald-600">${product.revenue.toFixed(0)}</span>
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

        {/* Revenue by Day of Week */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Revenue by Day</h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.dayOfWeekData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <YAxis 
                  dataKey="day" 
                  type="category" 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                  axisLine={false} 
                  tickLine={false} 
                  width={35} 
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 12, 
                    border: 'none', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)', 
                    fontSize: 12,
                    backgroundColor: 'white'
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerAnalytics;
