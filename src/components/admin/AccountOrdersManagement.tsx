import { useState, useEffect, useMemo } from 'react';
import { Loader2, Package, CheckCircle, Clock, Send, Eye, Edit, Trash2, X, Save, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

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
type PaymentFilter = 'all' | 'completed' | 'pending';

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');

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

  const handleDelete = async (orderId: string) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    setDeletingId(orderId);
    
    const { error } = await supabase
      .from('ai_account_purchases')
      .delete()
      .eq('id', orderId);
    
    setDeletingId(null);
    
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

  const filteredOrders = enrichedOrders.filter(order => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      order.user_email?.toLowerCase().includes(searchLower) ||
      order.user_name?.toLowerCase().includes(searchLower) ||
      order.ai_accounts?.name?.toLowerCase().includes(searchLower) ||
      order.id.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'all' || order.delivery_status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Total Orders</div>
          <div className="text-2xl font-bold text-white">
            {isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : stats.total}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Pending</div>
          <div className="text-2xl font-bold text-yellow-400">
            {isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : stats.pending}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Delivered</div>
          <div className="text-2xl font-bold text-green-400">
            {isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : stats.delivered}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Revenue</div>
          <div className="text-2xl font-bold text-purple-400">
            {isLoading ? <Skeleton className="h-8 w-20 bg-white/10" /> : `$${stats.revenue.toFixed(2)}`}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by user, email, account name, or order ID..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Delivery</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <option value="all">All Payments</option>
            <option value="completed">Paid</option>
            <option value="pending">Payment Pending</option>
          </select>
        </div>

        {(searchQuery || statusFilter !== 'all' || paymentFilter !== 'all') && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
            <span className="text-gray-400 text-sm">Showing {filteredOrders.length} of {enrichedOrders.length} orders</span>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setPaymentFilter('all');
              }}
              className="text-purple-400 text-sm hover:text-purple-300"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Edit Order</h3>
              <button 
                onClick={() => setEditingOrder(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Payment Status</label>
                <select
                  value={editFormData.payment_status}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, payment_status: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Delivery Status</label>
                <select
                  value={editFormData.delivery_status}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, delivery_status: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="pending">Pending</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Amount ($)</label>
                <input
                  type="number"
                  value={editFormData.amount}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Account Credentials</label>
                <input
                  type="text"
                  value={editFormData.account_credentials}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, account_credentials: e.target.value }))}
                  placeholder="email:password or link"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingOrder(null)}
                  className="px-6 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full bg-white/10" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32 bg-white/10" />
                    <Skeleton className="h-4 w-48 bg-white/10" />
                    <Skeleton className="h-4 w-24 bg-white/10" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20 bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {enrichedOrders.length === 0 ? 'No Orders Yet' : 'No Matching Orders'}
          </h3>
          <p className="text-gray-400">
            {enrichedOrders.length === 0 ? 'AI account orders will appear here' : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`bg-white/5 border rounded-xl p-5 ${
                order.delivery_status === 'pending' ? 'border-yellow-500/30' : 'border-white/10'
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
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                      {order.user_name?.charAt(0) || order.user_email?.charAt(0) || 'U'}
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-bold text-white text-lg">
                      {order.user_name || 'Unknown User'}
                    </h3>
                    <p className="text-gray-400 text-sm">{order.user_email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl">{getCategoryIcon(order.ai_accounts?.category)}</span>
                      <span className="text-gray-300 font-medium">{order.ai_accounts?.name || 'AI Account'}</span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                      {new Date(order.purchased_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">${order.amount}</p>
                    <div className="flex gap-1.5 mt-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        order.payment_status === 'completed' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {order.payment_status}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        order.delivery_status === 'delivered' 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {order.delivery_status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(order)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Edit order"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      disabled={deletingId === order.id}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete order"
                    >
                      {deletingId === order.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {order.delivery_status === 'pending' && order.payment_status === 'completed' && (
                <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
                  <input
                    type="text"
                    value={credentials[order.id] || ''}
                    onChange={(e) => setCredentials(prev => ({ ...prev, [order.id]: e.target.value }))}
                    placeholder="Enter account credentials (email:password or invite link)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                  <button
                    onClick={() => handleDeliver(order.id)}
                    disabled={delivering === order.id}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {delivering === order.id ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Deliver
                  </button>
                </div>
              )}

              {order.delivery_status === 'delivered' && order.account_credentials && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-400" />
                    <span className="text-green-400 text-sm font-medium">Delivered</span>
                    <span className="text-gray-500 text-xs">
                      {order.delivered_at && new Date(order.delivered_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 p-3 bg-white/5 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">Credentials:</p>
                    <p className="text-white font-mono text-sm">{order.account_credentials}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AccountOrdersManagement;
