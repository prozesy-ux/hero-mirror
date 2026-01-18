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
  Activity
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
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'from-emerald-500 to-teal-500';
    if (score >= 70) return 'from-blue-500 to-indigo-500';
    if (score >= 50) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-rose-500';
  };

  const stats = [
    {
      label: 'Available Balance',
      value: `$${(wallet?.balance || 0).toFixed(2)}`,
      icon: Wallet,
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50',
      onClick: () => navigate('/seller/wallet')
    },
    {
      label: 'Pending Balance',
      value: `$${(wallet?.pending_balance || 0).toFixed(2)}`,
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-50',
      onClick: () => navigate('/seller/wallet')
    },
    {
      label: 'Total Earnings',
      value: `$${totalEarnings.toFixed(2)}`,
      icon: DollarSign,
      gradient: 'from-violet-500 to-purple-500',
      bgGradient: 'from-violet-50 to-purple-50',
      onClick: () => navigate('/seller/orders')
    },
    {
      label: 'Total Orders',
      value: orders.length.toString(),
      icon: ShoppingBag,
      gradient: 'from-blue-500 to-indigo-500',
      bgGradient: 'from-blue-50 to-indigo-50',
      onClick: () => navigate('/seller/orders')
    }
  ];

  const quickStats = [
    { label: 'Products', value: products.length, icon: Package, color: 'text-violet-600' },
    { label: 'Completed', value: completedOrders, icon: CheckCircle, color: 'text-emerald-600' },
    { label: 'Pending', value: pendingOrders, icon: Clock, color: 'text-amber-600' },
    { label: 'Delivered', value: deliveredOrders, icon: TrendingUp, color: 'text-blue-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Trust Score Header */}
      {trustScore && (
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getTrustScoreColor(trustScore.trust_score)} flex items-center justify-center`}>
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Trust Score</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900">{trustScore.trust_score}%</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="font-semibold text-slate-900">{trustScore.successful_orders}</p>
              <p className="text-slate-500">Orders</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-900">{trustScore.buyer_approved_count}</p>
              <p className="text-slate-500">Approved</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-slate-900">{trustScore.total_reports}</p>
              <p className="text-slate-500">Reports</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <button
            key={index}
            onClick={stat.onClick}
            className={`group relative bg-gradient-to-br ${stat.bgGradient} rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 text-left`}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-slate-500 font-medium mb-1">{stat.label}</p>
            <p className="text-2xl font-bold tracking-tight text-slate-900">{stat.value}</p>
            <ArrowRight className="absolute bottom-5 right-5 w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm text-center">
            <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
            <p className="text-xl font-bold tracking-tight text-slate-900">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => navigate('/seller/products')}
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/seller/orders')}
          className="rounded-xl border-slate-200"
        >
          View All Orders
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate('/seller/wallet')}
          className="rounded-xl border-slate-200"
        >
          Withdraw Funds
          <Wallet className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-600" />
            <h3 className="font-semibold text-slate-900">Recent Activity</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/seller/orders')}
            className="text-violet-600 hover:text-violet-700 hover:bg-violet-50"
          >
            View All
          </Button>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No orders yet</p>
            <p className="text-sm text-slate-400 mt-1">Your recent orders will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentOrders.map((order) => (
              <div key={order.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                {/* Product Image */}
                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
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
                  <p className="font-medium text-slate-900 truncate">
                    {order.product?.name || 'Unknown Product'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {order.buyer?.email?.split('@')[0] || 'Customer'} • {format(new Date(order.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>

                {/* Status & Amount */}
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-slate-900">${(Number(order.seller_earning) || 0).toFixed(2)}</p>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      order.status === 'completed'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : order.status === 'delivered'
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {order.status}
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