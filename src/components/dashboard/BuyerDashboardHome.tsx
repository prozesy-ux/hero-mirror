import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, ShoppingBag, TrendingUp, Clock, Package, ArrowRight, Plus, Heart, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface Order {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  product?: {
    name: string;
    icon_url: string | null;
  };
  seller?: {
    store_name: string;
  };
}

const BuyerDashboardHome = () => {
  const { user } = useAuthContext();
  const { formatAmountOnly } = useCurrency();
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    // Fetch wallet
    const { data: walletData } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user?.id)
      .single();
    
    if (walletData) setWallet(walletData);

    // Fetch recent orders
    const { data: ordersData } = await supabase
      .from('seller_orders')
      .select(`
        id, amount, status, created_at,
        product:seller_products(name, icon_url),
        seller:seller_profiles(store_name)
      `)
      .eq('buyer_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (ordersData) setOrders(ordersData as Order[]);

    // Fetch wishlist count
    const { count } = await supabase
      .from('buyer_wishlist')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id);

    setWishlistCount(count || 0);
    setLoading(false);
  };

  const stats = useMemo(() => {
    const totalSpent = orders.reduce((sum, o) => sum + o.amount, 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'delivered').length;
    return { totalSpent, totalOrders, pendingOrders };
  }, [orders]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Wallet Balance</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{formatAmountOnly(wallet?.balance || 0)}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-violet-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Spent</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{formatAmountOnly(stats.totalSpent)}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
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

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Wishlist Items</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{wishlistCount}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-pink-100 flex items-center justify-center">
              <Heart className="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/dashboard/billing">
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">Add Funds</p>
                <p className="text-sm text-white/70">Top up your wallet</p>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/dashboard/ai-accounts">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Store className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Browse Marketplace</p>
                <p className="text-sm text-slate-500">Discover products</p>
              </div>
            </div>
          </div>
        </Link>

        <Link to="/dashboard/wishlist">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-pink-100 flex items-center justify-center">
                <Heart className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">View Wishlist</p>
                <p className="text-sm text-slate-500">{wishlistCount} saved items</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">Recent Orders</h3>
          <Link to="/dashboard/orders">
            <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="p-10 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No orders yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  {order.product?.icon_url ? (
                    <img src={order.product.icon_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Package className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{order.product?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{order.seller?.store_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800">{formatAmountOnly(order.amount)}</p>
                    <p className="text-xs text-slate-400">{format(new Date(order.created_at), 'MMM d')}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                    order.status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {order.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyerDashboardHome;
