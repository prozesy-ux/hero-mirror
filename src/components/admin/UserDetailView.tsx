import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ArrowLeft, Crown, User as UserIcon, Wallet, ShoppingBag, MessageSquare, 
  Heart, Calendar, Mail, Loader2, ToggleLeft, ToggleRight, Trash2,
  ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface UserDetailViewProps {
  userId: string;
  userIdAuth: string;
  onBack: () => void;
  onUserDeleted: () => void;
}

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_pro: boolean;
  created_at: string;
}

interface WalletData {
  balance: number;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  payment_gateway: string | null;
  created_at: string;
}

interface AIPurchase {
  id: string;
  amount: number;
  payment_status: string;
  delivery_status: string;
  purchased_at: string;
  account_credentials: string | null;
  ai_accounts: {
    name: string;
    icon_url: string | null;
  } | null;
}

interface SupportMessage {
  id: string;
  message: string;
  sender_type: string;
  is_read: boolean;
  created_at: string;
}

const UserDetailView = ({ userId, userIdAuth, onBack, onUserDeleted }: UserDetailViewProps) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [aiPurchases, setAIPurchases] = useState<AIPurchase[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [togglingPro, setTogglingPro] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAllUserData();
  }, [userId, userIdAuth]);

  const fetchAllUserData = async () => {
    setLoading(true);
    
    try {
      const [
        profileRes,
        walletRes,
        transactionsRes,
        aiPurchasesRes,
        supportMessagesRes,
        favoritesRes
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_wallets').select('*').eq('user_id', userIdAuth).maybeSingle(),
        supabase.from('wallet_transactions').select('*').eq('user_id', userIdAuth).order('created_at', { ascending: false }),
        supabase.from('ai_account_purchases').select('*, ai_accounts(name, icon_url)').eq('user_id', userIdAuth).order('purchased_at', { ascending: false }),
        supabase.from('support_messages').select('*').eq('user_id', userIdAuth).order('created_at', { ascending: false }).limit(20),
        supabase.from('favorites').select('id', { count: 'exact' }).eq('user_id', userIdAuth)
      ]);

      setProfile(profileRes.data);
      setWallet(walletRes.data);
      setTransactions(transactionsRes.data || []);
      setAIPurchases(aiPurchasesRes.data || []);
      setSupportMessages(supportMessagesRes.data || []);
      setFavoritesCount(favoritesRes.count || 0);
    } catch (err) {
      console.error('Error fetching user data:', err);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePro = async () => {
    if (!profile) return;
    setTogglingPro(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({ is_pro: !profile.is_pro })
      .eq('id', userId);
    
    if (error) {
      toast.error('Failed to update user status');
    } else {
      toast.success(`User ${!profile.is_pro ? 'upgraded to Pro' : 'downgraded to Free'}`);
      setProfile({ ...profile, is_pro: !profile.is_pro });
    }
    
    setTogglingPro(false);
  };

  const handleDeleteUser = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    setDeleting(true);
    
    try {
      await supabase.from('user_roles').delete().eq('user_id', userIdAuth);
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      
      if (error) {
        toast.error('Failed to delete user');
      } else {
        toast.success('User deleted successfully');
        onUserDeleted();
      }
    } catch (err) {
      toast.error('An error occurred');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={14} className="text-green-400" />;
      case 'pending':
        return <Clock size={14} className="text-amber-400" />;
      case 'failed':
        return <XCircle size={14} className="text-red-400" />;
      default:
        return <AlertCircle size={14} className="text-zinc-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-500/10 text-green-400',
      pending: 'bg-amber-500/10 text-amber-400',
      failed: 'bg-red-500/10 text-red-400',
      delivered: 'bg-green-500/10 text-green-400'
    };
    return styles[status] || 'bg-zinc-800 text-zinc-400';
  };

  const totalTopup = transactions.filter(t => t.type === 'topup' && t.status === 'completed').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalSpent = transactions.filter(t => t.type === 'purchase' && t.status === 'completed').reduce((sum, t) => sum + Number(t.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-white animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">User not found</p>
        <button onClick={onBack} className="mt-4 text-white hover:underline">← Back to Users</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all"
        >
          <ArrowLeft size={20} />
          <span>Back to Users</span>
        </button>
        <button
          onClick={handleDeleteUser}
          disabled={deleting}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
        >
          {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
          Delete User
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-black border border-[#111] rounded-none p-6 hover:bg-[#080808] transition-all">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name || 'User'} 
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                {profile.full_name?.charAt(0) || profile.email?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">{profile.full_name || 'No name'}</h2>
              <div className="flex items-center gap-2 text-zinc-500 text-sm">
                <Mail size={14} />
                {profile.email}
              </div>
              <div className="flex items-center gap-2 text-zinc-600 text-sm mt-1">
                <Calendar size={14} />
                Joined {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {profile.is_pro ? (
              <span className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 rounded-full">
                <Crown size={16} /> Pro User
              </span>
            ) : (
              <span className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-zinc-500 rounded-full">
                <UserIcon size={16} /> Free User
              </span>
            )}
            <button
              onClick={handleTogglePro}
              disabled={togglingPro}
              className={`p-2 rounded-lg transition-all ${
                profile.is_pro 
                  ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' 
                  : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white'
              }`}
              title={profile.is_pro ? 'Downgrade to Free' : 'Upgrade to Pro'}
            >
              {togglingPro ? (
                <Loader2 size={18} className="animate-spin" />
              ) : profile.is_pro ? (
                <ToggleRight size={18} />
              ) : (
                <ToggleLeft size={18} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-black border border-[#111] rounded-none p-4 hover:bg-[#080808] transition-all">
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
            <div className="p-1.5 bg-blue-500/5 rounded-sm">
              <Wallet size={14} className="text-blue-400" />
            </div>
            Balance
          </div>
          <div className="text-2xl font-bold text-white">৳{wallet?.balance?.toFixed(2) || '0.00'}</div>
        </div>
        <div className="bg-black border border-[#111] rounded-none p-4 hover:bg-[#080808] transition-all">
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
            <div className="p-1.5 bg-green-500/5 rounded-sm">
              <ArrowUpRight size={14} className="text-green-400" />
            </div>
            Total Topup
          </div>
          <div className="text-2xl font-bold text-green-400">৳{totalTopup.toFixed(2)}</div>
        </div>
        <div className="bg-black border border-[#111] rounded-none p-4 hover:bg-[#080808] transition-all">
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
            <div className="p-1.5 bg-purple-500/5 rounded-sm">
              <ShoppingBag size={14} className="text-purple-400" />
            </div>
            Purchases
          </div>
          <div className="text-2xl font-bold text-white">{aiPurchases.length}</div>
        </div>
        <div className="bg-black border border-[#111] rounded-none p-4 hover:bg-[#080808] transition-all">
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
            <div className="p-1.5 bg-pink-500/5 rounded-sm">
              <Heart size={14} className="text-pink-400" />
            </div>
            Favorites
          </div>
          <div className="text-2xl font-bold text-white">{favoritesCount}</div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="bg-[#0d0d0f] border border-[#1a1a1a] p-1 rounded-xl">
          <TabsTrigger value="transactions" className="data-[state=active]:bg-[#1a1a1a] rounded-lg">
            Transactions ({transactions.length})
          </TabsTrigger>
          <TabsTrigger value="purchases" className="data-[state=active]:bg-[#1a1a1a] rounded-lg">
            AI Purchases ({aiPurchases.length})
          </TabsTrigger>
          <TabsTrigger value="messages" className="data-[state=active]:bg-[#1a1a1a] rounded-lg">
            Messages ({supportMessages.length})
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="mt-4">
          <div className="bg-[#09090b] border border-[#1a1a1a] rounded-xl overflow-hidden">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-zinc-600">No transactions found</div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#0d0d0f]">
                  <tr>
                    <th className="text-left px-6 py-3 text-zinc-500 font-medium text-sm">Type</th>
                    <th className="text-left px-6 py-3 text-zinc-500 font-medium text-sm">Amount</th>
                    <th className="text-left px-6 py-3 text-zinc-500 font-medium text-sm">Gateway</th>
                    <th className="text-left px-6 py-3 text-zinc-500 font-medium text-sm">Status</th>
                    <th className="text-left px-6 py-3 text-zinc-500 font-medium text-sm">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-[#1a1a1a] hover:bg-[#0f0f11] transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {tx.type === 'topup' ? (
                            <ArrowDownLeft size={16} className="text-green-400" />
                          ) : (
                            <ArrowUpRight size={16} className="text-red-400" />
                          )}
                          <span className="text-white capitalize">{tx.type}</span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 font-medium ${tx.type === 'topup' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type === 'topup' ? '+' : '-'}৳{Number(tx.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-zinc-500">{tx.payment_gateway || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs w-fit ${getStatusBadge(tx.status)}`}>
                          {getStatusIcon(tx.status)}
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 text-sm">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* AI Purchases Tab */}
        <TabsContent value="purchases" className="mt-4">
          <div className="bg-[#09090b] border border-[#1a1a1a] rounded-xl overflow-hidden">
            {aiPurchases.length === 0 ? (
              <div className="text-center py-12 text-zinc-600">No AI account purchases found</div>
            ) : (
              <table className="w-full">
                <thead className="bg-[#0d0d0f]">
                  <tr>
                    <th className="text-left px-6 py-3 text-zinc-500 font-medium text-sm">Account</th>
                    <th className="text-left px-6 py-3 text-zinc-500 font-medium text-sm">Amount</th>
                    <th className="text-left px-6 py-3 text-zinc-500 font-medium text-sm">Payment</th>
                    <th className="text-left px-6 py-3 text-zinc-500 font-medium text-sm">Delivery</th>
                    <th className="text-left px-6 py-3 text-zinc-500 font-medium text-sm">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {aiPurchases.map((purchase) => (
                    <tr key={purchase.id} className="border-t border-[#1a1a1a] hover:bg-[#0f0f11] transition-all">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {purchase.ai_accounts?.icon_url ? (
                            <img src={purchase.ai_accounts.icon_url} alt="" className="w-8 h-8 rounded-lg" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                              <ShoppingBag size={16} className="text-zinc-500" />
                            </div>
                          )}
                          <span className="text-white">{purchase.ai_accounts?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white font-medium">৳{Number(purchase.amount).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs w-fit ${getStatusBadge(purchase.payment_status)}`}>
                          {getStatusIcon(purchase.payment_status)}
                          {purchase.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs w-fit ${getStatusBadge(purchase.delivery_status)}`}>
                          {getStatusIcon(purchase.delivery_status)}
                          {purchase.delivery_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 text-sm">
                        {new Date(purchase.purchased_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="mt-4">
          <div className="bg-[#09090b] border border-[#1a1a1a] rounded-xl overflow-hidden">
            {supportMessages.length === 0 ? (
              <div className="text-center py-12 text-zinc-600">No support messages found</div>
            ) : (
              <div className="divide-y divide-[#1a1a1a]">
                {supportMessages.map((msg) => (
                  <div key={msg.id} className="p-4 hover:bg-[#0f0f11] transition-all">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        msg.sender_type === 'admin' ? 'bg-purple-500/10' : 'bg-blue-500/10'
                      }`}>
                        <MessageSquare size={14} className={msg.sender_type === 'admin' ? 'text-purple-400' : 'text-blue-400'} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-medium ${msg.sender_type === 'admin' ? 'text-purple-400' : 'text-blue-400'}`}>
                            {msg.sender_type === 'admin' ? 'Admin' : 'User'}
                          </span>
                          <span className="text-zinc-600 text-xs">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                          {!msg.is_read && msg.sender_type === 'user' && (
                            <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 text-xs rounded">Unread</span>
                          )}
                        </div>
                        <p className="text-zinc-300">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserDetailView;