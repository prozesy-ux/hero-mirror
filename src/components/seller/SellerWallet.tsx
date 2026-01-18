import { useState, useEffect } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Wallet, 
  ArrowDownCircle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  AlertCircle,
  DollarSign,
  History,
  CreditCard
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  currency_code: string | null;
  exchange_rate: number | null;
  icon_url: string | null;
  is_automatic: boolean;
  account_number: string | null;
  account_name: string | null;
}

type WalletTab = 'wallet' | 'withdrawals';

// Currency helper functions
const getCurrencySymbol = (code: string | null): string => {
  switch (code) {
    case 'BDT': return '৳';
    case 'INR': return '₹';
    case 'PKR': return 'Rs';
    default: return '$';
  }
};

const formatLocalAmount = (usdAmount: number, method: PaymentMethod | undefined): string => {
  if (!method || method.currency_code === 'USD' || !method.currency_code) {
    return `$${usdAmount}`;
  }
  const rate = method.exchange_rate || 1;
  const localAmount = usdAmount * rate;
  const symbol = getCurrencySymbol(method.currency_code);
  return `${symbol}${localAmount.toFixed(0)}`;
};

const SellerWallet = () => {
  const { profile, wallet, withdrawals, refreshWallet, refreshWithdrawals, loading } = useSellerContext();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(10);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [accountDetails, setAccountDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<WalletTab>('wallet');

  const quickAmounts = [5, 10, 25, 50, 100];

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    const { data } = await supabase
      .from('payment_methods')
      .select('id, name, code, currency_code, exchange_rate, icon_url, is_automatic, account_number, account_name')
      .eq('is_enabled', true)
      .order('display_order');
    if (data) setPaymentMethods(data);
  };

  const handleWithdraw = async () => {
    if (!profile || !withdrawAmount || !selectedMethod || !accountDetails.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    const amount = withdrawAmount;
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount < 5) {
      toast.error('Minimum withdrawal amount is $5');
      return;
    }

    if (amount > (wallet?.balance || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    // Check for pending withdrawal
    const pendingWithdrawal = withdrawals.find(w => w.status === 'pending');
    if (pendingWithdrawal) {
      toast.error('You already have a pending withdrawal request');
      return;
    }

    setSubmitting(true);

    try {
      // Create withdrawal request
      const { error: withdrawalError } = await supabase
        .from('seller_withdrawals')
        .insert({
          seller_id: profile.id,
          amount,
          payment_method: selectedMethod,
          account_details: accountDetails.trim(),
          status: 'pending'
        });

      if (withdrawalError) throw withdrawalError;

      // Deduct from available balance
      const newBalance = (wallet?.balance || 0) - amount;
      const { error: walletError } = await supabase
        .from('seller_wallets')
        .update({ balance: newBalance })
        .eq('seller_id', profile.id);

      if (walletError) throw walletError;

      toast.success('Withdrawal request submitted successfully');
      setShowWithdrawDialog(false);
      setWithdrawAmount(10);
      setSelectedMethod('');
      setAccountDetails('');
      refreshWallet();
      refreshWithdrawals();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit withdrawal');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, label: 'Pending', className: 'bg-amber-100 text-amber-700' };
      case 'approved':
        return { icon: CheckCircle, label: 'Approved', className: 'bg-violet-100 text-violet-700' };
      case 'rejected':
        return { icon: XCircle, label: 'Rejected', className: 'bg-red-100 text-red-700' };
      default:
        return { icon: Clock, label: status, className: 'bg-gray-100 text-gray-700' };
    }
  };

  const selectedPaymentMethod = paymentMethods.find(m => m.code === selectedMethod);
  const hasPendingWithdrawal = withdrawals.some(w => w.status === 'pending');

  const tabs = [
    { id: 'wallet' as WalletTab, label: 'Wallet', icon: Wallet },
    { id: 'withdrawals' as WalletTab, label: 'Withdrawals', icon: History },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

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
                onClick={() => setShowWithdrawDialog(true)}
                disabled={!wallet?.balance || wallet.balance < 5 || hasPendingWithdrawal}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/25"
              >
                <ArrowDownCircle size={20} />
                Withdraw Funds
              </button>
            </div>
          </div>

          {hasPendingWithdrawal && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
              <div>
                <p className="text-amber-700 font-medium">Withdrawal Pending</p>
                <p className="text-amber-600/70 text-sm">Please wait for your current withdrawal to be processed.</p>
              </div>
            </div>
          )}

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

      {/* Withdrawals Tab */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight mb-4 flex items-center gap-2">
            <History className="text-gray-500" size={20} />
            Withdrawal History
          </h3>
          
          {withdrawals.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No withdrawals yet</p>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => {
                const statusConfig = getStatusConfig(withdrawal.status);
                return (
                  <div
                    key={withdrawal.id}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-violet-100">
                          <DollarSign size={18} className="text-violet-600" />
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">${Number(withdrawal.amount).toFixed(2)}</p>
                          <p className="text-gray-500 text-sm">
                            {format(new Date(withdrawal.created_at), 'MMM d, yyyy')}
                            <span className="ml-2 text-xs uppercase text-gray-400">
                              via {withdrawal.payment_method}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${statusConfig.className}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                    {withdrawal.admin_notes && (
                      <p className="mt-3 text-sm text-gray-600 bg-gray-100 p-2 rounded-lg">
                        Note: {withdrawal.admin_notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Withdraw Modal - Matching BillingSection TopUp Modal Design */}
      {showWithdrawDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg border border-gray-200 animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
                <Wallet className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">Withdraw Funds</h3>
            </div>

            {/* Quick Amount Buttons */}
            <div className="mb-6">
              <p className="text-gray-500 text-sm mb-3 font-medium">Select amount (USD)</p>
              <div className="grid grid-cols-5 gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setWithdrawAmount(amount)}
                    className={`py-3 rounded-xl font-semibold transition-all flex flex-col items-center ${
                      withdrawAmount === amount
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>${amount}</span>
                    {selectedPaymentMethod && selectedPaymentMethod.currency_code && selectedPaymentMethod.currency_code !== 'USD' && (
                      <span className={`text-xs ${withdrawAmount === amount ? 'text-white/70' : 'text-gray-500'}`}>
                        {formatLocalAmount(amount, selectedPaymentMethod)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  min="5"
                />
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <p className="text-gray-500 text-sm mb-3 font-medium">Select payment method</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.code)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedMethod === method.code
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

            {/* Selected Method Info Section - Matching Buyer Modal Exactly */}
            {selectedPaymentMethod && selectedPaymentMethod.is_automatic && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  {selectedPaymentMethod.icon_url ? (
                    <img 
                      src={selectedPaymentMethod.icon_url} 
                      alt={selectedPaymentMethod.name} 
                      className="h-8 w-auto object-contain"
                    />
                  ) : (
                    <CreditCard size={24} className="text-gray-600" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">Secure Payment via {selectedPaymentMethod.name}</p>
                    <p className="text-xs text-gray-500">Instant processing</p>
                  </div>
                </div>
              </div>
            )}

            {selectedPaymentMethod && !selectedPaymentMethod.is_automatic && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="mb-3">
                  <p className="text-gray-800 font-semibold mb-1">{selectedPaymentMethod.name} Withdrawal</p>
                  <p className="text-gray-600 text-sm">
                    You'll receive{' '}
                    <span className="font-bold text-violet-600 text-lg">
                      {formatLocalAmount(withdrawAmount, selectedPaymentMethod)}
                    </span>
                    {selectedPaymentMethod.currency_code !== 'USD' && (
                      <span className="text-gray-400 text-xs ml-1">(≈ ${withdrawAmount} USD)</span>
                    )}
                  </p>
                </div>
                <input
                  type="text"
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                  placeholder={`Enter your ${selectedPaymentMethod.name} account number/wallet address`}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWithdrawDialog(false);
                  setWithdrawAmount(10);
                  setSelectedMethod('');
                  setAccountDetails('');
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={submitting || !withdrawAmount || withdrawAmount < 5 || withdrawAmount > (wallet?.balance || 0) || !selectedMethod || (!selectedPaymentMethod?.is_automatic && !accountDetails.trim())}
                className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {submitting && <Loader2 className="animate-spin" size={18} />}
                {selectedPaymentMethod?.is_automatic 
                  ? `Withdraw $${withdrawAmount}` 
                  : `Submit ${formatLocalAmount(withdrawAmount, selectedPaymentMethod)} Withdrawal`
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerWallet;
