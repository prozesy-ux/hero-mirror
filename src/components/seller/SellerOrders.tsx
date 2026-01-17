import { useState } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Package, 
  Loader2, 
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  User
} from 'lucide-react';

const SellerOrders = () => {
  const { orders, wallet, refreshOrders, refreshWallet, loading } = useSellerContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [credentials, setCredentials] = useState('');
  const [delivering, setDelivering] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.buyer?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && order.status === activeTab;
  });

  const handleDeliver = async () => {
    if (!selectedOrder || !credentials.trim()) {
      toast.error('Please enter the account credentials');
      return;
    }

    setDelivering(true);
    try {
      const order = orders.find(o => o.id === selectedOrder);
      if (!order) throw new Error('Order not found');

      // Update order with credentials
      const { error: orderError } = await supabase
        .from('seller_orders')
        .update({
          credentials: credentials.trim(),
          status: 'completed',
          delivered_at: new Date().toISOString()
        })
        .eq('id', selectedOrder);

      if (orderError) throw orderError;

      // Move from pending to available balance
      const { error: walletError } = await supabase
        .from('seller_wallets')
        .update({
          balance: (wallet?.balance || 0) + order.seller_earning,
          pending_balance: (wallet?.pending_balance || 0) - order.seller_earning
        })
        .eq('seller_id', order.seller_id);

      if (walletError) throw walletError;

      toast.success('Order delivered successfully!');
      setSelectedOrder(null);
      setCredentials('');
      refreshOrders();
      refreshWallet();
    } catch (error: any) {
      toast.error(error.message || 'Failed to deliver order');
    } finally {
      setDelivering(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'refunded':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground">Manage and deliver your orders</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pendingCount > 0 && (
              <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
          <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">No orders found</h3>
                <p className="text-muted-foreground text-center">
                  {activeTab === 'pending' 
                    ? 'No pending orders to deliver'
                    : 'Orders will appear here when customers purchase your products'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-medium">{order.product?.name || 'Product'}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span>{order.buyer?.email || 'Unknown buyer'}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), 'PPp')}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className="font-bold text-emerald-500">
                          +${Number(order.seller_earning).toFixed(2)}
                        </p>
                        {getStatusBadge(order.status)}
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedOrder(order.id)}
                            className="bg-emerald-500 hover:bg-emerald-600"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Deliver
                          </Button>
                        )}
                      </div>
                    </div>
                    {order.status === 'completed' && order.delivered_at && (
                      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                        Delivered on {format(new Date(order.delivered_at), 'PPp')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delivery Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deliver Order</DialogTitle>
            <DialogDescription>
              Enter the account credentials to deliver to the buyer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Textarea
                placeholder="Enter account credentials (email, password, etc.)"
                value={credentials}
                onChange={(e) => setCredentials(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-2">
                This information will be sent to the buyer and your earnings will be moved to available balance.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedOrder(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeliver}
                disabled={delivering || !credentials.trim()}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                {delivering ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Deliver
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerOrders;
