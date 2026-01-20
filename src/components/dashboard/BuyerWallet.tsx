import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Wallet, 
  ArrowDownCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  DollarSign,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

interface BuyerWithdrawal {
  id: string;
  amount: number;
  payment_method: string;
  account_details: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
}

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  currency_code: string;
  exchange_rate: number;
}

const BuyerWallet = () => {
  const { user } = useAuthContext();
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [withdrawals, setWithdrawals] = useState<BuyerWithdrawal[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  
  // Form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [accountDetails, setAccountDetails] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
      fetchPaymentMethods();
      const unsubscribe = subscribeToUpdates();
      return () => unsubscribe();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch wallet
    const { data: walletData, error: walletError } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (walletError && walletError.code === 'PGRST116') {
      // Create wallet if not exists
      await supabase.from('user_wallets').insert({ user_id: user.id, balance: 0 });
      setWallet({ balance: 0 });
    } else if (walletData) {
      setWallet(walletData);
    }

    // Fetch withdrawals
    const { data: withdrawalsData } = await supabase
      .from('buyer_withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (withdrawalsData) {
      setWithdrawals(withdrawalsData);
    }

    setLoading(false);
  };

  const fetchPaymentMethods = async () => {
    // Use secure view that excludes api_key and api_secret
    const { data } = await supabase
      .from('payment_methods_public')
      .select('*')
      .order('name');

    if (data) {
      setPaymentMethods(data);
    }
  };

  const subscribeToUpdates = () => {
    if (!user) return () => {};

    const channel = supabase
      .channel('buyer-wallet-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_wallets',
        filter: `user_id=eq.${user.id}`
      }, () => fetchData())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'buyer_withdrawals',
        filter: `user_id=eq.${user.id}`
      }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !withdrawAmount || !selectedMethod || !accountDetails) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
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

    // Create withdrawal request
    const { error: withdrawError } = await supabase
      .from('buyer_withdrawals')
      .insert({
        user_id: user.id,
        amount,
        payment_method: selectedMethod,
        account_details: accountDetails.trim()
      });

    if (withdrawError) {
      toast.error('Failed to submit withdrawal request');
      console.error(withdrawError);
    } else {
      // Deduct from wallet
      const newBalance = (wallet?.balance || 0) - amount;
      await supabase
        .from('user_wallets')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      toast.success('Withdrawal request submitted successfully');
      setShowWithdrawDialog(false);
      setWithdrawAmount('');
      setSelectedMethod('');
      setAccountDetails('');
      fetchData();
    }

    setSubmitting(false);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, label: 'Pending', className: 'bg-amber-50 text-amber-600 border-amber-200' };
      case 'approved':
        return { icon: CheckCircle, label: 'Approved', className: 'bg-blue-50 text-blue-600 border-blue-200' };
      case 'completed':
        return { icon: CheckCircle, label: 'Completed', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
      case 'rejected':
        return { icon: XCircle, label: 'Rejected', className: 'bg-red-50 text-red-600 border-red-200' };
      default:
        return { icon: Clock, label: status, className: 'bg-gray-50 text-gray-600 border-gray-200' };
    }
  };

  const selectedPaymentMethod = paymentMethods.find(m => m.code === selectedMethod);
  const convertedAmount = selectedPaymentMethod && withdrawAmount
    ? (parseFloat(withdrawAmount) * selectedPaymentMethod.exchange_rate).toFixed(2)
    : null;

  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + Number(w.amount), 0);

  const pendingAmount = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + Number(w.amount), 0);

  const hasPendingWithdrawal = withdrawals.some(w => w.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your balance and withdrawals</p>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Balance */}
        <div className="relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">${(wallet?.balance || 0).toFixed(2)}</p>
          <p className="text-sm text-slate-500 font-medium">Available Balance</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
        </div>

        {/* Pending Withdrawals */}
        <div className="relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">${pendingAmount.toFixed(2)}</p>
          <p className="text-sm text-slate-500 font-medium">Pending Withdrawal</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
        </div>

        {/* Total Withdrawn */}
        <div className="relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">${totalWithdrawn.toFixed(2)}</p>
          <p className="text-sm text-slate-500 font-medium">Total Withdrawn</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
        </div>
      </div>

      {/* Withdraw Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowWithdrawDialog(true)}
          disabled={!wallet?.balance || wallet.balance <= 0 || hasPendingWithdrawal}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
        >
          <ArrowDownCircle size={18} />
          Withdraw Funds
        </button>
      </div>

      {hasPendingWithdrawal && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
          <p className="text-amber-700 text-sm">
            You have a pending withdrawal request. Please wait for it to be processed before submitting a new one.
          </p>
        </div>
      )}

      {/* Withdrawal History */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Withdrawal History</h2>
        </div>
        
        {withdrawals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <ArrowDownCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No withdrawals yet</p>
            <p className="text-gray-400 text-sm mt-1">Your withdrawal history will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {withdrawals.map((withdrawal) => {
              const statusConfig = getStatusConfig(withdrawal.status);
              const StatusIcon = statusConfig.icon;
              return (
                <div key={withdrawal.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">${Number(withdrawal.amount).toFixed(2)}</p>
                        <p className="text-sm text-slate-500">
                          {withdrawal.payment_method} • {format(new Date(withdrawal.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${statusConfig.className}`}>
                      <StatusIcon size={12} />
                      {statusConfig.label}
                    </div>
                  </div>
                  {withdrawal.admin_notes && (
                    <p className="mt-2 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg">
                      Note: {withdrawal.admin_notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Enter the amount and select your payment method
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleWithdraw} className="space-y-4 mt-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="1"
                  max={wallet?.balance || 0}
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Available: ${(wallet?.balance || 0).toFixed(2)}
              </p>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Payment Method
              </label>
              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.code}>
                      {method.name} ({method.currency_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Converted Amount Display */}
            {convertedAmount && selectedPaymentMethod && (
              <div className="p-3 bg-emerald-50 rounded-xl">
                <p className="text-sm text-emerald-700">
                  You will receive: <span className="font-bold">{selectedPaymentMethod.currency_code} {convertedAmount}</span>
                </p>
              </div>
            )}

            {/* Account Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Account Details
              </label>
              <textarea
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
                placeholder="Enter your account number, wallet address, or payment details..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !withdrawAmount || !selectedMethod || !accountDetails}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <ArrowDownCircle size={18} />
                  Submit Withdrawal
                </>
              )}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuyerWallet;
