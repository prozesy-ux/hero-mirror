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

// Extend window for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

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
  
  // Razorpay script loading state
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    script.onerror = () => console.error('Failed to load Razorpay script');
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

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
          window.location.href = data.url;
        }
      } else if (selectedGateway === 'razorpay') {
        // Razorpay checkout flow
        if (!razorpayLoaded) {
          toast.error('Payment system is loading. Please try again in a moment.');
          setProcessingTopup(false);
          return;
        }

        // Create order on backend
        const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
          body: { amount: topupAmount }
        });
        
        if (error) throw error;
        if (!data?.order_id) throw new Error('Failed to create order');

        // Close the modal before opening Razorpay
        setShowTopupModal(false);

        // Open Razorpay checkout
        const options = {
          key: data.key_id,
          amount: data.amount,
          currency: data.currency,
          name: 'Uptoza',
          description: `Add $${topupAmount} to wallet`,
          order_id: data.order_id,
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            // Verify payment on backend
            try {
              toast.info('Verifying payment...');
              const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  amount: topupAmount
                }
              });
              
              if (verifyError) {
                console.error('Verification error:', verifyError);
                toast.error('Payment verification failed. Please contact support.');
              } else if (verifyData?.success) {
                toast.success(`$${topupAmount} added to your wallet!`);
                fetchData();
              }
            } catch (verifyErr) {
              console.error('Verification exception:', verifyErr);
              toast.error('Payment verification failed. Please contact support if funds are missing.');
            }
            setProcessingTopup(false);
          },
          prefill: {
            email: user.email
          },
          theme: {
            color: '#7c3aed' // Violet color matching the UI
          },
          modal: {
            ondismiss: () => {
              setProcessingTopup(false);
              toast.info('Payment cancelled');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', async (response: any) => {
          console.error('Razorpay payment failed:', response.error);
          
          // Record failed transaction in database
          try {
            await supabase.from('wallet_transactions').insert({
              user_id: user.id,
              type: 'topup',
              amount: topupAmount,
              payment_gateway: 'razorpay',
              status: 'rejected',
              transaction_id: response.error?.metadata?.order_id || null,
              description: `Failed: ${response.error?.description || 'Payment failed'}`
            });
            fetchData(); // Refresh to show failed transaction
          } catch (err) {
            console.error('Failed to record rejected payment:', err);
          }
          
          toast.error(response.error?.description || 'Payment failed. Please try again.');
          setProcessingTopup(false);
        });
        rzp.open();
        return; // Don't set processingTopup to false yet - handled in callbacks
        
      } else {
        // Manual payment flow (bKash/UPI/etc)
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
      console.error('Topup error:', error);
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
    
    // Check balance first (UI feedback)
    if ((wallet?.balance || 0) < 19) {
      toast.error('Insufficient balance. Please top up your wallet first.');
      return;
    }
    
    setProcessingPayment(true);

    try {
      // Call atomic RPC function - handles wallet deduction, transaction record, and profile update
      const { data, error } = await supabase.rpc('purchase_pro_plan', {
        p_user_id: user.id,
        p_amount: 19.00
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; new_balance?: number };

      if (!result.success) {
        toast.error(result.error || 'Failed to process payment');
        setProcessingPayment(false);
        return;
      }

      toast.success('Welcome to Pro! All prompts are now unlocked!');
      fetchData(); // Refresh wallet balance and transactions
      window.location.reload();
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast.error(error.message || 'Failed to upgrade to Pro');
    } finally {
      setProcessingPayment(false);
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
    { id: 'wallet' as BillingTab, label: 'Wallet', shortLabel: 'Wallet', icon: Wallet },
    { id: 'transactions' as BillingTab, label: 'Transactions', shortLabel: 'Txns', icon: History },
    { id: 'plan' as BillingTab, label: 'Plan', shortLabel: 'Plan', icon: Crown },
    { id: 'purchases' as BillingTab, label: 'Purchases', shortLabel: 'Buy', icon: ShoppingBag },
  ];

  // Removed blocking loading overlay - now using toast notifications instead

  return (
    <div className="max-w-4xl mx-auto animate-fade-up">
      {/* Tab Navigation - Gumroad Style */}
      <div className="bg-white border rounded p-2 mb-8">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 rounded font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-[#FF90E8] text-black border border-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <TabIcon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Wallet Tab */}
      {activeTab === 'wallet' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Wallet Card - Gumroad Style */}
          <div className="bg-white border rounded p-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div>
                <p className="text-base text-slate-700 mb-2">Wallet Balance</p>
                <h3 className="text-4xl font-semibold text-slate-900">
                  ${(wallet?.balance || 0).toFixed(2)}
                </h3>
              </div>
              <button
                onClick={() => setShowTopupModal(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#FF90E8] text-black font-semibold rounded border border-black transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <Plus size={18} />
                Add Funds
              </button>
            </div>
          </div>

          {/* Payment Methods - Gumroad Style */}
          <div className="bg-white border rounded p-8">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">
              Available Payment Methods
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {paymentMethods.map((method) => (
                <div 
                  key={method.id}
                  className="p-4 bg-white border rounded text-center transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-default"
                >
                  {method.icon_url ? (
                    <img 
                      src={method.icon_url} 
                      alt={method.name} 
                      className="h-8 w-auto mx-auto mb-2 object-contain"
                    />
                  ) : (
                    <div className="h-8 w-8 mx-auto mb-2 rounded bg-slate-100 flex items-center justify-center">
                      <CreditCard size={16} className="text-slate-500" />
                    </div>
                  )}
                  <p className="text-slate-900 font-medium text-sm">{method.name}</p>
                  <p className="text-slate-600 text-xs">{method.is_automatic ? 'Automatic' : 'Manual'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab - Gumroad Style */}
      {activeTab === 'transactions' && (
        <div className="bg-white border rounded p-8">
          <h3 className="text-xl font-semibold text-slate-900 mb-6">
            Transaction History
          </h3>
          
          {transactions.length === 0 ? (
            <p className="text-slate-600 text-center py-12">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 bg-white border rounded transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-900 font-medium text-sm capitalize truncate">{tx.description || tx.type}</p>
                      <p className="text-slate-600 text-xs">
                        {new Date(tx.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {tx.payment_gateway && (
                          <span className="ml-1.5 uppercase text-slate-400">
                            via {tx.payment_gateway}
                          </span>
                        )}
                      </p>
                    </div>
                    {/* Amount + Status */}
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <p className={`font-semibold text-base ${tx.type === 'topup' ? 'text-emerald-600' : tx.type === 'refund' ? 'text-blue-600' : 'text-slate-700'}`}>
                        {tx.type === 'topup' ? '+' : tx.type === 'refund' ? '+' : '-'}${tx.amount.toFixed(2)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded font-medium border ${
                        tx.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        tx.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Transaction ID section for manual payments */}
                  {tx.payment_gateway && tx.payment_gateway !== 'stripe' && tx.status === 'pending' && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      {editingTransactionId === tx.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editTransactionIdValue}
                            onChange={(e) => setEditTransactionIdValue(e.target.value)}
                            placeholder="Enter correct transaction ID"
                            className="flex-1 bg-white border border-black rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF90E8]/50"
                          />
                          <button
                            onClick={() => handleUpdateTransactionId(tx.id)}
                            className="px-3 py-2 bg-[#FF90E8] text-black rounded text-sm border border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingTransactionId(null);
                              setEditTransactionIdValue('');
                            }}
                            className="px-3 py-2 bg-white text-black rounded text-sm border border-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">Transaction ID:</span>{' '}
                            <span className="font-mono">{tx.transaction_id || 'Not provided'}</span>
                          </p>
                          <button
                            onClick={() => {
                              setEditingTransactionId(tx.id);
                              setEditTransactionIdValue(tx.transaction_id || '');
                            }}
                            className="text-xs text-[#FF90E8] hover:underline font-medium"
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

      {/* Plan Tab - Gumroad Style */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="bg-white border rounded p-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-1">
                  {isPro ? 'Pro Plan' : 'Free Plan'}
                </h3>
                <p className="text-slate-600">
                  {isPro ? 'Lifetime access to all prompts' : 'Limited access to free prompts only'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {isPro && (
                  <>
                    <span className="px-4 py-2 bg-emerald-50 text-emerald-700 font-semibold rounded border border-emerald-200 flex items-center gap-2">
                      <Check size={16} />
                      Active
                    </span>
                    {!hasPendingCancellation && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="px-4 py-2 bg-white text-slate-700 rounded border border-black transition-all text-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      >
                        Cancel Plan
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {hasPendingCancellation && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded flex items-center gap-3">
                <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                <div>
                  <p className="text-amber-700 font-medium">Cancellation Pending</p>
                  <p className="text-amber-600/70 text-sm">Your cancellation request is being processed.</p>
                </div>
              </div>
            )}
          </div>

          {/* Upgrade Card (if not Pro) - Gumroad Style */}
          {!isPro && (
            <div className="bg-white border rounded overflow-hidden">
              {/* Clean header with PRO badge */}
              <div className="px-8 pt-8 pb-6 border-b border-slate-200">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded text-sm font-semibold mb-4 border border-amber-200">
                  <Crown size={14} />
                  PRO
                </div>
                <h3 className="text-2xl font-semibold text-slate-900">
                  Upgrade to Pro
                </h3>
                <p className="text-slate-600 mt-1">
                  Unlock 10,000+ premium AI prompts, forever.
                </p>
              </div>

              {/* Two-column layout */}
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                {/* Pricing Column */}
                <div className="p-8">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-slate-400 line-through text-lg font-medium">$499</span>
                    <span className="text-4xl font-semibold text-slate-900">$19</span>
                  </div>
                  <p className="text-slate-600 text-sm mb-4">one-time payment</p>
                  
                  {/* Wallet Balance Indicator */}
                  <div className={`flex items-center justify-between p-3 rounded border mb-4 ${
                    (wallet?.balance || 0) >= 19 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Wallet size={16} className={(wallet?.balance || 0) >= 19 ? 'text-emerald-600' : 'text-amber-600'} />
                      <span className="text-sm font-medium text-slate-700">Your Balance</span>
                    </div>
                    <span className={`font-semibold ${
                      (wallet?.balance || 0) >= 19 ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      ${(wallet?.balance || 0).toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Low Balance Warning */}
                  {(wallet?.balance || 0) < 19 && (
                    <p className="text-amber-600 text-xs mb-3 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Add ${(19 - (wallet?.balance || 0)).toFixed(2)} more to upgrade
                    </p>
                  )}
                  
                  <button
                    onClick={handleUpgrade}
                    disabled={processingPayment}
                    className="w-full bg-[#FF90E8] text-black font-semibold py-3.5 px-6 rounded border border-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Processing...
                      </>
                    ) : (
                      <>
                        Upgrade Now
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                  
                  <div className="flex items-center gap-2 mt-4 text-sm text-slate-600">
                    <Shield size={14} className="text-slate-400" />
                    <span>30-day money-back guarantee</span>
                  </div>
                </div>

                {/* Features Column */}
                <div className="p-8">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    What's included
                  </p>
                  <div className="space-y-3">
                    {proFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        {'logo' in feature && feature.logo ? (
                          <img 
                            src={feature.logo} 
                            alt={feature.logoAlt} 
                            className="w-6 h-6 rounded object-cover"
                          />
                        ) : (
                          <div className={`w-6 h-6 rounded flex items-center justify-center ${
                            feature.highlight ? 'bg-amber-100' : 'bg-slate-100'
                          }`}>
                            {feature.icon && <feature.icon size={14} className={
                              feature.highlight ? 'text-amber-600' : 'text-slate-600'
                            } />}
                          </div>
                        )}
                        <span className={`text-[15px] ${
                          feature.highlight ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
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

      {/* Purchases Tab - Gumroad Style */}
      {activeTab === 'purchases' && (
        <div className="bg-white border rounded p-8">
          <h3 className="text-xl font-semibold text-slate-900 mb-6">
            Purchase History
          </h3>
          
          {purchases.length === 0 ? (
            <p className="text-slate-600 text-center py-12">No purchases yet</p>
          ) : (
            <div className="space-y-3">
              {purchases.map((purchase) => {
                const refundStatus = refundRequests.find(r => r.amount === purchase.amount);
                const canRequestRefund = purchase.payment_status === 'completed' && !refundStatus;

                return (
                  <div
                    key={purchase.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white border rounded gap-3 transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {/* Product Info */}
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-900 font-semibold text-base truncate">Pro Plan - Lifetime Access</p>
                      <p className="text-slate-600 text-sm">
                        {new Date(purchase.purchased_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>
                    {/* Price & Status */}
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="text-left sm:text-right">
                        <p className="text-slate-900 font-semibold text-lg">${purchase.amount.toFixed(2)}</p>
                        <span className={`text-xs px-2 py-1 rounded font-medium inline-block border ${
                          purchase.payment_status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {purchase.payment_status}
                        </span>
                      </div>
                      {refundStatus ? (
                        <span className={`text-xs px-3 py-1.5 rounded font-medium whitespace-nowrap border ${
                          refundStatus.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : refundStatus.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          Refund {refundStatus.status}
                        </span>
                      ) : canRequestRefund && (
                        <button
                          onClick={() => setShowRefundModal(purchase.id)}
                          className="flex items-center gap-1.5 text-sm text-black px-3 py-1.5 bg-white rounded border border-black transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        >
                          <RotateCcw size={14} />
                          Refund
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

      {/* Topup Modal - Gumroad Style */}
      {showTopupModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg border border-black animate-scale-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-slate-900 mb-6">Add Funds to Wallet</h3>

            {/* Quick Amount Buttons */}
            <div className="mb-6">
              <p className="text-slate-700 text-sm mb-3 font-medium">Select amount (USD)</p>
              <div className="grid grid-cols-5 gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setTopupAmount(amount)}
                    className={`py-3 rounded font-semibold transition-all flex flex-col items-center border ${
                      topupAmount === amount
                        ? 'bg-[#FF90E8] text-black border-black'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-black'
                    }`}
                  >
                    <span>${amount}</span>
                    {selectedMethod && selectedMethod.currency_code && selectedMethod.currency_code !== 'USD' && (
                      <span className={`text-xs ${topupAmount === amount ? 'text-black/70' : 'text-slate-500'}`}>
                        {formatLocalAmount(amount, selectedMethod)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-white border border-black rounded px-4 py-3 text-slate-900 text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF90E8]/50"
                  min="1"
                />
                {selectedMethod && selectedMethod.currency_code && selectedMethod.currency_code !== 'USD' && (
                  <p className="text-center text-slate-600 text-sm mt-2">
                    ≈ {formatLocalAmount(topupAmount, selectedMethod)} at rate {getCurrencySymbol(selectedMethod.currency_code)}{selectedMethod.exchange_rate}/$1
                  </p>
                )}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <p className="text-slate-700 text-sm mb-3 font-medium">Select payment method</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedGateway(method.code)}
                    className={`p-4 rounded border-2 transition-all ${
                      selectedGateway === method.code
                        ? 'border-black bg-[#FF90E8]/10'
                        : 'border-slate-200 bg-white hover:border-black'
                    }`}
                  >
                    {method.icon_url ? (
                      <img 
                        src={method.icon_url} 
                        alt={method.name} 
                        className="h-8 w-auto mx-auto mb-2 object-contain"
                      />
                    ) : (
                      <div className="h-8 w-8 mx-auto mb-2 rounded bg-slate-100 flex items-center justify-center">
                        <CreditCard size={16} className="text-slate-500" />
                      </div>
                    )}
                    <p className="text-slate-900 font-medium text-sm text-center">{method.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Gateway-specific inputs */}
            {selectedMethod && !selectedMethod.is_automatic && (
              <div className="mb-6 p-4 bg-slate-50 rounded border border-slate-200">
                <div className="mb-3">
                  <p className="text-slate-800 font-semibold mb-1">{selectedMethod.name} Payment</p>
                  {selectedMethod.account_number && (
                    <div className="text-slate-600 text-sm">
                      <p className="mb-1">
                        Send{' '}
                        <span className="font-semibold text-[#FF90E8] text-lg">
                          {formatLocalAmount(topupAmount, selectedMethod)}
                        </span>
                        {selectedMethod.currency_code && selectedMethod.currency_code !== 'USD' && (
                          <span className="text-slate-400 text-xs ml-1">(≈ ${topupAmount} USD)</span>
                        )}
                        {' '}to:
                      </p>
                      <p className="font-mono font-semibold text-slate-900 select-all text-lg">{selectedMethod.account_number}</p>
                      {selectedMethod.account_name && <p className="text-slate-500 text-sm">{selectedMethod.account_name}</p>}
                    </div>
                  )}
                  {selectedMethod.instructions && (
                    <p className="text-slate-600 text-sm mt-2">{selectedMethod.instructions}</p>
                  )}
                  {selectedMethod.qr_image_url && (
                    <div className="mt-3">
                      <img 
                        src={selectedMethod.qr_image_url} 
                        alt={`${selectedMethod.name} QR`} 
                        className="w-32 h-32 object-contain rounded border border-slate-200"
                      />
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={transactionIdInput}
                  onChange={(e) => setTransactionIdInput(e.target.value)}
                  placeholder={`Enter ${selectedMethod.name} Transaction ID`}
                  className="w-full bg-white border border-black rounded px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF90E8]/50"
                />
              </div>
            )}

            {selectedMethod?.is_automatic && (
              <div className="mb-6 p-4 bg-slate-50 rounded border border-slate-200">
                <div className="flex items-center gap-3">
                  {selectedMethod.icon_url ? (
                    <img 
                      src={selectedMethod.icon_url} 
                      alt={selectedMethod.name} 
                      className="h-8 w-auto object-contain"
                    />
                  ) : (
                    <CreditCard size={24} className="text-slate-600" />
                  )}
                  <div>
                    <p className="font-medium text-slate-900">Secure Payment via {selectedMethod.name}</p>
                    <p className="text-xs text-slate-500">Instant processing</p>
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
                className="flex-1 bg-white text-black py-3 rounded border border-black transition-all font-medium hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Cancel
              </button>
              <button
                onClick={handleTopup}
                disabled={processingTopup}
                className="flex-1 bg-[#FF90E8] text-black py-3 rounded border border-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
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
