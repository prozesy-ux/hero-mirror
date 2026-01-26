import { useMemo } from 'react';
import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { TrendingUp, Users, ShoppingBag, DollarSign, Package, Wallet, Calendar, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays, startOfMonth } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';

const AdminAnalytics = () => {
  const { profiles, purchases, accountOrders, sellerProfiles, isLoading, refreshAll } = useAdminDataContext();

  // Calculate platform stats
  const stats = useMemo(() => {
    const totalUsers = profiles.length;
    const proUsers = profiles.filter((p: any) => p.is_pro).length;
    const totalSellers = sellerProfiles?.length || 0;
    const activeSellers = sellerProfiles?.filter((s: any) => s.is_active && !s.is_deleted).length || 0;
    
    const totalRevenue = purchases
      .filter((p: any) => p.payment_status === 'completed')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    
    const accountOrderRevenue = accountOrders
      .filter((o: any) => o.payment_status === 'completed')
      .reduce((sum: number, o: any) => sum + Number(o.amount), 0);

    // This month's stats
    const monthStart = startOfMonth(new Date());
    const thisMonthUsers = profiles.filter((p: any) => new Date(p.created_at) >= monthStart).length;
    const thisMonthRevenue = purchases
      .filter((p: any) => p.payment_status === 'completed' && new Date(p.purchased_at) >= monthStart)
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    return { 
      totalUsers, 
      proUsers, 
      totalSellers, 
      activeSellers, 
      totalRevenue: totalRevenue + accountOrderRevenue,
      thisMonthUsers,
      thisMonthRevenue
    };
  }, [profiles, purchases, accountOrders, sellerProfiles]);

  // Revenue by day (last 14 days)
  const revenueByDay = useMemo(() => {
    const dayMap = new Map<string, number>();
    
    [...purchases, ...accountOrders].forEach((order: any) => {
      if (order.payment_status === 'completed') {
        const day = format(new Date(order.purchased_at || order.created_at), 'MMM d');
        dayMap.set(day, (dayMap.get(day) || 0) + Number(order.amount));
      }
    });

    const maxRevenue = Math.max(...Array.from(dayMap.values()), 1);
    return Array.from(dayMap.entries())
      .map(([date, amount]) => ({
        date,
        amount,
        percentage: Math.round((amount / maxRevenue) * 100)
      }))
      .slice(-14);
  }, [purchases, accountOrders]);

  // User growth by month
  const userGrowth = useMemo(() => {
    const monthMap = new Map<string, number>();
    
    profiles.forEach((profile: any) => {
      const month = format(new Date(profile.created_at), 'MMM');
      monthMap.set(month, (monthMap.get(month) || 0) + 1);
    });

    return Array.from(monthMap.entries())
      .map(([month, count]) => ({ month, users: count }))
      .slice(-6);
  }, [profiles]);

  // Revenue breakdown
  const revenueBreakdown = useMemo(() => {
    const proRevenue = purchases
      .filter((p: any) => p.payment_status === 'completed')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    
    const accountRevenue = accountOrders
      .filter((o: any) => o.payment_status === 'completed')
      .reduce((sum: number, o: any) => sum + Number(o.amount), 0);

    return [
      { name: 'Pro Subscriptions', value: proRevenue, color: '#8B5CF6' },
      { name: 'AI Accounts', value: accountRevenue, color: '#3B82F6' }
    ].filter(s => s.value > 0);
  }, [purchases, accountOrders]);

  const exportReport = () => {
    const csv = [
      `Platform Analytics Report - ${format(new Date(), 'yyyy-MM-dd')}`,
      '',
      'SUMMARY',
      `Total Users,${stats.totalUsers}`,
      `Pro Users,${stats.proUsers}`,
      `Total Sellers,${stats.totalSellers}`,
      `Active Sellers,${stats.activeSellers}`,
      `Total Revenue,$${stats.totalRevenue.toFixed(2)}`,
      '',
      'REVENUE BY DAY',
      'Date,Amount',
      ...revenueByDay.map(d => `${d.date},$${d.amount.toFixed(2)}`)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Report exported');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl bg-white/5" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Platform Analytics</h1>
          <p className="text-sm text-slate-400">Monitor platform performance and metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refreshAll()}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            size="sm" 
            onClick={exportReport}
            className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Users</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.totalUsers}</p>
              <p className="text-xs text-blue-400 mt-1">+{stats.thisMonthUsers} this month</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <Users className="h-7 w-7 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Pro Users</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.proUsers}</p>
              <p className="text-xs text-amber-400 mt-1">{stats.totalUsers > 0 ? ((stats.proUsers / stats.totalUsers) * 100).toFixed(1) : 0}% conversion</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
              <TrendingUp className="h-7 w-7 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Active Sellers</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.activeSellers}</p>
              <p className="text-xs text-violet-400 mt-1">of {stats.totalSellers} total</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center">
              <ShoppingBag className="h-7 w-7 text-violet-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Revenue</p>
              <p className="text-3xl font-bold text-white mt-1">${stats.totalRevenue.toFixed(0)}</p>
              <p className="text-xs text-emerald-400 mt-1">${stats.thisMonthRevenue.toFixed(0)} this month</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="h-7 w-7 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
          <h3 className="font-semibold text-white mb-4">Revenue Trend</h3>
          {revenueByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={revenueByDay}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} stroke="#334155" />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} stroke="#334155" tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  formatter={(value: any) => [`$${value}`, 'Revenue']}
                  contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94A3B8' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-500">
              No revenue data yet
            </div>
          )}
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
          <h3 className="font-semibold text-white mb-4">Revenue Breakdown</h3>
          {revenueBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={revenueBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {revenueBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-500">
              No revenue breakdown data
            </div>
          )}
        </div>
      </div>

      {/* User Growth */}
      <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
        <h3 className="font-semibold text-white mb-4">User Growth</h3>
        {userGrowth.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} stroke="#334155" />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} stroke="#334155" />
              <Tooltip 
                contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94A3B8' }}
              />
              <Bar dataKey="users" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-slate-500">
            No user growth data
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
