import { useState, useEffect } from 'react';
import { ShoppingCart, Loader2, Search, TrendingUp, BadgeCheck, ShieldCheck, Check, Eye, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

// Generate stable random purchase count per account
const getPurchaseCount = (accountId: string) => {
  const hash = accountId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 150 + (hash % 350);
};

const AIAccountsSection = () => {
  const { user } = useAuthContext();
  const [accounts, setAccounts] = useState<AIAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredAccount, setHoveredAccount] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

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

  const handlePurchase = async (account: AIAccount) => {
    if (!user) {
      toast.error('Please sign in to purchase');
      return;
    }

    setPurchasing(account.id);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const { error } = await supabase
      .from('ai_account_purchases')
      .insert({
        user_id: user.id,
        ai_account_id: account.id,
        amount: account.price,
        payment_status: 'completed',
        delivery_status: 'pending'
      });

    setPurchasing(null);

    if (error) {
      toast.error('Failed to complete purchase');
    } else {
      toast.success('Purchase successful! Account credentials will be delivered soon.');
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

  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Premium Search Bar */}
      <div className="relative mb-8">
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

      {/* Top Selling Section */}
      <div className="bg-[#1a1a1f] rounded-2xl p-6 mb-8 border border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white rounded-xl">
            <TrendingUp size={20} className="text-gray-900" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Top Selling</h2>
            <p className="text-gray-500 text-sm">Most popular AI accounts this month</p>
          </div>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-[#1a1a1f] rounded-2xl p-16 text-center border border-white/5">
          <div className="w-20 h-20 rounded-full bg-[#0f0f12] flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-10 h-10 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 tracking-tight">No Accounts Available</h3>
          <p className="text-gray-500">Check back later for premium AI accounts</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccounts.map((account) => (
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
                      className="bg-black hover:bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {purchasing === account.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing
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
          ))}
        </div>
      )}
    </div>
  );
};

export default AIAccountsSection;
