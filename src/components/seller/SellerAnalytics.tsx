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
import { Download, Calendar as CalendarIcon } from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval, isWithinInterval, startOfMonth, subMonths } from 'date-fns';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import EzMartDashboardGrid, { DashboardStatData } from '@/components/dashboard/EzMartDashboardGrid';

const CATEGORY_COLORS = ['#ff7f00', '#fdba74', '#fed7aa', '#e5e7eb'];

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

  useEffect(() => {
    const now = new Date();
    switch (period) {
      case '7d': setDateRange({ from: subDays(now, 7), to: now }); break;
      case '30d': setDateRange({ from: subDays(now, 30), to: now }); break;
      case '90d': setDateRange({ from: subDays(now, 90), to: now }); break;
    }
  }, [period]);

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

    // Current week vs last week
    const thisWeekOrders = orders.filter(o => new Date(o.created_at) >= weekAgo);
    const lastWeekOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= twoWeeksAgo && d < weekAgo;
    });

    const thisWeekSales = thisWeekOrders.reduce((s, o) => s + Number(o.seller_earning), 0);
    const lastWeekSales = lastWeekOrders.reduce((s, o) => s + Number(o.seller_earning), 0);
    const salesChange = lastWeekSales > 0 ? ((thisWeekSales - lastWeekSales) / lastWeekSales) * 100 : (thisWeekSales > 0 ? 100 : 0);

    const ordersChange = lastWeekOrders.length > 0
      ? ((thisWeekOrders.length - lastWeekOrders.length) / lastWeekOrders.length) * 100
      : (thisWeekOrders.length > 0 ? 100 : 0);

    // Unique buyers
    const uniqueBuyers = new Set(filteredOrders.map(o => o.buyer_id)).size;
    const lastWeekBuyers = new Set(lastWeekOrders.map(o => o.buyer_id)).size;
    const thisWeekBuyers = new Set(thisWeekOrders.map(o => o.buyer_id)).size;
    const visitorsChange = lastWeekBuyers > 0
      ? ((thisWeekBuyers - lastWeekBuyers) / lastWeekBuyers) * 100
      : (thisWeekBuyers > 0 ? 100 : 0);

    // Top categories from products
    const productSales: Record<string, { name: string; revenue: number }> = {};
    filteredOrders.forEach(order => {
      const name = order.product?.name || 'Other';
      if (!productSales[name]) productSales[name] = { name, revenue: 0 };
      productSales[name].revenue += Number(order.seller_earning);
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 4);
    const totalFilteredSales = filteredOrders.reduce((s, o) => s + Number(o.seller_earning), 0);

    const topCategories = topProducts.length > 0 ? topProducts.map((p, i) => ({
      name: p.name,
      amount: formatAmountOnly(p.revenue),
      color: CATEGORY_COLORS[i] || '#e5e7eb',
    })) : [
      { name: 'No sales yet', amount: formatAmountOnly(0), color: '#e5e7eb' },
    ];

    // Daily revenue for chart
    const dailyRevenue = dateRange.from && dateRange.to
      ? eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).map(day => {
          const dayStart = startOfDay(day);
          const dayEnd = new Date(dayStart.getTime() + 86400000 - 1);
          const dayOrders = filteredOrders.filter(o => {
            const d = new Date(o.created_at);
            return isWithinInterval(d, { start: dayStart, end: dayEnd });
          });
          return {
            date: format(day, 'dd MMM'),
            revenue: dayOrders.reduce((s, o) => s + Number(o.seller_earning), 0),
          };
        })
      : [];

    // Monthly target
    const currentMonthStart = startOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= prevMonthStart && d < currentMonthStart;
    });
    const prevMonthRevenue = prevMonthOrders.reduce((s, o) => s + Number(o.seller_earning), 0);
    const monthlyTarget = Math.max(prevMonthRevenue * 1.1, 100);
    const currentMonthOrders = orders.filter(o => new Date(o.created_at) >= currentMonthStart);
    const monthlyRevenue = currentMonthOrders.reduce((s, o) => s + Number(o.seller_earning), 0);
    const monthlyTargetChange = prevMonthRevenue > 0
      ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
      : (monthlyRevenue > 0 ? 100 : 0);

    // Conversion funnel
    const totalViews = products.reduce((s, p) => s + ((p as any).view_count || 0), 0);
    const totalOrders = filteredOrders.length;
    const pendingOrders = filteredOrders.filter(o => o.status === 'pending').length;
    const completedOrders = filteredOrders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
    const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled' || o.status === 'refunded').length;

    const maxFunnel = Math.max(totalViews, totalOrders, 1);
    const conversionFunnel = [
      { label: 'Product', labelLine2: 'Views', value: totalViews.toLocaleString(), badge: '+9%', barHeight: '100%', barColor: '#ffe4c2' },
      { label: 'Total', labelLine2: 'Orders', value: totalOrders.toLocaleString(), badge: `${totalOrders > 0 ? '+' : ''}${totalOrders}`, barHeight: `${Math.min(Math.max((totalOrders / maxFunnel) * 100 * 5, 15), 100)}%`, barColor: '#ffd4a2' },
      { label: 'Pending', labelLine2: 'Orders', value: pendingOrders.toLocaleString(), badge: pendingOrders.toString(), barHeight: `${Math.min(Math.max((pendingOrders / Math.max(totalOrders, 1)) * 100, 10), 100)}%`, barColor: '#ffc482' },
      { label: 'Completed', labelLine2: 'Orders', value: completedOrders.toLocaleString(), badge: `+${completedOrders}`, barHeight: `${Math.min(Math.max((completedOrders / Math.max(totalOrders, 1)) * 100, 10), 100)}%`, barColor: '#ffb362' },
      { label: 'Cancelled', labelLine2: '/ Refunded', value: cancelledOrders.toLocaleString(), badge: `-${cancelledOrders}`, isNegative: cancelledOrders > 0, barHeight: `${Math.min(Math.max((cancelledOrders / Math.max(totalOrders, 1)) * 100, 5), 100)}%`, barColor: '#ff9f42' },
    ];

    const activeUsersByCountry = [
      { country: 'Product Views', percent: 100, barColor: '#f97316' },
    ];

    // Traffic/Order breakdown
    const total = totalOrders || 1;
    const completed = filteredOrders.filter(o => o.status === 'completed').length;
    const delivered = filteredOrders.filter(o => o.status === 'delivered').length;
    const pending = pendingOrders;
    const refunded = cancelledOrders;
    const trafficSources = [
      { name: 'Completed Orders', percent: Math.round((completed / total) * 100), color: '#10b981' },
      { name: 'Delivered', percent: Math.round((delivered / total) * 100), color: '#3b82f6' },
      { name: 'Pending', percent: Math.round((pending / total) * 100), color: '#f59e0b' },
      { name: 'Cancelled/Refunded', percent: Math.round((refunded / total) * 100), color: '#ef4444' },
    ].filter(s => s.percent > 0);

    // Recent orders
    const recentOrders = filteredOrders.slice(0, 10).map((o, i) => ({
      id: o.id,
      orderId: o.id.slice(0, 8).toUpperCase(),
      customerName: o.buyer?.full_name || o.buyer?.email || 'Customer',
      productName: o.product?.name || 'Product',
      productIcon: o.product?.icon_url || undefined,
      qty: 1,
      total: formatAmountOnly(Number(o.seller_earning)),
      status: o.status,
    }));

    // Recent activity
    const recentActivity = filteredOrders.slice(0, 5).map(o => ({
      id: o.id,
      icon: o.status === 'completed' ? 'purchase' : o.status === 'refunded' ? 'price' : 'order',
      message: `${o.buyer?.full_name || 'Customer'} ${o.status === 'completed' ? 'purchased' : o.status} ${o.product?.name || 'a product'}`,
      time: format(new Date(o.created_at), 'MMM d, h:mm a'),
    }));

    return {
      totalSales: totalFilteredSales,
      totalSalesChange: salesChange,
      totalOrders,
      totalOrdersChange: ordersChange,
      totalVisitors: uniqueBuyers,
      totalVisitorsChange: visitorsChange,
      thirdCardLabel: 'Total Balance',
      thirdCardValue: formatAmountOnly(wallet?.balance || 0),
      thirdCardIcon: 'dollar',
      topCategories,
      totalCategorySales: formatAmountOnly(totalFilteredSales),
      activeUsers: uniqueBuyers,
      activeUsersByCountry,
      conversionFunnel,
      trafficSources,
      formatAmount: formatAmountOnly,
      dailyRevenue,
      monthlyTarget,
      monthlyRevenue,
      monthlyTargetChange,
      recentOrders,
      recentActivity,
    };
  }, [orders, filteredOrders, products, wallet, dateRange, formatAmountOnly]);

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

      {/* EzMart Dashboard Grid */}
      <EzMartDashboardGrid data={dashboardData} />
    </div>
  );
};

export default SellerAnalytics;
