import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { bffApi, handleUnauthorized } from '@/lib/api-fetch';
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
  min_withdrawal?: number;
  max_withdrawal?: number;
}

const BuyerWallet = () => {
  const { user } = useAuthContext();
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [withdrawals, setWithdrawals] = useState<BuyerWithdrawal[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  
  // Form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [accountDetails, setAccountDetails] = useState('');

  // Fetch all data from BFF API (server-side validated)
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await bffApi.getBuyerWallet();

      if (result.isUnauthorized) {
        console.log('[BuyerWallet] Unauthorized - redirecting to signin');
        handleUnauthorized();
        return;
      }

      if (result.error || !result.data) {
        console.error('[BuyerWallet] BFF fetch failed:', result.error);
        setError(result.error || 'Failed to load wallet data');
        return;
      }

      const { wallet: walletData, withdrawals: withdrawalsData, paymentMethods: methodsData } = result.data;

      setWallet(walletData);
      setWithdrawals(withdrawalsData || []);
      setPaymentMethods(methodsData || []);

      console.log('[BuyerWallet] Data loaded from BFF at:', result.data._meta?.fetchedAt);
    } catch (err) {
      console.error('[BuyerWallet] Unexpected error:', err);
      setError('Unexpected error loading wallet');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Real-time subscriptions for instant updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('buyer-wallet-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_wallets',
        filter: `user_id=eq.${user.id}`
      }, () => {
        console.log('[BuyerWallet] Realtime: wallet changed');
        fetchData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'buyer_withdrawals',
        filter: `user_id=eq.${user.id}`
      }, () => {
        console.log('[BuyerWallet] Realtime: withdrawals changed');
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

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

    try {
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
        return;
      }

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
    } catch (err) {
      toast.error('Unexpected error submitting withdrawal');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
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
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-muted-foreground">{error}</p>
        <button 
          onClick={fetchData}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Wallet</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your balance and withdrawals</p>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Balance */}
        <div className="relative bg-card rounded-2xl p-6 border border-border shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">${(wallet?.balance || 0).toFixed(2)}</p>
          <p className="text-sm text-muted-foreground font-medium">Available Balance</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
        </div>

        {/* Pending Withdrawals */}
        <div className="relative bg-card rounded-2xl p-6 border border-border shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">${pendingAmount.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground font-medium">Pending Withdrawal</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
        </div>

        {/* Total Withdrawn */}
        <div className="relative bg-card rounded-2xl p-6 border border-border shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground mb-1">${totalWithdrawn.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground font-medium">Total Withdrawn</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
        </div>
      </div>

      {/* Withdraw Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowWithdrawDialog(true)}
          disabled={!wallet?.balance || wallet.balance <= 0 || hasPendingWithdrawal}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-muted disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
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
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Withdrawal History</h2>
        </div>
        
        {withdrawals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <ArrowDownCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No withdrawals yet</p>
            <p className="text-muted-foreground/70 text-sm mt-1">Your withdrawal history will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {withdrawals.map((withdrawal) => {
              const statusConfig = getStatusConfig(withdrawal.status);
              const StatusIcon = statusConfig.icon;
              return (
                <div key={withdrawal.id} className="px-6 py-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">${Number(withdrawal.amount).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
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
                    <p className="mt-2 text-sm text-muted-foreground bg-muted p-2 rounded-lg">
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
        <DialogContent className="bg-card max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Enter the amount and select your payment method
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleWithdraw} className="space-y-4 mt-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="1"
                  max={wallet?.balance || 0}
                  className="w-full pl-8 pr-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-background"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available: ${(wallet?.balance || 0).toFixed(2)}
              </p>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
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
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Account Details
              </label>
              <textarea
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
                placeholder="Enter your account number, wallet address, or payment details..."
                rows={3}
                className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none bg-background"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || !withdrawAmount || !selectedMethod || !accountDetails}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-muted text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
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
