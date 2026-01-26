import { useEffect, useState, useMemo } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  TrendingUp, 
  Wallet, 
  RotateCcw,
  Globe,
  MessageSquare,
  BarChart3,
  Star,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TrustScore {
  trust_score: number;
  total_reports: number;
  successful_orders: number;
  buyer_approved_count: number;
}

const SellerDashboard = () => {
  const { profile, wallet, products, orders, loading } = useSellerContext();
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const [outOfStockIndex, setOutOfStockIndex] = useState(0);
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
  const todayOrders = orders.filter(o => {
    try {
      return isToday(parseISO(o.created_at));
    } catch {
      return false;
    }
  });

  const todayOrderCount = todayOrders.length;
  const todaySales = todayOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  const returnsCount = orders.filter(o => o.status === 'refunded' || o.status === 'return').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered' || o.status === 'completed').length;
  const buyBoxWinRate = orders.length > 0 ? Math.round((deliveredOrders / orders.length) * 100) : 0;

  // Out of stock products
  const outOfStockProducts = products.filter(p => (p.stock ?? 0) === 0);

  // Recent orders for table (last 4)
  const recentOrders = orders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  // Sales chart data (last 7 days mock - in real scenario, aggregate from orders)
  const salesChartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayOrders = orders.filter(o => {
        try {
          const orderDate = parseISO(o.created_at);
          return orderDate.toDateString() === date.toDateString();
        } catch {
          return false;
        }
      });
      const revenue = dayOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
      data.push({
        name: format(date, 'EEE'),
        revenue: revenue,
        percentage: Math.min(100, (revenue / 1000) * 100) // Scale for visualization
      });
    }
    return data;
  }, [orders]);

  const handlePrevProduct = () => {
    setOutOfStockIndex(prev => 
      prev === 0 ? Math.max(0, outOfStockProducts.length - 1) : prev - 1
    );
  };

  const handleNextProduct = () => {
    setOutOfStockIndex(prev => 
      prev >= outOfStockProducts.length - 1 ? 0 : prev + 1
    );
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 border-0';
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-0';
      case 'return':
      case 'refunded':
        return 'bg-blue-100 text-blue-700 border-0';
      default:
        return 'bg-gray-100 text-gray-700 border-0';
    }
  };

  if (loading) {
    return (
      <div className="space-y-5 p-1">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-white" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <Skeleton className="lg:col-span-2 h-72 rounded-2xl bg-white" />
          <Skeleton className="h-72 rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  const currentOutOfStock = outOfStockProducts[outOfStockIndex];

  return (
    <div className="space-y-5">
      {/* Top Stats Row - 4 Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Order */}
        <div 
          className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/seller/orders')}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Today's Order</p>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">{todayOrderCount}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-500">1.3% Up from yesterday</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Package className="h-6 w-6 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Today's Sale */}
        <div 
          className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/seller/analytics')}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Today's Sale</p>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">₹{todaySales.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-500">1.3% Up from yesterday</span>
              </div>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Total Balance */}
        <div 
          className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/seller/wallet')}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Total Balance</p>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">₹{(wallet?.balance || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">Revenue sent to your wallet</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Returns & Refunds */}
        <div 
          className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/seller/orders')}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Returns & Refunds</p>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">{returnsCount}</p>
              <p className="text-xs text-gray-500 mt-2">Processed returns</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
              <RotateCcw className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section - Sales Chart + Quick Stats */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Sales Details Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-gray-900">Sales Details</h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full text-xs font-medium border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              October
              <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
          
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E5E7EB', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Market Place */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Globe className="h-5 w-5 text-blue-500" />
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <p className="text-2xl font-bold text-gray-900">01</p>
            <p className="text-xs text-gray-500 font-medium">Market Place</p>
          </div>

          {/* Buyer's Message */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <p className="text-2xl font-bold text-gray-900">05</p>
            <p className="text-xs text-gray-500 font-medium">Buyer's Message</p>
          </div>

          {/* Buy Box Wins */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-emerald-500" />
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <p className="text-2xl font-bold text-gray-900">{buyBoxWinRate}%</p>
            <p className="text-xs text-gray-500 font-medium">Buy Box Wins</p>
          </div>

          {/* Customer Feedback */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-500" />
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <p className="text-2xl font-bold text-gray-900">4.5</p>
              <div className="flex items-center">
                {[1, 2, 3, 4].map(i => (
                  <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
                <Star className="h-3 w-3 fill-gray-200 text-gray-200" />
              </div>
            </div>
            <p className="text-xs text-gray-500 font-medium">Customer Feedback</p>
          </div>
        </div>
      </div>

      {/* Bottom Section - Orders Table + Out of Stock */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Order Details Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Order Details</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/seller/orders')}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium text-xs"
              >
                View All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full text-xs font-medium border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                October
                <ChevronDown className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date - Time</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">No orders yet</p>
                        <p className="text-xs text-gray-500">Your recent orders will appear here</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-sm font-medium text-gray-900">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {order.product?.icon_url ? (
                              <img 
                                src={order.product.icon_url} 
                                alt={order.product?.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-gray-900 truncate max-w-[120px]">
                            {order.product?.name || 'Unknown Product'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-gray-600">1</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-gray-600">
                          {format(new Date(order.created_at), 'MMM d, yyyy - h:mm a')}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-gray-600">
                          {order.delivered_at 
                            ? format(new Date(order.delivered_at), 'MMM d, yyyy')
                            : '-'
                          }
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <Badge className={`text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Out of Stock Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Out of Stock</h3>
          
          {outOfStockProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <Package className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">All stocked up!</p>
              <p className="text-xs text-gray-500 text-center">No products are out of stock</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {/* Navigation */}
              <div className="flex items-center justify-between w-full mb-4">
                <button 
                  onClick={handlePrevProduct}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
                
                {/* Product Image */}
                <div className="w-28 h-28 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
                  {currentOutOfStock?.icon_url ? (
                    <img 
                      src={currentOutOfStock.icon_url}
                      alt={currentOutOfStock.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                
                <button 
                  onClick={handleNextProduct}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </button>
              </div>

              {/* Product Info */}
              <p className="text-sm font-medium text-gray-900 text-center mb-1 truncate max-w-full px-4">
                {currentOutOfStock?.name || 'Product Name'}
              </p>
              <p className="text-lg font-bold text-orange-500">
                ₹{(currentOutOfStock?.price || 0).toLocaleString()}
              </p>

              {/* Pagination Dots */}
              <div className="flex items-center gap-1.5 mt-4">
                {outOfStockProducts.slice(0, 5).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setOutOfStockIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === outOfStockIndex ? 'bg-orange-500' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
