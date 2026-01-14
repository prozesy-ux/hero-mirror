import { useState, useEffect } from 'react';
import { Bot, Clock, CheckCircle, Copy, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

const MyPurchasedAccounts = () => {
  const { user } = useAuthContext();
  const [purchases, setPurchases] = useState<PurchasedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) {
      fetchPurchases();
      subscribeToUpdates();
    }
  }, [user]);

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
    setLoading(false);
  };

  const subscribeToUpdates = () => {
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
        <h2 className="text-2xl font-bold text-white mb-2">My Purchased Accounts</h2>
        <p className="text-gray-400">View and manage your purchased AI accounts</p>
      </div>

      {purchases.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center">
          <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Purchases Yet</h3>
          <p className="text-gray-400">Your purchased AI accounts will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-700 flex items-center justify-center text-2xl">
                    {getCategoryIcon(purchase.ai_accounts?.category)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {purchase.ai_accounts?.name || 'AI Account'}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      Purchased on {new Date(purchase.purchased_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {purchase.delivery_status === 'pending' ? (
                    <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                      <Clock className="w-4 h-4" />
                      Pending Delivery
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Delivered
                    </span>
                  )}
                </div>
              </div>

              {purchase.delivery_status === 'delivered' && purchase.account_credentials && (
                <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Account Credentials</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleCredentials(purchase.id)}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                      >
                        {showCredentials[purchase.id] ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => copyCredentials(purchase.account_credentials!)}
                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                      >
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <code className="text-sm text-purple-400 font-mono">
                    {showCredentials[purchase.id]
                      ? purchase.account_credentials
                      : '••••••••••••••••••••'}
                  </code>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-gray-400">Amount Paid</span>
                <span className="text-white font-medium">${purchase.amount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPurchasedAccounts;
