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
import { format, subDays, subMonths } from 'date-fns';
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
    const thisMonthStart = subMonths(now, 1);
    const lastMonthStart = subMonths(now, 2);

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

    const pendingBalance = wallet?.pending_balance || 0;
    
    const totalOrders = filteredOrders.length;
    const thisWeekOrderCount = thisWeekOrders.length;
    const lastWeekOrderCount = lastWeekOrders.length;
    const ordersChange = lastWeekOrderCount > 0
      ? ((thisWeekOrderCount - lastWeekOrderCount) / lastWeekOrderCount) * 100
      : (thisWeekOrderCount > 0 ? 100 : 0);

    const activeProducts = products.filter(p => p.is_available && p.is_approved).length;
    const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    const thisMonthOrders = orders.filter(o => new Date(o.created_at) >= thisMonthStart);
    const lastMonthOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= lastMonthStart && d < thisMonthStart;
    });
    const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);

    const productSales: Record<string, { name: string; revenue: number; count: number }> = {};
    filteredOrders.forEach(order => {
      const productId = order.product_id;
      const productName = order.product?.name || 'Unknown';
      if (!productSales[productId]) {
        productSales[productId] = { name: productName, revenue: 0, count: 0 };
      }
      productSales[productId].revenue += Number(order.seller_earning);
      productSales[productId].count += 1;
    });
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    const maxProductRevenue = topProducts.length > 0 ? topProducts[0].revenue : 1;

    const statusBreakdown = {
      pending: filteredOrders.filter(o => o.status === 'pending').length,
      delivered: filteredOrders.filter(o => o.status === 'delivered').length,
      completed: filteredOrders.filter(o => o.status === 'completed').length,
      refunded: filteredOrders.filter(o => o.status === 'refunded').length
    };

    // Daily revenue for chart
    const dailyData: { date: string; revenue: number }[] = [];
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    for (let i = days - 1; i >= 0; i--) {
      const day = subDays(now, i);
      const dayStr = format(day, 'MMM dd');
      const dayRevenue = orders
        .filter(o => format(new Date(o.created_at), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
        .reduce((sum, o) => sum + Number(o.seller_earning), 0);
      dailyData.push({ date: dayStr, revenue: dayRevenue });
    }

    return {
      totalRevenue,
      revenueChange,
      pendingBalance,
      totalOrders,
      ordersChange,
      activeProducts,
      completionRate,
      thisMonthRevenue,
      lastMonthRevenue,
      topProducts,
      maxProductRevenue,
      statusBreakdown,
      dailyData
    };
  }, [orders, filteredOrders, products, wallet, period]);

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

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const recentOrders = orders.slice(0, 5);

  const dashboardData: DashboardStatData = useMemo(() => ({
    totalSales: metrics.totalRevenue,
    totalSalesChange: metrics.revenueChange,
    totalOrders: metrics.totalOrders,
    totalOrdersChange: metrics.ordersChange,
    totalVisitors: 237782,
    totalVisitorsChange: 8.02,
    revenueChartData: metrics.dailyData.slice(-8).map(d => ({
      date: d.date,
      revenue: d.revenue,
      orders: Math.round(d.revenue * 0.6),
    })),
    monthlyTarget: 100000,
    monthlyProgress: Math.min(Math.round(metrics.completionRate), 100) || 85,
    targetAmount: 100000,
    revenueAmount: metrics.thisMonthRevenue || 85000,
    topCategories: [
      { name: 'Electronics', value: 40, color: '#FF7F00' },
      { name: 'Fashion', value: 25, color: '#FDBA74' },
      { name: 'Home & Kitchen', value: 20, color: '#FED7AA' },
      { name: 'Beauty & Care', value: 15, color: '#FFEDD5' },
    ],
    totalCategorySales: `$${(metrics.totalRevenue / 1000000).toFixed(1)}M`,
    activeUsers: 2758,
    activeUsersByCountry: [
      { country: 'United States', flag: '🇺🇸', percent: 36 },
      { country: 'United Kingdom', flag: '🇬🇧', percent: 24 },
      { country: 'Indonesia', flag: '🇮🇩', percent: 17.5 },
      { country: 'Russia', flag: '🇷🇺', percent: 15 },
    ],
    conversionFunnel: [
      { label: 'Product Views', value: '25K', percent: 100 },
      { label: 'Add to Cart', value: '12K', percent: 48 },
      { label: 'Checkout', value: '8.5K', percent: 34 },
      { label: 'Purchases', value: '6.2K', percent: 25 },
      { label: 'Abandoned', value: '3K', percent: 12 },
    ],
    trafficSources: [
      { name: 'Direct', percent: 40, color: '#FF7F00' },
      { name: 'Organic', percent: 30, color: '#FDBA74' },
      { name: 'Social', percent: 15, color: '#FED7AA' },
      { name: 'Referral', percent: 10, color: '#FFEDD5' },
      { name: 'Email', percent: 5, color: '#FFC482' },
    ],
    formatAmount: formatAmountOnly,
  }), [metrics, formatAmountOnly]);

  if (loading) {
    return (
      <div className="space-y-5 p-4 lg:p-6" style={{ backgroundColor: '#f4f5f7' }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-5">
          <Skeleton className="h-72 rounded-2xl col-span-2" />
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 lg:p-6" style={{ backgroundColor: '#f4f5f7', minHeight: '100vh' }}>
      <AnnouncementBanner audience="seller" />

      {/* Header with Share Store & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">
            Welcome back, {profile?.store_name || 'Seller'}! 🎉
          </h1>
          <p className="text-[#6B7280] mt-1">Here's how your store is performing.</p>
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
            className="bg-[#FF7F00] text-white hover:bg-[#FF7F00]/90 rounded-lg h-9"
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
