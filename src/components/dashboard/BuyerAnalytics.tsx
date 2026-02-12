import { useState, useMemo, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
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
  Heart,
  Package,
  TrendingUp,
  Star,
  Download,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format, subDays, startOfDay, startOfMonth, eachDayOfInterval, isWithinInterval, getDay } from 'date-fns';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Order {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  product?: {
    name: string;
    category_id: string | null;
  };
}

const BuyerAnalytics = () => {
  const { formatAmountOnly } = useCurrency();
  const { user } = useAuthContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

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

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('seller_orders')
      .select('id, amount, status, created_at, product:seller_products(name, category_id)')
      .eq('buyer_id', user?.id)
      .order('created_at', { ascending: false });

    if (data) setOrders(data as Order[]);
    setLoading(false);
  };

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

    // Calculate stats
    const totalSpent = filteredOrders.reduce((sum, o) => sum + o.amount, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Compare with previous period
    const periodDays = dateRange.from && dateRange.to 
      ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    const previousFrom = subDays(dateRange.from!, periodDays);
    const previousTo = subDays(dateRange.to!, periodDays);
    const previousOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= previousFrom && d <= previousTo;
    });
    const previousSpent = previousOrders.reduce((sum, o) => sum + o.amount, 0);
    const spentChange = previousSpent > 0 ? ((totalSpent - previousSpent) / previousSpent) * 100 : 0;

    // This month spending
    const thisMonthSpent = orders.filter(o => new Date(o.created_at) >= startOfMonth(new Date())).reduce((s, o) => s + o.amount, 0);

    // Daily data for chart
    const dailyData = dateRange.from && dateRange.to 
      ? eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).map(day => {
          const dayStart = startOfDay(day);
          const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
          
          const dayOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.created_at);
            return isWithinInterval(orderDate, { start: dayStart, end: dayEnd });
          });

          const amount = dayOrders.reduce((sum, o) => sum + o.amount, 0);

          return {
            date: format(day, 'MMM d'),
            value: amount,
            orders: dayOrders.length
          };
        })
      : [];

    const maxSpending = Math.max(...dailyData.map(d => d.value), 1);
    const percentageData = dailyData.map(d => ({
      ...d,
      percentage: (d.value / maxSpending) * 100
    }));

    // Day of week breakdown
    const dayOfWeekData = dayNames.map((name, index) => {
      const dayOrders = filteredOrders.filter(order => getDay(new Date(order.created_at)) === index);
      return {
        day: name,
        orders: dayOrders.length,
        spending: dayOrders.reduce((sum, o) => sum + o.amount, 0)
      };
    });

    // Order status breakdown
    const statusBreakdown = [
      { name: 'Completed', value: filteredOrders.filter(o => o.status === 'completed').length, color: '#10B981' },
      { name: 'Delivered', value: filteredOrders.filter(o => o.status === 'delivered').length, color: '#3B82F6' },
      { name: 'Pending', value: filteredOrders.filter(o => o.status === 'pending').length, color: '#F59E0B' },
      { name: 'Refunded', value: filteredOrders.filter(o => o.status === 'refunded').length, color: '#EF4444' }
    ].filter(s => s.value > 0);

    // Top products purchased
    const productSpending: Record<string, { name: string; count: number; spent: number }> = {};
    filteredOrders.forEach(order => {
      const productName = order.product?.name || 'Unknown';
      if (!productSpending[productName]) {
        productSpending[productName] = { name: productName, count: 0, spent: 0 };
      }
      productSpending[productName].count += 1;
      productSpending[productName].spent += order.amount;
    });
    const topProducts = Object.values(productSpending).sort((a, b) => b.spent - a.spent).slice(0, 5);

    // Unique products purchased
    const uniqueProducts = new Set(filteredOrders.map(o => o.product?.name)).size;

    // Completion rate
    const completedOrders = filteredOrders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    return {
      totalSpent,
      totalOrders,
      avgOrderValue,
      spentChange,
      thisMonthSpent,
      dailyData: percentageData,
      dayOfWeekData,
      statusBreakdown,
      topProducts,
      uniqueProducts,
      completionRate,
      maxSpending
    };
  }, [orders, filteredOrders, dateRange]);

  // Export function
  const handleExport = () => {
    if (filteredOrders.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csv = [
      ['Date', 'Product', 'Amount', 'Status'].join(','),
      ...filteredOrders.map(o => [
        format(new Date(o.created_at), 'yyyy-MM-dd'),
        `"${o.product?.name || 'Unknown'}"`,
        o.amount,
        o.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spending-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-lg border" />)}
        </div>
        <Skeleton className="h-80 rounded-lg border" />
      </div>
    );
  }

  // Stat Card Component - Same as Seller
  const StatCard = ({ 
    title, 
    value, 
    change
  }: { 
    title: string; 
    value: string | number; 
    change?: number;
  }) => (
    <div className="bg-white border rounded p-8">
      <div className="flex items-center gap-2 text-base mb-2">
        <span className="text-slate-700">{title}</span>
      </div>
      <div className="text-4xl font-semibold text-slate-900">{value}</div>
      {change !== undefined && change !== 0 && (
        <p className="text-sm text-slate-500 mt-2">
          {change >= 0 ? '+' : ''}{change.toFixed(1)}% vs last period
        </p>
      )}
    </div>
  );

  // Quick Stat Item Component - Same as Seller
  const QuickStatItem = ({ 
    value, 
    label 
  }: { 
    value: React.ReactNode; 
    label: string; 
  }) => (
    <div className="bg-white border rounded p-8">
      <div className="flex items-center gap-2 text-base mb-2">
        <span className="text-slate-700">{label}</span>
      </div>
      <div className="text-4xl font-semibold text-slate-900">{value}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header - No Title, Just Date Filter + Export (Same as Seller) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
        {/* Date Range Picker */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="bg-white border-slate-200 rounded-xl h-9 px-3 text-sm font-medium text-slate-800"
            >
              <CalendarIcon className="w-4 h-4 mr-2 text-slate-600" />
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
          <SelectTrigger className="w-[130px] bg-white border-slate-200 rounded-xl h-9 text-sm font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-slate-200 rounded-xl">
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>

        {/* Export Button */}
        <Button 
          onClick={handleExport}
          className="bg-emerald-500 hover:bg-emerald-600 rounded-xl h-9 px-4"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Top Stats Grid - Same as Seller */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Spent" 
          value={formatAmountOnly(analyticsData.totalSpent)} 
          change={analyticsData.spentChange}
        />
        <StatCard 
          title="Total Orders" 
          value={analyticsData.totalOrders.toString().padStart(2, '0')} 
        />
        <StatCard 
          title="Avg Order Value" 
          value={formatAmountOnly(analyticsData.avgOrderValue)}
        />
        <StatCard 
          title="This Month" 
          value={formatAmountOnly(analyticsData.thisMonthSpent)}
        />
      </div>

      {/* Main Content Row - Same layout as Seller (2/3 + 1/3) */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Spending Details Chart - 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">Spending Details</h3>
          </div>
          {/* Chart Legend */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-xs text-slate-600">Spending</span>
            </div>
          </div>
          
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.dailyData}>
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
                  tickFormatter={(v) => {
                    const actualValue = (v / 100) * analyticsData.maxSpending;
                    return actualValue >= 1000 ? `${(actualValue/1000).toFixed(0)}k` : actualValue.toFixed(0);
                  }}
                  domain={[0, 100]}
                  width={45}
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
                  formatter={(value: number, name: string, props: any) => [
                    formatAmountOnly(props.payload.value), 
                    'Spending'
                  ]}
                  labelFormatter={(label) => label}
                />
                <Bar 
                  dataKey="percentage" 
                  fill="#F97316" 
                  radius={[6, 6, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats 2x2 Grid - 1/3 width (Same as Seller) */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-slate-800">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            <QuickStatItem 
              value={analyticsData.uniqueProducts.toString().padStart(2, '0')} 
              label="Products Bought" 
            />
            <QuickStatItem 
              value={analyticsData.totalOrders.toString().padStart(2, '0')} 
              label="Total Purchases" 
            />
            <QuickStatItem 
              value={`${analyticsData.completionRate.toFixed(0)}%`} 
              label="Completion Rate" 
            />
            <div className="bg-white rounded p-8 border">
              <div className="flex items-center gap-3">
                <Star className="h-6 w-6 text-amber-500" />
                <div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4].map(i => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                    <Star className="h-4 w-4 text-slate-300" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Customer Rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row - Same 3-column layout as Seller */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Status Donut Chart */}
        <div className="bg-white rounded-lg border p-6">
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
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Top Products</h3>
          {analyticsData.topProducts.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.topProducts.map((product, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.count} purchased</p>
                  </div>
                  <span className="text-sm font-bold text-slate-800">{formatAmountOnly(product.spent)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No purchases yet
            </div>
          )}
        </div>

        {/* Spending by Day */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Spending by Day</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.dayOfWeekData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={35} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 12, 
                    border: 'none', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)', 
                    fontSize: 12,
                    backgroundColor: 'white'
                  }}
                  formatter={(value: number) => [formatAmountOnly(value), 'Spending']}
                />
                <Bar dataKey="spending" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerAnalytics;
