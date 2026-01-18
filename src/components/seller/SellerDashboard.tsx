import { useEffect, useState } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Clock, 
  TrendingUp, 
  Package,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertCircle
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
  const navigate = useNavigate();
  const [trustScore, setTrustScore] = useState<TrustScore | null>(null);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalEarnings = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.seller_earning), 0);

  useEffect(() => {
    const fetchTrustScore = async () => {
      const { data } = await supabase
        .from('seller_trust_scores')
        .select('*')
        .eq('seller_id', profile.id)
        .maybeSingle();
      if (data) setTrustScore(data);
    };
    if (profile.id) fetchTrustScore();
  }, [profile.id]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
      {/* Trust Score Badge */}
      {trustScore && (
        <div className="mb-6 flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`font-medium ${
              trustScore.trust_score >= 80 
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                : trustScore.trust_score >= 50 
                ? 'bg-amber-50 text-amber-600 border-amber-200'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}
          >
            Trust Score: {trustScore.trust_score}%
          </Badge>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Available Balance */}
        <div 
          className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/seller/wallet')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-emerald-600" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">${(wallet?.balance || 0).toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">Available Balance</p>
        </div>

        {/* Pending Balance */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            {deliveredOrders > 0 && (
              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">
                {deliveredOrders} awaiting
              </Badge>
            )}
          </div>
          <p className="text-2xl font-bold text-slate-900">${(wallet?.pending_balance || 0).toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">Pending Balance</p>
        </div>

        {/* Total Earnings */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">${totalEarnings.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-1">Total Earnings</p>
        </div>

        {/* Orders */}
        <div 
          className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/seller/orders')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
            </div>
            {pendingOrders > 0 && (
              <Badge className="bg-purple-500 text-white text-[10px]">
                {pendingOrders} new
              </Badge>
            )}
          </div>
          <p className="text-2xl font-bold text-slate-900">{orders.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total Orders</p>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 grid-cols-3 mb-8">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
            <Package className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{products.length}</p>
            <p className="text-xs text-slate-500">Products</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm font-medium text-emerald-600">{products.filter(p => p.is_approved).length}</p>
            <p className="text-[10px] text-slate-400">Approved</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{completedOrders}</p>
            <p className="text-xs text-slate-500">Completed</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm font-medium text-slate-600">{profile.commission_rate}%</p>
            <p className="text-[10px] text-slate-400">Commission</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">${Number(profile.total_sales || 0).toFixed(0)}</p>
            <p className="text-xs text-slate-500">Lifetime Sales</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent Activity</h2>
          <button 
            onClick={() => navigate('/seller/orders')}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            View all
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {orders.length === 0 ? (
            <div className="p-8 text-center">
              <ShoppingCart className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No orders yet</p>
              <p className="text-slate-400 text-xs mt-1">Orders will appear here</p>
            </div>
          ) : (
            orders.slice(0, 5).map((order) => (
              <div key={order.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-900 truncate">
                    {order.product?.name || 'Product'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {order.buyer?.email || 'Buyer'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-sm text-emerald-600">
                    +${Number(order.seller_earning).toFixed(2)}
                  </p>
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] mt-1 ${
                      order.status === 'completed' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : order.status === 'delivered'
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : order.status === 'pending'
                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                        : 'bg-red-50 text-red-600 border-red-200'
                    }`}
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
