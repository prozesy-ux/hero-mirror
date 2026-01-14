import { useState, useEffect } from 'react';
import { Bot, ShoppingCart, Loader2, Sparkles, Zap, Shield, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

const AIAccountsSection = () => {
  const { user } = useAuthContext();
  const [accounts, setAccounts] = useState<AIAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

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

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case 'chatgpt': return '🤖';
      case 'claude': return '🧠';
      case 'midjourney': return '🎨';
      case 'gemini': return '✨';
      default: return '🔮';
    }
  };

  const getCategoryGradient = (category: string | null) => {
    switch (category) {
      case 'chatgpt': return 'from-emerald-400 to-teal-500';
      case 'claude': return 'from-orange-400 to-amber-500';
      case 'midjourney': return 'from-indigo-400 to-purple-500';
      case 'gemini': return 'from-blue-400 to-cyan-500';
      default: return 'from-purple-400 to-pink-500';
    }
  };

  const getCategoryBg = (category: string | null) => {
    switch (category) {
      case 'chatgpt': return 'bg-emerald-50 border-emerald-200';
      case 'claude': return 'bg-orange-50 border-orange-200';
      case 'midjourney': return 'bg-indigo-50 border-indigo-200';
      case 'gemini': return 'bg-blue-50 border-blue-200';
      default: return 'bg-purple-50 border-purple-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin" />
          <Zap className="absolute inset-0 m-auto text-emerald-500" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="section-accounts animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/30">
          <Bot size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">AI Accounts</h2>
          <p className="text-gray-500">Premium AI tool accounts at affordable prices</p>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-lg">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <Bot className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Accounts Available</h3>
          <p className="text-gray-500">Check back later for premium AI accounts</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="group bg-white rounded-3xl overflow-hidden border border-black/5 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300"
            >
              {/* Header with gradient */}
              <div className={`h-28 bg-gradient-to-br ${getCategoryGradient(account.category)} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
                </div>
                <span className="text-5xl relative z-10 group-hover:scale-110 transition-transform duration-300">
                  {getCategoryIcon(account.category)}
                </span>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                    {account.name}
                  </h3>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${getCategoryBg(account.category)}`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">Premium</span>
                  </div>
                </div>

                <p className="text-gray-500 text-sm mb-5 line-clamp-2">
                  {account.description || 'Premium AI account with full access'}
                </p>

                {/* Features */}
                <div className="flex items-center gap-4 mb-5 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Shield size={12} className="text-emerald-500" />
                    Verified
                  </span>
                  <span className="flex items-center gap-1">
                    <Star size={12} className="text-amber-500" />
                    Premium
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold text-gray-900">${account.price}</span>
                    <span className="text-gray-400 text-sm ml-1">one-time</span>
                  </div>

                  <button
                    onClick={() => handlePurchase(account)}
                    disabled={purchasing === account.id}
                    className={`flex items-center gap-2 bg-gradient-to-r ${getCategoryGradient(account.category)} text-white font-semibold py-3 px-5 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105`}
                  >
                    {purchasing === account.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        Buy Now
                      </>
                    )}
                  </button>
                </div>

                {account.stock !== null && account.stock <= 5 && (
                  <div className="mt-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-amber-700 text-xs font-medium flex items-center gap-1.5">
                      <Zap size={12} />
                      Only {account.stock} left in stock!
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIAccountsSection;