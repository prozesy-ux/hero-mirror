import { useState, useMemo, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Download } from 'lucide-react';
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

  // Handle period change
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

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return orders;
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= dateRange.from! && orderDate <= dateRange.to!;
    });
  }, [orders, dateRange]);

  // Calculate stats
  const stats = useMemo(() => {
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

    return { totalSpent, totalOrders, avgOrderValue, spentChange };
  }, [filteredOrders, orders, dateRange]);

  // Spending by day for chart
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
      .slice(-14); // Last 14 days
  }, [filteredOrders]);

  // Spending by category (mock since we don't have category names)
  const spendingByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    filteredOrders.forEach(order => {
      const category = order.product?.name?.split(' ')[0] || 'Other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + order.amount);
    });

    const colors = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EC4899'];
    return Array.from(categoryMap.entries())
      .map(([name, value], i) => ({
        name: name.substring(0, 10),
        value,
        color: colors[i % colors.length]
      }))
      .slice(0, 5);
  }, [filteredOrders]);

  // Monthly spending trend
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl border-2 border-black" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl border-2 border-black" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - No Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-white border-slate-200 rounded-xl">
                <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                <span className="text-sm text-slate-600">
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
            <SelectTrigger className="w-[140px] bg-white border-slate-200 rounded-xl">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={exportData} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards - Gumroad Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded p-8">
          <div className="flex items-center gap-2 text-base mb-2">
            <span className="text-slate-700">Total Spent</span>
          </div>
          <div className="text-4xl font-semibold text-slate-900">{formatAmountOnly(stats.totalSpent)}</div>
          {stats.spentChange !== 0 && (
            <p className="text-sm text-slate-500 mt-2">
              {stats.spentChange > 0 ? '+' : ''}{stats.spentChange.toFixed(1)}% vs last period
            </p>
          )}
        </div>

        <div className="bg-white border rounded p-8">
          <div className="flex items-center gap-2 text-base mb-2">
            <span className="text-slate-700">Total Orders</span>
          </div>
          <div className="text-4xl font-semibold text-slate-900">{stats.totalOrders}</div>
        </div>

        <div className="bg-white border rounded p-8">
          <div className="flex items-center gap-2 text-base mb-2">
            <span className="text-slate-700">Avg Order Value</span>
          </div>
          <div className="text-4xl font-semibold text-slate-900">{formatAmountOnly(stats.avgOrderValue)}</div>
        </div>

        <div className="bg-white border rounded p-8">
          <div className="flex items-center gap-2 text-base mb-2">
            <span className="text-slate-700">This Month</span>
          </div>
          <div className="text-4xl font-semibold text-slate-900">
            {formatAmountOnly(orders.filter(o => new Date(o.created_at) >= startOfMonth(new Date())).reduce((s, o) => s + o.amount, 0))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Spending Details Chart */}
        <div className="bg-white rounded-lg p-6 border-2 border-black shadow-neobrutalism">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Spending Details</h3>
          </div>
          {/* Chart Legend */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-xs text-slate-600">Spending</span>
            </div>
          </div>
          {spendingByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={spendingByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
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
                    borderRadius: '12px', 
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    padding: '12px 16px'
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#F97316" 
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              No spending data for this period
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg p-6 border-2 border-black shadow-neobrutalism">
          <h3 className="font-semibold text-slate-800 mb-4">Spending by Product</h3>
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
                >
                  {spendingByCategory.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatAmountOnly(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              No category data
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-lg p-6 border-2 border-black shadow-neobrutalism">
        <h3 className="font-semibold text-slate-800 mb-4">Monthly Spending Trend</h3>
        {monthlyTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" tickFormatter={(v) => formatAmountOnly(v)} />
              <Tooltip formatter={(value: any) => formatAmountOnly(value)} />
              <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-slate-400">
            No monthly data yet
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerAnalytics;
