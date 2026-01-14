import { useState, useEffect } from 'react';
import { CreditCard, Check, Sparkles, Crown, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Purchase {
  id: string;
  amount: number;
  payment_status: string;
  purchased_at: string;
}

const BillingSection = () => {
  const { user, isPro, profile } = useAuthContext();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPurchases();
    }
  }, [user]);

  const fetchPurchases = async () => {
    const { data } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user?.id)
      .order('purchased_at', { ascending: false });
    
    setPurchases(data || []);
  };

  const handleUpgrade = async () => {
    if (!user) return;
    
    setProcessingPayment(true);
    
    // Simulate payment processing (in production, integrate with Stripe)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create purchase record
    const { error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: user.id,
        amount: 19.00,
        payment_status: 'completed'
      });

    if (purchaseError) {
      toast.error('Failed to process payment');
      setProcessingPayment(false);
      return;
    }

    // Update user profile to Pro
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_pro: true })
      .eq('user_id', user.id);

    setProcessingPayment(false);

    if (profileError) {
      toast.error('Failed to activate Pro status');
    } else {
      toast.success('🎉 Welcome to Pro! All prompts are now unlocked!');
      fetchPurchases();
      // Refresh the page to update the profile state
      window.location.reload();
    }
  };

  const proFeatures = [
    '10,000+ Premium AI Prompts',
    'Unlimited Access Forever',
    'All ChatGPT Mega-Prompts',
    'All Midjourney Prompts',
    'All Claude Prompts',
    'New Prompts Added Monthly',
    'Priority Support',
    'Commercial License'
  ];

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-white mb-6">Billing & Subscription</h2>

      {/* Current Plan */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isPro ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gray-700'}`}>
              {isPro ? <Crown size={24} className="text-white" /> : <CreditCard size={24} className="text-gray-400" />}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                {isPro ? 'Pro Plan' : 'Free Plan'}
              </h3>
              <p className="text-gray-400">
                {isPro ? 'Lifetime access to all prompts' : 'Limited access to free prompts only'}
              </p>
            </div>
          </div>
          {isPro && (
            <span className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-full">
              Active
            </span>
          )}
        </div>
      </div>

      {/* Upgrade Card (if not Pro) */}
      {!isPro && (
        <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl p-8 mb-6 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-yellow-400" size={24} />
            <h3 className="text-2xl font-bold text-white">Upgrade to Pro</h3>
          </div>

          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-gray-400 line-through text-xl">$499</span>
            <span className="text-5xl font-bold text-white">$19</span>
            <span className="text-gray-400">one-time payment</span>
          </div>

          <div className="grid md:grid-cols-2 gap-3 mb-8">
            {proFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check size={18} className="text-green-400" />
                <span className="text-gray-300">{feature}</span>
              </div>
            ))}
          </div>

          <button
            onClick={handleUpgrade}
            disabled={processingPayment}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
            {processingPayment ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <Zap size={20} />
                Upgrade Now for $19
              </>
            )}
          </button>

          <p className="text-center text-gray-500 text-sm mt-4">
            🔒 Secure payment • 30-day money-back guarantee
          </p>
        </div>
      )}

      {/* Purchase History */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Purchase History</h3>
        
        {purchases.length === 0 ? (
          <p className="text-gray-400">No purchases yet</p>
        ) : (
          <div className="space-y-3">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0"
              >
                <div>
                  <p className="text-white font-medium">Pro Plan - Lifetime Access</p>
                  <p className="text-gray-500 text-sm">
                    {new Date(purchase.purchased_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">${purchase.amount.toFixed(2)}</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    purchase.payment_status === 'completed'
                      ? 'bg-green-900/50 text-green-400'
                      : 'bg-yellow-900/50 text-yellow-400'
                  }`}>
                    {purchase.payment_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingSection;
