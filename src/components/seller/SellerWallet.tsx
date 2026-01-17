import { useState, useEffect } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  DollarSign
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
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > (wallet?.balance || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    if (!formData.payment_method || !formData.account_details.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('seller_withdrawals')
        .insert({
          seller_id: profile.id,
          amount,
          payment_method: formData.payment_method,
          account_details: formData.account_details.trim()
        });

      if (error) throw error;

      // Deduct from available balance
      const { error: walletError } = await supabase
        .from('seller_wallets')
        .update({
          balance: (wallet?.balance || 0) - amount
        })
        .eq('seller_id', profile.id);

      if (walletError) throw walletError;

      toast.success('Withdrawal request submitted!');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const selectedMethod = paymentMethods.find(m => m.code === formData.payment_method);
  const convertedAmount = formData.amount && selectedMethod
    ? (parseFloat(formData.amount) * (selectedMethod.exchange_rate || 1)).toFixed(2)
    : null;

  const getCurrencySymbol = (code: string) => {
    switch (code) {
      case 'BDT': return '৳';
      case 'INR': return '₹';
      case 'PKR': return 'Rs';
      default: return '$';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
          <p className="text-muted-foreground">Manage your earnings and withdrawals</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-emerald-500 hover:bg-emerald-600"
              disabled={(wallet?.balance || 0) <= 0}
            >
              <ArrowDownToLine className="h-4 w-4 mr-2" />
              Withdraw
            </Button>
          </DialogTrigger>
          <DialogContent>
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
                  min="0"
                  max={wallet?.balance || 0}
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Available: ${(wallet?.balance || 0).toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select
                  value={formData.payment_method}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                >
                  <SelectTrigger>
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
                <div className="p-3 rounded-lg bg-emerald-500/10 text-sm">
                  <p className="text-emerald-600">
                    You will receive approximately{' '}
                    <strong>
                      {getCurrencySymbol(selectedMethod.currency_code)}
                      {convertedAmount}
                    </strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
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
                  placeholder="Enter your account number, wallet address, or payment details..."
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
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

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Balance
            </CardTitle>
            <div className="rounded-lg p-2 bg-emerald-500/10 text-emerald-500">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${(wallet?.balance || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Balance
            </CardTitle>
            <div className="rounded-lg p-2 bg-yellow-500/10 text-yellow-500">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${(wallet?.pending_balance || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">From pending orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Withdrawn
            </CardTitle>
            <div className="rounded-lg p-2 bg-blue-500/10 text-blue-500">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${withdrawals
                .filter(w => w.status === 'approved')
                .reduce((sum, w) => sum + Number(w.amount), 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
          <CardDescription>Your withdrawal requests</CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No withdrawals yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-accent/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-background flex items-center justify-center">
                      <ArrowDownToLine className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">${Number(withdrawal.amount).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        via {withdrawal.payment_method}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(withdrawal.created_at), 'PPp')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(withdrawal.status)}
                    {withdrawal.admin_notes && (
                      <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">
                        {withdrawal.admin_notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerWallet;
