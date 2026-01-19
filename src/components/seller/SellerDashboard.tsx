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
  Eye
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

  const stats = [
    {
      label: 'BALANCE',
      value: `$${(wallet?.balance || 0).toFixed(2)}`,
      change: '+12.5%',
      changePositive: true,
      icon: Wallet,
      iconBg: 'bg-emerald-500',
      onClick: () => navigate('/seller/wallet')
    },
    {
      label: 'PENDING',
      value: `$${(wallet?.pending_balance || 0).toFixed(2)}`,
      change: 'Processing',
      changePositive: null,
      icon: Clock,
      iconBg: 'bg-amber-500',
      onClick: () => navigate('/seller/wallet')
    },
    {
      label: 'EARNINGS',
      value: `$${totalEarnings.toFixed(2)}`,
      change: `${orders.length} orders`,
      changePositive: null,
      icon: DollarSign,
      iconBg: 'bg-violet-500',
      onClick: () => navigate('/seller/orders')
    },
    {
      label: 'PRODUCTS',
      value: products.length.toString(),
      change: `${products.filter(p => p.is_approved).length} live`,
      changePositive: null,
      icon: Package,
      iconBg: 'bg-blue-500',
      onClick: () => navigate('/seller/products')
    }
  ];

  return (
    <div className="space-y-6 seller-dashboard">
      {/* Trust Score Header - Premium Design */}
      {trustScore && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className={`h-1 bg-gradient-to-r ${getTrustScoreBg(trustScore.trust_score)}`} />
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Circular Progress Ring */}
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-slate-100"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - trustScore.trust_score / 100)}`}
                    strokeLinecap="round"
                    className={getTrustScoreColor(trustScore.trust_score)}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <ShieldCheck className={`w-6 h-6 ${getTrustScoreColor(trustScore.trust_score)}`} />
                </div>
              </div>
              <div>
                <p className="seller-label text-slate-500 mb-0.5">TRUST SCORE</p>
                <p className="seller-stat-number text-3xl text-slate-900">{trustScore.trust_score}%</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-8">
              <div className="text-center">
                <p className="seller-stat-number text-xl text-slate-900">{trustScore.successful_orders}</p>
                <p className="seller-label text-slate-500">ORDERS</p>
              </div>
              <div className="text-center">
                <p className="seller-stat-number text-xl text-slate-900">{trustScore.buyer_approved_count}</p>
                <p className="seller-label text-slate-500">APPROVED</p>
              </div>
              <div className="text-center">
                <p className="seller-stat-number text-xl text-slate-900">{trustScore.total_reports}</p>
                <p className="seller-label text-slate-500">REPORTS</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Grid - Premium Fiverr-style Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <button
            key={index}
            onClick={stat.onClick}
            className="group seller-stat-card text-left hover:shadow-lg hover:border-slate-200 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center shadow-sm`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              {stat.changePositive !== null && (
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                  stat.changePositive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'
                }`}>
                  {stat.change}
                </span>
              )}
            </div>
            <p className="seller-label text-slate-500 mb-1">{stat.label}</p>
            <p className="seller-stat-number text-2xl text-slate-900 group-hover:text-slate-700 transition-colors">{stat.value}</p>
            {stat.changePositive === null && stat.change && (
              <p className="text-xs text-slate-500 mt-1">{stat.change}</p>
            )}
          </button>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Completed', value: completedOrders, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Pending', value: pendingOrders, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Delivered', value: deliveredOrders, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Total', value: orders.length, icon: ShoppingBag, color: 'text-violet-500', bg: 'bg-violet-50' }
        ].map((stat, index) => (
          <div key={index} className={`${stat.bg} rounded-xl p-3 text-center border border-transparent`}>
            <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
            <p className="seller-stat-number text-lg text-slate-900">{stat.value}</p>
            <p className="text-[10px] text-slate-600 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions - Clean Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => navigate('/seller/products')}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl shadow-sm shadow-emerald-200 font-semibold"
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