import { useEffect, useState, useMemo } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { 
  Package,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Award,
  Star,
  AlertTriangle,
  ChevronDown,
  Download,
  Calendar as CalendarIcon
} from 'lucide-react';
import { format, subDays, eachDayOfInterval, isWithinInterval, startOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TrustScore {
  trust_score: number;
  total_reports: number;
  successful_orders: number;
  buyer_approved_count: number;
}

const SellerDashboard = () => {
  const { profile, wallet, products, orders, loading } = useSellerContext();
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.id) {
      fetchTrustScore();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('trust-score-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seller_trust_scores',
        filter: `seller_id=eq.${profile.id}`
      }, () => {
        fetchTrustScore();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  const fetchTrustScore = async () => {
    if (!profile?.id) return;
    
    const { data } = await supabase
      .from('seller_trust_scores')
      .select('trust_score, total_reports, successful_orders, buyer_approved_count')
      .eq('seller_id', profile.id)
      .single();
    
    if (data) {
      setTrustScore(data);
    }
  };

  // Calculate stats
  const todayStart = startOfDay(new Date());
  const todayOrders = orders.filter(o => new Date(o.created_at) >= todayStart);
  const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const refundedOrders = orders.filter(o => o.status === 'refunded').length;

  // Chart data
  const chartData = useMemo(() => {
    const days = chartPeriod === '7d' ? 7 : chartPeriod === '30d' ? 30 : 90;
    const startDate = subDays(new Date(), days);
    const dateRange = eachDayOfInterval({ start: startDate, end: new Date() });

    return dateRange.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
      
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        return isWithinInterval(orderDate, { start: dayStart, end: dayEnd });
      });

      return {
        date: format(day, 'MMM d'),
        sales: dayOrders.reduce((sum, o) => sum + Number(o.seller_earning), 0),
        orders: dayOrders.length
      };
    });
  }, [orders, chartPeriod]);

  // Recent orders for table
  const recentOrders = orders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  // Low stock products
  const lowStockProducts = products
    .filter(p => (p.stock ?? 0) <= 5 && p.is_available)
    .slice(0, 4);

  // Best selling products
  const bestSellers = products
    .filter(p => p.sold_count > 0)
    .sort((a, b) => b.sold_count - a.sold_count)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="p-4 lg:p-6 bg-[#F7F8FA] min-h-screen space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] font-semibold">Pending</Badge>;
      case 'delivered':
        return <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px] font-semibold">Delivered</Badge>;
      case 'completed':
        return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] font-semibold">Completed</Badge>;
      case 'refunded':
        return <Badge className="bg-red-100 text-red-700 border-0 text-[10px] font-semibold">Refunded</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-0 text-[10px] font-semibold">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 lg:p-6 bg-[#F7F8FA] min-h-screen space-y-6 seller-dashboard">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 seller-heading">Dashboard</h1>
          <p className="text-sm text-slate-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex items-center gap-3">
          {trustScore && (
            <Badge className={`px-3 py-1.5 text-xs font-semibold ${
              trustScore.trust_score >= 90 ? 'bg-emerald-100 text-emerald-700' :
              trustScore.trust_score >= 70 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              {trustScore.trust_score}% Trust Score
            </Badge>
          )}
          <Button 
            variant="outline" 
            size="sm"
            className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
            onClick={() => navigate('/seller/analytics')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards - 4 Column Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Orders */}
        <button 
          onClick={() => navigate('/seller/orders')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all text-left"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Today's Orders</p>
              <p className="text-3xl font-extrabold text-slate-800 mt-1 seller-stat-number">{todayOrders.length}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-600">+{pendingOrders} pending</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </button>

        {/* Today's Sales */}
        <button 
          onClick={() => navigate('/seller/analytics')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all text-left"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Today's Sales</p>
              <p className="text-3xl font-extrabold text-slate-800 mt-1 seller-stat-number">${todaySales.toFixed(0)}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-600">{completedOrders} completed</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </button>

        {/* Total Balance */}
        <button 
          onClick={() => navigate('/seller/wallet')}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all text-left"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Balance</p>
              <p className="text-3xl font-extrabold text-slate-800 mt-1 seller-stat-number">${(wallet?.balance || 0).toFixed(0)}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs font-medium text-slate-500">${(wallet?.pending_balance || 0).toFixed(0)} pending</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </button>

        {/* Returns & Refunds */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Returns & Refunds</p>
              <p className="text-3xl font-extrabold text-slate-800 mt-1 seller-stat-number">{refundedOrders}</p>
              <div className="flex items-center gap-1.5 mt-2">
                {refundedOrders > 0 ? (
                  <>
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                    <span className="text-xs font-medium text-red-600">Needs attention</span>
                  </>
                ) : (
                  <span className="text-xs font-medium text-emerald-600">All clear!</span>
                )}
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
              <Package className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Row - Chart + Quick Stats */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sales Details Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Sales Details</h3>
              <p className="text-sm text-slate-500">Revenue over time</p>
            </div>
            <Select value={chartPeriod} onValueChange={(v) => setChartPeriod(v as typeof chartPeriod)}>
              <SelectTrigger className="w-[130px] bg-slate-50 border-slate-200 rounded-xl text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                  tickFormatter={v => `$${v}`}
                  width={50}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: 12, 
                    border: 'none', 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    fontSize: 12
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3B82F6" 
                  strokeWidth={2.5}
                  fill="url(#salesGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-5">Quick Stats</h3>
          <div className="space-y-4">
            {/* Products */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Package className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Products</p>
                  <p className="text-xs text-slate-500">{products.filter(p => p.is_approved).length} live</p>
                </div>
              </div>
              <span className="text-xl font-bold text-slate-800">{products.length}</span>
            </div>

            {/* Messages */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Messages</p>
                  <p className="text-xs text-slate-500">Unread chats</p>
                </div>
              </div>
              <span className="text-xl font-bold text-slate-800">0</span>
            </div>

            {/* Success Rate */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Award className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Success Rate</p>
                  <p className="text-xs text-slate-500">Completion rate</p>
                </div>
              </div>
              <span className="text-xl font-bold text-emerald-600">
                {orders.length > 0 ? Math.round((completedOrders / orders.length) * 100) : 100}%
              </span>
            </div>

            {/* Rating */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Star className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Rating</p>
                  <p className="text-xs text-slate-500">Avg feedback</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map(i => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
                <Star className="h-4 w-4 text-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Content Row - Orders Table + Low Stock */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Details Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Order Details</h3>
              <p className="text-sm text-slate-500">Recent transactions</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/seller/orders')}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-10 text-center">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-5 py-3">Order ID</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-5 py-3">Product</th>
                    <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-5 py-3 hidden sm:table-cell">Date</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide px-5 py-3">Amount</th>
                    <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-sm font-medium text-slate-700">#{order.id.slice(-6).toUpperCase()}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {order.product?.icon_url ? (
                              <img src={order.product.icon_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <span className="text-sm text-slate-700 truncate max-w-[120px]">
                            {order.product?.name || 'Product'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className="text-sm text-slate-500">{format(new Date(order.created_at), 'MMM d, h:mm a')}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-sm font-semibold text-slate-800">${Number(order.seller_earning).toFixed(2)}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {getStatusBadge(order.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock / Out of Stock */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Low Stock Alert</h3>
              <p className="text-sm text-slate-500">Products need restocking</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="py-8 text-center">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">All products in stock</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.icon_url ? (
                      <img src={product.icon_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                    <p className="text-xs text-amber-600 font-medium">
                      {(product.stock ?? 0) === 0 ? 'Out of stock' : `${product.stock} left`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Best Selling Products */}
      {bestSellers.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Best Selling Products</h3>
              <p className="text-sm text-slate-500">Top performers this month</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/seller/products')}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
            >
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-5 py-3">#</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-5 py-3">Product</th>
                  <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wide px-5 py-3">Sold</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide px-5 py-3">Revenue</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wide px-5 py-3 hidden sm:table-cell">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bestSellers.map((product, index) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <span className="text-sm font-bold text-slate-400">{index + 1}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {product.icon_url ? (
                            <img src={product.icon_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="text-sm font-semibold text-slate-800">{product.sold_count}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-sm font-semibold text-emerald-600">
                        ${(product.sold_count * product.price * 0.9).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right hidden sm:table-cell">
                      <div className="flex items-center justify-end gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i <= 4 ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
