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
import { useSearchParams, useNavigate } from 'react-router-dom';

// Import payment logos
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

type BillingTab = 'wallet' | 'transactions' | 'plan' | 'purchases';
type PaymentGateway = 'stripe' | 'bkash' | 'upi';

const BillingSection = () => {
  const { user, isPro } = useAuthContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
  const [processingTopup, setProcessingTopup] = useState(false);
  
  // Payment gateway states
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('stripe');
  const [bkashNumber, setBkashNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
      subscribeToUpdates();
      
      // Check for Stripe topup success and verify payment
      const topupStatus = searchParams.get('topup');
      const sessionId = searchParams.get('session_id');
      
      if (topupStatus === 'success' && sessionId) {
        verifyAndCreditWallet(sessionId);
      }
    }
  }, [user, searchParams]);

  const verifyAndCreditWallet = async (sessionId: string, retryCount = 0) => {
    // Don't block the entire page - just show a toast
    if (retryCount === 0) {
      setVerifyingPayment(true);
      toast.info('Verifying your payment...');
      // Add delay on first attempt - Stripe might not be ready immediately
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('verify-topup', {
        body: { session_id: sessionId }
      });
      
      if (error) {
        // If payment not completed yet, retry up to 3 times
        if (error.message?.includes('not completed') && retryCount < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          return verifyAndCreditWallet(sessionId, retryCount + 1);
        }
        throw error;
      }
      
      if (data?.success) {
        toast.success(`$${data.amount} added to your wallet!`);
        fetchData();
      } else if (data?.message?.includes('already processed')) {
        toast.info('Payment was already processed.');
        fetchData();
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast.error('Payment verification failed. Contact support if funds are missing.');
    } finally {
      setVerifyingPayment(false);
      // Clear URL params
      navigate('/dashboard/billing', { replace: true });
    }
  };

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

  const handleTopup = async () => {
    if (!user) return;
    setProcessingTopup(true);

    try {
      if (selectedGateway === 'stripe') {
        // Stripe checkout flow
        const { data, error } = await supabase.functions.invoke('create-topup', {
          body: { amount: topupAmount }
        });
        
        if (error) throw error;
        if (data?.url) {
          window.open(data.url, '_blank');
        }
      } else {
        // Manual payment flow (bKash/UPI)
        const transactionId = selectedGateway === 'bkash' ? bkashNumber : upiId;
        
        if (!transactionId.trim()) {
          toast.error(`Please enter your ${selectedGateway === 'bkash' ? 'bKash number' : 'UPI transaction ID'}`);
          setProcessingTopup(false);
          return;
        }

        // Create pending transaction for admin approval
        const { error } = await supabase
          .from('wallet_transactions')
          .insert({
            user_id: user.id,
            type: 'topup',
            amount: topupAmount,
            payment_gateway: selectedGateway,
            transaction_id: transactionId,
            status: 'pending',
            description: `Top-up via ${selectedGateway.toUpperCase()} - awaiting approval`
          });

        if (error) throw error;
        
        toast.success('Payment submitted! Awaiting admin approval.');
        setBkashNumber('');
        setUpiId('');
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setProcessingTopup(false);
      setShowTopupModal(false);
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

  const paymentMethods = [
    { id: 'stripe' as PaymentGateway, name: 'Stripe', logo: stripeLogo, description: 'Credit/Debit Card' },
    { id: 'bkash' as PaymentGateway, name: 'bKash', logo: bkashLogo, description: 'Mobile Banking' },
    { id: 'upi' as PaymentGateway, name: 'UPI', logo: upiLogo, description: 'UPI Payment' },
  ];

  // Removed blocking loading overlay - now using toast notifications instead

  return (
    <div className="max-w-4xl mx-auto animate-fade-up">
      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl p-2 mb-8 border border-gray-200 shadow-md flex gap-2">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 transform flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 hover:scale-105 active:scale-95'
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
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
            <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-4 flex items-center gap-2">
              <CreditCard className="text-gray-500" size={20} />
              Available Payment Methods
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {paymentMethods.map((method) => (
                <div 
                  key={method.id}
                  className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center hover:bg-gray-100 transition-all"
                >
                  <img 
                    src={method.logo} 
                    alt={method.name} 
                    className="h-8 w-auto mx-auto mb-2 object-contain"
                  />
                  <p className="text-gray-900 font-medium text-sm">{method.name}</p>
                  <p className="text-gray-500 text-xs">{method.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-4 flex items-center gap-2">
            <History className="text-gray-500" size={20} />
            Transaction History
          </h3>
          
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      tx.type === 'topup' ? 'bg-violet-100' :
                      tx.type === 'purchase' ? 'bg-gray-100' :
                      'bg-blue-100'
                    }`}>
                      {tx.type === 'topup' && <CircleDollarSign size={18} className="text-violet-600" />}
                      {tx.type === 'purchase' && <Receipt size={18} className="text-gray-600" />}
                      {tx.type === 'refund' && <RotateCcw size={18} className="text-blue-600" />}
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium capitalize">{tx.description || tx.type}</p>
                      <p className="text-gray-500 text-sm">
                        {new Date(tx.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {tx.payment_gateway && (
                          <span className="ml-2 text-xs uppercase text-gray-400">
                            via {tx.payment_gateway}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.type === 'topup' ? 'text-violet-600' : tx.type === 'refund' ? 'text-blue-600' : 'text-gray-700'}`}>
                      {tx.type === 'topup' ? '+' : tx.type === 'refund' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                      tx.status === 'completed' ? 'bg-violet-100 text-violet-700' :
                      tx.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
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
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${isPro ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gray-100'}`}>
                  {isPro ? <Crown size={28} className="text-white" /> : <User size={28} className="text-gray-500" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
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
                    <span className="px-4 py-2 bg-violet-100 text-violet-700 font-semibold rounded-xl flex items-center gap-2">
                      <Check size={16} />
                      Active
                    </span>
                    {!hasPendingCancellation && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all text-sm border border-gray-200"
                      >
                        Cancel Plan
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {hasPendingCancellation && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                <div>
                  <p className="text-amber-700 font-medium">Cancellation Pending</p>
                  <p className="text-amber-600/70 text-sm">Your cancellation request is being processed.</p>
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
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-4 flex items-center gap-2">
            <ClipboardList className="text-gray-500" size={20} />
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
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 flex-wrap gap-3 hover:bg-gray-100 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gray-100 rounded-xl">
                        <ShoppingBag size={18} className="text-gray-600" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-semibold">Pro Plan - Lifetime Access</p>
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
                        <p className="text-gray-900 font-semibold text-lg">${purchase.amount.toFixed(2)}</p>
                        <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                          purchase.payment_status === 'completed'
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {purchase.payment_status}
                        </span>
                      </div>
                      {refundStatus ? (
                        <span className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                          refundStatus.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : refundStatus.status === 'approved'
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          Refund {refundStatus.status}
                        </span>
                      ) : canRequestRefund && (
                        <button
                          onClick={() => setShowRefundModal(purchase.id)}
                          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200 hover:bg-gray-200"
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

            {/* Payment Method Selection */}
            <div className="mb-6">
              <p className="text-gray-500 text-sm mb-3 font-medium">Select payment method</p>
              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedGateway(method.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedGateway === method.id
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <img 
                      src={method.logo} 
                      alt={method.name} 
                      className="h-8 w-auto mx-auto mb-2 object-contain"
                    />
                    <p className="text-gray-900 font-medium text-sm text-center">{method.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Gateway-specific inputs */}
            {selectedGateway === 'bkash' && (
              <div className="mb-6 p-4 bg-pink-50 rounded-xl border border-pink-200">
                <div className="mb-3">
                  <p className="text-pink-800 font-semibold mb-1">bKash Payment Instructions</p>
                  <p className="text-pink-600 text-sm">
                    1. Send <span className="font-bold">${topupAmount}</span> to: <span className="font-mono font-bold">01XXXXXXXXX</span> (Personal)
                  </p>
                  <p className="text-pink-600 text-sm">2. Enter your bKash number below</p>
                </div>
                <input
                  type="text"
                  value={bkashNumber}
                  onChange={(e) => setBkashNumber(e.target.value)}
                  placeholder="Enter your bKash number"
                  className="w-full bg-white border border-pink-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500/30"
                />
              </div>
            )}

            {selectedGateway === 'upi' && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="mb-3">
                  <p className="text-blue-800 font-semibold mb-1">UPI Payment Instructions</p>
                  <p className="text-blue-600 text-sm">
                    1. Send <span className="font-bold">${topupAmount}</span> to: <span className="font-mono font-bold">yourname@upi</span>
                  </p>
                  <p className="text-blue-600 text-sm">2. Enter your UPI transaction ID below</p>
                </div>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="Enter UPI transaction ID"
                  className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            )}

            {selectedGateway === 'stripe' && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <img 
                    src={stripeLogo} 
                    alt="Stripe" 
                    className="h-8 w-auto object-contain"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Secure Payment via Stripe</p>
                    <p className="text-xs text-gray-500">Credit/Debit Card accepted • Instant</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTopupModal(false);
                  setBkashNumber('');
                  setUpiId('');
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleTopup}
                disabled={processingTopup}
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {processingTopup ? <Loader2 className="animate-spin" size={18} /> : null}
                {selectedGateway === 'stripe' ? `Pay $${topupAmount}` : `Submit $${topupAmount} Request`}
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
