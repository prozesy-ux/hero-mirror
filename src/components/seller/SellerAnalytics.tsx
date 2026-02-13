import { useState, useMemo, useEffect } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  Download,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval, isWithinInterval, getDay } from 'date-fns';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SellerAnalytics = () => {
  const { orders, products, wallet, loading } = useSellerContext();
  const { formatAmountOnly } = useCurrency();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [avgRating, setAvgRating] = useState<number>(0);

  // Fetch real average rating from product_reviews
  useEffect(() => {
    const fetchAvgRating = async () => {
      const productIds = products.map(p => p.id);
      if (productIds.length === 0) return;
      const { data } = await supabase
        .from('product_reviews')
        .select('rating')
        .in('product_id', productIds);
      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAvgRating(avg);
      }
    };
    fetchAvgRating();
  }, [products]);

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

  const analyticsData = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = subDays(todayStart, 1);
    
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= todayStart;
    });

    const yesterdayOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= yesterdayStart && orderDate < todayStart;
    });

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

    const returnsRefunds = filteredOrders.filter(o => o.status === 'refunded').length;

    const dailyData = dateRange.from && dateRange.to 
      ? eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).map(day => {
          const dayStart = startOfDay(day);
          const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
          
          const dayOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.created_at);
            return isWithinInterval(orderDate, { start: dayStart, end: dayEnd });
          });

          const revenue = dayOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);

          return {
            date: format(day, 'MMM d'),
            value: revenue,
            orders: dayOrders.length
          };
        })
      : [];

    const maxRevenue = Math.max(...dailyData.map(d => d.value), 1);
    const percentageData = dailyData.map(d => ({
      ...d,
      percentage: (d.value / maxRevenue) * 100
    }));

    const dayOfWeekData = dayNames.map((name, index) => {
      const dayOrders = filteredOrders.filter(order => getDay(new Date(order.created_at)) === index);
      return {
        day: name,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0)
      };
    });

    const statusBreakdown = [
      { name: 'Completed', value: filteredOrders.filter(o => o.status === 'completed').length, color: '#10B981' },
      { name: 'Delivered', value: filteredOrders.filter(o => o.status === 'delivered').length, color: '#3B82F6' },
      { name: 'Pending', value: filteredOrders.filter(o => o.status === 'pending').length, color: '#F59E0B' },
      { name: 'Refunded', value: filteredOrders.filter(o => o.status === 'refunded').length, color: '#EF4444' }
    ].filter(s => s.value > 0);

    const productSales: Record<string, { name: string; sold: number; revenue: number }> = {};
    filteredOrders.forEach(order => {
      const productId = order.product_id;
      const productName = order.product?.name || 'Unknown';
      if (!productSales[productId]) {
        productSales[productId] = { name: productName, sold: 0, revenue: 0 };
      }
      productSales[productId].sold += 1;
      productSales[productId].revenue += Number(order.seller_earning);
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const conversionRate = todayOrders.length > 0 
      ? Math.min((todayOrders.length / Math.max(products.length * 10, 1)) * 100, 100) 
      : 0;

    return {
      todayOrders: todayOrderCount,
      ordersChange,
      todaySales,
      salesChange,
      totalBalance: wallet?.balance || 0,
      returnsRefunds,
      dailyData: percentageData,
      dayOfWeekData,
      statusBreakdown,
      topProducts,
      conversionRate,
      avgRating,
      maxRevenue
    };
  }, [orders, wallet, filteredOrders, dateRange, products.length]);

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
    a.download = `analytics-${format(dateRange.from || new Date(), 'yyyy-MM-dd')}-to-${format(dateRange.to || new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully!');
  };

  if (loading) {
    return (
      <div className="bg-[#F3EAE0] min-h-screen p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  const statCards = [
    { title: "Today's Order", value: analyticsData.todayOrders.toString().padStart(2, '0'), change: analyticsData.ordersChange, icon: ShoppingCart, iconBg: 'bg-orange-100', iconColor: 'text-[#FF7F00]' },
    { title: "Today's Sale", value: formatAmountOnly(analyticsData.todaySales), change: analyticsData.salesChange, icon: DollarSign, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    { title: "Total Balance", value: formatAmountOnly(analyticsData.totalBalance), icon: Wallet, iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { title: "Returns & Refunds", value: analyticsData.returnsRefunds.toString().padStart(2, '0'), icon: RotateCcw, iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  ];

  const quickStats = [
    { icon: Package, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', value: products.length.toString().padStart(2, '0'), label: 'Total Products' },
    { icon: TrendingUp, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', value: `${analyticsData.conversionRate.toFixed(0)}%`, label: 'Conversion Rate' },
    { icon: Star, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', value: analyticsData.avgRating > 0 ? analyticsData.avgRating.toFixed(1) : '—', label: 'Avg Rating' },
    { icon: MessageSquare, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', value: filteredOrders.filter(o => o.status === 'completed').length.toString().padStart(2, '0'), label: 'Completed' },
  ];

  return (
    <div className="bg-[#F3EAE0] min-h-screen p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2937]">Analytics</h2>
          <p className="text-sm text-[#6B7280]">Track your store performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-white border-gray-200 rounded-xl h-9 px-3 text-sm font-medium text-[#1F2937]"
              >
                <CalendarIcon className="w-4 h-4 mr-2 text-[#6B7280]" />
                {dateRange.from && dateRange.to ? (
                  <span>{format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}</span>
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

          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-[130px] bg-white border-gray-200 rounded-xl h-9 text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-200 rounded-xl">
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={handleExport}
            className="bg-[#FF7F00] hover:bg-[#e67200] text-white rounded-xl h-9 px-4"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full ${card.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <span className="text-sm text-[#6B7280]">{card.title}</span>
              </div>
              <div className="text-3xl font-bold text-[#1F2937]">{card.value}</div>
              {card.change !== undefined && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${card.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {card.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {card.change >= 0 ? '+' : ''}{card.change.toFixed(1)}% from yesterday
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Content Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sales Details Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#1F2937]">Sales Details</h3>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF7F00]" />
              <span className="text-xs text-[#6B7280]">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="text-xs text-[#6B7280]">Orders</span>
            </div>
          </div>
          
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: '#6B7280' }} 
                  axisLine={false} 
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#6B7280' }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(v) => {
                    const actualValue = (v / 100) * analyticsData.maxRevenue;
                    return actualValue >= 1000 ? `${(actualValue/1000).toFixed(0)}k` : actualValue.toFixed(0);
                  }}
                  domain={[0, 100]}
                  width={45}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 16, 
                    border: 'none', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    padding: '12px 16px', 
                    fontSize: 12,
                    backgroundColor: 'white'
                  }} 
                  formatter={(value: number, name: string, props: any) => [
                    formatAmountOnly(props.payload.value), 
                    'Revenue'
                  ]}
                  labelFormatter={(label) => label}
                />
                <Bar 
                  dataKey="percentage" 
                  fill="#FF7F00" 
                  radius={[6, 6, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats 2x2 Grid */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#1F2937]">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            {quickStats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-full ${stat.iconBg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-[#1F2937]">{stat.value}</div>
                  <p className="text-sm text-[#6B7280] mt-1">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Status Donut Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#1F2937] mb-4">Order Status</h3>
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
                        borderRadius: 16, 
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
                  <div key={item.name} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-[#6B7280]">{item.name}</span>
                    <span className="text-xs font-bold text-[#1F2937] ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">
              <div className="text-center">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">No orders yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#1F2937] mb-4">Top Products</h3>
          {analyticsData.topProducts.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.topProducts.map((product, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-[#FF7F00]/10 flex items-center justify-center text-xs font-bold text-[#FF7F00]">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1F2937] truncate">{product.name}</p>
                    <p className="text-xs text-[#6B7280]">{product.sold} sold</p>
                  </div>
                  <span className="text-sm font-bold text-[#1F2937]">{formatAmountOnly(product.revenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">No sales yet</p>
              </div>
            </div>
          )}
        </div>

        {/* Revenue by Day */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#1F2937] mb-4">Revenue by Day</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.dayOfWeekData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="day" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={35} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 16, 
                    border: 'none', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)', 
                    fontSize: 12,
                    backgroundColor: 'white'
                  }}
                  formatter={(value: number) => [formatAmountOnly(value), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerAnalytics;
