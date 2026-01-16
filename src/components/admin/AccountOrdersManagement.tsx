import { useState, useEffect, useMemo } from 'react';
import { Loader2, Package, CheckCircle, Clock, Send, Eye, Edit, Trash2, X, Save, Search, Filter, RefreshCw, Download, DollarSign, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

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

const ITEMS_PER_PAGE = 10;

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

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'delivered'>('all');
  const [filterPayment, setFilterPayment] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
    const unsubscribe = subscribeToOrders();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterPayment]);

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
        user_name: profileMap.get(order.user_id)?.full_name || null
      }));

      setOrders(enrichedOrders as AccountOrder[]);

      const pending = enrichedOrders.filter(o => o.delivery_status === 'pending').length;
      const delivered = enrichedOrders.filter(o => o.delivery_status === 'delivered').length;
      const revenue = enrichedOrders
        .filter(o => o.payment_status === 'completed')
        .reduce((sum, o) => sum + Number(o.amount), 0);

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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
    toast.success('Orders refreshed');
  };

  // Filtered and searched orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        order.user_email?.toLowerCase().includes(searchLower) ||
        order.user_name?.toLowerCase().includes(searchLower) ||
        order.ai_accounts?.name?.toLowerCase().includes(searchLower) ||
        order.id.toLowerCase().includes(searchLower);

      // Delivery status filter
      const matchesStatus = filterStatus === 'all' || order.delivery_status === filterStatus;

      // Payment status filter
      const matchesPayment = filterPayment === 'all' || order.payment_status === filterPayment;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, searchQuery, filterStatus, filterPayment]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const handleDeliver = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    
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

  const exportToCSV = () => {
    const headers = ['Order ID', 'User Email', 'User Name', 'Product', 'Amount', 'Payment Status', 'Delivery Status', 'Purchased At', 'Delivered At'];
    const rows = filteredOrders.map(o => [
      o.id,
      o.user_email,
      o.user_name || 'N/A',
      o.ai_accounts?.name || 'N/A',
      `$${o.amount}`,
      o.payment_status,
      o.delivery_status,
      new Date(o.purchased_at).toLocaleString(),
      o.delivered_at ? new Date(o.delivered_at).toLocaleString() : 'N/A'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `account-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Orders exported to CSV');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-[#27272a] border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-5 hover:border-[#3f3f46] transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Package size={22} className="text-blue-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-sm font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-5 hover:border-[#3f3f46] transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <Clock size={22} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-5 hover:border-[#3f3f46] transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20">
              <CheckCircle size={22} className="text-green-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-sm font-medium">Delivered</p>
              <p className="text-2xl font-bold text-green-400">{stats.delivered}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-5 hover:border-[#3f3f46] transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <DollarSign size={22} className="text-purple-400" />
            </div>
            <div>
              <p className="text-zinc-400 text-sm font-medium">Revenue</p>
              <p className="text-2xl font-bold text-purple-400">${stats.revenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-[#111113] border border-[#27272a] rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by email, name, product, or order ID..."
              className="w-full bg-[#0c0c0e] border border-[#27272a] rounded-xl pl-11 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#3f3f46] transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="bg-[#0c0c0e] border border-[#27272a] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#3f3f46]"
            >
              <option value="all">All Delivery</option>
              <option value="pending">Pending</option>
              <option value="delivered">Delivered</option>
            </select>

            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value as typeof filterPayment)}
              className="bg-[#0c0c0e] border border-[#27272a] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#3f3f46]"
            >
              <option value="all">All Payments</option>
              <option value="pending">Payment Pending</option>
              <option value="completed">Payment Completed</option>
              <option value="failed">Payment Failed</option>
            </select>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-[#18181b] border border-[#27272a] text-white px-4 py-3 rounded-xl hover:bg-[#1f1f23] transition-colors"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-[#18181b] border border-[#27272a] text-white px-4 py-3 rounded-xl hover:bg-[#1f1f23] transition-colors"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-400">
          <span>
            Showing {paginatedOrders.length} of {filteredOrders.length} orders
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
          {stats.pending > 0 && (
            <span className="flex items-center gap-2 text-yellow-400">
              <AlertCircle size={16} />
              {stats.pending} order{stats.pending > 1 ? 's' : ''} awaiting delivery
            </span>
          )}
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

      {/* Orders Table */}
      {filteredOrders.length === 0 ? (
        <div className="bg-[#111113] border border-[#27272a] rounded-xl p-12 text-center">
          <Package className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {orders.length === 0 ? 'No Orders Yet' : 'No Orders Found'}
          </h3>
          <p className="text-zinc-400">
            {orders.length === 0 
              ? 'AI account orders will appear here' 
              : 'Try adjusting your search or filters'}
          </p>
        </div>
      ) : (
        <div className="bg-[#111113] border border-[#27272a] rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#27272a] hover:bg-transparent">
                <TableHead className="text-zinc-400">Product</TableHead>
                <TableHead className="text-zinc-400">Customer</TableHead>
                <TableHead className="text-zinc-400">Amount</TableHead>
                <TableHead className="text-zinc-400">Payment</TableHead>
                <TableHead className="text-zinc-400">Delivery</TableHead>
                <TableHead className="text-zinc-400">Date</TableHead>
                <TableHead className="text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map((order) => (
                <TableRow key={order.id} className="border-[#27272a] hover:bg-[#1a1a1e]">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center text-lg">
                        {getCategoryIcon(order.ai_accounts?.category)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{order.ai_accounts?.name || 'AI Account'}</p>
                        <p className="text-xs text-zinc-500">{order.ai_accounts?.category || 'Unknown'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-white font-medium">{order.user_name || 'Unknown'}</p>
                      <p className="text-zinc-500 text-sm">{order.user_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-white font-semibold">${Number(order.amount).toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      order.payment_status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : order.payment_status === 'failed'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {order.payment_status === 'completed' && <CheckCircle size={12} />}
                      {order.payment_status === 'pending' && <Clock size={12} />}
                      {order.payment_status === 'failed' && <X size={12} />}
                      {order.payment_status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      order.delivery_status === 'delivered'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {order.delivery_status === 'delivered' ? <CheckCircle size={12} /> : <Clock size={12} />}
                      {order.delivery_status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-white text-sm">{new Date(order.purchased_at).toLocaleDateString()}</p>
                      <p className="text-zinc-500 text-xs">{new Date(order.purchased_at).toLocaleTimeString()}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {order.delivery_status === 'pending' && order.payment_status === 'completed' && (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={credentials[order.id] || ''}
                            onChange={(e) => setCredentials(prev => ({ ...prev, [order.id]: e.target.value }))}
                            placeholder="Credentials..."
                            className="w-32 bg-[#0c0c0e] border border-[#27272a] rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#3f3f46]"
                          />
                          <button
                            onClick={() => handleDeliver(order.id)}
                            disabled={delivering === order.id}
                            className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                            title="Deliver"
                          >
                            {delivering === order.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Send size={16} />
                            )}
                          </button>
                        </div>
                      )}
                      
                      {order.delivery_status === 'delivered' && order.account_credentials && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(order.account_credentials!);
                            toast.success('Credentials copied');
                          }}
                          className="p-2 rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-400 hover:bg-[#1f1f23] hover:text-white transition-all"
                          title="Copy credentials"
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleEdit(order)}
                        className="p-2 rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-400 hover:bg-[#1f1f23] hover:text-white transition-all"
                        title="Edit Order"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        disabled={deletingId === order.id}
                        className="p-2 rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
                        title="Delete Order"
                      >
                        {deletingId === order.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-[#27272a] p-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={`cursor-pointer ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      if (totalPages <= 5) return true;
                      if (page === 1 || page === totalPages) return true;
                      return Math.abs(page - currentPage) <= 1;
                    })
                    .map((page, index, arr) => (
                      <PaginationItem key={page}>
                        {index > 0 && arr[index - 1] !== page - 1 && (
                          <span className="px-2 text-zinc-500">...</span>
                        )}
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={`cursor-pointer ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AccountOrdersManagement;
