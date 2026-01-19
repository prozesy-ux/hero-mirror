import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminMutate } from '@/hooks/useAdminMutate';
import { 
  Crown, User as UserIcon, Trash2, Search, Loader2, ToggleLeft, ToggleRight,
  X, Wallet, History, ShoppingBag, Package, MessageCircle, Edit, Eye,
  DollarSign, ArrowUpRight, ArrowDownRight, Send
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_pro: boolean;
  created_at: string;
}

interface WalletData {
  balance: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  created_at: string;
  payment_gateway: string | null;
}

interface Purchase {
  id: string;
  amount: number;
  payment_status: string;
  purchased_at: string;
}

interface AIAccountPurchase {
  id: string;
  amount: number;
  payment_status: string;
  delivery_status: string;
  purchased_at: string;
  ai_accounts: { name: string } | null;
}

interface SupportMessage {
  id: string;
  message: string;
  sender_type: string;
  created_at: string;
}

type DetailTab = 'profile' | 'wallet' | 'transactions' | 'purchases' | 'orders' | 'chat';

const UsersManagement = () => {
  const { profiles, isLoading, refreshTable } = useAdminDataContext();
  const { fetchData } = useAdminData();
  const { updateData, deleteData, insertData, deleteWithFilters } = useAdminMutate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  
  // User detail modal state
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('profile');
  const [userWallet, setUserWallet] = useState<WalletData | null>(null);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [userPurchases, setUserPurchases] = useState<Purchase[]>([]);
  const [userOrders, setUserOrders] = useState<AIAccountPurchase[]>([]);
  const [userMessages, setUserMessages] = useState<SupportMessage[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Edit balance modal
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [newBalance, setNewBalance] = useState<number>(0);
  const [savingBalance, setSavingBalance] = useState(false);
  
  // Stats
  const [totalTopups, setTotalTopups] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  const users = profiles as UserProfile[];

  // Real-time subscription for profiles and wallets
  useEffect(() => {
    const profilesChannel = supabase
      .channel('admin-users-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        refreshTable('profiles');
      })
      .subscribe();

    const walletsChannel = supabase
      .channel('admin-users-wallets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_wallets' }, () => {
        // Refresh user details if a user is selected
        if (selectedUser) {
          fetchData('user_wallets', { filters: [{ column: 'user_id', value: selectedUser.user_id }] })
            .then(res => setUserWallet(res.data?.[0] || { balance: 0 }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(walletsChannel);
    };
  }, [refreshTable, selectedUser]);

  const fetchUserDetails = async (user: UserProfile) => {
    setLoadingDetail(true);
    setSelectedUser(user);
    setDetailTab('profile');

    const [walletRes, transactionsRes, purchasesRes, ordersRes, messagesRes] = await Promise.all([
      fetchData('user_wallets', { filters: [{ column: 'user_id', value: user.user_id }] }),
      fetchData('wallet_transactions', { 
        filters: [{ column: 'user_id', value: user.user_id }],
        order: { column: 'created_at', ascending: false },
        limit: 20
      }),
      fetchData('purchases', {
        filters: [{ column: 'user_id', value: user.user_id }],
        order: { column: 'purchased_at', ascending: false }
      }),
      fetchData('ai_account_purchases', {
        select: '*, ai_accounts(name)',
        filters: [{ column: 'user_id', value: user.user_id }],
        order: { column: 'purchased_at', ascending: false }
      }),
      fetchData('support_messages', {
        filters: [{ column: 'user_id', value: user.user_id }],
        order: { column: 'created_at', ascending: false },
        limit: 10
      })
    ]);

    setUserWallet(walletRes.data?.[0] || { balance: 0 });
    setUserTransactions(transactionsRes.data || []);
    setUserPurchases(purchasesRes.data || []);
    setUserOrders(ordersRes.data || []);
    setUserMessages(messagesRes.data || []);

    const topups = (transactionsRes.data || [])
      .filter((t: Transaction) => t.type === 'topup' && t.status === 'completed')
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    const spent = (transactionsRes.data || [])
      .filter((t: Transaction) => t.type === 'purchase' && t.status === 'completed')
      .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
    
    setTotalTopups(topups);
    setTotalSpent(spent);
    setLoadingDetail(false);
  };

  const handleDeleteUser = async (userId: string, userIdAuth: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    setDeletingId(userId);
    
    try {
      // Delete user roles using admin edge function
      await deleteWithFilters('user_roles', [{ column: 'user_id', value: userIdAuth }]);
      
      // Delete profile using admin edge function
      const result = await deleteData('profiles', userId);
      
      if (!result.success) {
        toast.error('Failed to delete user');
      } else {
        toast.success('User deleted successfully');
        setSelectedUser(null);
        refreshTable('profiles');
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePro = async (userId: string, currentStatus: boolean) => {
    setTogglingId(userId);
    
    const result = await updateData('profiles', userId, { is_pro: !currentStatus });
    
    if (!result.success) {
      toast.error('Failed to update user status');
    } else {
      toast.success(`User ${!currentStatus ? 'upgraded to Pro' : 'downgraded to Free'}`);
      refreshTable('profiles');
      if (selectedUser) {
        setSelectedUser({ ...selectedUser, is_pro: !currentStatus });
      }
    }
    
    setTogglingId(null);
  };

  const handleUpdateBalance = async () => {
    if (!selectedUser) return;
    
    setSavingBalance(true);

    // Check if wallet exists
    const { data: existingWallet } = await fetchData('user_wallets', {
      filters: [{ column: 'user_id', value: selectedUser.user_id }]
    });

    let result;
    if (existingWallet && existingWallet.length > 0) {
      result = await updateData('user_wallets', existingWallet[0].id, { balance: newBalance });
    } else {
      result = await insertData('user_wallets', { user_id: selectedUser.user_id, balance: newBalance });
    }

    setSavingBalance(false);
    setShowBalanceModal(false);

    if (!result.success) {
      toast.error('Failed to update balance');
    } else {
      toast.success('Balance updated successfully');
      setUserWallet({ balance: newBalance });
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const proCount = users.filter(u => u.is_pro).length;
  const freeCount = users.filter(u => !u.is_pro).length;

  const detailTabs = [
    { id: 'profile' as DetailTab, label: 'Profile', icon: UserIcon },
    { id: 'wallet' as DetailTab, label: 'Wallet', icon: Wallet },
    { id: 'transactions' as DetailTab, label: 'Transactions', icon: History },
    { id: 'purchases' as DetailTab, label: 'Purchases', icon: ShoppingBag },
    { id: 'orders' as DetailTab, label: 'AI Orders', icon: Package },
    { id: 'chat' as DetailTab, label: 'Chat', icon: MessageCircle },
  ];

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Total Users</div>
          <div className="text-2xl font-bold text-white">
            {isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : users.length}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Pro Users</div>
          <div className="text-2xl font-bold text-amber-400">
            {isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : proCount}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Free Users</div>
          <div className="text-2xl font-bold text-gray-400">
            {isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : freeCount}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, or username..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
        />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">User</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Email</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Plan</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Joined</th>
              <th className="text-right px-6 py-4 text-gray-400 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full bg-white/10" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24 bg-white/10" />
                        <Skeleton className="h-3 w-16 bg-white/10" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-40 bg-white/10" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full bg-white/10" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-24 bg-white/10" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-8 w-24 ml-auto bg-white/10" /></td>
                </tr>
              ))
            ) : (
              filteredUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className="border-t border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => fetchUserDetails(user)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.full_name || 'User'} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <span className="text-white font-medium">{user.full_name || 'No name'}</span>
                        {user.username && (
                          <p className="text-gray-500 text-xs">@{user.username}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{user.email}</td>
                  <td className="px-6 py-4">
                    {user.is_pro ? (
                      <span className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full w-fit">
                        <Crown size={12} /> Pro
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1 bg-white/10 text-gray-300 text-xs rounded-full w-fit">
                        <UserIcon size={12} /> Free
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => fetchUserDetails(user)}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleTogglePro(user.id, user.is_pro)}
                        disabled={togglingId === user.id}
                        className={`p-2 rounded-lg transition-all ${
                          user.is_pro 
                            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' 
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}
                        title={user.is_pro ? 'Downgrade to Free' : 'Upgrade to Pro'}
                      >
                        {togglingId === user.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : user.is_pro ? (
                          <ToggleRight size={18} />
                        ) : (
                          <ToggleLeft size={18} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.user_id)}
                        disabled={deletingId === user.id}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
                        title="Delete User"
                      >
                        {deletingId === user.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!isLoading && filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            {searchQuery ? 'No users found matching your search' : 'No users found'}
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/80 overflow-y-auto">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-4xl w-full my-8">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedUser.avatar_url ? (
                    <img 
                      src={selectedUser.avatar_url} 
                      alt={selectedUser.full_name || 'User'} 
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                      {selectedUser.full_name?.charAt(0) || selectedUser.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-white">
                        {selectedUser.full_name || 'No name'}
                      </h2>
                      {selectedUser.is_pro && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                          <Crown size={10} /> Pro
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400">{selectedUser.email}</p>
                    {selectedUser.username && (
                      <p className="text-gray-500 text-sm">@{selectedUser.username}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-white/10">
              <div className="flex overflow-x-auto">
                {detailTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setDetailTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap ${
                      detailTab === tab.id
                        ? 'text-white border-b-2 border-white'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {loadingDetail ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full bg-white/10" />
                  <Skeleton className="h-20 w-full bg-white/10" />
                </div>
              ) : (
                <>
                  {/* Profile Tab */}
                  {detailTab === 'profile' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-xl p-4">
                          <p className="text-gray-400 text-sm">User ID</p>
                          <p className="text-white font-mono text-sm truncate">{selectedUser.user_id}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                          <p className="text-gray-400 text-sm">Joined</p>
                          <p className="text-white">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleTogglePro(selectedUser.id, selectedUser.is_pro)}
                          disabled={togglingId === selectedUser.id}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                            selectedUser.is_pro
                              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {togglingId === selectedUser.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Crown size={16} />
                          )}
                          {selectedUser.is_pro ? 'Downgrade to Free' : 'Upgrade to Pro'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(selectedUser.id, selectedUser.user_id)}
                          disabled={deletingId === selectedUser.id}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-all"
                        >
                          {deletingId === selectedUser.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                          Delete User
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Wallet Tab */}
                  {detailTab === 'wallet' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/5 rounded-xl p-4">
                          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                            <Wallet size={14} />
                            Current Balance
                          </div>
                          <p className="text-2xl font-bold text-white">${userWallet?.balance?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                            <ArrowUpRight size={14} className="text-green-400" />
                            Total Top-ups
                          </div>
                          <p className="text-2xl font-bold text-green-400">${totalTopups.toFixed(2)}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                            <ArrowDownRight size={14} className="text-red-400" />
                            Total Spent
                          </div>
                          <p className="text-2xl font-bold text-red-400">${totalSpent.toFixed(2)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setNewBalance(userWallet?.balance || 0);
                          setShowBalanceModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-all"
                      >
                        <Edit size={16} />
                        Edit Balance
                      </button>
                    </div>
                  )}

                  {/* Transactions Tab */}
                  {detailTab === 'transactions' && (
                    <div className="space-y-4">
                      {userTransactions.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No transactions found</p>
                      ) : (
                        userTransactions.map(tx => (
                          <div key={tx.id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${tx.type === 'topup' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                {tx.type === 'topup' ? (
                                  <ArrowUpRight className="text-green-400" size={18} />
                                ) : (
                                  <ArrowDownRight className="text-red-400" size={18} />
                                )}
                              </div>
                              <div>
                                <p className="text-white font-medium capitalize">{tx.type}</p>
                                <p className="text-gray-500 text-sm">{tx.description || tx.payment_gateway || '-'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${tx.type === 'topup' ? 'text-green-400' : 'text-red-400'}`}>
                                {tx.type === 'topup' ? '+' : '-'}${tx.amount.toFixed(2)}
                              </p>
                              <p className="text-gray-500 text-sm">{new Date(tx.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Purchases Tab */}
                  {detailTab === 'purchases' && (
                    <div className="space-y-4">
                      {userPurchases.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No purchases found</p>
                      ) : (
                        userPurchases.map(purchase => (
                          <div key={purchase.id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-purple-500/20">
                                <ShoppingBag className="text-purple-400" size={18} />
                              </div>
                              <div>
                                <p className="text-white font-medium">Bundle Purchase</p>
                                <p className="text-gray-500 text-sm">{new Date(purchase.purchased_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-white">${purchase.amount.toFixed(2)}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                purchase.payment_status === 'completed' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {purchase.payment_status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* AI Orders Tab */}
                  {detailTab === 'orders' && (
                    <div className="space-y-4">
                      {userOrders.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No AI account orders found</p>
                      ) : (
                        userOrders.map(order => (
                          <div key={order.id} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-500/20">
                                <Package className="text-blue-400" size={18} />
                              </div>
                              <div>
                                <p className="text-white font-medium">{order.ai_accounts?.name || 'Unknown Account'}</p>
                                <p className="text-gray-500 text-sm">{new Date(order.purchased_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-white">${order.amount.toFixed(2)}</p>
                              <div className="flex gap-1">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  order.payment_status === 'completed' 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                  {order.payment_status}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  order.delivery_status === 'delivered' 
                                    ? 'bg-blue-500/20 text-blue-400' 
                                    : 'bg-orange-500/20 text-orange-400'
                                }`}>
                                  {order.delivery_status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Chat Tab */}
                  {detailTab === 'chat' && (
                    <div className="space-y-4">
                      {userMessages.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No support messages found</p>
                      ) : (
                        userMessages.map(msg => (
                          <div 
                            key={msg.id} 
                            className={`rounded-xl p-4 ${
                              msg.sender_type === 'admin' 
                                ? 'bg-white text-black ml-8' 
                                : 'bg-white/10 text-white mr-8'
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p className={`text-xs mt-1 ${msg.sender_type === 'admin' ? 'text-gray-500' : 'text-gray-400'}`}>
                              {msg.sender_type === 'admin' ? 'Support' : 'User'} • {new Date(msg.created_at).toLocaleString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Balance Modal */}
      {showBalanceModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Edit Wallet Balance</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">New Balance ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newBalance}
                  onChange={(e) => setNewBalance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateBalance}
                  disabled={savingBalance}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white hover:bg-purple-700 rounded-xl transition-all disabled:opacity-50"
                >
                  {savingBalance ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <DollarSign size={18} />
                  )}
                  Update Balance
                </button>
                <button
                  onClick={() => setShowBalanceModal(false)}
                  className="px-4 py-3 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;
