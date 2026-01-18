import { useState, useEffect } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Wallet, 
  ArrowDownToLine, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  TrendingUp,
  AlertCircle,
  Banknote
} from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  currency_code: string;
  exchange_rate: number;
}

const SellerWallet = () => {
  const { profile, wallet, withdrawals, refreshWallet, refreshWithdrawals, loading } = useSellerContext();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: '',
    account_details: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    const { data } = await supabase
      .from('payment_methods')
      .select('id, name, code, currency_code, exchange_rate')
      .eq('is_enabled', true)
      .order('display_order');
    if (data) setPaymentMethods(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    
    // Validation
    if (!amount || amount <= 0) {
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

    if (!formData.payment_method) {
      toast.error('Please select a payment method');
      return;
    }

    if (!formData.account_details.trim()) {
      toast.error('Please enter your account details');
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
          payment_method: formData.payment_method,
          account_details: formData.account_details.trim(),
          status: 'pending'
        });

      if (withdrawalError) throw withdrawalError;

      // Deduct from available balance
      const newBalance = (wallet?.balance || 0) - amount;
      const { error: walletError } = await supabase
        .from('seller_wallets')
        .update({ balance: newBalance })
        .eq('seller_id', profile.id);

      if (walletError) {
        // Rollback withdrawal if wallet update fails
        throw walletError;
      }

      toast.success('Withdrawal request submitted successfully!');
      setIsDialogOpen(false);
      setFormData({ amount: '', payment_method: '', account_details: '' });
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
        return { icon: Clock, label: 'Pending', className: 'bg-amber-50 text-amber-600 border-amber-200' };
      case 'approved':
        return { icon: CheckCircle, label: 'Approved', className: 'bg-emerald-50 text-emerald-600 border-emerald-200' };
      case 'rejected':
        return { icon: XCircle, label: 'Rejected', className: 'bg-red-50 text-red-600 border-red-200' };
      default:
        return { icon: AlertCircle, label: status, className: 'bg-slate-50 text-slate-600 border-slate-200' };
    }
  };

  const selectedMethod = paymentMethods.find(m => m.code === formData.payment_method);
  const convertedAmount = formData.amount && selectedMethod && selectedMethod.currency_code !== 'USD'
    ? (parseFloat(formData.amount) * (selectedMethod.exchange_rate || 1)).toFixed(2)
    : null;

  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = { BDT: '৳', INR: '₹', PKR: 'Rs', EUR: '€', GBP: '£' };
    return symbols[code] || '$';
  };

  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'approved')
    .reduce((sum, w) => sum + Number(w.amount), 0);

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');

  if (loading) {
    return (
      <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-end mb-6">
        <Button 
          onClick={() => setIsDialogOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 shadow-sm"
          disabled={(wallet?.balance || 0) < 5}
        >
          <ArrowDownToLine className="h-4 w-4 mr-2" />
          Withdraw
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-emerald-600" />
            </div>
            {(wallet?.balance || 0) >= 5 && (
              <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">Ready</span>
            )}
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">${(wallet?.balance || 0).toFixed(2)}</p>
          <p className="text-sm text-slate-500 font-medium">Available Balance</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
        </div>

        <div className="relative bg-white rounded-2xl p-6 border border-slate-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-1">${(wallet?.pending_balance || 0).toFixed(2)}</p>
          <p className="text-sm text-slate-500 font-medium">Pending Balance</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
        </div>

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

      {/* Pending Alert */}
      {pendingWithdrawals.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            You have {pendingWithdrawals.length} pending withdrawal{pendingWithdrawals.length > 1 ? 's' : ''} being processed
          </p>
        </div>
      )}

      {/* Withdrawal History */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Withdrawal History</h2>
        </div>
        
        {withdrawals.length === 0 ? (
          <div className="p-12 text-center">
            <Banknote className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900 mb-2">No withdrawals yet</h3>
            <p className="text-slate-500 text-sm">Your withdrawal history will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {withdrawals.map((withdrawal) => {
              const statusConfig = getStatusConfig(withdrawal.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div key={withdrawal.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <ArrowDownToLine className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">${Number(withdrawal.amount).toFixed(2)}</p>
                    <p className="text-sm text-slate-500">{withdrawal.payment_method}</p>
                    <p className="text-xs text-slate-400">{format(new Date(withdrawal.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={`text-[11px] font-medium ${statusConfig.className}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                    {withdrawal.admin_notes && (
                      <p className="text-xs text-slate-500 mt-2 max-w-[150px] truncate">
                        {withdrawal.admin_notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Withdrawal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Request a withdrawal from your available balance
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="5"
                max={wallet?.balance || 0}
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="border-slate-200"
                required
              />
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Min: $5.00</span>
                <span className="text-slate-500">Available: ${(wallet?.balance || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.code}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMethod && selectedMethod.currency_code !== 'USD' && convertedAmount && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                <p className="text-sm text-emerald-700 font-medium">
                  You'll receive ~{getCurrencySymbol(selectedMethod.currency_code)}{convertedAmount}
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  Rate: 1 USD = {selectedMethod.exchange_rate} {selectedMethod.currency_code}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="account_details">Account Details</Label>
              <Textarea
                id="account_details"
                value={formData.account_details}
                onChange={(e) => setFormData(prev => ({ ...prev, account_details: e.target.value }))}
                placeholder="Enter your account number or payment details..."
                rows={3}
                className="border-slate-200"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 border-slate-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Submit Request'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerWallet;
