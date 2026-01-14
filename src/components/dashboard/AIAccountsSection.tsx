import { useState, useEffect } from 'react';
import { Bot, ShoppingCart, Check, Loader2, Sparkles } from 'lucide-react';
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

    // Simulate payment processing
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
      case 'chatgpt':
        return '🤖';
      case 'claude':
        return '🧠';
      case 'midjourney':
        return '🎨';
      case 'gemini':
        return '✨';
      default:
        return '🔮';
    }
  };

  const getCategoryGradient = (category: string | null) => {
    switch (category) {
      case 'chatgpt':
        return 'from-green-500 to-emerald-600';
      case 'claude':
        return 'from-orange-500 to-amber-600';
      case 'midjourney':
        return 'from-blue-500 to-indigo-600';
      case 'gemini':
        return 'from-purple-500 to-pink-600';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">AI Accounts</h2>
        <p className="text-gray-400">Premium AI tool accounts at affordable prices</p>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center">
          <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Accounts Available</h3>
          <p className="text-gray-400">Check back later for premium AI accounts</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-purple-500 transition-all duration-300 group"
            >
              {/* Header with gradient */}
              <div className={`h-24 bg-gradient-to-br ${getCategoryGradient(account.category)} flex items-center justify-center`}>
                <span className="text-5xl">{getCategoryIcon(account.category)}</span>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                    {account.name}
                  </h3>
                  <div className="flex items-center gap-1 bg-purple-500/20 px-2 py-1 rounded-full">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span className="text-xs text-purple-300 font-medium">Premium</span>
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {account.description || 'Premium AI account with full access'}
                </p>

                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">
                    ${account.price}
                  </div>

                  <button
                    onClick={() => handlePurchase(account)}
                    disabled={purchasing === account.id}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <p className="text-orange-400 text-xs mt-3">
                    Only {account.stock} left in stock!
                  </p>
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
