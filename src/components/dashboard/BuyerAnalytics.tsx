import { useState, useMemo, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Download, DollarSign, ShoppingCart, CreditCard, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays, startOfMonth } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';

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
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('seller_orders')
      .select('id, amount, status, created_at, product:seller_products(name, category_id)')
      .eq('buyer_id', user?.id)
      .order('created_at', { ascending: false });

    if (data) setOrders(data as Order[]);
    setLoading(false);
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    const now = new Date();
    switch (value) {
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
  };

  const filteredOrders = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return orders;
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= dateRange.from! && orderDate <= dateRange.to!;
    });
  }, [orders, dateRange]);

  const stats = useMemo(() => {
    const totalSpent = filteredOrders.reduce((sum, o) => sum + o.amount, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    
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

    return { totalSpent, totalOrders, avgOrderValue, spentChange };
  }, [filteredOrders, orders, dateRange]);

  const spendingByDay = useMemo(() => {
    const dayMap = new Map<string, number>();
    
    filteredOrders.forEach(order => {
      const day = format(new Date(order.created_at), 'MMM d');
      dayMap.set(day, (dayMap.get(day) || 0) + order.amount);
    });

    const maxSpending = Math.max(...Array.from(dayMap.values()), 1);

    return Array.from(dayMap.entries())
      .map(([date, amount]) => ({
        date,
        amount,
        percentage: Math.round((amount / maxSpending) * 100)
      }))
      .slice(-14);
  }, [filteredOrders]);

  const spendingByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    filteredOrders.forEach(order => {
      const category = order.product?.name?.split(' ')[0] || 'Other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + order.amount);
    });

    const colors = ['#FF8A00', '#FF9933', '#FFB366', '#FFCC99', '#FFE5CC'];
    return Array.from(categoryMap.entries())
      .map(([name, value], i) => ({
        name: name.substring(0, 10),
        value,
        color: colors[i % colors.length]
      }))
      .slice(0, 5);
  }, [filteredOrders]);

  const monthlyTrend = useMemo(() => {
    const monthMap = new Map<string, number>();
    
    orders.forEach(order => {
      const month = format(new Date(order.created_at), 'MMM yyyy');
      monthMap.set(month, (monthMap.get(month) || 0) + order.amount);
    });

    return Array.from(monthMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .slice(-6);
  }, [orders]);

  const exportData = () => {
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
    toast.success('Report exported');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - EzMart Style */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-[32px] font-bold" style={{ color: '#333' }}>Analytics</h1>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-white rounded-lg h-10 px-4"
                style={{ borderColor: '#F0F0F0', color: '#666' }}
              >
                <Calendar className="w-4 h-4 mr-2" style={{ color: '#FF8A00' }} />
                <span className="text-sm">
                  {dateRange.from && dateRange.to 
                    ? `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`
                    : 'Select dates'
                  }
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="range"
                selected={dateRange}
                onSelect={(range) => range && setDateRange(range)}
                numberOfMonths={2}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger 
              className="w-[140px] bg-white rounded-lg h-10"
              style={{ borderColor: '#F0F0F0', color: '#666' }}
            >
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent className="bg-white rounded-lg" style={{ borderColor: '#F0F0F0' }}>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={exportData} 
            className="text-white rounded-lg h-10 hover:opacity-90"
            style={{ backgroundColor: '#FF8A00' }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards - 3 Column EzMart Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="ezmart-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: '#666' }}>Total Spent</p>
              <p className="text-[28px] font-bold" style={{ color: '#333' }}>{formatAmountOnly(stats.totalSpent)}</p>
              {stats.spentChange !== 0 && (
                <p className="text-xs mt-2 flex items-center gap-1" style={{ color: stats.spentChange > 0 ? '#EF4444' : '#10B981' }}>
                  <ArrowUpRight className="w-3 h-3" />
                  {stats.spentChange > 0 ? '+' : ''}{stats.spentChange.toFixed(1)}% vs last period
                </p>
              )}
            </div>
            <div className="ezmart-icon-box">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="ezmart-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: '#666' }}>Total Orders</p>
              <p className="text-[28px] font-bold" style={{ color: '#333' }}>{stats.totalOrders}</p>
              <p className="text-xs mt-2" style={{ color: '#999' }}>In selected period</p>
            </div>
            <div className="ezmart-icon-box">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="ezmart-card" style={{ backgroundColor: '#FFECD1' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: '#666' }}>This Month</p>
              <p className="text-[28px] font-bold" style={{ color: '#333' }}>
                {formatAmountOnly(orders.filter(o => new Date(o.created_at) >= startOfMonth(new Date())).reduce((s, o) => s + o.amount, 0))}
              </p>
              <p className="text-xs mt-2" style={{ color: '#999' }}>Avg: {formatAmountOnly(stats.avgOrderValue)}/order</p>
            </div>
            <div className="ezmart-icon-box">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts - 2 Column */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Spending Details Chart */}
        <div className="ezmart-card !p-0">
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: '#F0F0F0' }}>
            <h3 className="text-lg font-semibold" style={{ color: '#333' }}>Spending Details</h3>
            <button className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: '#FFF5EB', color: '#FF8A00' }}>
              Spending
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF8A00' }} />
                <span className="text-xs" style={{ color: '#666' }}>Spending</span>
              </div>
            </div>
            {spendingByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={spendingByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#999' }} 
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value.toString()}
                  />
                  <Tooltip 
                    formatter={(value: any, name: any, props: any) => [
                      formatAmountOnly(props.payload.amount),
                      'Spending'
                    ]}
                    contentStyle={{ 
                      borderRadius: 12, 
                      border: '1px solid #F0F0F0',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      padding: '12px 16px'
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="#FF8A00" 
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center" style={{ color: '#999' }}>
                No spending data for this period
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown - Donut */}
        <div className="ezmart-card !p-0">
          <div className="p-6 border-b" style={{ borderColor: '#F0F0F0' }}>
            <h3 className="text-lg font-semibold" style={{ color: '#333' }}>Spending by Product</h3>
          </div>
          <div className="p-6">
            {spendingByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={spendingByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {spendingByCategory.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => formatAmountOnly(value)} 
                    contentStyle={{ 
                      borderRadius: 12, 
                      border: '1px solid #F0F0F0',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center" style={{ color: '#999' }}>
                No category data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="ezmart-card !p-0">
        <div className="p-6 border-b" style={{ borderColor: '#F0F0F0' }}>
          <h3 className="text-lg font-semibold" style={{ color: '#333' }}>Monthly Spending Trend</h3>
        </div>
        <div className="p-6">
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#999' }} />
                <YAxis tick={{ fontSize: 11, fill: '#999' }} tickFormatter={(v) => formatAmountOnly(v)} />
                <Tooltip 
                  formatter={(value: any) => formatAmountOnly(value)} 
                  contentStyle={{ 
                    borderRadius: 12, 
                    border: '1px solid #F0F0F0',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                  }}
                />
                <Bar dataKey="amount" fill="#FF8A00" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center" style={{ color: '#999' }}>
              No monthly data yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerAnalytics;
