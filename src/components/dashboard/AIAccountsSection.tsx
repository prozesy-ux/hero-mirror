import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Loader2, Search, TrendingUp, BadgeCheck, ShieldCheck, Check, Eye, Users, Package, BarChart3, Clock, CheckCircle, Copy, EyeOff, Wallet, AlertTriangle, Plus, X, MessageCircle, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

// Import real product images
import chatgptLogo from '@/assets/chatgpt-logo.avif';
import midjourneyLogo from '@/assets/midjourney-logo.avif';
import geminiLogo from '@/assets/gemini-logo.avif';

interface AIAccount {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  category: string | null;
  is_available: boolean;
  stock: number | null;
}

interface PurchasedAccount {
  id: string;
  amount: number;
  payment_status: string;
  delivery_status: string;
  account_credentials: string | null;
  purchased_at: string;
  delivered_at: string | null;
  ai_accounts: {
    name: string;
    category: string | null;
    icon_url: string | null;
  } | null;
}

interface InsufficientFundsModal {
  show: boolean;
  required: number;
  current: number;
  shortfall: number;
  accountName?: string;
}

interface SupportMessage {
  id: string;
  user_id: string;
  message: string;
  sender_type: 'user' | 'admin';
  is_read: boolean;
  created_at: string;
}

// Generate stable random purchase count per account
const getPurchaseCount = (accountId: string) => {
  const hash = accountId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 150 + (hash % 350);
};

type TabType = 'browse' | 'purchases' | 'stats' | 'chat';
type CategoryFilter = 'all' | 'chatgpt' | 'midjourney' | 'claude' | 'gemini';

const AIAccountsSection = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('browse');
  const [accounts, setAccounts] = useState<AIAccount[]>([]);
  const [purchases, setPurchases] = useState<PurchasedAccount[]>([]);
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredAccount, setHoveredAccount] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  const [insufficientFundsModal, setInsufficientFundsModal] = useState<InsufficientFundsModal>({
    show: false,
    required: 0,
    current: 0,
    shortfall: 0
  });

  // Chat state
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (user) {
      fetchPurchases();
      fetchWallet();
      fetchChatMessages();
      fetchUnreadCount();
      const unsubscribe = subscribeToUpdates();
      const unsubscribeWallet = subscribeToWallet();
      const unsubscribeChat = subscribeToChatMessages();
      return () => {
        unsubscribe();
        unsubscribeWallet();
        unsubscribeChat();
      };
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatMessages = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as SupportMessage[]);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    
    const { count, error } = await supabase
      .from('support_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('sender_type', 'admin')
      .eq('is_read', false);

    if (!error) {
      setUnreadCount(count || 0);
    }
  };

  const subscribeToChatMessages = () => {
    if (!user) return () => {};

    const channel = supabase
      .channel('user-support-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchChatMessages();
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setSendingMessage(true);
    const { error } = await supabase
      .from('support_messages')
      .insert({
        user_id: user.id,
        message: newMessage.trim(),
        sender_type: 'user'
      });

    if (error) {
      toast.error('Failed to send message');
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
      toast.success('Message sent!');
      fetchChatMessages();
    }
    setSendingMessage(false);
  };

  const fetchWallet = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // No wallet exists, create one
      const { data: newWallet } = await supabase
        .from('user_wallets')
        .insert({ user_id: user.id, balance: 0 })
        .select('balance')
        .single();
      
      setWallet(newWallet);
    } else if (data) {
      setWallet(data);
    }
  };

  const subscribeToWallet = () => {
    if (!user) return () => {};

    const channel = supabase
      .channel('my-wallet-ai-accounts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_wallets',
          filter: `user_id=eq.${user.id}`
        },
        () => fetchWallet()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('ai_accounts')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAccounts(data);
    }
    setLoading(false);
  };

  const fetchPurchases = async () => {
    const { data, error } = await supabase
      .from('ai_account_purchases')
      .select(`
        *,
        ai_accounts (name, category, icon_url)
      `)
      .eq('user_id', user?.id)
      .order('purchased_at', { ascending: false });

    if (!error && data) {
      setPurchases(data as PurchasedAccount[]);
    }
    setPurchasesLoading(false);
  };

  const subscribeToUpdates = () => {
    if (!user) return () => {};

    const channel = supabase
      .channel('my-account-purchases')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_account_purchases',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchPurchases();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handlePurchase = async (account: AIAccount) => {
    if (!user) {
      toast.error('Please sign in to purchase');
      return;
    }

    // Check wallet balance first
    const { data: walletData, error: walletError } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (walletError && walletError.code === 'PGRST116') {
      // No wallet exists
      setInsufficientFundsModal({
        show: true,
        required: account.price,
        current: 0,
        shortfall: account.price,
        accountName: account.name
      });
      return;
    }

    const currentBalance = Number(walletData?.balance) || 0;

    if (currentBalance < account.price) {
      // Show insufficient balance modal
      setInsufficientFundsModal({
        show: true,
        required: account.price,
        current: currentBalance,
        shortfall: account.price - currentBalance,
        accountName: account.name
      });
      return;
    }

    // Proceed with purchase
    setPurchasing(account.id);

    try {
      // 1. Deduct from wallet
      const newBalance = currentBalance - account.price;
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error('Failed to update wallet balance');
      }

      // 2. Create wallet transaction record
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          type: 'purchase',
          amount: account.price,
          status: 'completed',
          description: `AI Account: ${account.name}`
        });

      if (transactionError) {
        // Rollback wallet balance
        await supabase
          .from('user_wallets')
          .update({ balance: currentBalance })
          .eq('user_id', user.id);
        throw new Error('Failed to create transaction record');
      }

      // 3. Create AI account purchase record
      const { error: purchaseError } = await supabase
        .from('ai_account_purchases')
        .insert({
          user_id: user.id,
          ai_account_id: account.id,
          amount: account.price,
          payment_status: 'completed',
          delivery_status: 'pending'
        });

      if (purchaseError) {
        // Rollback wallet
        await supabase
          .from('user_wallets')
          .update({ balance: currentBalance })
          .eq('user_id', user.id);
        throw new Error('Failed to create purchase record');
      }

      toast.success('Purchase successful! Account credentials will be delivered soon.');
      fetchWallet();
      fetchPurchases();
      setActiveTab('purchases');
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Failed to complete purchase');
    } finally {
      setPurchasing(null);
    }
  };

  const getProductImage = (category: string | null) => {
    switch (category) {
      case 'chatgpt': return chatgptLogo;
      case 'midjourney': return midjourneyLogo;
      case 'gemini': return geminiLogo;
      case 'claude': return chatgptLogo;
      default: return chatgptLogo;
    }
  };

  const toggleCredentials = (id: string) => {
    setShowCredentials(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyCredentials = (credentials: string) => {
    navigator.clipboard.writeText(credentials);
    toast.success('Credentials copied to clipboard');
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || account.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Stats calculations
  const totalPurchases = purchases.length;
  const totalSpent = purchases.reduce((sum, p) => sum + Number(p.amount), 0);
  const deliveredCount = purchases.filter(p => p.delivery_status === 'delivered').length;
  const pendingCount = purchases.filter(p => p.delivery_status === 'pending').length;

  const categories: { value: CategoryFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'chatgpt', label: 'ChatGPT' },
    { value: 'midjourney', label: 'Midjourney' },
    { value: 'claude', label: 'Claude' },
    { value: 'gemini', label: 'Gemini' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Tab Navigation with Wallet Balance */}
      <div className="bg-[#1a1a1f] rounded-2xl p-2 mb-8 border border-white/5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Tab buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 transform flex items-center gap-2 ${
                activeTab === 'browse'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95'
              }`}
            >
              <ShoppingCart size={16} />
              Browse Accounts
            </button>
            <button
              onClick={() => setActiveTab('purchases')}
              className={`px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 transform flex items-center gap-2 ${
                activeTab === 'purchases'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95'
              }`}
            >
              <Package size={16} />
              My Purchases
              {purchases.length > 0 && (
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === 'purchases' ? 'bg-black text-white' : 'bg-white/10 text-white'
                }`}>
                  {purchases.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 transform flex items-center gap-2 ${
                activeTab === 'stats'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95'
              }`}
            >
              <BarChart3 size={16} />
              Stats
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 transform flex items-center gap-2 ${
                activeTab === 'chat'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95'
              }`}
            >
              <MessageCircle size={16} />
              Chat
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-red-500 text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
          
          {/* Wallet Balance & Add Funds */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-violet-500/20 border border-violet-500/30 px-3 py-2 rounded-xl">
              <Wallet size={16} className="text-violet-400" />
              <span className="text-violet-400 font-bold">
                ${wallet?.balance?.toFixed(2) || '0.00'}
              </span>
            </div>
            <button
              onClick={() => navigate('/dashboard/billing')}
              className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded-xl font-medium transition-all hover:scale-105 active:scale-95"
            >
              <Plus size={16} />
              Add Funds
            </button>
          </div>
        </div>
      </div>

      {/* Browse Accounts Tab */}
      {activeTab === 'browse' && (
        <>
          {/* Premium Search Bar */}
          <div className="relative mb-6">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-lg">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search AI accounts..."
              className="w-full bg-[#0f0f12] border border-white/10 rounded-2xl pl-14 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all font-medium text-lg"
            />
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 mb-8 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  categoryFilter === cat.value
                    ? 'bg-white text-black'
                    : 'bg-[#1a1a1f] text-gray-400 hover:text-white border border-white/5 hover:bg-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>


          {filteredAccounts.length === 0 ? (
            <div className="bg-[#1a1a1f] rounded-2xl p-16 text-center border border-white/5">
              <div className="w-20 h-20 rounded-full bg-[#0f0f12] flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">No Accounts Found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAccounts.map((account) => {
                const hasEnoughBalance = (wallet?.balance || 0) >= account.price;
                
                return (
                  <div
                    key={account.id}
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Product Image Header */}
                    <div className="h-32 bg-gray-50 p-6 flex items-center justify-center relative">
                      <img 
                        src={getProductImage(account.category)} 
                        alt={account.name}
                        className="h-16 w-16 object-contain"
                      />
                      {/* Purchase Count Badge */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg shadow-sm border border-gray-100">
                        <Users size={12} className="text-gray-600" />
                        <span className="text-xs font-semibold text-gray-700">{getPurchaseCount(account.id)} sold</span>
                      </div>
                      
                      {/* Low Balance Warning Badge */}
                      {!hasEnoughBalance && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-200">
                          <AlertTriangle size={12} className="text-amber-600" />
                          <span className="text-xs font-semibold text-amber-700">Low Balance</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                          {account.name}
                        </h3>
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg">
                          <BadgeCheck size={14} className="text-gray-600" />
                          <span className="text-xs font-semibold text-gray-600">Verified</span>
                        </div>
                      </div>

                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {account.description || 'Premium AI account with full access'}
                      </p>

                      {/* Features */}
                      <div className="flex items-center gap-3 mb-5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <ShieldCheck size={12} className="text-gray-600" />
                          Secure
                        </span>
                        <span className="flex items-center gap-1">
                          <Check size={12} className="text-gray-600" />
                          Instant
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-gray-900 tracking-tight">${account.price}</span>
                          <span className="text-gray-400 text-sm ml-1">one-time</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* View Button */}
                          <div 
                            className="relative"
                            onMouseEnter={() => setHoveredAccount(account.id)}
                            onMouseLeave={() => setHoveredAccount(null)}
                          >
                            <button className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                              <Eye size={18} className="text-gray-700" />
                            </button>
                            
                            {/* Hover Tooltip */}
                            {hoveredAccount === account.id && (
                              <div className="absolute bottom-full right-0 mb-2 w-64 p-4 bg-white rounded-xl shadow-xl border border-gray-100 z-20 animate-fade-up">
                                <h4 className="font-bold text-gray-900 mb-1">{account.name}</h4>
                                <p className="text-gray-600 text-sm mb-3">
                                  {account.description || 'Premium AI account with full access to all features and capabilities.'}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 border-t border-gray-100 pt-3">
                                  <ShieldCheck size={12} className="text-green-600" />
                                  <span>Instant delivery • Secure payment • 24/7 support</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Buy Now Button */}
                          <button
                            onClick={() => handlePurchase(account)}
                            disabled={purchasing === account.id}
                            className={`font-semibold px-5 py-2.5 rounded-xl transition-all disabled:cursor-not-allowed flex items-center gap-2 ${
                              purchasing === account.id
                                ? 'bg-gray-200 text-gray-500'
                                : hasEnoughBalance
                                ? 'bg-black hover:bg-gray-900 text-white'
                                : 'bg-amber-500/20 text-amber-700 hover:bg-amber-500/30 border border-amber-300'
                            }`}
                          >
                            {purchasing === account.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing
                              </>
                            ) : !hasEnoughBalance ? (
                              <>
                                <AlertTriangle className="w-4 h-4" />
                                Top Up
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-4 h-4" />
                                Buy Now
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* My Purchases Tab */}
      {activeTab === 'purchases' && (
        <>
          {purchasesLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin" />
            </div>
          ) : purchases.length === 0 ? (
            <div className="bg-[#1a1a1f] rounded-2xl p-16 text-center border border-white/5">
              <div className="w-20 h-20 rounded-full bg-[#0f0f12] flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">No Purchases Yet</h3>
              <p className="text-gray-500 mb-6">Your purchased AI accounts will appear here</p>
              <button
                onClick={() => setActiveTab('browse')}
                className="bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-all"
              >
                Browse Accounts
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden">
                        <img 
                          src={getProductImage(purchase.ai_accounts?.category)}
                          alt={purchase.ai_accounts?.name || 'AI Account'}
                          className="w-10 h-10 object-contain"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                          {purchase.ai_accounts?.name || 'AI Account'}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          Purchased on {new Date(purchase.purchased_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Paid from Wallet Badge */}
                      <span className="flex items-center gap-1.5 bg-violet-50 text-violet-600 px-3 py-1.5 rounded-full text-sm font-medium">
                        <Wallet className="w-4 h-4" />
                        Wallet
                      </span>
                      {purchase.delivery_status === 'pending' ? (
                        <span className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full text-sm font-medium">
                          <Clock className="w-4 h-4" />
                          Pending
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1.5 rounded-full text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Delivered
                        </span>
                      )}
                    </div>
                  </div>

                  {purchase.delivery_status === 'delivered' && purchase.account_credentials && (
                    <div className="mt-5 p-4 bg-[#0f0f12] rounded-xl border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-300">Account Credentials</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleCredentials(purchase.id)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            {showCredentials[purchase.id] ? (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Eye className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={() => copyCredentials(purchase.account_credentials!)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                      <code className="text-sm text-white font-mono">
                        {showCredentials[purchase.id]
                          ? purchase.account_credentials
                          : '••••••••••••••••••••'}
                      </code>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Amount Paid</span>
                    <span className="text-gray-900 font-bold text-lg">${purchase.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <>
          {/* Wallet Balance Card */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-200 text-sm font-medium mb-1">Wallet Balance</p>
                <p className="text-4xl font-bold tracking-tight">${wallet?.balance?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Wallet className="w-8 h-8" />
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard/billing')}
              className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add Funds to Wallet
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <Package size={20} className="text-blue-600" />
                </div>
                <span className="text-gray-500 text-sm font-medium">Total Purchases</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">{totalPurchases}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-violet-50 rounded-xl">
                  <BarChart3 size={20} className="text-violet-600" />
                </div>
                <span className="text-gray-500 text-sm font-medium">Total Spent</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">${totalSpent.toFixed(2)}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-green-50 rounded-xl">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                <span className="text-gray-500 text-sm font-medium">Delivered</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">{deliveredCount}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-amber-50 rounded-xl">
                  <Clock size={20} className="text-amber-600" />
                </div>
                <span className="text-gray-500 text-sm font-medium">Pending</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">{pendingCount}</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#1a1a1f] rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-bold text-white mb-4 tracking-tight">Recent Activity</h3>
            {purchases.length === 0 ? (
              <p className="text-gray-500">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {purchases.slice(0, 5).map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                        <img 
                          src={getProductImage(purchase.ai_accounts?.category)}
                          alt=""
                          className="w-6 h-6 object-contain"
                        />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{purchase.ai_accounts?.name}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(purchase.purchased_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-semibold">${purchase.amount}</span>
                      {purchase.delivery_status === 'delivered' ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <Clock size={16} className="text-amber-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="bg-[#1a1a1f] rounded-2xl border border-white/5 overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
              <MessageCircle className="text-violet-400" size={20} />
            </div>
            <div>
              <h3 className="text-white font-semibold">Support Chat</h3>
              <p className="text-gray-400 text-sm">We typically reply within a few hours</p>
            </div>
          </div>
          
          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No messages yet</p>
                  <p className="text-gray-500 text-sm">Send us a message and we'll get back to you</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.sender_type === 'user'
                        ? 'bg-violet-500 text-white'
                        : 'bg-gray-800 text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <span className="text-xs opacity-60 mt-1 block">
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
              />
              <button
                onClick={sendChatMessage}
                disabled={!newMessage.trim() || sendingMessage}
                className="bg-violet-500 hover:bg-violet-600 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insufficient Funds Modal */}
      {insufficientFundsModal.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setInsufficientFundsModal({ show: false, required: 0, current: 0, shortfall: 0 })}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Insufficient Balance</h3>
              
              <p className="text-gray-600 mb-4">
                To purchase <span className="font-semibold text-gray-900">{insufficientFundsModal.accountName}</span>
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Required Amount:</span>
                  <span className="text-gray-900 font-bold">${insufficientFundsModal.required.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Your Balance:</span>
                  <span className="text-amber-600 font-bold">${insufficientFundsModal.current.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
                  <span className="text-gray-500">Amount Needed:</span>
                  <span className="text-violet-600 font-bold">${insufficientFundsModal.shortfall.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setInsufficientFundsModal({ show: false, required: 0, current: 0, shortfall: 0 })}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setInsufficientFundsModal({ show: false, required: 0, current: 0, shortfall: 0 });
                    navigate('/dashboard/billing');
                  }}
                  className="flex-1 px-4 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <Wallet size={18} />
                  Top Up Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAccountsSection;
