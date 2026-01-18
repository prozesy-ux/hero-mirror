import { useState } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  Truck,
  AlertCircle,
  Pencil
} from 'lucide-react';

const SellerOrders = () => {
  const { orders, wallet, refreshOrders, refreshWallet, loading, profile } = useSellerContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [credentials, setCredentials] = useState('');
  const [delivering, setDelivering] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  
  // Edit credentials state
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editCredentials, setEditCredentials] = useState('');
  const [updating, setUpdating] = useState(false);

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

      // Update order status to delivered (awaiting buyer approval)
      const { error: orderError } = await supabase
        .from('seller_orders')
        .update({
          credentials: credentials.trim(),
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', selectedOrder);

      if (orderError) throw orderError;

      // Create notification for buyer
      await supabase.from('notifications').insert({
        user_id: order.buyer_id,
        type: 'delivery',
        title: 'Order Delivered!',
        message: `Your order for ${order.product?.name || 'Product'} has been delivered. Check credentials and approve.`,
        link: '/dashboard/ai-accounts?tab=purchases',
        is_read: false
      });

      // Create system message in seller_chats
      await supabase.from('seller_chats').insert({
        buyer_id: order.buyer_id,
        seller_id: profile?.id,
        message: `🎁 Seller has delivered your order for "${order.product?.name || 'Product'}". Please check your credentials and approve if everything is correct.`,
        sender_type: 'system',
        product_id: order.product_id
      });

      toast.success('Order delivered! Awaiting buyer approval.');
      setSelectedOrder(null);
      setCredentials('');
      refreshOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to deliver');
    } finally {
      setDelivering(false);
    }
  };

  const handleUpdateCredentials = async () => {
    if (!editingOrder || !editCredentials.trim()) {
      toast.error('Please enter the new credentials');
      return;
    }

    setUpdating(true);
    try {
      const order = orders.find(o => o.id === editingOrder);
      if (!order) throw new Error('Order not found');

      // Update credentials
      const { error: orderError } = await supabase
        .from('seller_orders')
        .update({
          credentials: editCredentials.trim()
        })
        .eq('id', editingOrder);

      if (orderError) throw orderError;

      // Create notification for buyer
      await supabase.from('notifications').insert({
        user_id: order.buyer_id,
        type: 'update',
        title: 'Credentials Updated',
        message: `Seller updated credentials for ${order.product?.name || 'Product'}`,
        link: '/dashboard/ai-accounts?tab=purchases',
        is_read: false
      });

      // Create system message in seller_chats
      await supabase.from('seller_chats').insert({
        buyer_id: order.buyer_id,
        seller_id: profile?.id,
        message: `🔄 Seller has updated the credentials for your order "${order.product?.name || 'Product'}". Please check your purchases tab for the new credentials.`,
        sender_type: 'system',
        product_id: order.product_id
      });

      toast.success('Credentials updated successfully!');
      setEditingOrder(null);
      setEditCredentials('');
      refreshOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update credentials');
    } finally {
      setUpdating(false);
    }
  };

  const openEditCredentials = (orderId: string, currentCredentials: string | null) => {
    setEditingOrder(orderId);
    setEditCredentials(currentCredentials || '');
  };

  const getStatusConfig = (status: string, buyerApproved?: boolean) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending Delivery',
          className: 'bg-amber-50 text-amber-600 border-amber-200'
        };
      case 'delivered':
        return {
          icon: Truck,
          label: 'Awaiting Approval',
          className: 'bg-blue-50 text-blue-600 border-blue-200'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          label: buyerApproved ? 'Buyer Approved' : 'Completed',
          className: 'bg-emerald-50 text-emerald-600 border-emerald-200'
        };
      case 'refunded':
        return {
          icon: XCircle,
          label: 'Refunded',
          className: 'bg-red-50 text-red-600 border-red-200'
        };
      default:
        return {
          icon: AlertCircle,
          label: status,
          className: 'bg-slate-50 text-slate-600 border-slate-200'
        };
    }
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;

  if (loading) {
    return (
      <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white border-slate-200"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white border border-slate-200 p-1">
          <TabsTrigger value="pending" className="gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">
            Pending
            {pendingCount > 0 && (
              <Badge className="bg-amber-500 text-white text-[10px] h-5 min-w-[20px]">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="delivered" className="gap-2 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">
            Delivered
            {deliveredCount > 0 && (
              <Badge className="bg-blue-500 text-white text-[10px] h-5 min-w-[20px]">
                {deliveredCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">
            Completed ({completedCount})
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">
            All
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-12 text-center">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 mb-2">No orders found</h3>
              <p className="text-slate-500 text-sm">
                {activeTab === 'pending' ? 'No pending orders' : 'Orders will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => {
                const statusConfig = getStatusConfig(order.status, (order as any).buyer_approved);
                const StatusIcon = statusConfig.icon;

                return (
                  <div 
                    key={order.id} 
                    className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          {order.product?.icon_url ? (
                            <img src={order.product.icon_url} alt="" className="h-full w-full object-cover rounded-lg" />
                          ) : (
                            <Package className="h-6 w-6 text-slate-400" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-slate-900">{order.product?.name || 'Product'}</h3>
                          <p className="text-sm text-slate-500">{order.buyer?.email || 'Unknown buyer'}</p>
                          <p className="text-xs text-slate-400">
                            {format(new Date(order.created_at), 'MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className="font-bold text-lg text-emerald-600">
                          +${Number(order.seller_earning).toFixed(2)}
                        </p>
                        <Badge variant="outline" className={`text-[11px] font-medium ${statusConfig.className}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => setSelectedOrder(order.id)}
                            className="bg-emerald-500 hover:bg-emerald-600 mt-1"
                          >
                            <Send className="h-3.5 w-3.5 mr-1.5" />
                            Deliver
                          </Button>
                        )}
                      </div>
                    </div>

                    {order.status === 'delivered' && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-blue-600">
                            <Truck className="h-4 w-4" />
                            <p className="text-sm font-medium">Delivered - Waiting for buyer to approve</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditCredentials(order.id, order.credentials)}
                            className="border-slate-200 text-slate-600 hover:bg-slate-50"
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1.5" />
                            Edit Credentials
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Balance will be released once buyer approves delivery
                        </p>
                      </div>
                    )}

                    {order.status === 'completed' && order.delivered_at && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-500">
                          Completed on {format(new Date(order.delivered_at), 'MMM d, yyyy')}
                          {(order as any).buyer_approved && ' • Buyer approved'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delivery Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Deliver Order</DialogTitle>
            <DialogDescription>
              Enter the account credentials to send to the buyer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter account credentials (email, password, etc.)"
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
              rows={4}
              className="border-slate-200"
            />
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-sm text-blue-600">
                After delivery, the buyer will review and approve. Your earnings will be released upon approval.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedOrder(null)}
                className="flex-1 border-slate-200"
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

      {/* Edit Credentials Dialog */}
      <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Credentials</DialogTitle>
            <DialogDescription>
              Update the account credentials for this order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter updated account credentials (email, password, etc.)"
              value={editCredentials}
              onChange={(e) => setEditCredentials(e.target.value)}
              rows={4}
              className="border-slate-200"
            />
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <p className="text-sm text-amber-600">
                The buyer will be notified of the credential update and will see the new credentials.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setEditingOrder(null)}
                className="flex-1 border-slate-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateCredentials}
                disabled={updating || !editCredentials.trim()}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Pencil className="h-4 w-4 mr-2" />
                    Update
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
