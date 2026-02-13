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
import { Download, Calendar as CalendarIcon, ArrowUpDown, Eye, MousePointer, ShoppingCart, TrendingUp, Globe, Activity, Star, BarChart3 } from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval, isWithinInterval, startOfMonth, subMonths, getDay, getHours } from 'date-fns';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import EzMartDashboardGrid, { DashboardStatData } from '@/components/dashboard/EzMartDashboardGrid';

const CATEGORY_COLORS = ['#ff7f00', '#fdba74', '#fed7aa', '#e5e7eb'];
const COUNTRY_BAR_COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#e5e7eb'];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SellerAnalytics = () => {
  const { orders, products, wallet, loading, productAnalytics, trafficAnalytics, buyerCountries } = useSellerContext();
  const { formatAmountOnly } = useCurrency();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [productSortKey, setProductSortKey] = useState<'views' | 'clicks' | 'purchases' | 'revenue' | 'conversion'>('revenue');
  const [productSortAsc, setProductSortAsc] = useState(false);

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

  const filteredAnalytics = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return productAnalytics;
    return productAnalytics.filter(pa => {
      const d = new Date(pa.date);
      return d >= dateRange.from! && d <= dateRange.to!;
    });
  }, [productAnalytics, dateRange]);

  const filteredTraffic = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return trafficAnalytics;
    return trafficAnalytics.filter(ta => {
      const d = new Date(ta.date);
      return d >= dateRange.from! && d <= dateRange.to!;
    });
  }, [trafficAnalytics, dateRange]);

  // ── EzMart Dashboard Data (existing) ─────────────────────────────────
  const dashboardData = useMemo((): DashboardStatData => {
    const now = new Date();
    const weekAgo = subDays(now, 7);
    const twoWeeksAgo = subDays(now, 14);

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

    const totalViews = filteredAnalytics.reduce((s, pa) => s + (pa.views || 0), 0);
    const totalClicks = filteredAnalytics.reduce((s, pa) => s + (pa.clicks || 0), 0);

    const thisWeekAnalytics = productAnalytics.filter(pa => new Date(pa.date) >= weekAgo);
    const lastWeekAnalytics = productAnalytics.filter(pa => {
      const d = new Date(pa.date);
      return d >= twoWeeksAgo && d < weekAgo;
    });
    const thisWeekViews = thisWeekAnalytics.reduce((s, pa) => s + (pa.views || 0), 0);
    const lastWeekViews = lastWeekAnalytics.reduce((s, pa) => s + (pa.views || 0), 0);
    const viewsChange = lastWeekViews > 0
      ? Math.round(((thisWeekViews - lastWeekViews) / lastWeekViews) * 100)
      : (thisWeekViews > 0 ? 100 : 0);

    const totalUniqueVisitors = filteredTraffic.reduce((s, ta) => s + (ta.unique_visitors || 0), 0);
    const uniqueBuyers = new Set(filteredOrders.map(o => o.buyer_id)).size;
    const lastWeekBuyers = new Set(lastWeekOrders.map(o => o.buyer_id)).size;
    const thisWeekBuyers = new Set(thisWeekOrders.map(o => o.buyer_id)).size;
    const visitorsChange = lastWeekBuyers > 0
      ? ((thisWeekBuyers - lastWeekBuyers) / lastWeekBuyers) * 100
      : (thisWeekBuyers > 0 ? 100 : 0);

    const productSales: Record<string, { name: string; revenue: number }> = {};
    filteredOrders.forEach(order => {
      const name = order.product?.name || 'Other';
      if (!productSales[name]) productSales[name] = { name, revenue: 0 };
      productSales[name].revenue += Number(order.seller_earning);
    });
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 4);
    const totalFilteredSales = filteredOrders.reduce((s, o) => s + Number(o.seller_earning), 0);

    const topCategories = topProducts.length > 0 ? topProducts.map((p, i) => ({
      name: p.name, amount: formatAmountOnly(p.revenue), color: CATEGORY_COLORS[i] || '#e5e7eb',
    })) : [{ name: 'No sales yet', amount: formatAmountOnly(0), color: '#e5e7eb' }];

    const dailyRevenue = dateRange.from && dateRange.to
      ? eachDayOfInterval({ start: dateRange.from, end: dateRange.to }).map(day => {
          const dayStart = startOfDay(day);
          const dayEnd = new Date(dayStart.getTime() + 86400000 - 1);
          const dayOrders = filteredOrders.filter(o => isWithinInterval(new Date(o.created_at), { start: dayStart, end: dayEnd }));
          return { date: format(day, 'dd MMM'), revenue: dayOrders.reduce((s, o) => s + Number(o.seller_earning), 0) };
        })
      : [];

    const currentMonthStart = startOfMonth(new Date());
    const prevMonthStart = startOfMonth(subMonths(new Date(), 1));
    const prevMonthOrders = orders.filter(o => { const d = new Date(o.created_at); return d >= prevMonthStart && d < currentMonthStart; });
    const prevMonthRevenue = prevMonthOrders.reduce((s, o) => s + Number(o.seller_earning), 0);
    const monthlyTarget = Math.max(prevMonthRevenue * 1.1, 100);
    const currentMonthOrders = orders.filter(o => new Date(o.created_at) >= currentMonthStart);
    const monthlyRevenue = currentMonthOrders.reduce((s, o) => s + Number(o.seller_earning), 0);
    const monthlyTargetChange = prevMonthRevenue > 0 ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 : (monthlyRevenue > 0 ? 100 : 0);

    const totalOrders = filteredOrders.length;
    const pendingOrders = filteredOrders.filter(o => o.status === 'pending').length;
    const completedOrders = filteredOrders.filter(o => o.status === 'completed' || o.status === 'delivered').length;
    const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled' || o.status === 'refunded').length;
    const maxFunnel = Math.max(totalViews, totalClicks, totalOrders, 1);
    const viewsBadge = viewsChange !== 0 ? `${viewsChange > 0 ? '+' : ''}${viewsChange}%` : '0%';

    const conversionFunnel = [
      { label: 'Product', labelLine2: 'Views', value: totalViews.toLocaleString(), badge: viewsBadge, barHeight: '100%', barColor: '#ffe4c2' },
      { label: 'Total', labelLine2: 'Clicks', value: totalClicks.toLocaleString(), badge: totalClicks > 0 ? `${((totalClicks / Math.max(totalViews, 1)) * 100).toFixed(1)}%` : '0%', barHeight: `${Math.min(Math.max((totalClicks / maxFunnel) * 100 * 3, 15), 100)}%`, barColor: '#ffd4a2' },
      { label: 'Total', labelLine2: 'Orders', value: totalOrders.toLocaleString(), badge: `${totalOrders > 0 ? '+' : ''}${totalOrders}`, barHeight: `${Math.min(Math.max((totalOrders / maxFunnel) * 100 * 5, 15), 100)}%`, barColor: '#ffc482' },
      { label: 'Completed', labelLine2: 'Orders', value: completedOrders.toLocaleString(), badge: `+${completedOrders}`, barHeight: `${Math.min(Math.max((completedOrders / Math.max(totalOrders, 1)) * 100, 10), 100)}%`, barColor: '#ffb362' },
      { label: 'Cancelled', labelLine2: '/ Refunded', value: cancelledOrders.toLocaleString(), badge: `-${cancelledOrders}`, isNegative: cancelledOrders > 0, barHeight: `${Math.min(Math.max((cancelledOrders / Math.max(totalOrders, 1)) * 100, 5), 100)}%`, barColor: '#ff9f42' },
    ];

    const totalBuyerCountry = buyerCountries.reduce((s, c) => s + c.count, 0);
    const activeUsersByCountry = totalBuyerCountry > 0
      ? buyerCountries.slice(0, 5).map((c, i) => ({ country: c.country, percent: Math.round((c.count / totalBuyerCountry) * 100), barColor: COUNTRY_BAR_COLORS[i] || '#e5e7eb' }))
      : [{ country: 'No buyer data', percent: 100, barColor: '#e5e7eb' }];

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

    const recentOrders = filteredOrders.slice(0, 10).map(o => ({
      id: o.id, orderId: o.id.slice(0, 8).toUpperCase(),
      customerName: o.buyer?.full_name || o.buyer?.email || 'Customer',
      productName: o.product?.name || 'Product', productIcon: o.product?.icon_url || undefined,
      qty: 1, total: formatAmountOnly(Number(o.seller_earning)), status: o.status,
    }));

    const recentActivity = filteredOrders.slice(0, 5).map(o => ({
      id: o.id,
      icon: o.status === 'completed' ? 'purchase' : o.status === 'refunded' ? 'price' : 'order',
      message: `${o.buyer?.full_name || 'Customer'} ${o.status === 'completed' ? 'purchased' : o.status} ${o.product?.name || 'a product'}`,
      time: format(new Date(o.created_at), 'MMM d, h:mm a'),
    }));

    return {
      totalSales: totalFilteredSales, totalSalesChange: salesChange,
      totalOrders, totalOrdersChange: ordersChange,
      totalVisitors: totalUniqueVisitors || uniqueBuyers, totalVisitorsChange: visitorsChange,
      thirdCardLabel: 'Avg Rating', thirdCardValue: avgRating > 0 ? `${avgRating.toFixed(1)} ⭐` : 'N/A', thirdCardIcon: 'dollar' as const,
      topCategories, totalCategorySales: formatAmountOnly(totalFilteredSales),
      activeUsers: totalUniqueVisitors || uniqueBuyers, activeUsersByCountry,
      conversionFunnel, trafficSources, formatAmount: formatAmountOnly,
      dailyRevenue, monthlyTarget, monthlyRevenue, monthlyTargetChange,
      recentOrders, recentActivity,
    };
  }, [orders, filteredOrders, products, wallet, dateRange, formatAmountOnly, filteredAnalytics, filteredTraffic, productAnalytics, buyerCountries, avgRating]);

  // ── Deep Analytics Data ──────────────────────────────────────────────

  // Section 1: Per-Product Performance
  const perProductData = useMemo(() => {
    const productMap: Record<string, { name: string; icon: string | null; views: number; clicks: number; purchases: number; revenue: number }> = {};
    products.forEach(p => {
      productMap[p.id] = { name: p.name, icon: p.icon_url, views: 0, clicks: 0, purchases: 0, revenue: 0 };
    });
    filteredAnalytics.forEach(pa => {
      if (productMap[pa.product_id]) {
        productMap[pa.product_id].views += pa.views || 0;
        productMap[pa.product_id].clicks += pa.clicks || 0;
        productMap[pa.product_id].purchases += pa.purchases || 0;
        productMap[pa.product_id].revenue += pa.revenue || 0;
      }
    });
    const arr = Object.values(productMap).map(p => ({
      ...p,
      conversion: p.views > 0 ? (p.purchases / p.views) * 100 : 0,
    }));
    arr.sort((a, b) => productSortAsc ? (a[productSortKey] as number) - (b[productSortKey] as number) : (b[productSortKey] as number) - (a[productSortKey] as number));
    return arr;
  }, [products, filteredAnalytics, productSortKey, productSortAsc]);

  // Section 2: Traffic Sources
  const trafficSourceData = useMemo(() => {
    const sourceMap: Record<string, number> = {};
    filteredTraffic.forEach(ta => {
      const src = ta.source || 'Direct';
      sourceMap[src] = (sourceMap[src] || 0) + (ta.page_views || 0);
    });
    const totalPV = Object.values(sourceMap).reduce((s, v) => s + v, 0) || 1;
    const totalUV = filteredTraffic.reduce((s, ta) => s + (ta.unique_visitors || 0), 0);
    const sources = Object.entries(sourceMap).map(([name, views]) => ({
      name, views, percent: Math.round((views / totalPV) * 100),
    })).sort((a, b) => b.views - a.views);
    return { sources, totalPageViews: totalPV === 1 ? 0 : totalPV, totalUniqueVisitors: totalUV };
  }, [filteredTraffic]);

  // Section 3: Geographic Distribution
  const geoData = useMemo(() => {
    const totalBuyers = buyerCountries.reduce((s, c) => s + c.count, 0);
    // Enrich with order counts and revenue per country
    const countryOrderMap: Record<string, { orders: number; revenue: number }> = {};
    filteredOrders.forEach(o => {
      const country = (o.buyer as any)?.country || 'Unknown';
      if (!countryOrderMap[country]) countryOrderMap[country] = { orders: 0, revenue: 0 };
      countryOrderMap[country].orders += 1;
      countryOrderMap[country].revenue += Number(o.seller_earning);
    });
    const top10 = buyerCountries.slice(0, 10).map(c => ({
      ...c,
      percent: totalBuyers > 0 ? Math.round((c.count / totalBuyers) * 100) : 0,
      orderCount: countryOrderMap[c.country]?.orders || 0,
      revenue: countryOrderMap[c.country]?.revenue || 0,
    }));
    return { countries: top10, totalBuyers };
  }, [buyerCountries, filteredOrders]);

  // Section 4: Store Health
  const storeHealth = useMemo(() => {
    const totalViews = filteredAnalytics.reduce((s, pa) => s + (pa.views || 0), 0);
    const totalClicks = filteredAnalytics.reduce((s, pa) => s + (pa.clicks || 0), 0);
    const totalPurchases = filteredAnalytics.reduce((s, pa) => s + (pa.purchases || 0), 0);
    const totalRevenue = filteredAnalytics.reduce((s, pa) => s + (pa.revenue || 0), 0);
    return {
      avgRating,
      totalViews,
      ctr: totalViews > 0 ? (totalClicks / totalViews) * 100 : 0,
      purchaseRate: totalClicks > 0 ? (totalPurchases / totalClicks) * 100 : 0,
      revenuePerView: totalViews > 0 ? totalRevenue / totalViews : 0,
    };
  }, [filteredAnalytics, avgRating]);

  // Section 5: Time-Based Trends
  const timeTrends = useMemo(() => {
    // Daily views/clicks aggregated
    const dailyMap: Record<string, { views: number; clicks: number }> = {};
    filteredAnalytics.forEach(pa => {
      if (!dailyMap[pa.date]) dailyMap[pa.date] = { views: 0, clicks: 0 };
      dailyMap[pa.date].views += pa.views || 0;
      dailyMap[pa.date].clicks += pa.clicks || 0;
    });
    const dailyTrend = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date: format(new Date(date), 'dd MMM'), ...data }));

    // Peak hours from order timestamps
    const hourCounts = Array(24).fill(0);
    filteredOrders.forEach(o => {
      const hour = getHours(new Date(o.created_at));
      hourCounts[hour]++;
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    // Peak days
    const dayCounts = Array(7).fill(0);
    filteredOrders.forEach(o => {
      const day = getDay(new Date(o.created_at));
      dayCounts[day]++;
    });
    const peakDay = dayCounts.indexOf(Math.max(...dayCounts));

    return { dailyTrend, peakHour, peakDay, hourCounts, dayCounts };
  }, [filteredAnalytics, filteredOrders]);

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

  const toggleSort = (key: typeof productSortKey) => {
    if (productSortKey === key) setProductSortAsc(!productSortAsc);
    else { setProductSortKey(key); setProductSortAsc(false); }
  };

  if (loading) {
    return (
      <div className="bg-[#FCFCFC] min-h-screen p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  const SortHeader = ({ label, sortKey }: { label: string; sortKey: typeof productSortKey }) => (
    <button onClick={() => toggleSort(sortKey)} className="flex items-center gap-1 text-xs font-semibold text-[#6B7280] hover:text-[#1F2937] transition-colors">
      {label}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  return (
    <div className="bg-[#FCFCFC] min-h-screen p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2937]">Analytics</h2>
          <p className="text-sm text-[#6B7280]">Track your store performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-white border-gray-200 rounded-xl h-9 px-3 text-sm font-medium text-[#1F2937]">
                <CalendarIcon className="w-4 h-4 mr-2 text-[#6B7280]" />
                {dateRange.from && dateRange.to ? (
                  <span>{format(dateRange.from, 'MMM d, yyyy')} - {format(dateRange.to, 'MMM d, yyyy')}</span>
                ) : <span>Pick a date range</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white" align="end">
              <Calendar mode="range" selected={dateRange} onSelect={(range) => {
                setDateRange(range || { from: undefined, to: undefined });
                if (range?.from && range?.to) { setPeriod('custom'); setCalendarOpen(false); }
              }} numberOfMonths={2} className="pointer-events-auto" initialFocus />
            </PopoverContent>
          </Popover>

          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-[130px] bg-white border-gray-200 rounded-xl h-9 text-sm font-medium"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white border-gray-200 rounded-xl">
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleExport} className="bg-[#FF7F00] hover:bg-[#e67200] text-white rounded-xl h-9 px-4">
            <Download className="w-4 h-4 mr-2" />Export
          </Button>
        </div>
      </div>

      {/* EzMart Dashboard Grid */}
      <EzMartDashboardGrid data={dashboardData} />

      {/* ══════════════════════════════════════════════════════════════════
          DEEP ANALYTICS SECTIONS
          ══════════════════════════════════════════════════════════════════ */}

      {/* Section 1: Per-Product Performance Table */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#fff7ed] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#FF7F00]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1F2937]">Per-Product Performance</h3>
              <p className="text-xs text-[#6B7280]">{products.length} products tracked</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-2 text-xs font-semibold text-[#6B7280]">Product</th>
                <th className="text-right py-3 px-2"><SortHeader label="Views" sortKey="views" /></th>
                <th className="text-right py-3 px-2"><SortHeader label="Clicks" sortKey="clicks" /></th>
                <th className="text-right py-3 px-2"><SortHeader label="Purchases" sortKey="purchases" /></th>
                <th className="text-right py-3 px-2"><SortHeader label="Revenue" sortKey="revenue" /></th>
                <th className="text-right py-3 px-2"><SortHeader label="Conv. Rate" sortKey="conversion" /></th>
              </tr>
            </thead>
            <tbody>
              {perProductData.length > 0 ? perProductData.map((p, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-[#fff7ed]/50 transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      {p.icon ? (
                        <img src={p.icon} alt="" className="w-7 h-7 rounded-lg object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                          {p.name.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium text-[#1F2937] truncate max-w-[200px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 text-[#6B7280]">{p.views.toLocaleString()}</td>
                  <td className="text-right py-3 px-2 text-[#6B7280]">{p.clicks.toLocaleString()}</td>
                  <td className="text-right py-3 px-2 text-[#6B7280]">{p.purchases.toLocaleString()}</td>
                  <td className="text-right py-3 px-2 font-semibold text-[#1F2937]">{formatAmountOnly(p.revenue)}</td>
                  <td className="text-right py-3 px-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.conversion > 5 ? 'bg-green-50 text-green-600' : p.conversion > 0 ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
                      {p.conversion.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="text-center py-8 text-[#9CA3AF]">No product data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2 & 3: Traffic Sources + Geographic Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Traffic Sources Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-[#fff7ed] flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#FF7F00]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1F2937]">Traffic Sources</h3>
              <p className="text-xs text-[#6B7280]">{trafficSourceData.totalPageViews.toLocaleString()} page views • {trafficSourceData.totalUniqueVisitors.toLocaleString()} unique visitors</p>
            </div>
          </div>
          {trafficSourceData.sources.length > 0 ? (
            <div className="space-y-4">
              {trafficSourceData.sources.map((src, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#1F2937]">{src.name}</span>
                    <span className="text-xs text-[#6B7280]">{src.views.toLocaleString()} ({src.percent}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${src.percent}%`, backgroundColor: COUNTRY_BAR_COLORS[i] || '#ff7f00' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-[#9CA3AF] text-sm">No traffic data yet</div>
          )}
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-[#fff7ed] flex items-center justify-center">
              <Globe className="w-5 h-5 text-[#FF7F00]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1F2937]">Buyer Countries</h3>
              <p className="text-xs text-[#6B7280]">{geoData.totalBuyers} unique buyers</p>
            </div>
          </div>
          {geoData.countries.length > 0 ? (
            <div className="space-y-3">
              {geoData.countries.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-16 text-xs font-medium text-[#1F2937] truncate">{c.country}</div>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${c.percent}%`, backgroundColor: COUNTRY_BAR_COLORS[i % 5] }} />
                  </div>
                  <div className="text-right min-w-[80px]">
                    <span className="text-xs text-[#6B7280]">{c.count} ({c.percent}%)</span>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <span className="text-xs font-semibold text-[#1F2937]">{formatAmountOnly(c.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-[#9CA3AF] text-sm">No buyer country data</div>
          )}
        </div>
      </div>

      {/* Section 4: Store Health Summary */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-lg bg-[#fff7ed] flex items-center justify-center">
            <Star className="w-5 h-5 text-[#FF7F00]" />
          </div>
          <h3 className="text-base font-semibold text-[#1F2937]">Store Health Summary</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Avg Rating', value: storeHealth.avgRating > 0 ? `${storeHealth.avgRating.toFixed(1)} ⭐` : 'N/A', icon: Star },
            { label: 'Total Views', value: storeHealth.totalViews.toLocaleString(), icon: Eye },
            { label: 'Click-Through Rate', value: `${storeHealth.ctr.toFixed(1)}%`, icon: MousePointer },
            { label: 'Purchase Conv. Rate', value: `${storeHealth.purchaseRate.toFixed(1)}%`, icon: ShoppingCart },
            { label: 'Revenue per View', value: formatAmountOnly(storeHealth.revenuePerView), icon: TrendingUp },
          ].map((metric, i) => (
            <div key={i} className="bg-[#FAFAF8] rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <metric.icon className="w-4 h-4 text-[#FF7F00]" />
                <span className="text-xs text-[#6B7280]">{metric.label}</span>
              </div>
              <div className="text-xl font-bold text-[#1F2937]">{metric.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 5: Time-Based Trends */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Views & Clicks Over Time */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-[#fff7ed] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#FF7F00]" />
            </div>
            <h3 className="text-base font-semibold text-[#1F2937]">Views & Clicks Trend</h3>
          </div>
          {timeTrends.dailyTrend.length > 0 ? (() => {
            const maxV = Math.max(...timeTrends.dailyTrend.map(d => d.views), 1);
            const displayData = timeTrends.dailyTrend.slice(-14);
            return (
              <div className="space-y-2">
                {/* Mini SVG chart */}
                <div className="relative h-[120px] w-full">
                  <svg width="100%" height="120" viewBox={`0 0 ${displayData.length * 40} 120`} preserveAspectRatio="none">
                    {displayData.map((d, i) => {
                      const barH = (d.views / maxV) * 100;
                      const clickH = (d.clicks / maxV) * 100;
                      return (
                        <g key={i}>
                          <rect x={i * 40 + 4} y={120 - barH} width="14" height={barH} rx="3" fill="#FFE4C2" />
                          <rect x={i * 40 + 20} y={120 - clickH} width="14" height={clickH} rx="3" fill="#FF7F00" />
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#FFE4C2]" />Views</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#FF7F00]" />Clicks</div>
                </div>
              </div>
            );
          })() : (
            <div className="h-32 flex items-center justify-center text-[#9CA3AF] text-sm">No trend data yet</div>
          )}
        </div>

        {/* Peak Analysis */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-[#fff7ed] flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#FF7F00]" />
            </div>
            <h3 className="text-base font-semibold text-[#1F2937]">Peak Activity</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#FAFAF8] rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-[#6B7280] mb-1">Peak Hour</p>
              <p className="text-lg font-bold text-[#1F2937]">
                {filteredOrders.length > 0 ? `${timeTrends.peakHour}:00 - ${timeTrends.peakHour + 1}:00` : 'N/A'}
              </p>
            </div>
            <div className="bg-[#FAFAF8] rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-[#6B7280] mb-1">Peak Day</p>
              <p className="text-lg font-bold text-[#1F2937]">
                {filteredOrders.length > 0 ? dayNames[timeTrends.peakDay] : 'N/A'}
              </p>
            </div>
          </div>

          {/* Orders by Day of Week */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#6B7280] mb-2">Orders by Day</p>
            {dayNames.map((name, i) => {
              const maxDay = Math.max(...timeTrends.dayCounts, 1);
              const pct = (timeTrends.dayCounts[i] / maxDay) * 100;
              return (
                <div key={name} className="flex items-center gap-2">
                  <span className="w-8 text-xs text-[#6B7280]">{name}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: i === timeTrends.peakDay ? '#FF7F00' : '#FFE4C2' }} />
                  </div>
                  <span className="text-xs text-[#6B7280] w-6 text-right">{timeTrends.dayCounts[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerAnalytics;
