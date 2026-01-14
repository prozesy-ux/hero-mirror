import { useState, useEffect } from 'react';
import { CreditCard, Check, Sparkles, Crown, Zap, XCircle, RefreshCcw, Loader2, AlertTriangle, Shield, Wallet, Plus, ArrowUpRight, History, DollarSign, IndianRupee, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { GlassCard } from '@/components/ui/glass-card';
import { useSearchParams } from 'react-router-dom';

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
      toast.success('🎉 Welcome to Pro! All prompts are now unlocked!');
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
    stripe: { name: 'Stripe', icon: CreditCard, color: 'from-purple-500 to-indigo-500', desc: 'Credit/Debit Card' },
    bkash: { name: 'bKash', icon: Smartphone, color: 'from-pink-500 to-rose-500', desc: 'Mobile Banking (BD)' },
    upi: { name: 'UPI', icon: IndianRupee, color: 'from-green-500 to-emerald-500', desc: 'India Payments' },
  };

  const proFeatures = [
    '10,000+ Premium AI Prompts',
    'Unlimited Access Forever',
    'All ChatGPT Mega-Prompts',
    'All Midjourney Prompts',
    'All Claude Prompts',
    'New Prompts Added Monthly',
    'Priority Support',
    'Commercial License',
  ];

  return (
    <div className="max-w-4xl mx-auto animate-fade-up section-billing">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg shadow-amber-500/30">
          <Wallet size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Billing & Wallet</h2>
          <p className="text-gray-500">Manage your wallet, subscription and payments</p>
        </div>
      </div>

      {/* Wallet Card */}
      <GlassCard variant="glow" className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 animate-glow-pulse">
              <Wallet size={28} className="text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Wallet Balance</p>
              <h3 className="text-4xl font-bold text-white">
                ${(wallet?.balance || 0).toFixed(2)}
              </h3>
            </div>
          </div>
          <button
            onClick={() => setShowTopupModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold rounded-xl transition-all"
          >
            <Plus size={20} />
            Add Funds
          </button>
        </div>
      </GlassCard>

      {/* Transaction History */}
      {transactions.length > 0 && (
        <GlassCard className="mb-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <History className="text-purple-400" size={20} />
            Recent Transactions
          </h3>
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    tx.type === 'topup' ? 'bg-green-500/20 text-green-400' :
                    tx.type === 'purchase' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {tx.type === 'topup' ? <ArrowUpRight size={16} /> :
                     tx.type === 'purchase' ? <DollarSign size={16} /> :
                     <RefreshCcw size={16} />}
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
                  <p className={`font-semibold ${tx.type === 'topup' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type === 'topup' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    tx.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Current Plan */}
      <GlassCard variant={isPro ? "glow" : "default"} className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${isPro ? 'bg-gradient-to-br from-purple-500 to-pink-500 animate-glow-pulse' : 'bg-white/10'}`}>
              {isPro ? <Crown size={28} className="text-white" /> : <CreditCard size={28} className="text-gray-400" />}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                {isPro ? 'Pro Plan' : 'Free Plan'}
              </h3>
              <p className="text-gray-400">
                {isPro ? 'Lifetime access to all prompts' : 'Limited access to free prompts only'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isPro && (
              <>
                <span className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg">
                  Active
                </span>
                {!hasPendingCancellation && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-all text-sm border border-white/10"
                  >
                    Cancel Plan
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {hasPendingCancellation && (
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-3">
            <AlertTriangle className="text-yellow-400 shrink-0" size={20} />
            <div>
              <p className="text-yellow-400 font-medium">Cancellation Pending</p>
              <p className="text-gray-400 text-sm">Your cancellation request is being processed.</p>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Upgrade Card (if not Pro) */}
      {!isPro && (
        <GlassCard variant="gradient" className="mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-yellow-400 animate-pulse" size={28} />
              <h3 className="text-3xl font-bold text-white">Upgrade to Pro</h3>
            </div>

            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-gray-500 line-through text-2xl">$499</span>
              <span className="text-6xl font-bold gradient-text">$19</span>
              <span className="text-gray-400 text-lg">one-time payment</span>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {proFeatures.map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 group hover:bg-white/10 transition-all"
                >
                  <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 group-hover:scale-110 transition-transform">
                    <Check size={16} />
                  </div>
                  <span className="text-gray-200">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleUpgrade}
              disabled={processingPayment}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 glow-purple text-lg"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  Processing...
                </>
              ) : (
                <>
                  <Zap size={24} />
                  Upgrade Now for $19
                </>
              )}
            </button>

            <p className="text-center text-gray-500 text-sm mt-4 flex items-center justify-center gap-2">
              <Shield size={14} />
              Secure payment • 30-day money-back guarantee
            </p>
          </div>
        </GlassCard>
      )}

      {/* Purchase History */}
      <GlassCard>
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <CreditCard className="text-purple-400" size={20} />
          Purchase History
        </h3>
        
        {purchases.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No purchases yet</p>
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
                  <div>
                    <p className="text-white font-medium">Pro Plan - Lifetime Access</p>
                    <p className="text-gray-500 text-sm">
                      {new Date(purchase.purchased_at).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-white font-semibold text-lg">${purchase.amount.toFixed(2)}</p>
                      <span className={`text-xs px-2 py-1 rounded-lg ${
                        purchase.payment_status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {purchase.payment_status}
                      </span>
                    </div>
                    {refundStatus ? (
                      <span className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                        refundStatus.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : refundStatus.status === 'approved'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        Refund {refundStatus.status}
                      </span>
                    ) : canRequestRefund && (
                      <button
                        onClick={() => setShowRefundModal(purchase.id)}
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 bg-white/5 rounded-lg"
                      >
                        <RefreshCcw size={14} />
                        Request Refund
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* Topup Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111] rounded-2xl p-6 w-full max-w-lg border border-white/10 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <Wallet className="text-green-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Add Funds to Wallet</h3>
            </div>

            {/* Quick Amount Buttons */}
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-3">Select amount</p>
              <div className="grid grid-cols-5 gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTopupAmount(amount)}
                    className={`py-3 rounded-xl font-semibold transition-all ${
                      topupAmount === amount
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  min="1"
                />
              </div>
            </div>

            {/* Payment Gateway Selection */}
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-3">Select payment method</p>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(gatewayInfo) as PaymentGateway[]).map((gateway) => {
                  const info = gatewayInfo[gateway];
                  const Icon = info.icon;
                  return (
                    <button
                      key={gateway}
                      onClick={() => setSelectedGateway(gateway)}
                      className={`p-4 rounded-xl border transition-all text-center ${
                        selectedGateway === gateway
                          ? `bg-gradient-to-br ${info.color} border-transparent`
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <Icon size={24} className="mx-auto mb-2" />
                      <p className="text-white font-medium text-sm">{info.name}</p>
                      <p className="text-gray-400 text-xs">{info.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gateway Specific Fields */}
            {selectedGateway === 'bkash' && (
              <div className="mb-6">
                <label className="text-gray-400 text-sm mb-2 block">bKash Number</label>
                <input
                  type="tel"
                  value={bkashNumber}
                  onChange={(e) => setBkashNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                />
              </div>
            )}

            {selectedGateway === 'upi' && (
              <div className="mb-6">
                <label className="text-gray-400 text-sm mb-2 block">UPI ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="yourname@upi"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowTopupModal(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleTopup}
                disabled={processingTopup || (selectedGateway === 'bkash' && !bkashNumber) || (selectedGateway === 'upi' && !upiId)}
                className={`flex-1 bg-gradient-to-r ${gatewayInfo[selectedGateway].color} text-white py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium`}
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
              <h3 className="text-xl font-bold text-white">Cancel Pro Plan</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Are you sure you want to cancel your Pro plan? You'll lose access to all premium prompts.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl transition-all font-medium"
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
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <RefreshCcw className="text-purple-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Request Refund</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Please tell us why you'd like a refund. We'll review your request within 24-48 hours.
            </p>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Reason for refund request"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRefundModal(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const purchase = purchases.find(p => p.id === showRefundModal);
                  if (purchase) handleRefundRequest(purchase.id, purchase.amount);
                }}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
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
