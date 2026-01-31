import { useState, useMemo } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { format, isToday, isYesterday, isThisWeek, isThisMonth, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { sendEmail } from '@/lib/email-sender';
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
  Calendar as CalendarIcon,
  ChevronDown,
  Filter,
  RefreshCw
} from 'lucide-react';

const SellerOrders = () => {
  const { orders, refreshOrders, loading, profile } = useSellerContext();
  const { formatAmountOnly } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [credentials, setCredentials] = useState('');
  const [delivering, setDelivering] = useState(false);
  const [activeStatus, setActiveStatus] = useState<'all' | 'pending' | 'delivered' | 'completed' | 'refunded'>('all');
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'week' | 'month' | '30d' | 'custom' | 'all'>('all');
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | null>(null);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  
  // Bulk selection
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  
  // Edit credentials state
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [editCredentials, setEditCredentials] = useState('');
  const [updating, setUpdating] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.buyer?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus = activeStatus === 'all' || order.status === activeStatus;
      
      // Date filter
      let matchesDate = true;
      const orderDate = new Date(order.created_at);
      
      if (dateRange === 'today') {
        matchesDate = isToday(orderDate);
      } else if (dateRange === 'yesterday') {
        matchesDate = isYesterday(orderDate);
      } else if (dateRange === 'week') {
        matchesDate = isThisWeek(orderDate);
      } else if (dateRange === 'month') {
        matchesDate = isThisMonth(orderDate);
      } else if (dateRange === '30d') {
        const thirtyDaysAgo = subDays(new Date(), 30);
        matchesDate = orderDate >= thirtyDaysAgo;
      } else if (dateRange === 'custom' && customRange) {
        matchesDate = isWithinInterval(orderDate, { 
          start: startOfDay(customRange.from), 
          end: endOfDay(customRange.to) 
        });
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchQuery, activeStatus, dateRange, customRange]);

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

      const { error: orderError } = await supabase
        .from('seller_orders')
        .update({
          credentials: credentials.trim(),
          status: 'delivered',
          delivered_at: new Date().toISOString()
        })
        .eq('id', selectedOrder);

      if (orderError) throw orderError;

      await supabase.from('notifications').insert({
        user_id: order.buyer_id,
        type: 'delivery',
        title: 'Order Delivered!',
        message: `Your order for ${order.product?.name || 'Product'} has been delivered. Check credentials and approve.`,
        link: '/dashboard/marketplace?tab=purchases',
        is_read: false
      });

      await supabase.from('seller_notifications').insert({
        seller_id: profile?.id,
        type: 'order_delivered',
        title: 'Order Delivered',
        message: `You delivered "${order.product?.name || 'Product'}" to buyer. Awaiting approval.`,
        link: '/seller/orders',
        is_read: false
      });

      await supabase.from('seller_chats').insert({
        buyer_id: order.buyer_id,
        seller_id: profile?.id,
        message: `🎁 Seller has delivered your order for "${order.product?.name || 'Product'}". Please check your credentials and approve if everything is correct.`,
        sender_type: 'system',
        product_id: order.product_id
      });

      // Send order delivered email to buyer (background, non-blocking)
      const { data: buyerProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', order.buyer_id)
        .single();
      
      if (buyerProfile?.email) {
        sendEmail({
          templateId: 'order_delivered',
          to: buyerProfile.email,
          variables: {
            user_name: buyerProfile.email.split('@')[0],
            order_id: order.id.slice(0, 8).toUpperCase(),
            product_name: order.product?.name || 'Product',
          }
        }).catch(err => console.error('Delivery email error:', err));
      }

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

      const { error: orderError } = await supabase
        .from('seller_orders')
        .update({
          credentials: editCredentials.trim()
        })
        .eq('id', editingOrder);

      if (orderError) throw orderError;

      await supabase.from('notifications').insert({
        user_id: order.buyer_id,
        type: 'update',
        title: 'Credentials Updated',
        message: `Seller updated credentials for ${order.product?.name || 'Product'}`,
        link: '/dashboard/marketplace?tab=purchases',
        is_read: false
      });

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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-l-amber-400' };
      case 'delivered':
        return { icon: Truck, label: 'Delivered', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-l-blue-400' };
      case 'completed':
        return { icon: CheckCircle, label: 'Completed', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-l-emerald-400' };
      case 'refunded':
        return { icon: XCircle, label: 'Refunded', bg: 'bg-red-100', text: 'text-red-700', border: 'border-l-red-400' };
      default:
        return { icon: AlertCircle, label: status, bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-l-slate-400' };
    }
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const completedCount = orders.filter(o => o.status === 'completed').length;
  const refundedCount = orders.filter(o => o.status === 'refunded').length;

  const dateLabels: Record<string, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    week: 'This Week',
    month: 'This Month',
    '30d': 'Last 30 Days',
    custom: customRange ? `${format(customRange.from, 'MMM d')} - ${format(customRange.to, 'MMM d')}` : 'Custom',
    all: 'All Time'
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 bg-[#F7F8FA] min-h-screen">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 bg-[#F7F8FA] min-h-screen seller-dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refreshOrders()}
            className="bg-white border-slate-200 rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportCSV}
            className="bg-white border-slate-200 rounded-xl"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Delivered</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{deliveredCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Completed</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase">Refunded</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{refundedCount}</p>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by order ID, product, or buyer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-50 border-slate-200 rounded-xl"
            />
          </div>

          {/* Date Range Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[160px] justify-between bg-slate-50 border-slate-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-700">{dateLabels[dateRange]}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <div className="space-y-1">
                {['today', 'yesterday', 'week', 'month', '30d', 'all'].map((key) => (
                  <Button
                    key={key}
                    variant="ghost"
                    size="sm"
                    onClick={() => { setDateRange(key as typeof dateRange); setShowCustomPicker(false); }}
                    className={`w-full justify-start rounded-lg ${dateRange === key ? 'bg-slate-100' : ''}`}
                  >
                    {dateLabels[key]}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCustomPicker(true)}
                  className={`w-full justify-start rounded-lg text-blue-600 ${dateRange === 'custom' ? 'bg-blue-50' : ''}`}
                >
                  Custom Range...
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 mt-4 overflow-x-auto hide-scrollbar pb-1">
          {[
            { key: 'all', label: 'All', count: orders.length },
            { key: 'pending', label: 'Pending', count: pendingCount },
            { key: 'delivered', label: 'Delivered', count: deliveredCount },
            { key: 'completed', label: 'Completed', count: completedCount },
            { key: 'refunded', label: 'Refunded', count: refundedCount }
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={activeStatus === tab.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveStatus(tab.key as typeof activeStatus)}
              className={`flex-shrink-0 rounded-full px-4 ${
                activeStatus === tab.key 
                  ? 'bg-slate-900 text-white hover:bg-slate-800' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
              <Badge className={`ml-2 text-[10px] ${
                activeStatus === tab.key 
                  ? 'bg-white/20 text-white' 
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {tab.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Bulk Actions */}
        {selectedOrders.size > 0 && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
            <Badge className="bg-blue-100 text-blue-700">{selectedOrders.size} selected</Badge>
            <Button size="sm" variant="ghost" onClick={() => setSelectedOrders(new Set())} className="text-slate-600">
              Clear Selection
            </Button>
          </div>
        )}
      </div>

      {/* Custom Date Picker Modal */}
      <Dialog open={showCustomPicker} onOpenChange={setShowCustomPicker}>
        <DialogContent className="max-w-fit">
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
          </DialogHeader>
          <Calendar
            mode="range"
            selected={customRange ? { from: customRange.from, to: customRange.to } : undefined}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                setCustomRange({ from: range.from, to: range.to });
                setDateRange('custom');
                setShowCustomPicker(false);
              }
            }}
            numberOfMonths={2}
            className="pointer-events-auto"
          />
        </DialogContent>
      </Dialog>

      {/* Orders List - Dokani Card Style */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900 mb-2">No orders found</h3>
            <p className="text-slate-500 text-sm">Try adjusting your filters</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;
            const buyerEmailInput = (order as any).buyer_email_input;

            return (
              <div key={order.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Order Header - Dokani Style */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600 flex-wrap">
                    <span>Customer: <strong className="text-slate-800">{order.buyer?.email?.split('@')[0] || 'Buyer'}</strong></span>
                    <span className="text-slate-300 hidden sm:inline">|</span>
                    <span>Date: <strong className="text-slate-800">{format(new Date(order.created_at), 'dd MMM, yyyy')}</strong></span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    Order ID: #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                
                {/* Product Row */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Checkbox for pending orders */}
                  {order.status === 'pending' && (
                    <Checkbox
                      checked={selectedOrders.has(order.id)}
                      onCheckedChange={(checked) => handleSelectOrder(order.id, !!checked)}
                      className="flex-shrink-0"
                    />
                  )}
                  
                  {/* Product Image */}
                  <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {order.product?.icon_url ? (
                      <img src={order.product.icon_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{order.product?.name || 'Product'}</p>
                    <p className="text-sm text-slate-500">Quantity: 1</p>
                    {buyerEmailInput && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-400">{buyerEmailInput}</span>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(buyerEmailInput)} className="h-5 w-5 p-0 text-blue-600">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg text-slate-800">{formatAmountOnly(Number(order.amount))}</p>
                    <p className="text-xs text-emerald-600">+{formatAmountOnly(Number(order.seller_earning))} earned</p>
                  </div>
                  
                  {/* Status Badge */}
                  <Badge className={`${statusConfig.bg} ${statusConfig.text} border-0 text-xs font-semibold flex-shrink-0`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                  
                  {/* Actions */}
                  <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedOrder(order.id)}
                        className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Deliver
                      </Button>
                    )}
                    {order.status === 'delivered' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditCredentials(order.id, order.credentials)}
                        className="flex-1 sm:flex-none border-emerald-500 text-emerald-600 rounded-lg hover:bg-emerald-50"
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    {order.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(order.id)}
                        className="flex-1 sm:flex-none text-slate-500 rounded-lg"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy ID
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

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
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-sm text-blue-600">
                After delivery, the buyer will review and approve. Your earnings will be released upon approval.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedOrder(null)}
                className="flex-1 border-slate-200 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeliver}
                disabled={delivering || !credentials.trim()}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 rounded-xl"
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
              placeholder="Enter updated account credentials"
              value={editCredentials}
              onChange={(e) => setEditCredentials(e.target.value)}
              rows={4}
              className="border-slate-200"
            />
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-sm text-amber-600">
                The buyer will be notified of the credential update.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setEditingOrder(null)}
                className="flex-1 border-slate-200 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateCredentials}
                disabled={updating || !editCredentials.trim()}
                className="flex-1 bg-blue-500 hover:bg-blue-600 rounded-xl"
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
