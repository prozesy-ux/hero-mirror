import { useState, useEffect } from 'react';
import { Loader2, Package, CheckCircle, Clock, Send, Eye, Edit, Trash2, X, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

const AccountOrdersManagement = () => {
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    delivered: 0,
    revenue: 0
  });

  useEffect(() => {
    fetchOrders();
    subscribeToOrders();
  }, []);

  const fetchOrders = async () => {
    const { data: ordersData, error } = await supabase
      .from('ai_account_purchases')
      .select(`
        *,
        ai_accounts (name, category)
      `)
      .order('purchased_at', { ascending: false });

    if (!error && ordersData) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, email, full_name');

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedOrders = ordersData.map(order => ({
        ...order,
        user_email: profileMap.get(order.user_id)?.email || 'Unknown',
        user_name: profileMap.get(order.user_id)?.full_name || 'Unknown'
      }));

      setOrders(enrichedOrders as AccountOrder[]);

      const pending = enrichedOrders.filter(o => o.delivery_status === 'pending').length;
      const delivered = enrichedOrders.filter(o => o.delivery_status === 'delivered').length;
      const revenue = enrichedOrders
        .filter(o => o.payment_status === 'completed')
        .reduce((sum, o) => sum + o.amount, 0);

      setStats({
        total: enrichedOrders.length,
        pending,
        delivered,
        revenue
      });
    }
    setLoading(false);
  };

  const subscribeToOrders = () => {
    const channel = supabase
      .channel('account-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_account_purchases'
        },
        () => {
          fetchOrders();
          toast.info('Order updated!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleDeliver = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    
    // Check if payment is completed
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
      fetchOrders();
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
      fetchOrders();
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
      fetchOrders();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-[#27272a] border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 hover:border-[#3f3f46] transition-colors">
          <div className="text-zinc-400 text-sm font-medium">Total Orders</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 hover:border-[#3f3f46] transition-colors">
          <div className="text-zinc-400 text-sm font-medium">Pending</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
        </div>
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 hover:border-[#3f3f46] transition-colors">
          <div className="text-zinc-400 text-sm font-medium">Delivered</div>
          <div className="text-2xl font-bold text-green-400">{stats.delivered}</div>
        </div>
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4 hover:border-[#3f3f46] transition-colors">
          <div className="text-zinc-400 text-sm font-medium">Revenue</div>
          <div className="text-2xl font-bold text-purple-400">${stats.revenue.toFixed(2)}</div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#0a0a0a] border border-[#27272a] rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Edit Order</h3>
              <button 
                onClick={() => setEditingOrder(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-[#1a1a1e] rounded-lg transition-colors"
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
                  className="w-full bg-[#0c0c0e] border border-[#27272a] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#3f3f46]"
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
                  className="w-full bg-[#0c0c0e] border border-[#27272a] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#3f3f46]"
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
                  className="w-full bg-[#0c0c0e] border border-[#27272a] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#3f3f46]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Account Credentials</label>
                <input
                  type="text"
                  value={editFormData.account_credentials}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, account_credentials: e.target.value }))}
                  placeholder="email:password or link"
                  className="w-full bg-[#0c0c0e] border border-[#27272a] rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#3f3f46]"
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
                  className="px-6 py-3 bg-[#18181b] border border-[#27272a] text-white rounded-xl hover:bg-[#1f1f23] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-12 text-center">
          <Package className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Orders Yet</h3>
          <p className="text-zinc-400">AI account orders will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`bg-[#111113] border rounded-xl p-5 ${
                order.delivery_status === 'pending' ? 'border-yellow-500/30' : 'border-[#27272a]'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center text-2xl">
                    {getCategoryIcon(order.ai_accounts?.category)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {order.ai_accounts?.name || 'AI Account'}
                    </h3>
                    <p className="text-gray-400 text-sm">{order.user_email}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(order.purchased_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-white">${order.amount}</span>
                  {order.delivery_status === 'pending' ? (
                    <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                      <Clock className="w-4 h-4" />
                      Pending
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Delivered
                    </span>
                  )}
                  
                  {/* Action Buttons */}
                  <button
                    onClick={() => handleEdit(order)}
                    className="p-2 rounded-lg bg-[#18181b] border border-[#27272a] text-gray-400 hover:bg-[#1f1f23] hover:text-white transition-all"
                    title="Edit Order"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(order.id)}
                    disabled={deletingId === order.id}
                    className="p-2 rounded-lg bg-[#18181b] border border-[#27272a] text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
                    title="Delete Order"
                  >
                    {deletingId === order.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>

              {order.delivery_status === 'pending' && (
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={credentials[order.id] || ''}
                    onChange={(e) => setCredentials(prev => ({ ...prev, [order.id]: e.target.value }))}
                    placeholder="Enter account credentials (email:password or link)"
                    className="flex-1 bg-[#0c0c0e] border border-[#27272a] rounded-xl px-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#3f3f46]"
                  />
                  <button
                    onClick={() => handleDeliver(order.id)}
                    disabled={delivering === order.id}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {delivering === order.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Deliver
                  </button>
                </div>
              )}

              {order.delivery_status === 'delivered' && order.account_credentials && (
                <div className="flex items-center gap-2 p-3 bg-[#18181b] border border-[#27272a] rounded-xl">
                  <Eye className="w-4 h-4 text-zinc-400" />
                  <code className="text-sm text-zinc-400">{order.account_credentials}</code>
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
