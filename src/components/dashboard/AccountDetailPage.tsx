import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Users, Check, Wallet, Loader2, ChevronRight, Package, Clock, ShieldCheck, BadgeCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Import product images
import chatgptLogo from '@/assets/chatgpt-logo.avif';
import midjourneyLogo from '@/assets/midjourney-logo.avif';
import geminiLogo from '@/assets/gemini-logo.avif';

interface AIAccount {
  id: string;
  name: string;
  slug?: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  category: string | null;
  is_available: boolean;
  stock: number | null;
  created_at: string;
}

// Generate stable random purchase count per account
const getPurchaseCount = (accountId: string) => {
  const hash = accountId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 150 + (hash % 350);
};

const AccountDetailPage = () => {
  const { accountSlug } = useParams<{ accountSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  
  const [account, setAccount] = useState<AIAccount | null>(null);
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (accountSlug) {
      fetchAccount();
    }
  }, [accountSlug]);

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  const fetchAccount = async () => {
    // Check if accountSlug looks like a UUID (for backward compatibility)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountSlug || '');
    
    const { data, error } = isUUID
      ? await supabase.from('ai_accounts').select('*').eq('id', accountSlug).maybeSingle()
      : await supabase.from('ai_accounts').select('*').eq('slug', accountSlug).maybeSingle();

    if (error) {
      console.error('Error fetching account:', error);
      toast.error('Failed to load account details');
    } else if (data) {
      // If accessed by UUID, redirect to slug URL for SEO
      if (isUUID && data.slug) {
        navigate(`/dashboard/ai-accounts/${data.slug}`, { replace: true });
        return;
      }
      setAccount(data);
    }
    setLoading(false);
  };

  const fetchWallet = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setWallet(data);
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

  const handlePurchase = async () => {
    if (!user || !account) {
      toast.error('Please sign in to purchase');
      return;
    }

    const currentBalance = wallet?.balance || 0;

    if (currentBalance < account.price) {
      toast.error('Insufficient balance. Please top up your wallet.');
      navigate('/dashboard/billing');
      return;
    }

    setPurchasing(true);

    try {
      const newBalance = currentBalance - account.price;
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      if (updateError) throw new Error('Failed to update wallet balance');

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
        await supabase.from('user_wallets').update({ balance: currentBalance }).eq('user_id', user.id);
        throw new Error('Failed to create transaction record');
      }

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
        await supabase.from('user_wallets').update({ balance: currentBalance }).eq('user_id', user.id);
        throw new Error('Failed to create purchase record');
      }

      toast.success('Purchase successful! Account credentials will be delivered soon.');
      navigate('/dashboard/ai-accounts?tab=purchases');
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Failed to complete purchase');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="bg-white rounded-2xl p-16 text-center border border-gray-200 shadow-md">
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <Package className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Account Not Found</h3>
        <p className="text-gray-500 mb-6">The account you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/dashboard/ai-accounts')}
          className="bg-gray-900 text-white font-semibold px-6 py-3 rounded-xl hover:bg-gray-800 transition-all inline-flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back to Marketplace
        </button>
      </div>
    );
  }

  const hasEnoughBalance = (wallet?.balance || 0) >= account.price;
  const purchaseCount = getPurchaseCount(account.id);

  return (
    <div className="animate-fade-up max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/dashboard/ai-accounts')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-medium transition-colors group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Back to Marketplace
      </button>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        {/* Hero Section */}
        <div className="relative">
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            {account.icon_url ? (
              <img 
                src={account.icon_url} 
                alt={account.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <img 
                src={getProductImage(account.category)} 
                alt={account.name}
                className="h-32 w-32 object-contain"
              />
            )}
          </div>
          
          {/* Category Badge */}
          <div className="absolute top-4 left-4 px-4 py-2 bg-violet-500 text-white rounded-full text-sm font-bold uppercase shadow-lg">
            {account.category || 'AI'}
          </div>

          {/* Stock Badge */}
          {account.stock !== null && (
            <div className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-900 rounded-full text-sm font-medium shadow-lg flex items-center gap-2">
              <Package size={16} />
              {account.stock} in stock
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                {account.name}
              </h1>
              
              {/* Rating & Sales */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                  <span className="text-gray-600 font-medium ml-1">5.0</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Users size={16} />
                  <span className="font-medium">{purchaseCount}+ sold</span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="bg-gray-50 rounded-2xl p-4 lg:p-6 text-center lg:text-right">
              <p className="text-gray-500 text-sm mb-1">One-time payment</p>
              <p className="text-3xl lg:text-4xl font-bold text-gray-900">${account.price}</p>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-600 leading-relaxed">
              {account.description || 'Premium AI account with full access to all features. Get instant access to the most powerful AI tools available. Perfect for professionals, creators, and businesses looking to leverage cutting-edge AI technology.'}
            </p>
          </div>

          {/* Features */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">What's Included</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                'Full account access',
                'Premium features unlocked',
                'Instant delivery',
                '24/7 Support available',
                'Secure credentials',
                'Lifetime access'
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Check size={14} className="text-emerald-600" />
                  </div>
                  <span className="text-gray-700 font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-gray-100">
            <div className="flex items-center gap-2 text-gray-500">
              <ShieldCheck size={20} className="text-emerald-500" />
              <span className="text-sm font-medium">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Clock size={20} className="text-violet-500" />
              <span className="text-sm font-medium">Instant Delivery</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <BadgeCheck size={20} className="text-blue-500" />
              <span className="text-sm font-medium">Verified Seller</span>
            </div>
          </div>

          {/* Wallet Info & Purchase Button */}
          <div className="flex flex-col lg:flex-row items-center gap-4">
            {/* Wallet Balance */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 w-full lg:w-auto">
              <Wallet size={20} className="text-violet-500" />
              <div>
                <p className="text-xs text-gray-500">Your Balance</p>
                <p className="font-bold text-gray-900">${wallet?.balance?.toFixed(2) || '0.00'}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-1 w-full lg:w-auto">
              {!hasEnoughBalance && (
                <button
                  onClick={() => navigate('/dashboard/billing')}
                  className="flex-1 lg:flex-none px-6 py-3.5 bg-violet-100 text-violet-700 rounded-xl font-semibold hover:bg-violet-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Wallet size={18} />
                  Top Up Wallet
                </button>
              )}
              
              <button
                onClick={handlePurchase}
                disabled={purchasing || !hasEnoughBalance}
                className={`flex-1 px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                  purchasing
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : hasEnoughBalance
                    ? 'bg-yellow-400 hover:bg-yellow-500 text-black'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {purchasing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Buy Now - ${account.price}
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDetailPage;
