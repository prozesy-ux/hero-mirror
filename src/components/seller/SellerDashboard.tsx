import { useEffect, useState } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  Clock, 
  DollarSign, 
  Package,
  ShoppingBag,
  CheckCircle,
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldCheck,
  Activity,
  BarChart3,
  ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface TrustScore {
  trust_score: number;
  total_reports: number;
  successful_orders: number;
  buyer_approved_count: number;
}

const SellerDashboard = () => {
  const { profile, wallet, products, orders, loading } = useSellerContext();
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.id) {
      fetchTrustScore();
    }
  }, [profile?.id]);

  // Real-time subscription for trust score updates
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

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalEarnings = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + (Number(o.seller_earning) || 0), 0);

  const recentOrders = orders
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6 seller-dashboard">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getTrustScoreBg = (score: number) => {
    if (score >= 90) return 'from-emerald-500 to-teal-500';
    if (score >= 70) return 'from-blue-500 to-indigo-500';
    if (score >= 50) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  // Premium gradient stats matching Analytics design
  const stats = [
    {
      label: 'BALANCE',
      value: `$${(wallet?.balance || 0).toFixed(2)}`,
      change: 'Available',
      icon: Wallet,
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      onClick: () => navigate('/seller/wallet')
    },
    {
      label: 'PENDING',
      value: `$${Math.max(0, wallet?.pending_balance || 0).toFixed(2)}`,
      change: 'Processing',
      icon: Clock,
      gradient: 'bg-gradient-to-br from-amber-500 to-orange-600',
      onClick: () => navigate('/seller/wallet')
    },
    {
      label: 'EARNINGS',
      value: `$${totalEarnings.toFixed(2)}`,
      change: `${orders.length} orders`,
      icon: DollarSign,
      gradient: 'bg-gradient-to-br from-violet-500 to-purple-600',
      onClick: () => navigate('/seller/orders')
    },
    {
      label: 'PRODUCTS',
      value: products.length.toString(),
      change: `${products.filter(p => p.is_approved).length} live`,
      icon: Package,
      gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      onClick: () => navigate('/seller/products')
    }
  ];

  return (
    <div className="space-y-6 seller-dashboard">
      {/* Trust Score Header - TikTok Store Premium Design */}
      {trustScore && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 text-white shadow-xl">
          {/* Glass overlay */}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />
          
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            {/* Seller Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <Badge className={`text-xs font-bold px-2.5 py-0.5 ${
                    trustScore.trust_score >= 90 ? 'bg-emerald-400 text-emerald-900' :
                    trustScore.trust_score >= 70 ? 'bg-blue-400 text-blue-900' : 'bg-amber-400 text-amber-900'
                  }`}>
                    {trustScore.trust_score >= 90 ? '⭐ TOP SELLER' : 
                     trustScore.trust_score >= 70 ? '✓ TRUSTED' : '📈 GROWING'}
                  </Badge>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1">{trustScore.trust_score}% Trust Score</h3>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden mb-5">
              <div 
                className="h-full bg-gradient-to-r from-white to-white/80 rounded-full transition-all duration-1000" 
                style={{ width: `${trustScore.trust_score}%` }} 
              />
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 sm:p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <p className="text-2xl sm:text-3xl font-bold">{trustScore.successful_orders}</p>
                <p className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wide">Completed</p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <p className="text-2xl sm:text-3xl font-bold">{trustScore.buyer_approved_count}</p>
                <p className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wide">Approved</p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <p className="text-2xl sm:text-3xl font-bold">{trustScore.total_reports}</p>
                <p className="text-[10px] sm:text-xs text-white/70 uppercase tracking-wide">Reports</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Grid - Premium Gradient Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <button
            key={index}
            onClick={stat.onClick}
            className={`relative rounded-xl sm:rounded-2xl p-3 sm:p-5 overflow-hidden text-left transition-all active:scale-[0.98] hover:shadow-xl ${stat.gradient}`}
          >
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-white/80 text-[10px] sm:text-xs font-medium uppercase tracking-wide">{stat.label}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-0.5 sm:mt-1">{stat.value}</p>
                {stat.change && (
                  <div className="flex items-center gap-1 mt-1 sm:mt-2">
                    <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white/90" />
                    <span className="text-[10px] sm:text-xs font-semibold text-white/90">{stat.change}</span>
                  </div>
                )}
              </div>
              <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center">
                <stat.icon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Stats Row - Mobile Scrollable */}
      <div className="flex gap-2 sm:gap-3 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
        {[
          { label: 'Completed', value: completedOrders, icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'Pending', value: pendingOrders, icon: Clock, color: 'text-amber-500' },
          { label: 'Delivered', value: deliveredOrders, icon: TrendingUp, color: 'text-blue-500' },
          { label: 'Total', value: orders.length, icon: ShoppingBag, color: 'text-violet-500' }
        ].map((stat, index) => (
          <div key={index} className="flex-shrink-0 bg-white rounded-xl p-2.5 sm:p-3 text-center border border-slate-100 shadow-sm min-w-[72px] sm:min-w-[80px]">
            <stat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${stat.color} mx-auto mb-0.5 sm:mb-1`} />
            <p className="seller-stat-number text-base sm:text-lg text-slate-900">{stat.value}</p>
            <p className="text-[9px] sm:text-[10px] text-slate-600 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions - Clean Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => navigate('/seller/products')}
          className="bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 rounded-xl font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/seller/orders')}
          className="rounded-xl border-slate-200 hover:bg-slate-50 font-medium"
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          View Orders
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/seller/analytics')}
          className="rounded-xl border-slate-200 hover:bg-slate-50 font-medium"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Analytics
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/seller/wallet')}
          className="rounded-xl border-slate-200 hover:bg-slate-50 font-medium"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Withdraw
        </Button>
      </div>

      {/* Recent Activity - Timeline Style */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <h3 className="seller-heading text-slate-900">Recent Activity</h3>
              <p className="text-xs text-slate-500">Your latest orders</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/seller/orders')}
            className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 font-medium rounded-lg"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-6 h-6 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-900 mb-1">No orders yet</p>
            <p className="text-sm text-slate-500">Your recent orders will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentOrders.map((order, index) => (
              <div key={order.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors group">
                {/* Timeline Indicator */}
                <div className="relative flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    order.status === 'completed' ? 'bg-emerald-500' :
                    order.status === 'delivered' ? 'bg-blue-500' : 'bg-amber-500'
                  }`} />
                  {index < recentOrders.length - 1 && (
                    <div className="w-px h-full bg-slate-200 absolute top-4" />
                  )}
                </div>

                {/* Product Image */}
                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-100">
                  {order.product?.icon_url ? (
                    <img 
                      src={order.product.icon_url} 
                      alt={order.product?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                </div>

                {/* Order Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate group-hover:text-violet-700 transition-colors">
                    {order.product?.name || 'Unknown Product'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {order.buyer?.email?.split('@')[0] || 'Customer'} • {format(new Date(order.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>

                {/* Status & Amount */}
                <div className="text-right flex-shrink-0">
                  <p className="seller-stat-number text-lg text-slate-900">${(Number(order.seller_earning) || 0).toFixed(2)}</p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold ${
                      order.status === 'completed'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : order.status === 'delivered'
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {order.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;