import { useState, useMemo } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { format, isToday, isThisWeek, isThisMonth, startOfDay, startOfWeek, startOfMonth } from 'date-fns';
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
  Pencil,
  Download,
  Mail,
  Copy,
  Calendar,
  Filter
} from 'lucide-react';

const SellerOrders = () => {
  const { orders, wallet, refreshOrders, refreshWallet, loading, profile } = useSellerContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [credentials, setCredentials] = useState('');
  const [delivering, setDelivering] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  
  // Bulk selection
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkDelivering, setBulkDelivering] = useState(false);
  
  // Edit credentials state
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editCredentials, setEditCredentials] = useState('');
  const [updating, setUpdating] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.buyer?.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus = activeTab === 'all' || order.status === activeTab;
      
      // Date filter
      let matchesDate = true;
      if (dateRange !== 'all') {
        const orderDate = new Date(order.created_at);
        if (dateRange === 'today') {
          matchesDate = isToday(orderDate);
        } else if (dateRange === 'week') {
          matchesDate = isThisWeek(orderDate);
        } else if (dateRange === 'month') {
          matchesDate = isThisMonth(orderDate);
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchQuery, activeTab, dateRange]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pendingIds = filteredOrders.filter(o => o.status === 'pending').map(o => o.id);
      setSelectedOrders(new Set(pendingIds));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSet = new Set(selectedOrders);
    if (checked) {
      newSet.add(orderId);
    } else {
      newSet.delete(orderId);
    }
    setSelectedOrders(newSet);
  };

  const handleExportCSV = () => {
    const ordersToExport = filteredOrders.filter(o => 
      selectedOrders.size === 0 || selectedOrders.has(o.id)
    );
    
    const csvContent = [
      ['Order ID', 'Product', 'Buyer Email', 'Amount', 'Earning', 'Status', 'Created At', 'Buyer Email Input'].join(','),
      ...ordersToExport.map(order => [
        order.id,
        order.product?.name || 'N/A',
        order.buyer?.email || 'N/A',
        order.amount,
        order.seller_earning,
        order.status,
        format(new Date(order.created_at), 'yyyy-MM-dd HH:mm'),
        (order as any).buyer_email_input || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Orders exported successfully!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

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

      // Create notification for buyer (in notifications table - for buyers)
      await supabase.from('notifications').insert({
        user_id: order.buyer_id,
        type: 'delivery',
        title: 'Order Delivered!',
        message: `Your order for ${order.product?.name || 'Product'} has been delivered. Check credentials and approve.`,
        link: '/dashboard/ai-accounts?tab=purchases',
        is_read: false
      });

      // Create seller notification (in seller_notifications table - for seller)
      await supabase.from('seller_notifications').insert({
        seller_id: profile?.id,
        type: 'order_delivered',
        title: 'Order Delivered',
        message: `You delivered "${order.product?.name || 'Product'}" to buyer. Awaiting approval.`,
        link: '/seller/orders',
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

      // Create notification for buyer (in notifications table - for buyers)
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
          className: 'bg-amber-50 text-amber-600 border-amber-200',
          accentColor: 'border-l-amber-400'
        };
      case 'delivered':
        return {
          icon: Truck,
          label: 'Awaiting Approval',
          className: 'bg-blue-50 text-blue-600 border-blue-200',
          accentColor: 'border-l-blue-400'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          label: buyerApproved ? 'Buyer Approved' : 'Completed',
          className: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          accentColor: 'border-l-emerald-400'
        };
      case 'refunded':
        return {
          icon: XCircle,
          label: 'Refunded',
          className: 'bg-red-50 text-red-600 border-red-200',
          accentColor: 'border-l-red-400'
        };
      default:
        return {
          icon: AlertCircle,
          label: status,
          className: 'bg-slate-50 text-slate-600 border-slate-200',
          accentColor: 'border-l-slate-400'
        };
    }
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const pendingSelectableCount = filteredOrders.filter(o => o.status === 'pending').length;

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
    <div className="p-3 sm:p-4 lg:p-6 bg-slate-50 min-h-screen">
      {/* Export Button */}
      <div className="flex justify-end mb-4 sm:mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          className="border-slate-200 text-slate-600 hover:bg-slate-50"
        >
          <Download className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedOrders.size > 0 && (
        <div className="flex items-center gap-2 sm:gap-3 bg-violet-50 border border-violet-200 rounded-xl p-2 sm:p-3 mb-4">
          <Badge className="bg-violet-500 text-white text-xs">
            {selectedOrders.size} selected
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedOrders(new Set())}
            className="text-slate-600 hover:bg-slate-100 text-xs sm:text-sm"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Search & Date Filter - Mobile optimized */}
      <div className="flex flex-col gap-3 mb-4 sm:mb-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-slate-200"
          />
        </div>
        
        {/* Date Filter - Horizontal scrollable on mobile */}
        <div className="flex overflow-x-auto hide-scrollbar gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {[
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'Week' },
            { key: 'month', label: 'Month' },
            { key: 'all', label: 'All' }
          ].map((item) => (
            <Button
              key={item.key}
              size="sm"
              variant={dateRange === item.key ? 'default' : 'ghost'}
              onClick={() => setDateRange(item.key as typeof dateRange)}
              className={`flex-shrink-0 text-xs sm:text-sm px-3 ${
                dateRange === item.key ? 'bg-slate-900 text-white' : 'text-slate-600'
              }`}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabs - Horizontally scrollable on mobile */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="bg-white border border-slate-200 p-1 flex overflow-x-auto hide-scrollbar w-full sm:w-auto">
            <TabsTrigger value="pending" className="flex-shrink-0 gap-1.5 text-xs sm:text-sm data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">
              <span className="hidden sm:inline">Pending</span>
              <span className="sm:hidden">Pend</span>
              {pendingCount > 0 && (
                <Badge className="bg-amber-500 text-white text-[10px] h-5 min-w-[18px]">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="delivered" className="flex-shrink-0 gap-1.5 text-xs sm:text-sm data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">
              <span className="hidden sm:inline">Delivered</span>
              <span className="sm:hidden">Sent</span>
              {deliveredCount > 0 && (
                <Badge className="bg-blue-500 text-white text-[10px] h-5 min-w-[18px]">
                  {deliveredCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-shrink-0 text-xs sm:text-sm data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">
              <span className="hidden sm:inline">Completed ({completedCount})</span>
              <span className="sm:hidden">Done ({completedCount})</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-shrink-0 text-xs sm:text-sm data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">
              All
            </TabsTrigger>
          </TabsList>

          {/* Select All (only for pending) */}
          {activeTab === 'pending' && pendingSelectableCount > 0 && (
            <label className="hidden sm:flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <Checkbox
                checked={selectedOrders.size === pendingSelectableCount && pendingSelectableCount > 0}
                onCheckedChange={handleSelectAll}
              />
              Select all
            </label>
          )}
        </div>

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
                const buyerEmailInput = (order as any).buyer_email_input;

                return (
                  <div 
                    key={order.id} 
                    className={`bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg hover:border-slate-200 transition-all duration-200 border-l-4 ${statusConfig.accentColor}`}
                  >
                    <div className="p-3 sm:p-4">
                      {/* Mobile-first layout: Stack vertically on mobile */}
                      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between sm:gap-4">
                        {/* Product Info Row */}
                        <div className="flex items-start gap-3">
                          {/* Checkbox for pending orders */}
                          {order.status === 'pending' && (
                            <Checkbox
                              checked={selectedOrders.has(order.id)}
                              onCheckedChange={(checked) => handleSelectOrder(order.id, !!checked)}
                              className="mt-1 flex-shrink-0"
                            />
                          )}
                          
                          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {order.product?.icon_url ? (
                              <img src={order.product.icon_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-6 w-6 sm:h-7 sm:w-7 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-slate-900 text-sm sm:text-lg truncate">{order.product?.name || 'Product'}</h3>
                            <p className="text-xs sm:text-sm text-slate-500 truncate">{order.buyer?.email || 'Unknown buyer'}</p>
                            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                              {format(new Date(order.created_at), 'MMM d, h:mm a')}
                            </p>
                          </div>
                        </div>

                        {/* Price + Actions Row - Full width on mobile */}
                        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <p className="font-bold text-lg sm:text-xl text-emerald-600">
                            +${Number(order.seller_earning).toFixed(2)}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-[10px] sm:text-[11px] font-medium ${statusConfig.className}`}>
                              <StatusIcon className="h-3 w-3 mr-0.5 sm:mr-1" />
                              <span className="hidden sm:inline">{statusConfig.label}</span>
                              <span className="sm:hidden">{statusConfig.label.split(' ')[0]}</span>
                            </Badge>
                            {order.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => setSelectedOrder(order.id)}
                                className="bg-emerald-500 hover:bg-emerald-600 h-8 text-xs sm:text-sm"
                              >
                                <Send className="h-3.5 w-3.5 sm:mr-1.5" />
                                <span className="hidden sm:inline">Deliver</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Buyer Email Input (for email-required products) */}
                      {buyerEmailInput && (
                        <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-700">Buyer Email for Access:</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(buyerEmailInput)}
                              className="h-7 text-blue-600 hover:bg-blue-100"
                            >
                              <Copy className="h-3.5 w-3.5 mr-1" />
                              Copy
                            </Button>
                          </div>
                          <code className="block mt-2 text-sm bg-white px-3 py-2 rounded border border-blue-200 text-blue-900 font-mono">
                            {buyerEmailInput}
                          </code>
                        </div>
                      )}

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
