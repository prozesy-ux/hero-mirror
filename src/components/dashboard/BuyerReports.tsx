import { useState, useMemo, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { Download, Calendar, TrendingUp, ShoppingBag, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';

interface Order {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  product?: {
    name: string;
  };
}

const BuyerReports = () => {
  const { user } = useAuthContext();
  const { formatAmountOnly } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 90),
    to: new Date()
  });
  const [period, setPeriod] = useState('90d');

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('seller_orders')
      .select('id, amount, status, created_at, product:seller_products(name)')
      .eq('buyer_id', user?.id)
      .order('created_at', { ascending: false });

    if (data) setOrders(data as Order[]);
    setLoading(false);
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    const now = new Date();
    switch (value) {
      case '30d':
        setDateRange({ from: subDays(now, 30), to: now });
        break;
      case '90d':
        setDateRange({ from: subDays(now, 90), to: now });
        break;
      case '1y':
        setDateRange({ from: subDays(now, 365), to: now });
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

  // Summary stats
  const stats = useMemo(() => {
    const totalSpent = filteredOrders.reduce((sum, o) => sum + o.amount, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
    return { totalSpent, totalOrders, avgOrderValue, completedOrders };
  }, [filteredOrders]);

  // Monthly spending data
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(now, 5),
      end: now
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthOrders = orders.filter(o => {
        const d = new Date(o.created_at);
        return d >= monthStart && d <= monthEnd;
      });

      return {
        month: format(month, 'MMM yyyy'),
        spending: monthOrders.reduce((sum, o) => sum + o.amount, 0),
        orders: monthOrders.length
      };
    });
  }, [orders]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    filteredOrders.forEach(order => {
      const category = order.product?.name?.split(' ')[0] || 'Other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + order.amount);
    });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name: name.substring(0, 12), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredOrders]);

  const exportData = () => {
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
    a.download = `spending-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
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
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={exportData} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-5 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Spent</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{formatAmountOnly(stats.totalSpent)}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Orders</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalOrders}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Avg Order Value</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{formatAmountOnly(stats.avgOrderValue)}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-violet-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-5 border-2 border-black shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Completed</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.completedOrders}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Spending Trend */}
        <div className="bg-white rounded-lg p-6 border-2 border-black shadow-neobrutalism">
          <h3 className="font-semibold text-slate-800 mb-4">Monthly Spending</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="reportSpendingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <Tooltip 
                  formatter={(value: any) => formatAmountOnly(value)}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="spending" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  fill="url(#reportSpendingGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              No data available
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg p-6 border-2 border-black shadow-neobrutalism">
          <h3 className="font-semibold text-slate-800 mb-4">Spending by Product</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 11 }} 
                  stroke="#94A3B8" 
                  width={80}
                />
                <Tooltip 
                  formatter={(value: any) => formatAmountOnly(value)}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              No category data
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BuyerReports;
