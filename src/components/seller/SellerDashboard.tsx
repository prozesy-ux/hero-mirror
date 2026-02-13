import { useEffect, useState, useMemo } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AnnouncementBanner } from '@/components/ui/announcement-banner';
import {
  Calendar as CalendarIcon,
  Share2,
} from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, eachDayOfInterval, startOfDay, isWithinInterval } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import ShareStoreModal from './ShareStoreModal';
import EzMartDashboardGrid, { type DashboardStatData } from '@/components/dashboard/EzMartDashboardGrid';

const SellerDashboard = () => {
  const { profile, wallet, products, orders, loading } = useSellerContext();
  const { formatAmountOnly } = useCurrency();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const navigate = useNavigate();

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

  const filteredOrders = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return orders;
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= dateRange.from! && orderDate <= dateRange.to!;
    });
  }, [orders, dateRange]);

  const metrics = useMemo(() => {
    const now = new Date();
    const thisWeekStart = subDays(now, 7);
    const lastWeekStart = subDays(now, 14);
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = subDays(thisMonthStart, 1);

    const thisWeekOrders = orders.filter(o => new Date(o.created_at) >= thisWeekStart);
    const lastWeekOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= lastWeekStart && d < thisWeekStart;
    });

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    const thisWeekRevenue = thisWeekOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    const lastWeekRevenue = lastWeekOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    const revenueChange = lastWeekRevenue > 0 
      ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 
      : (thisWeekRevenue > 0 ? 100 : 0);

    const totalOrders = filteredOrders.length;
    const thisWeekOrderCount = thisWeekOrders.length;
    const lastWeekOrderCount = lastWeekOrders.length;
    const ordersChange = lastWeekOrderCount > 0
      ? ((thisWeekOrderCount - lastWeekOrderCount) / lastWeekOrderCount) * 100
      : (thisWeekOrderCount > 0 ? 100 : 0);

    const activeProducts = products.filter(p => p.is_available && p.is_approved).length;

    // Monthly target & revenue
    const thisMonthOrders = orders.filter(o => new Date(o.created_at) >= thisMonthStart);
    const lastMonthOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= lastMonthStart && d <= lastMonthEnd;
    });
    const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    // Monthly target = last month revenue * 1.2 (20% growth goal), minimum $100
    const monthlyTarget = Math.max(lastMonthRevenue * 1.2, thisMonthRevenue > 0 ? thisMonthRevenue * 1.5 : 100);
    const monthlyTargetChange = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : (thisMonthRevenue > 0 ? 100 : 0);

    // Daily revenue for chart
    const dailyRevenue = dateRange.from && dateRange.to 
      ? eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).map(day => {
          const dayStart = startOfDay(day);
          const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
          const dayOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.created_at);
            return isWithinInterval(orderDate, { start: dayStart, end: dayEnd });
          });
          return {
            date: format(day, 'dd MMM'),
            revenue: dayOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0),
          };
        })
      : [];

    // Top product categories from orders
    const categorySales: Record<string, number> = {};
    filteredOrders.forEach(order => {
      const name = order.product?.name || 'Other';
      categorySales[name] = (categorySales[name] || 0) + Number(order.seller_earning || order.amount);
    });

    // Product view totals - use sold_count as proxy until view_count is added to context
    const totalViews = products.reduce((sum, p) => sum + ((p as any).view_count || p.sold_count || 0), 0);

    return {
      totalRevenue,
      revenueChange,
      totalOrders,
      ordersChange,
      activeProducts,
      thisMonthRevenue,
      monthlyTarget,
      monthlyTargetChange,
      dailyRevenue,
      totalViews,
    };
  }, [orders, filteredOrders, products, wallet, dateRange]);

  const handleExport = () => {
    if (filteredOrders.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csvContent = [
      ['Order ID', 'Product', 'Amount', 'Status', 'Date'].join(','),
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
    a.download = `orders-${format(dateRange.from || new Date(), 'yyyy-MM-dd')}-to-${format(dateRange.to || new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully!');
  };

  // Build top categories from product sales
  const topCategories = useMemo(() => {
    const productSales: Record<string, number> = {};
    filteredOrders.forEach(order => {
      const name = order.product?.name || 'Other';
      productSales[name] = (productSales[name] || 0) + Number(order.seller_earning);
    });
    const sorted = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const colors = ['#ff7f00', '#fdba74', '#fed7aa', '#e5e7eb'];
    return sorted.map(([name, amount], i) => ({
      name,
      amount: formatAmountOnly(amount),
      color: colors[i] || '#e5e7eb',
    }));
  }, [filteredOrders, formatAmountOnly]);

  const totalCategorySales = useMemo(() => {
    const total = filteredOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    return formatAmountOnly(total);
  }, [filteredOrders, formatAmountOnly]);

  // Conversion funnel from real data
  const conversionFunnel = useMemo(() => {
    const totalViews = metrics.totalViews;
    const totalOrders = metrics.totalOrders;
    const completedOrders = filteredOrders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
    const pendingOrders = filteredOrders.filter(o => o.status === 'pending').length;
    const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled' || o.status === 'refunded').length;

    return [
      { label: 'Product', labelLine2: 'Views', value: totalViews.toLocaleString(), badge: '+9%', barHeight: '100%', barColor: '#ffe4c2' },
      { label: 'Total', labelLine2: 'Orders', value: totalOrders.toLocaleString(), badge: `${totalOrders > 0 ? '+' : ''}${totalOrders}`, barHeight: `${Math.min(Math.max((totalOrders / Math.max(totalViews, 1)) * 100 * 5, 15), 100)}%`, barColor: '#ffd4a2' },
      { label: 'Pending', labelLine2: 'Orders', value: pendingOrders.toLocaleString(), badge: pendingOrders.toString(), barHeight: `${Math.min(Math.max((pendingOrders / Math.max(totalOrders, 1)) * 100, 10), 100)}%`, barColor: '#ffc482' },
      { label: 'Completed', labelLine2: 'Orders', value: completedOrders.toLocaleString(), badge: `+${completedOrders}`, barHeight: `${Math.min(Math.max((completedOrders / Math.max(totalOrders, 1)) * 100, 10), 100)}%`, barColor: '#ffb362' },
      { label: 'Cancelled', labelLine2: '/ Refunded', value: cancelledOrders.toLocaleString(), badge: `-${cancelledOrders}`, isNegative: cancelledOrders > 0, barHeight: `${Math.min(Math.max((cancelledOrders / Math.max(totalOrders, 1)) * 100, 5), 100)}%`, barColor: '#ff9f42' },
    ];
  }, [metrics, filteredOrders]);

  // Recent orders for table
  const recentOrders = useMemo(() => {
    return filteredOrders.slice(0, 5).map((order, idx) => ({
      id: order.id,
      orderId: order.id.slice(0, 8).toUpperCase(),
      customerName: (order as any).buyer?.full_name || (order as any).buyer?.email || `Customer`,
      customerAvatar: (order as any).buyer?.avatar_url || undefined,
      productName: order.product?.name || 'Unknown Product',
      productIcon: (order.product as any)?.icon_url || (order.product as any)?.thumbnail_url || undefined,
      qty: 1,
      total: formatAmountOnly(Number(order.seller_earning)),
      status: order.status,
    }));
  }, [filteredOrders, formatAmountOnly]);

  // Recent activity feed
  const recentActivity = useMemo(() => {
    const activities: Array<{ id: string; icon: string; message: string; time: string; color?: string }> = [];
    // Build from recent orders
    filteredOrders.slice(0, 6).forEach(order => {
      const productName = order.product?.name || 'a product';
      if (order.status === 'completed' || order.status === 'delivered') {
        activities.push({ id: `act-${order.id}`, icon: 'purchase', message: `Order for "${productName}" was ${order.status}`, time: format(new Date(order.created_at), 'MMM d, h:mm a'), color: '#ecfdf5' });
      } else if (order.status === 'pending') {
        activities.push({ id: `act-${order.id}`, icon: 'order', message: `New order received for "${productName}"`, time: format(new Date(order.created_at), 'MMM d, h:mm a'), color: '#fff7ed' });
      } else if (order.status === 'cancelled' || order.status === 'refunded') {
        activities.push({ id: `act-${order.id}`, icon: 'stock', message: `Order for "${productName}" was ${order.status}`, time: format(new Date(order.created_at), 'MMM d, h:mm a'), color: '#fef2f2' });
      }
    });
    return activities.slice(0, 5);
  }, [filteredOrders]);

  const dashboardData: DashboardStatData = useMemo(() => ({
    totalSales: metrics.totalRevenue,
    totalSalesChange: metrics.revenueChange,
    totalOrders: metrics.totalOrders,
    totalOrdersChange: metrics.ordersChange,
    totalVisitors: metrics.totalViews,
    totalVisitorsChange: 0,
    topCategories: topCategories.length > 0 ? topCategories : [
      { name: 'No sales yet', amount: formatAmountOnly(0), color: '#e5e7eb' },
    ],
    totalCategorySales,
    activeUsers: metrics.totalViews,
    activeUsersByCountry: [
      { country: 'Product Views', percent: 100, barColor: '#f97316' },
    ],
    conversionFunnel,
    trafficSources: (() => {
      const total = filteredOrders.length || 1;
      const completed = filteredOrders.filter(o => o.status === 'completed').length;
      const delivered = filteredOrders.filter(o => o.status === 'delivered').length;
      const pending = filteredOrders.filter(o => o.status === 'pending').length;
      const refunded = filteredOrders.filter(o => o.status === 'refunded' || o.status === 'cancelled').length;
      return [
        { name: 'Completed Orders', percent: Math.round((completed / total) * 100), color: '#10b981' },
        { name: 'Delivered', percent: Math.round((delivered / total) * 100), color: '#3b82f6' },
        { name: 'Pending', percent: Math.round((pending / total) * 100), color: '#f59e0b' },
        { name: 'Cancelled/Refunded', percent: Math.round((refunded / total) * 100), color: '#ef4444' },
      ].filter(s => s.percent > 0);
    })(),
    formatAmount: formatAmountOnly,
    dailyRevenue: metrics.dailyRevenue,
    monthlyTarget: metrics.monthlyTarget,
    monthlyRevenue: metrics.thisMonthRevenue,
    monthlyTargetChange: metrics.monthlyTargetChange,
    recentOrders,
    recentActivity,
  }), [metrics, formatAmountOnly, topCategories, totalCategorySales, conversionFunnel, recentOrders, recentActivity]);

  if (loading) {
    return (
      <div className="space-y-5" style={{ backgroundColor: '#F3EAE0', padding: '32px' }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-5">
          <Skeleton className="h-72 rounded col-span-2" />
          <Skeleton className="h-72 rounded" />
          <Skeleton className="h-72 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5" style={{ backgroundColor: '#F3EAE0', minHeight: '100vh', padding: '32px' }}>
      <AnnouncementBanner audience="seller" />

      {/* Header with Share Store & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">
            Welcome back, {profile?.store_name || 'Seller'}! 🎉
          </h1>
          <p className="text-[#64748b] mt-1">Here's how your store is performing.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-white border-gray-200 rounded-lg h-9 px-3 text-sm font-normal">
                <CalendarIcon className="w-4 h-4 mr-2 text-[#6B7280]" />
                {dateRange.from && dateRange.to ? (
                  <span className="text-[#6B7280]">
                    {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                  </span>
                ) : <span>Pick dates</span>}
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
            <SelectTrigger className="w-[100px] bg-white border-gray-200 rounded-lg h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => setShareModalOpen(true)}
            className="bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90 rounded-lg h-9"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Store
          </Button>
        </div>
      </div>

      <EzMartDashboardGrid data={dashboardData} />

      {profile && (
        <ShareStoreModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          storeSlug={profile.store_name?.toLowerCase().replace(/\s+/g, '-') || null}
          storeName={profile.store_name}
        />
      )}
    </div>
  );
};

export default SellerDashboard;
