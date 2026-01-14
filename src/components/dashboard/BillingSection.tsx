import { useState, useEffect } from 'react';
import { 
  CreditCard, Check, XCircle, Loader2, AlertTriangle, Shield, Wallet, Plus, History, 
  Crown, Zap, Sparkles, Infinity, MessageSquareText, Image, 
  Brain, CalendarCheck, Headphones, FileCheck, CircleDollarSign, Receipt, RotateCcw, 
  ClipboardList, ShoppingBag, User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

// Import real payment logos
import stripeLogo from '@/assets/stripe-logo.svg';
import bkashLogo from '@/assets/bkash-logo.png';
import upiLogo from '@/assets/upi-logo.png';

interface Purchase {
  id: string;
  amount: number;
  payment_status: string;
  purchased_at: string;
}

interface RefundRequest {
  id: string;
  status: string;
  amount: number;
  created_at: string;
}

interface CancellationRequest {
  id: string;
  status: string;
  created_at: string;
}

interface WalletData {
  balance: number;
}

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  payment_gateway: string;
  status: string;
  description: string;
  created_at: string;
}

type PaymentGateway = 'stripe' | 'bkash' | 'upi';
type BillingTab = 'wallet' | 'transactions' | 'plan' | 'purchases';

const BillingSection = () => {
  const { user, isPro } = useAuthContext();
  const [searchParams] = useSearchParams();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [cancellationRequest, setCancellationRequest] = useState<CancellationRequest | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<BillingTab>('wallet');
  
  // Wallet states
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(10);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('stripe');
  const [processingTopup, setProcessingTopup] = useState(false);
  const [bkashNumber, setBkashNumber] = useState('');
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
      subscribeToUpdates();
      
      // Check for topup success
      const topupStatus = searchParams.get('topup');
      const amount = searchParams.get('amount');
      if (topupStatus === 'success' && amount) {
        handleStripeTopupSuccess(parseFloat(amount));
      }
    }
  }, [user, searchParams]);

  const fetchData = async () => {
    const { data: purchasesData } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user?.id)
      .order('purchased_at', { ascending: false });
    
    setPurchases(purchasesData || []);

    const { data: refundsData } = await supabase
      .from('refund_requests')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    setRefundRequests(refundsData || []);

    const { data: cancellationData } = await supabase
      .from('cancellation_requests')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    setCancellationRequest(cancellationData);

    // Fetch wallet
    const { data: walletData } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user?.id)
      .single();
    
    setWallet(walletData || { balance: 0 });

    // Fetch transactions
    const { data: txData } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    setTransactions(txData || []);
  };

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel('billing-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refund_requests', filter: `user_id=eq.${user?.id}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cancellation_requests', filter: `user_id=eq.${user?.id}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_wallets', filter: `user_id=eq.${user?.id}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${user?.id}` }, fetchData)
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const handleStripeTopupSuccess = async (amount: number) => {
    try {
      const { error } = await supabase.functions.invoke('process-topup', {
        body: { amount, gateway: 'stripe', transactionId: `stripe_${Date.now()}` }
      });
      
      if (error) throw error;
      toast.success(`Successfully added $${amount} to your wallet!`);
      fetchData();
    } catch (error: any) {
      console.error('Error processing topup:', error);
    }
  };

  const handleTopup = async () => {
    if (!user) return;
    setProcessingTopup(true);

    try {
      if (selectedGateway === 'stripe') {
        const { data, error } = await supabase.functions.invoke('create-topup', {
          body: { amount: topupAmount }
        });
        
        if (error) throw error;
        if (data?.url) {
          window.open(data.url, '_blank');
        }
      } else {
        // For bKash and UPI, simulate payment process
        const transactionId = selectedGateway === 'bkash' 
          ? `bkash_${bkashNumber}_${Date.now()}`
          : `upi_${upiId}_${Date.now()}`;
        
        const { error } = await supabase.functions.invoke('process-topup', {
          body: { 
            amount: topupAmount, 
            gateway: selectedGateway, 
            transactionId 
          }
        });
        
        if (error) throw error;
        toast.success(`Successfully added $${topupAmount} to your wallet via ${selectedGateway.toUpperCase()}!`);
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setProcessingTopup(false);
      setShowTopupModal(false);
      setBkashNumber('');
      setUpiId('');
    }
  };

  const handleUpgrade = async () => {
    if (!user) return;
    
    setProcessingPayment(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

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

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_pro: true })
      .eq('user_id', user.id);

    setProcessingPayment(false);

    if (profileError) {
      toast.error('Failed to activate Pro status');
    } else {
      toast.success('Welcome to Pro! All prompts are now unlocked!');
      fetchData();
      window.location.reload();
    }
  };

  const handleCancelPlan = async () => {
    if (!user) return;
    
    setSubmitting(true);
    
    const { error } = await supabase
      .from('cancellation_requests')
      .insert({
        user_id: user.id,
        reason: cancelReason || null
      });

    setSubmitting(false);
    setShowCancelModal(false);
    setCancelReason('');

    if (error) {
      toast.error('Failed to submit cancellation request');
    } else {
      toast.success('Cancellation request submitted. We\'ll process it shortly.');
      fetchData();
    }
  };

  const handleRefundRequest = async (purchaseId: string, amount: number) => {
    if (!user) return;
    
    setSubmitting(true);
    
    const { error } = await supabase
      .from('refund_requests')
      .insert({
        user_id: user.id,
        purchase_id: purchaseId,
        purchase_type: 'pro_plan',
        amount: amount,
        reason: refundReason || null
      });

    setSubmitting(false);
    setShowRefundModal(null);
    setRefundReason('');

    if (error) {
      toast.error('Failed to submit refund request');
    } else {
      toast.success('Refund request submitted. We\'ll review it within 24-48 hours.');
      fetchData();
    }
  };

  const hasPendingCancellation = cancellationRequest?.status === 'pending';
  const quickAmounts = [5, 10, 25, 50, 100];

  const gatewayInfo = {
    stripe: { name: 'Stripe', logo: stripeLogo, desc: 'Credit/Debit Card' },
    bkash: { name: 'bKash', logo: bkashLogo, desc: 'Mobile Banking (BD)' },
    upi: { name: 'UPI', logo: upiLogo, desc: 'India Payments' },
  };

  const proFeatures = [
    { text: '10,000+ Premium AI Prompts', icon: Sparkles },
    { text: 'Unlimited Access Forever', icon: Infinity },
    { text: 'All ChatGPT Mega-Prompts', icon: MessageSquareText },
    { text: 'All Midjourney Prompts', icon: Image },
    { text: 'All Claude Prompts', icon: Brain },
    { text: 'New Prompts Added Monthly', icon: CalendarCheck },
    { text: 'Priority Support', icon: Headphones },
    { text: 'Commercial License', icon: FileCheck },
  ];

  const tabs = [
    { id: 'wallet' as BillingTab, label: 'Wallet', icon: Wallet },
    { id: 'transactions' as BillingTab, label: 'Transactions', icon: History },
    { id: 'plan' as BillingTab, label: 'Plan', icon: Crown },
    { id: 'purchases' as BillingTab, label: 'Purchases', icon: ShoppingBag },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-fade-up">
      {/* Tab Navigation */}
      <div className="bg-[#1a1a1f] rounded-2xl p-2 mb-8 border border-white/5 flex gap-2">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 transform flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-white text-black shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95'
              }`}
            >
              <TabIcon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Wallet Tab */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          {/* Wallet Card */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600">
                  <Wallet size={28} className="text-white" />
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Wallet Balance</p>
                  <h3 className="text-4xl font-bold text-gray-900 tracking-tight">
                    ${(wallet?.balance || 0).toFixed(2)}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowTopupModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/25"
              >
                <Plus size={20} />
                Add Funds
              </button>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-[#1a1a1f] rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-bold text-white tracking-tight mb-4 flex items-center gap-2">
              <CreditCard className="text-gray-400" size={20} />
              Payment Methods
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {(Object.keys(gatewayInfo) as PaymentGateway[]).map((gateway) => {
                const info = gatewayInfo[gateway];
                return (
                  <div
                    key={gateway}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 text-center hover:bg-white/10 transition-all"
                  >
                    <img 
                      src={info.logo} 
                      alt={info.name} 
                      className="h-8 w-auto mx-auto mb-2 object-contain"
                    />
                    <p className="text-white font-medium text-sm">{info.name}</p>
                    <p className="text-gray-500 text-xs">{info.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="bg-[#1a1a1f] rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-bold text-white tracking-tight mb-4 flex items-center gap-2">
            <History className="text-gray-400" size={20} />
            Transaction History
          </h3>
          
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      tx.type === 'topup' ? 'bg-violet-500/15' :
                      tx.type === 'purchase' ? 'bg-gray-500/15' :
                      'bg-blue-500/15'
                    }`}>
                      {tx.type === 'topup' && <CircleDollarSign size={18} className="text-violet-400" />}
                      {tx.type === 'purchase' && <Receipt size={18} className="text-gray-400" />}
                      {tx.type === 'refund' && <RotateCcw size={18} className="text-blue-400" />}
                    </div>
                    <div>
                      <p className="text-white font-medium capitalize">{tx.description || tx.type}</p>
                      <p className="text-gray-500 text-sm">
                        {new Date(tx.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.type === 'topup' ? 'text-violet-400' : tx.type === 'refund' ? 'text-blue-400' : 'text-gray-300'}`}>
                      {tx.type === 'topup' ? '+' : tx.type === 'refund' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                      tx.status === 'completed' ? 'bg-violet-500/20 text-violet-400' :
                      tx.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Plan Tab */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="bg-[#1a1a1f] rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${isPro ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-white/10'}`}>
                  {isPro ? <Crown size={28} className="text-white" /> : <User size={28} className="text-gray-400" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    {isPro ? 'Pro Plan' : 'Free Plan'}
                  </h3>
                  <p className="text-gray-500">
                    {isPro ? 'Lifetime access to all prompts' : 'Limited access to free prompts only'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isPro && (
                  <>
                    <span className="px-4 py-2 bg-violet-500/20 text-violet-400 font-semibold rounded-xl flex items-center gap-2">
                      <Check size={16} />
                      Active
                    </span>
                    {!hasPendingCancellation && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl transition-all text-sm border border-white/10"
                      >
                        Cancel Plan
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {hasPendingCancellation && (
              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3">
                <AlertTriangle className="text-amber-400 shrink-0" size={20} />
                <div>
                  <p className="text-amber-400 font-medium">Cancellation Pending</p>
                  <p className="text-gray-500 text-sm">Your cancellation request is being processed.</p>
                </div>
              </div>
            )}
          </div>

          {/* Upgrade Card (if not Pro) */}
          {!isPro && (
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">
              {/* Gradient Hero Header */}
              <div className="h-32 bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 p-6 flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <Crown className="text-white" size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">Upgrade to Pro</h3>
                  <p className="text-white/80">Unlock everything, forever</p>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-baseline gap-3 mb-6">
                  <span className="text-gray-400 line-through text-xl">$499</span>
                  <span className="text-5xl font-bold text-gray-900 tracking-tight">$19</span>
                  <span className="text-gray-500">one-time payment</span>
                </div>

                <div className="grid md:grid-cols-2 gap-3 mb-6">
                  {proFeatures.map((feature, index) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <div 
                        key={index} 
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                          <FeatureIcon size={16} className="text-white" />
                        </div>
                        <span className="text-gray-700 font-medium">{feature.text}</span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleUpgrade}
                  disabled={processingPayment}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-lg shadow-orange-500/25"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap size={20} />
                      Upgrade Now for $19
                    </>
                  )}
                </button>

                <p className="text-center text-gray-500 text-sm mt-4 flex items-center justify-center gap-2">
                  <Shield size={14} />
                  Secure payment • 30-day money-back guarantee
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Purchases Tab */}
      {activeTab === 'purchases' && (
        <div className="bg-[#1a1a1f] rounded-2xl p-6 border border-white/5">
          <h3 className="text-lg font-bold text-white tracking-tight mb-4 flex items-center gap-2">
            <ClipboardList className="text-gray-400" size={20} />
            Purchase History
          </h3>
          
          {purchases.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No purchases yet</p>
          ) : (
            <div className="space-y-3">
              {purchases.map((purchase) => {
                const refundStatus = refundRequests.find(r => r.amount === purchase.amount);
                const canRequestRefund = purchase.payment_status === 'completed' && !refundStatus;

                return (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 flex-wrap gap-3 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/10 rounded-xl">
                        <ShoppingBag size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Pro Plan - Lifetime Access</p>
                        <p className="text-gray-500 text-sm">
                          {new Date(purchase.purchased_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-white font-semibold text-lg">${purchase.amount.toFixed(2)}</p>
                        <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                          purchase.payment_status === 'completed'
                            ? 'bg-violet-500/20 text-violet-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {purchase.payment_status}
                        </span>
                      </div>
                      {refundStatus ? (
                        <span className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                          refundStatus.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400'
                            : refundStatus.status === 'approved'
                            ? 'bg-violet-500/20 text-violet-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          Refund {refundStatus.status}
                        </span>
                      ) : canRequestRefund && (
                        <button
                          onClick={() => setShowRefundModal(purchase.id)}
                          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 bg-white/5 rounded-lg border border-white/10"
                        >
                          <RotateCcw size={14} />
                          Request Refund
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Topup Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg border border-gray-200 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
                <Wallet className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">Add Funds to Wallet</h3>
            </div>

            {/* Quick Amount Buttons */}
            <div className="mb-6">
              <p className="text-gray-500 text-sm mb-3 font-medium">Select amount</p>
              <div className="grid grid-cols-5 gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTopupAmount(amount)}
                    className={`py-3 rounded-xl font-semibold transition-all ${
                      topupAmount === amount
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  min="1"
                />
              </div>
            </div>

            {/* Payment Gateway Selection with Real Logos */}
            <div className="mb-6">
              <p className="text-gray-500 text-sm mb-3 font-medium">Select payment method</p>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(gatewayInfo) as PaymentGateway[]).map((gateway) => {
                  const info = gatewayInfo[gateway];
                  return (
                    <button
                      key={gateway}
                      onClick={() => setSelectedGateway(gateway)}
                      className={`p-4 rounded-xl border transition-all text-center ${
                        selectedGateway === gateway
                          ? 'bg-violet-50 border-violet-300 ring-2 ring-violet-500/20'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <img 
                        src={info.logo} 
                        alt={info.name} 
                        className="h-8 w-auto mx-auto mb-2 object-contain"
                      />
                      <p className="font-medium text-sm text-gray-900">{info.name}</p>
                      <p className="text-xs text-gray-500">{info.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gateway Specific Fields */}
            {selectedGateway === 'bkash' && (
              <div className="mb-6">
                <label className="text-gray-500 text-sm mb-2 block font-medium">bKash Number</label>
                <input
                  type="tel"
                  value={bkashNumber}
                  onChange={(e) => setBkashNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
            )}

            {selectedGateway === 'upi' && (
              <div className="mb-6">
                <label className="text-gray-500 text-sm mb-2 block font-medium">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowTopupModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleTopup}
                disabled={processingTopup || (selectedGateway === 'bkash' && !bkashNumber) || (selectedGateway === 'upi' && !upiId)}
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {processingTopup ? <Loader2 className="animate-spin" size={18} /> : null}
                Add ${topupAmount}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Plan Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] rounded-2xl p-6 w-full max-w-md border border-white/10 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <XCircle className="text-red-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Cancel Pro Plan</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Are you sure you want to cancel your Pro plan? You'll lose access to all premium prompts.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 mb-4 focus:outline-none focus:ring-2 focus:ring-white/20"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl transition-all font-medium border border-white/10"
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancelPlan}
                disabled={submitting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : null}
                Cancel Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Request Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] rounded-2xl p-6 w-full max-w-md border border-white/10 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <RotateCcw className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Request Refund</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Please tell us why you'd like a refund. We'll review your request within 24-48 hours.
            </p>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Reason for refund request"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 mb-4 focus:outline-none focus:ring-2 focus:ring-white/20"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRefundModal(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl transition-all font-medium border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const purchase = purchases.find(p => p.id === showRefundModal);
                  if (purchase) handleRefundRequest(purchase.id, purchase.amount);
                }}
                disabled={submitting}
                className="flex-1 bg-white hover:bg-gray-100 text-black py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : null}
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingSection;
