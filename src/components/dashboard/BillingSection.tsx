import { useState, useEffect, useRef } from 'react';
import { 
  CreditCard, Check, XCircle, Loader2, AlertTriangle, Shield, Wallet, Plus, History, 
  Crown, Zap, Sparkles, Infinity, CalendarPlus, Headphones, FileCheck, CircleDollarSign, Receipt, RotateCcw, 
  ClipboardList, ShoppingBag, User, ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { playSound } from '@/lib/sounds';

// Import AI product logos

// Import AI product logos
import chatgptLogo from '@/assets/chatgpt-logo.avif';
import midjourneyLogo from '@/assets/midjourney-logo.avif';
import geminiLogo from '@/assets/gemini-logo.avif';

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
  transaction_id?: string;
}

interface PaymentMethodDB {
  id: string;
  name: string;
  code: string;
  icon_url: string | null;
  qr_image_url: string | null;
  account_number: string | null;
  account_name: string | null;
  instructions: string | null;
  is_automatic: boolean;
  is_enabled: boolean;
  display_order: number;
  currency_code: string | null;
  exchange_rate: number | null;
}

// Currency helper functions
const getCurrencySymbol = (code: string | null): string => {
  switch (code) {
    case 'BDT': return '৳';
    case 'INR': return '₹';
    case 'PKR': return 'Rs';
    default: return '$';
  }
};

const convertToLocalCurrency = (usdAmount: number, method: PaymentMethodDB | undefined): number => {
  if (!method) return usdAmount;
  const rate = method.exchange_rate || 1;
  return usdAmount * rate;
};

const formatLocalAmount = (usdAmount: number, method: PaymentMethodDB | undefined): string => {
  if (!method || method.currency_code === 'USD' || !method.currency_code) {
    return `$${usdAmount}`;
  }
  const localAmount = convertToLocalCurrency(usdAmount, method);
  const symbol = getCurrencySymbol(method.currency_code);
  return `${symbol}${localAmount.toFixed(0)}`;
};

type BillingTab = 'wallet' | 'transactions' | 'plan' | 'purchases';

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
  const [selectedGateway, setSelectedGateway] = useState<string>('stripe');
  const [transactionIdInput, setTransactionIdInput] = useState('');
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [editTransactionIdValue, setEditTransactionIdValue] = useState('');
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  
  // Payment methods from database
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDB[]>([]);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

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

  const fetchPaymentMethods = async () => {
    const { data } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_enabled', true)
      .order('display_order', { ascending: true });
    
    if (data) {
      setPaymentMethods(data);
      // Set default selected gateway to first method
      if (data.length > 0 && !selectedGateway) {
        setSelectedGateway(data[0].code);
      }
    }
  };

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

  // Track previous wallet balance for sound notification
  const prevWalletBalanceRef = useRef<number | null>(null);

  const subscribeToUpdates = () => {
    const channel = supabase
      .channel('billing-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refund_requests', filter: `user_id=eq.${user?.id}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cancellation_requests', filter: `user_id=eq.${user?.id}` }, fetchData)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_wallets', filter: `user_id=eq.${user?.id}` }, async (payload) => {
        const newBalance = (payload.new as { balance: number })?.balance || 0;
        const oldBalance = prevWalletBalanceRef.current;
        
        // Play sound and show toast when wallet is credited
        if (oldBalance !== null && newBalance > oldBalance) {
          playSound('walletCredited');
          toast.success(`$${(newBalance - oldBalance).toFixed(2)} added to your wallet!`);
          
          // Create notification for wallet top-up
          await supabase.from('notifications').insert({
            user_id: user?.id,
            type: 'topup',
            title: 'Wallet Credited',
            message: `$${(newBalance - oldBalance).toFixed(2)} has been added to your wallet`,
            link: '/dashboard/billing',
            is_read: false
          });
        }
        
        prevWalletBalanceRef.current = newBalance;
        fetchData();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_wallets', filter: `user_id=eq.${user?.id}` }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_transactions', filter: `user_id=eq.${user?.id}` }, fetchData)
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  // Initialize wallet balance ref when wallet data is fetched
  useEffect(() => {
    if (wallet?.balance !== undefined && prevWalletBalanceRef.current === null) {
      prevWalletBalanceRef.current = wallet.balance;
    }
  }, [wallet?.balance]);

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
        if (!transactionIdInput.trim()) {
          toast.error('Please enter your transaction ID');
          setProcessingTopup(false);
          return;
        }

        // Check for duplicate transaction ID
        const { data: existingTx } = await supabase
          .from('wallet_transactions')
          .select('id')
          .eq('transaction_id', transactionIdInput.trim())
          .single();

        if (existingTx) {
          toast.error('This transaction ID has already been used. Please check your transaction ID.');
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
            transaction_id: transactionIdInput.trim(),
            status: 'pending',
            description: `Top-up via ${selectedGateway.toUpperCase()} - awaiting approval`
          });

        if (error) throw error;
        
        toast.success('Payment submitted! Awaiting admin approval.');
        setTransactionIdInput('');
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setProcessingTopup(false);
      setShowTopupModal(false);
    }
  };

  const handleUpdateTransactionId = async (txId: string) => {
    if (!editTransactionIdValue.trim()) {
      toast.error('Please enter a transaction ID');
      return;
    }

    // Check for duplicate
    const { data: existingTx } = await supabase
      .from('wallet_transactions')
      .select('id')
      .eq('transaction_id', editTransactionIdValue.trim())
      .neq('id', txId)
      .single();

    if (existingTx) {
      toast.error('This transaction ID has already been used');
      return;
    }

    const { error } = await supabase
      .from('wallet_transactions')
      .update({ transaction_id: editTransactionIdValue.trim() })
      .eq('id', txId)
      .eq('user_id', user?.id)
      .eq('status', 'pending');

    if (error) {
      toast.error('Failed to update transaction ID');
      return;
    }

    toast.success('Transaction ID updated!');
    setEditingTransactionId(null);
    setEditTransactionIdValue('');
    fetchData();
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
  
  // Get selected payment method details
  const selectedMethod = paymentMethods.find(m => m.code === selectedGateway);

  const proFeatures = [
    { text: '10,000+ Premium AI Prompts', icon: Sparkles, highlight: true },
    { text: 'All ChatGPT Mega-Prompts', logo: chatgptLogo, logoAlt: 'ChatGPT' },
    { text: 'All Midjourney Prompts', logo: midjourneyLogo, logoAlt: 'Midjourney' },
    { text: 'All Gemini Prompts', logo: geminiLogo, logoAlt: 'Gemini' },
    { text: 'Unlimited Access Forever', icon: Infinity },
    { text: 'New Prompts Added Monthly', icon: CalendarPlus },
    { text: 'Priority Support', icon: Headphones },
    { text: 'Commercial License', icon: FileCheck },
  ];

  const tabs = [
    { id: 'wallet' as BillingTab, label: 'Wallet', icon: Wallet },
    { id: 'transactions' as BillingTab, label: 'Transactions', icon: History },
    { id: 'plan' as BillingTab, label: 'Plan', icon: Crown },
    { id: 'purchases' as BillingTab, label: 'Purchases', icon: ShoppingBag },
  ];

  // Removed blocking loading overlay - now using toast notifications instead

  return (
    <div className="max-w-4xl mx-auto animate-fade-up">
      {/* Tab Navigation - Mobile Optimized */}
      <div className="bg-white rounded-2xl p-1.5 lg:p-2 mb-4 lg:mb-8 border border-gray-200 shadow-md">
        <div className="flex gap-1 lg:gap-2 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 lg:px-6 py-2.5 lg:py-3.5 rounded-xl font-semibold text-xs lg:text-sm transition-all duration-200 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95'
                }`}
              >
                <TabIcon size={14} className="lg:w-4 lg:h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {paymentMethods.map((method) => (
                <div 
                  key={method.id}
                  className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center hover:bg-gray-100 transition-all"
                >
                  {method.icon_url ? (
                    <img 
                      src={method.icon_url} 
                      alt={method.name} 
                      className="h-8 w-auto mx-auto mb-2 object-contain"
                    />
                  ) : (
                    <div className="h-8 w-8 mx-auto mb-2 rounded-lg bg-gray-200 flex items-center justify-center">
                      <CreditCard size={16} className="text-gray-500" />
                    </div>
                  )}
                  <p className="text-gray-900 font-medium text-sm">{method.name}</p>
                  <p className="text-gray-500 text-xs">{method.is_automatic ? 'Automatic' : 'Manual'}</p>
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
                  className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all"
                >
                  <div className="flex items-center justify-between">
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
                  
                  {/* Transaction ID section for manual payments */}
                  {tx.payment_gateway && tx.payment_gateway !== 'stripe' && tx.status === 'pending' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      {editingTransactionId === tx.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editTransactionIdValue}
                            onChange={(e) => setEditTransactionIdValue(e.target.value)}
                            placeholder="Enter correct transaction ID"
                            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                          />
                          <button
                            onClick={() => handleUpdateTransactionId(tx.id)}
                            className="px-3 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingTransactionId(null);
                              setEditTransactionIdValue('');
                            }}
                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Transaction ID:</span>{' '}
                            <span className="font-mono">{tx.transaction_id || 'Not provided'}</span>
                          </p>
                          <button
                            onClick={() => {
                              setEditingTransactionId(tx.id);
                              setEditTransactionIdValue(tx.transaction_id || '');
                            }}
                            className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Clean header with PRO badge */}
              <div className="px-8 pt-8 pb-6 border-b border-gray-100">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-semibold mb-4 border border-amber-100">
                  <Crown size={14} />
                  PRO
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">
                  Upgrade to Pro
                </h3>
                <p className="text-gray-500 mt-1">
                  Unlock 10,000+ premium AI prompts, forever.
                </p>
              </div>

              {/* Two-column layout */}
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                {/* Pricing Column */}
                <div className="p-8">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-gray-400 line-through text-lg font-medium">$499</span>
                    <span className="text-4xl font-bold text-gray-900 tracking-tight">$19</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-6">one-time payment</p>
                  
                  <button
                    onClick={handleUpgrade}
                    disabled={processingPayment}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3.5 px-6 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Processing...
                      </>
                    ) : (
                      <>
                        Upgrade Now
                        <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                  
                  <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                    <Shield size={14} className="text-gray-400" />
                    <span>30-day money-back guarantee</span>
                  </div>
                </div>

                {/* Features Column */}
                <div className="p-8">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                    What's included
                  </p>
                  <div className="space-y-3">
                    {proFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        {'logo' in feature && feature.logo ? (
                          <img 
                            src={feature.logo} 
                            alt={feature.logoAlt} 
                            className="w-6 h-6 rounded-md object-cover"
                          />
                        ) : (
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                            feature.highlight ? 'bg-amber-100' : 'bg-gray-100'
                          }`}>
                            {feature.icon && <feature.icon size={14} className={
                              feature.highlight ? 'text-amber-600' : 'text-gray-600'
                            } />}
                          </div>
                        )}
                        <span className={`text-[15px] ${
                          feature.highlight ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                        }`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
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
              <p className="text-gray-500 text-sm mb-3 font-medium">Select amount (USD)</p>
              <div className="grid grid-cols-5 gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTopupAmount(amount)}
                    className={`py-3 rounded-xl font-semibold transition-all flex flex-col items-center ${
                      topupAmount === amount
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>${amount}</span>
                    {selectedMethod && selectedMethod.currency_code && selectedMethod.currency_code !== 'USD' && (
                      <span className={`text-xs ${topupAmount === amount ? 'text-white/70' : 'text-gray-500'}`}>
                        {formatLocalAmount(amount, selectedMethod)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <div className="relative">
                  <input
                    type="number"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                    min="1"
                  />
                </div>
                {selectedMethod && selectedMethod.currency_code && selectedMethod.currency_code !== 'USD' && (
                  <p className="text-center text-gray-500 text-sm mt-2">
                    ≈ {formatLocalAmount(topupAmount, selectedMethod)} at rate {getCurrencySymbol(selectedMethod.currency_code)}{selectedMethod.exchange_rate}/$1
                  </p>
                )}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <p className="text-gray-500 text-sm mb-3 font-medium">Select payment method</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedGateway(method.code)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedGateway === method.code
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    {method.icon_url ? (
                      <img 
                        src={method.icon_url} 
                        alt={method.name} 
                        className="h-8 w-auto mx-auto mb-2 object-contain"
                      />
                    ) : (
                      <div className="h-8 w-8 mx-auto mb-2 rounded-lg bg-gray-200 flex items-center justify-center">
                        <CreditCard size={16} className="text-gray-500" />
                      </div>
                    )}
                    <p className="text-gray-900 font-medium text-sm text-center">{method.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Gateway-specific inputs */}
            {selectedMethod && !selectedMethod.is_automatic && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="mb-3">
                  <p className="text-gray-800 font-semibold mb-1">{selectedMethod.name} Payment</p>
                  {selectedMethod.account_number && (
                    <div className="text-gray-600 text-sm">
                      <p className="mb-1">
                        Send{' '}
                        <span className="font-bold text-violet-600 text-lg">
                          {formatLocalAmount(topupAmount, selectedMethod)}
                        </span>
                        {selectedMethod.currency_code && selectedMethod.currency_code !== 'USD' && (
                          <span className="text-gray-400 text-xs ml-1">(≈ ${topupAmount} USD)</span>
                        )}
                        {' '}to:
                      </p>
                      <p className="font-mono font-bold text-gray-900 select-all text-lg">{selectedMethod.account_number}</p>
                      {selectedMethod.account_name && <p className="text-gray-500 text-sm">{selectedMethod.account_name}</p>}
                    </div>
                  )}
                  {selectedMethod.instructions && (
                    <p className="text-gray-600 text-sm mt-2">{selectedMethod.instructions}</p>
                  )}
                  {selectedMethod.qr_image_url && (
                    <div className="mt-3">
                      <img 
                        src={selectedMethod.qr_image_url} 
                        alt={`${selectedMethod.name} QR`} 
                        className="w-32 h-32 object-contain rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={transactionIdInput}
                  onChange={(e) => setTransactionIdInput(e.target.value)}
                  placeholder={`Enter ${selectedMethod.name} Transaction ID`}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
            )}

            {selectedMethod?.is_automatic && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  {selectedMethod.icon_url ? (
                    <img 
                      src={selectedMethod.icon_url} 
                      alt={selectedMethod.name} 
                      className="h-8 w-auto object-contain"
                    />
                  ) : (
                    <CreditCard size={24} className="text-gray-600" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">Secure Payment via {selectedMethod.name}</p>
                    <p className="text-xs text-gray-500">Instant processing</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTopupModal(false);
                  setTransactionIdInput('');
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
                {selectedMethod?.is_automatic 
                  ? `Pay $${topupAmount}` 
                  : `Submit ${formatLocalAmount(topupAmount, selectedMethod)} Request`
                }
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
