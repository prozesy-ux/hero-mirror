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
import { Download, Calendar as CalendarIcon } from 'lucide-react';
import { format, subDays, startOfDay, startOfMonth, eachDayOfInterval, isWithinInterval, getDay, subMonths } from 'date-fns';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import EzMartDashboardGrid, { DashboardStatData } from '@/components/dashboard/EzMartDashboardGrid';

const CATEGORY_COLORS = ['#ff7f00', '#fdba74', '#fed7aa', '#e5e7eb'];
const COUNTRY_BAR_COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#e5e7eb'];
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

  useEffect(() => {
    const now = new Date();
    switch (period) {
      case '7d': setDateRange({ from: subDays(now, 7), to: now }); break;
      case '30d': setDateRange({ from: subDays(now, 30), to: now }); break;
      case '90d': setDateRange({ from: subDays(now, 90), to: now }); break;
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

  const filteredOrders = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return orders;
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= dateRange.from! && orderDate <= dateRange.to!;
    });
  }, [orders, dateRange]);

  const dashboardData = useMemo((): DashboardStatData => {
    const now = new Date();
    const weekAgo = subDays(now, 7);
    const twoWeeksAgo = subDays(now, 14);

    const thisWeekOrders = orders.filter(o => new Date(o.created_at) >= weekAgo);
    const lastWeekOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= twoWeeksAgo && d < weekAgo;
    });

    const totalSpent = filteredOrders.reduce((sum, o) => sum + o.amount, 0);
    const totalOrders = filteredOrders.length;

    const thisWeekSpent = thisWeekOrders.reduce((s, o) => s + o.amount, 0);
    const lastWeekSpent = lastWeekOrders.reduce((s, o) => s + o.amount, 0);
    const spentChange = lastWeekSpent > 0 ? ((thisWeekSpent - lastWeekSpent) / lastWeekSpent) * 100 : (thisWeekSpent > 0 ? 100 : 0);

    const ordersChange = lastWeekOrders.length > 0
      ? ((thisWeekOrders.length - lastWeekOrders.length) / lastWeekOrders.length) * 100
      : (thisWeekOrders.length > 0 ? 100 : 0);

    // Unique products
    const uniqueProducts = new Set(filteredOrders.map(o => o.product?.name)).size;
    const thisWeekUnique = new Set(thisWeekOrders.map(o => o.product?.name)).size;
    const lastWeekUnique = new Set(lastWeekOrders.map(o => o.product?.name)).size;
    const uniqueChange = lastWeekUnique > 0 ? ((thisWeekUnique - lastWeekUnique) / lastWeekUnique) * 100 : (thisWeekUnique > 0 ? 100 : 0);

    // Completion rate
    const completedOrders = filteredOrders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Top products by spending
    const productSpending: Record<string, { name: string; spent: number }> = {};
    filteredOrders.forEach(order => {
      const productName = order.product?.name || 'Unknown';
      if (!productSpending[productName]) productSpending[productName] = { name: productName, spent: 0 };
      productSpending[productName].spent += order.amount;
    });
    const topProducts = Object.values(productSpending).sort((a, b) => b.spent - a.spent).slice(0, 4);
    const topCategories = topProducts.length > 0 ? topProducts.map((p, i) => ({
      name: p.name,
      amount: formatAmountOnly(p.spent),
      color: CATEGORY_COLORS[i] || '#e5e7eb',
    })) : [{ name: 'No purchases yet', amount: formatAmountOnly(0), color: '#e5e7eb' }];

    // Day of week breakdown (repurposed as "active users by country")
    const dayOfWeekData = dayNames.map((name, index) => {
      const dayOrders = filteredOrders.filter(order => getDay(new Date(order.created_at)) === index);
      return { country: name, percent: dayOrders.length, barColor: COUNTRY_BAR_COLORS[index % 5] || '#e5e7eb' };
    });
    const maxDayOrders = Math.max(...dayOfWeekData.map(d => d.percent), 1);
    const activeUsersByCountry = dayOfWeekData.map(d => ({
      ...d,
      percent: Math.round((d.percent / maxDayOrders) * 100),
    }));

    // Order status funnel
    const pendingOrders = filteredOrders.filter(o => o.status === 'pending').length;
    const deliveredOrders = filteredOrders.filter(o => o.status === 'delivered').length;
    const completedOnly = filteredOrders.filter(o => o.status === 'completed').length;
    const refundedOrders = filteredOrders.filter(o => o.status === 'refunded' || o.status === 'cancelled').length;
    const maxFunnel = Math.max(totalOrders, 1);

    const conversionFunnel = [
      { label: 'Total', labelLine2: 'Orders', value: totalOrders.toString(), badge: `${totalOrders}`, barHeight: '100%', barColor: '#ffe4c2' },
      { label: 'Pending', labelLine2: 'Orders', value: pendingOrders.toString(), badge: `${pendingOrders}`, barHeight: `${Math.max((pendingOrders / maxFunnel) * 100, 10)}%`, barColor: '#ffd4a2' },
      { label: 'Delivered', labelLine2: 'Orders', value: deliveredOrders.toString(), badge: `${deliveredOrders}`, barHeight: `${Math.max((deliveredOrders / maxFunnel) * 100, 10)}%`, barColor: '#ffc482' },
      { label: 'Completed', labelLine2: 'Orders', value: completedOnly.toString(), badge: `+${completedOnly}`, barHeight: `${Math.max((completedOnly / maxFunnel) * 100, 10)}%`, barColor: '#ffb362' },
      { label: 'Refunded', labelLine2: '/ Cancelled', value: refundedOrders.toString(), badge: `-${refundedOrders}`, isNegative: refundedOrders > 0, barHeight: `${Math.max((refundedOrders / maxFunnel) * 100, 5)}%`, barColor: '#ff9f42' },
    ];

    // Traffic sources = order status breakdown
    const total = totalOrders || 1;
    const trafficSources = [
      { name: 'Completed', percent: Math.round((completedOnly / total) * 100), color: '#10b981' },
      { name: 'Delivered', percent: Math.round((deliveredOrders / total) * 100), color: '#3b82f6' },
      { name: 'Pending', percent: Math.round((pendingOrders / total) * 100), color: '#f59e0b' },
      { name: 'Refunded', percent: Math.round((refundedOrders / total) * 100), color: '#ef4444' },
    ].filter(s => s.percent > 0);

    // Daily spending data
    const dailyRevenue = dateRange.from && dateRange.to
      ? eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).map(day => {
          const dayStart = startOfDay(day);
          const dayEnd = new Date(dayStart.getTime() + 86400000 - 1);
          const dayOrd = filteredOrders.filter(o => {
            const d = new Date(o.created_at);
            return isWithinInterval(d, { start: dayStart, end: dayEnd });
          });
          return { date: format(day, 'dd MMM'), revenue: dayOrd.reduce((s, o) => s + o.amount, 0) };
        })
      : [];

    // Monthly target
    const currentMonthStart = startOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= prevMonthStart && d < currentMonthStart;
    });
    const prevMonthSpent = prevMonthOrders.reduce((s, o) => s + o.amount, 0);
    const monthlyTarget = Math.max(prevMonthSpent * 1.1, 50);
    const currentMonthOrd = orders.filter(o => new Date(o.created_at) >= currentMonthStart);
    const monthlySpent = currentMonthOrd.reduce((s, o) => s + o.amount, 0);
    const monthlyTargetChange = prevMonthSpent > 0 ? ((monthlySpent - prevMonthSpent) / prevMonthSpent) * 100 : (monthlySpent > 0 ? 100 : 0);

    // Recent orders
    const recentOrders = filteredOrders.slice(0, 10).map(o => ({
      id: o.id,
      orderId: o.id.slice(0, 8).toUpperCase(),
      customerName: 'You',
      productName: o.product?.name || 'Product',
      qty: 1,
      total: formatAmountOnly(o.amount),
      status: o.status,
    }));

    const recentActivity = filteredOrders.slice(0, 5).map(o => ({
      id: o.id,
      icon: o.status === 'completed' ? 'purchase' : o.status === 'refunded' ? 'price' : 'order',
      message: `You ${o.status === 'completed' ? 'purchased' : o.status} ${o.product?.name || 'a product'}`,
      time: format(new Date(o.created_at), 'MMM d, h:mm a'),
    }));

    return {
      totalSales: totalSpent,
      totalSalesChange: spentChange,
      totalOrders,
      totalOrdersChange: ordersChange,
      totalVisitors: uniqueProducts,
      totalVisitorsChange: uniqueChange,
      thirdCardLabel: 'Completion Rate',
      thirdCardValue: `${completionRate.toFixed(0)}%`,
      thirdCardIcon: 'dollar' as const,
      topCategories,
      totalCategorySales: formatAmountOnly(totalSpent),
      activeUsers: totalOrders,
      activeUsersByCountry,
      conversionFunnel,
      trafficSources,
      formatAmount: formatAmountOnly,
      dailyRevenue,
      monthlyTarget,
      monthlyRevenue: monthlySpent,
      monthlyTargetChange,
      recentOrders,
      recentActivity,
    };
  }, [orders, filteredOrders, dateRange, formatAmountOnly]);

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
      <div className="bg-[#f1f5f9] min-h-screen p-8 space-y-6" style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-[#f1f5f9] min-h-screen p-8 space-y-6" style={{ fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2937]">Analytics</h2>
          <p className="text-sm text-[#6B7280]">Track your purchase history</p>
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

      {/* EzMart Dashboard Grid */}
      <EzMartDashboardGrid data={dashboardData} />
    </div>
  );
};

export default BuyerAnalytics;
