import { useSellerContext } from '@/contexts/SellerContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  Wallet,
  Clock
} from 'lucide-react';

const StatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  iconColor 
}: { 
  title: string; 
  value: string; 
  description?: string;
  icon: any; 
  iconColor: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`rounded-lg p-2 ${iconColor}`}>
        <Icon className="h-4 w-4" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </CardContent>
  </Card>
);

const SellerDashboard = () => {
  const { profile, wallet, products, orders, loading } = useSellerContext();

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalEarnings = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + Number(o.seller_earning), 0);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {profile.store_name}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your store today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Available Balance"
          value={`$${wallet?.balance?.toFixed(2) || '0.00'}`}
          description="Ready to withdraw"
          icon={Wallet}
          iconColor="bg-emerald-500/10 text-emerald-500"
        />
        <StatCard
          title="Pending Balance"
          value={`$${wallet?.pending_balance?.toFixed(2) || '0.00'}`}
          description="From pending orders"
          icon={Clock}
          iconColor="bg-yellow-500/10 text-yellow-500"
        />
        <StatCard
          title="Total Earnings"
          value={`$${totalEarnings.toFixed(2)}`}
          description="All time earnings"
          icon={DollarSign}
          iconColor="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          title="Total Orders"
          value={String(orders.length)}
          description={`${pendingOrders} pending, ${completedOrders} completed`}
          icon={ShoppingCart}
          iconColor="bg-purple-500/10 text-purple-500"
        />
      </div>

      {/* Second Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Products"
          value={String(products.length)}
          description={`${products.filter(p => p.is_approved).length} approved`}
          icon={Package}
          iconColor="bg-orange-500/10 text-orange-500"
        />
        <StatCard
          title="Total Sales"
          value={`$${Number(profile.total_sales || 0).toFixed(2)}`}
          description="Lifetime sales volume"
          icon={TrendingUp}
          iconColor="bg-cyan-500/10 text-cyan-500"
        />
        <StatCard
          title="Commission Rate"
          value={`${profile.commission_rate}%`}
          description="Platform commission"
          icon={DollarSign}
          iconColor="bg-rose-500/10 text-rose-500"
        />
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Your latest orders</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No orders yet. Start promoting your products!
            </p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {order.product?.name || 'Product'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.buyer?.email || 'Buyer'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm text-emerald-500">
                      +${Number(order.seller_earning).toFixed(2)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'completed' 
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : order.status === 'pending'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerDashboard;
