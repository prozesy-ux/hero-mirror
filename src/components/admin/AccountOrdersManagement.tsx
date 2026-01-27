import { useState, useEffect, useMemo } from 'react';
import { Loader2, Package, CheckCircle, Clock, Send, Eye, Edit, Trash2, X, Save, Search, RefreshCw, DollarSign, List } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface AccountOrder {
  id: string;
  user_id: string;
  amount: number;
  payment_status: string;
  delivery_status: string;
  account_credentials: string | null;
  purchased_at: string;
  delivered_at: string | null;
  ai_accounts: {
    name: string;
    category: string | null;
  } | null;
  user_email?: string;
  user_name?: string;
  user_avatar?: string | null;
}

type StatusFilter = 'all' | 'pending' | 'delivered' | 'failed';

const AccountOrdersManagement = () => {
  const { accountOrders, profiles, isLoading, refreshTable } = useAdminDataContext();
  const [delivering, setDelivering] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [editingOrder, setEditingOrder] = useState<AccountOrder | null>(null);
  const [editFormData, setEditFormData] = useState({
    payment_status: '',
    delivery_status: '',
    account_credentials: '',
    amount: 0
  });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const enrichedOrders = useMemo(() => {
    const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));
    return accountOrders.map((order: any) => ({
      ...order,
      user_email: profileMap.get(order.user_id)?.email || 'Unknown',
      user_name: profileMap.get(order.user_id)?.full_name || 'Unknown',
      user_avatar: profileMap.get(order.user_id)?.avatar_url || null
    })) as AccountOrder[];
  }, [accountOrders, profiles]);

  const stats = useMemo(() => {
    const pending = enrichedOrders.filter(o => o.delivery_status === 'pending').length;
    const delivered = enrichedOrders.filter(o => o.delivery_status === 'delivered').length;
    const revenue = enrichedOrders
      .filter(o => o.payment_status === 'completed')
      .reduce((sum, o) => sum + o.amount, 0);
    return { total: enrichedOrders.length, pending, delivered, revenue };
  }, [enrichedOrders]);

  useEffect(() => {
    const channel = supabase
      .channel('account-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ai_account_purchases' }, () => {
        refreshTable('ai_account_purchases');
        toast.info('Order updated!');
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refreshTable]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshTable('ai_account_purchases');
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  const handleDeliver = async (orderId: string) => {
    const order = enrichedOrders.find(o => o.id === orderId);
    
    if (order?.payment_status !== 'completed') {
      toast.error('Cannot deliver - payment not completed');
      return;
    }
    
    const creds = credentials[orderId];
    if (!creds?.trim()) {
      toast.error('Please enter account credentials');
      return;
    }

    setDelivering(orderId);

    const { error } = await supabase
      .from('ai_account_purchases')
      .update({
        account_credentials: creds,
        delivery_status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      .eq('id', orderId);

    setDelivering(null);

    if (error) {
      toast.error('Failed to deliver credentials');
    } else {
      toast.success('Credentials delivered successfully');
      setCredentials(prev => ({ ...prev, [orderId]: '' }));
      refreshTable('ai_account_purchases');
    }
  };

  const handleEdit = (order: AccountOrder) => {
    setEditingOrder(order);
    setEditFormData({
      payment_status: order.payment_status,
      delivery_status: order.delivery_status,
      account_credentials: order.account_credentials || '',
      amount: order.amount
    });
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    
    setSaving(true);
    
    const { error } = await supabase
      .from('ai_account_purchases')
      .update({
        payment_status: editFormData.payment_status,
        delivery_status: editFormData.delivery_status,
        account_credentials: editFormData.account_credentials || null,
        amount: editFormData.amount,
        delivered_at: editFormData.delivery_status === 'delivered' ? new Date().toISOString() : null
      })
      .eq('id', editingOrder.id);

    setSaving(false);

    if (error) {
      toast.error('Failed to update order');
    } else {
      toast.success('Order updated successfully');
      setEditingOrder(null);
      refreshTable('ai_account_purchases');
    }
  };

  const handleDeleteClick = (orderId: string) => {
    setDeleteConfirm({ open: true, id: orderId });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return;
    
    setDeleting(true);
    
    const { error } = await supabase
      .from('ai_account_purchases')
      .delete()
      .eq('id', deleteConfirm.id);
    
    setDeleting(false);
    setDeleteConfirm({ open: false, id: null });
    
    if (error) {
      toast.error('Failed to delete order');
    } else {
      toast.success('Order deleted successfully');
      refreshTable('ai_account_purchases');
    }
  };

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case 'chatgpt': return '🤖';
      case 'claude': return '🧠';
      case 'midjourney': return '🎨';
      case 'gemini': return '✨';
      default: return '🔮';
    }
  };

  const filteredOrders = useMemo(() => {
    return enrichedOrders.filter(order => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        order.user_email?.toLowerCase().includes(searchLower) ||
        order.user_name?.toLowerCase().includes(searchLower) ||
        order.ai_accounts?.name?.toLowerCase().includes(searchLower) ||
        order.id.toLowerCase().includes(searchLower);

      const matchesTab = activeTab === 'all' || order.delivery_status === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [enrichedOrders, searchQuery, activeTab]);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Total Orders</p>
              <p className="text-3xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-8 w-16 bg-slate-700" /> : stats.total}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <Package className="h-7 w-7 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Pending</p>
              <p className="text-3xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-8 w-16 bg-slate-700" /> : stats.pending}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
              <Clock className="h-7 w-7 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Delivered</p>
              <p className="text-3xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-8 w-16 bg-slate-700" /> : stats.delivered}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-violet-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Revenue</p>
              <p className="text-3xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-8 w-16 bg-slate-700" /> : `$${stats.revenue.toFixed(2)}`}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <DollarSign className="h-7 w-7 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs with Refresh on same row */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StatusFilter)} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-slate-900/50 border border-slate-800 p-1 rounded-xl">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4"
            >
              <List className="h-4 w-4 mr-2" />
              All
            </TabsTrigger>
            <TabsTrigger 
              value="pending" 
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4"
            >
              <Clock className="h-4 w-4 mr-2" />
              Pending
            </TabsTrigger>
            <TabsTrigger 
              value="delivered" 
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Delivered
            </TabsTrigger>
          </TabsList>

          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing || isLoading}
            className="bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user, email, account name, or order ID..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {/* Orders List */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded-full bg-slate-700" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32 bg-slate-700" />
                        <Skeleton className="h-4 w-48 bg-slate-700" />
                        <Skeleton className="h-4 w-24 bg-slate-700" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-20 bg-slate-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
              <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {enrichedOrders.length === 0 ? 'No Orders Yet' : 'No Matching Orders'}
              </h3>
              <p className="text-slate-400">
                {enrichedOrders.length === 0 ? 'AI account orders will appear here' : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className={`bg-slate-900/50 border rounded-2xl p-5 ${
                    order.delivery_status === 'pending' ? 'border-amber-500/30' : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {order.user_avatar ? (
                        <img 
                          src={order.user_avatar} 
                          alt={order.user_name} 
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                          {order.user_name?.charAt(0) || order.user_email?.charAt(0) || 'U'}
                        </div>
                      )}
                      
                      <div>
                        <h3 className="font-bold text-white text-lg">
                          {order.user_name || 'Unknown User'}
                        </h3>
                        <p className="text-slate-400 text-sm">{order.user_email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xl">{getCategoryIcon(order.ai_accounts?.category)}</span>
                          <span className="text-slate-300 font-medium">{order.ai_accounts?.name || 'AI Account'}</span>
                        </div>
                        <p className="text-slate-500 text-xs mt-1">
                          {new Date(order.purchased_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xl font-bold text-emerald-400">${order.amount.toFixed(2)}</p>
                        <div className="flex gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            order.payment_status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {order.payment_status}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            order.delivery_status === 'delivered'
                              ? 'bg-violet-500/20 text-violet-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {order.delivery_status}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(order)}
                          className="p-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-white"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(order.id)}
                          disabled={deleting}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Section for Pending Orders */}
                  {order.delivery_status === 'pending' && order.payment_status === 'completed' && (
                    <div className="flex gap-3 pt-4 border-t border-slate-800">
                      <input
                        type="text"
                        value={credentials[order.id] || ''}
                        onChange={(e) => setCredentials(prev => ({ ...prev, [order.id]: e.target.value }))}
                        placeholder="Enter credentials (email:password)"
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                      <button
                        onClick={() => handleDeliver(order.id)}
                        disabled={delivering === order.id}
                        className="flex items-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl disabled:opacity-50"
                      >
                        {delivering === order.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Send size={18} />
                        )}
                        Deliver
                      </button>
                    </div>
                  )}

                  {/* Show Credentials for Delivered Orders */}
                  {order.delivery_status === 'delivered' && order.account_credentials && (
                    <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-400 text-sm font-medium">Delivered Credentials:</span>
                        </div>
                        <code className="text-slate-300 text-sm bg-slate-800 px-3 py-1 rounded">{order.account_credentials}</code>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Edit Order</h3>
              <button 
                onClick={() => setEditingOrder(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Payment Status</label>
                <select
                  value={editFormData.payment_status}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, payment_status: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Delivery Status</label>
                <select
                  value={editFormData.delivery_status}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, delivery_status: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="pending">Pending</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Amount ($)</label>
                <input
                  type="number"
                  value={editFormData.amount}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Account Credentials</label>
                <input
                  type="text"
                  value={editFormData.account_credentials}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, account_credentials: e.target.value }))}
                  placeholder="email:password or link"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingOrder(null)}
                  className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, id: open ? deleteConfirm.id : null })}
        title="Delete Order"
        description="Are you sure you want to delete this order? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
      />
    </div>
  );
};

export default AccountOrdersManagement;
