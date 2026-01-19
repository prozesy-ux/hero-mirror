import { useState, useEffect, useCallback } from 'react';
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
  CreditCard,
  Plus,
  Trash2,
  Star,
  Building2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

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
  withdrawal_enabled: boolean;
  min_withdrawal: number;
  max_withdrawal: number;
}

interface SavedAccount {
  id: string;
  seller_id: string;
  payment_method_code: string;
  account_name: string;
  account_number: string;
  bank_name: string | null;
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
}

type WalletTab = 'wallet' | 'withdrawals' | 'accounts';

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

const maskAccountNumber = (accountNumber: string): string => {
  if (accountNumber.length <= 4) return accountNumber;
  return '•••• ' + accountNumber.slice(-4);
};

const SellerWallet = () => {
  const { profile, wallet, withdrawals, refreshWallet, refreshWithdrawals, loading } = useSellerContext();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(10);
  const [selectedAccountForWithdraw, setSelectedAccountForWithdraw] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<WalletTab>('wallet');
  
  // Add account form state
  const [newAccountMethod, setNewAccountMethod] = useState('');
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newAccountPrimary, setNewAccountPrimary] = useState(false);

  const quickAmounts = [5, 10, 25, 50, 100];

  useEffect(() => {
    fetchPaymentMethods();
    if (profile?.id) {
      fetchSavedAccounts();
    }
  }, [profile?.id]);

  // Real-time subscription for withdrawals
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('seller-wallet-withdrawals-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seller_withdrawals',
        filter: `seller_id=eq.${profile.id}`
      }, () => {
        refreshWithdrawals();
        refreshWallet();
      })
      .subscribe();

    const accountsChannel = supabase
      .channel('seller-payment-accounts-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'seller_payment_accounts',
        filter: `seller_id=eq.${profile.id}`
      }, () => {
        fetchSavedAccounts();
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
      supabase.removeChannel(accountsChannel);
    };
  }, [profile?.id, refreshWithdrawals, refreshWallet]);

  const fetchPaymentMethods = async () => {
    const { data } = await supabase
      .from('payment_methods')
      .select('id, name, code, currency_code, exchange_rate, icon_url, is_automatic, account_number, account_name, withdrawal_enabled, min_withdrawal, max_withdrawal')
      .eq('is_enabled', true)
      .eq('withdrawal_enabled', true)
      .order('display_order');
    if (data) setPaymentMethods(data as PaymentMethod[]);
  };

  const fetchSavedAccounts = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('seller_payment_accounts')
      .select('*')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });
    if (data) setSavedAccounts(data);
  };

  const handleAddAccount = async () => {
    if (!profile?.id || !newAccountMethod || !newAccountName.trim() || !newAccountNumber.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      // If setting as primary, unset other primary accounts for same method
      if (newAccountPrimary) {
        await supabase
          .from('seller_payment_accounts')
          .update({ is_primary: false })
          .eq('seller_id', profile.id)
          .eq('payment_method_code', newAccountMethod);
      }

      const { error } = await supabase
        .from('seller_payment_accounts')
        .insert({
          seller_id: profile.id,
          payment_method_code: newAccountMethod,
          account_name: newAccountName.trim(),
          account_number: newAccountNumber.trim(),
          bank_name: newBankName.trim() || null,
          is_primary: newAccountPrimary
        });

      if (error) throw error;

      toast.success('Payment account added successfully');
      setShowAddAccountModal(false);
      resetAddAccountForm();
      fetchSavedAccounts();
    } catch (error: any) {
      if (error.message?.includes('duplicate')) {
        toast.error('This account already exists');
      } else {
        toast.error(error.message || 'Failed to add account');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const { error } = await supabase
        .from('seller_payment_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
      toast.success('Account deleted');
      fetchSavedAccounts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account');
    }
  };

  const handleSetPrimary = async (accountId: string, methodCode: string) => {
    try {
      // Unset all primary for this method
      await supabase
        .from('seller_payment_accounts')
        .update({ is_primary: false })
        .eq('seller_id', profile?.id)
        .eq('payment_method_code', methodCode);

      // Set this one as primary
      const { error } = await supabase
        .from('seller_payment_accounts')
        .update({ is_primary: true })
        .eq('id', accountId);

      if (error) throw error;
      toast.success('Primary account updated');
      fetchSavedAccounts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update primary');
    }
  };

  const resetAddAccountForm = () => {
    setNewAccountMethod('');
    setNewAccountName('');
    setNewAccountNumber('');
    setNewBankName('');
    setNewAccountPrimary(false);
  };

  const handleWithdraw = async () => {
    if (!profile || !withdrawAmount || !selectedAccountForWithdraw) {
      toast.error('Please select an account');
      return;
    }

    const selectedAccount = savedAccounts.find(a => a.id === selectedAccountForWithdraw);
    if (!selectedAccount) {
      toast.error('Invalid account selected');
      return;
    }

    const selectedMethod = paymentMethods.find(m => m.code === selectedAccount.payment_method_code);
    const minWithdrawal = selectedMethod?.min_withdrawal || 5;
    const maxWithdrawal = selectedMethod?.max_withdrawal || 1000;

    if (withdrawAmount < minWithdrawal) {
      toast.error(`Minimum withdrawal amount is $${minWithdrawal}`);
      return;
    }

    if (withdrawAmount > maxWithdrawal) {
      toast.error(`Maximum withdrawal amount is $${maxWithdrawal}`);
      return;
    }

    if (withdrawAmount > (wallet?.balance || 0)) {
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
      // Create withdrawal request with account reference
      const { error: withdrawalError } = await supabase
        .from('seller_withdrawals')
        .insert({
          seller_id: profile.id,
          amount: withdrawAmount,
          payment_method: selectedAccount.payment_method_code,
          account_details: `${selectedAccount.account_name} - ${selectedAccount.account_number}${selectedAccount.bank_name ? ` (${selectedAccount.bank_name})` : ''}`,
          payment_account_id: selectedAccount.id,
          status: 'pending'
        });

      if (withdrawalError) throw withdrawalError;

      // Deduct from available balance
      const newBalance = (wallet?.balance || 0) - withdrawAmount;
      const { error: walletError } = await supabase
        .from('seller_wallets')
        .update({ balance: newBalance })
        .eq('seller_id', profile.id);

      if (walletError) throw walletError;

      toast.success('Withdrawal request submitted successfully');
      setShowWithdrawDialog(false);
      setWithdrawAmount(10);
      setSelectedAccountForWithdraw(null);
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

  const hasPendingWithdrawal = withdrawals.some(w => w.status === 'pending');

  const tabs = [
    { id: 'wallet' as WalletTab, label: 'Wallet', icon: Wallet },
    { id: 'accounts' as WalletTab, label: 'Accounts', icon: CreditCard },
    { id: 'withdrawals' as WalletTab, label: 'Withdrawals', icon: History },
  ];

  const getMethodAccounts = (methodCode: string) => savedAccounts.filter(a => a.payment_method_code === methodCode);

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
                {tab.id === 'accounts' && savedAccounts.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'}`}>
                    {savedAccounts.length}
                  </span>
                )}
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
                disabled={!wallet?.balance || wallet.balance < 5 || hasPendingWithdrawal || savedAccounts.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/25"
              >
                <ArrowDownCircle size={20} />
                Withdraw Funds
              </button>
            </div>
          </div>

          {savedAccounts.length === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
              <div>
                <p className="text-amber-700 font-medium">Add Payment Account First</p>
                <p className="text-amber-600/70 text-sm">You need to add at least one payment account before withdrawing.</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setActiveTab('accounts')}
                className="ml-auto border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                Add Account
              </Button>
            </div>
          )}

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
              Available Withdrawal Methods
            </h3>
            {paymentMethods.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No withdrawal methods available. Contact admin.</p>
            ) : (
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
                    <p className="text-gray-500 text-xs">Min: ${method.min_withdrawal}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accounts Tab - Colorful Gradient Design */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          {/* Header - Gradient style matching admin */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
                  <CreditCard size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Payment Accounts</h3>
                  <p className="text-sm text-gray-500">Add accounts for withdrawals</p>
                </div>
              </div>
              <Button 
                onClick={() => setShowAddAccountModal(true)} 
                className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25"
              >
                <Plus className="w-4 h-4" />
                Add Account
              </Button>
            </div>
          </div>

          {/* Payment Method Categories */}
          {paymentMethods.length === 0 ? (
            /* Empty State - Gradient design */
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-12 border border-violet-200 text-center">
              <div className="p-4 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 w-fit mx-auto mb-4">
                <CreditCard className="w-12 h-12 text-violet-500" />
              </div>
              <p className="text-gray-700 font-medium">No withdrawal methods enabled</p>
              <p className="text-gray-500 text-sm mt-1">Contact support for assistance</p>
            </div>
          ) : (
            paymentMethods.map(method => {
              const methodAccounts = getMethodAccounts(method.code);
              return (
                /* Payment Method Category Card - Gradient design */
                <div 
                  key={method.id} 
                  className={`rounded-2xl p-6 border transition-all duration-300 ${
                    methodAccounts.length > 0
                      ? 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200 shadow-lg shadow-violet-100'
                      : 'bg-white border-gray-200 shadow-md hover:shadow-lg'
                  }`}
                >
                  {/* Method Header */}
                  <div className="flex items-center gap-3 mb-4">
                    {method.icon_url ? (
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center p-2 ${
                        methodAccounts.length > 0 
                          ? 'bg-gradient-to-br from-violet-100 to-purple-100' 
                          : 'bg-gray-100'
                      }`}>
                        <img src={method.icon_url} className="h-full w-full object-contain" alt={method.name} />
                      </div>
                    ) : (
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                        methodAccounts.length > 0 
                          ? 'bg-gradient-to-br from-violet-100 to-purple-100' 
                          : 'bg-gray-100'
                      }`}>
                        <CreditCard size={22} className={methodAccounts.length > 0 ? 'text-violet-600' : 'text-gray-500'} />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{method.name}</h4>
                      <p className="text-xs text-gray-500">
                        <span className={methodAccounts.length > 0 ? 'text-violet-600 font-medium' : ''}>
                          {methodAccounts.length} account{methodAccounts.length !== 1 ? 's' : ''}
                        </span>
                        <span className="mx-2">•</span>
                        Min ${method.min_withdrawal} / Max ${method.max_withdrawal}
                      </p>
                    </div>
                    
                    {/* Account count badge - Gradient */}
                    {methodAccounts.length > 0 && (
                      <span className="px-3 py-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold rounded-full shadow-md">
                        {methodAccounts.length} Added
                      </span>
                    )}
                  </div>

                  {/* Account Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {methodAccounts.map(account => (
                      /* Account Card - Gradient hover states */
                      <div 
                        key={account.id}
                        className={`p-4 rounded-xl border-2 transition-all duration-300 relative group ${
                          account.is_primary
                            ? 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-300 shadow-md shadow-violet-100'
                            : 'bg-white border-gray-200 hover:border-violet-200 hover:bg-violet-50/30 hover:shadow-md'
                        }`}
                      >
                        {/* Primary Badge - Gradient */}
                        {account.is_primary && (
                          <div className="absolute -top-2.5 -right-2.5 z-10">
                            <span className="px-2.5 py-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-semibold rounded-full flex items-center gap-1 shadow-lg">
                              <Star className="w-3 h-3" />
                              Primary
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{account.account_name}</p>
                            <p className="text-sm text-violet-600 font-mono">{maskAccountNumber(account.account_number)}</p>
                            {account.bank_name && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <Building2 size={12} className="text-violet-400" />
                                {account.bank_name}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions - Gradient style buttons */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-violet-100">
                          {!account.is_primary && (
                            <button
                              onClick={() => handleSetPrimary(account.id, account.payment_method_code)}
                              className="text-xs text-violet-600 hover:text-white hover:bg-gradient-to-r hover:from-violet-500 hover:to-purple-600 px-3 py-1.5 rounded-full font-medium transition-all border border-violet-200 hover:border-transparent"
                            >
                              Set Primary
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteAccount(account.id)}
                            className="text-xs text-red-500 hover:text-white hover:bg-red-500 px-3 py-1.5 rounded-full font-medium ml-auto flex items-center gap-1 transition-all border border-red-200 hover:border-transparent"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Add Account Card - Gradient dashed border */}
                    <button 
                      onClick={() => {
                        setNewAccountMethod(method.code);
                        setShowAddAccountModal(true);
                      }}
                      className="p-4 rounded-xl border-2 border-dashed border-violet-200 hover:border-violet-400 bg-gradient-to-br from-violet-50/50 to-purple-50/50 hover:from-violet-100 hover:to-purple-100 transition-all duration-300 flex flex-col items-center justify-center gap-2 min-h-[140px] group"
                    >
                      <div className="p-3 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 group-hover:from-violet-200 group-hover:to-purple-200 transition-all">
                        <Plus className="w-6 h-6 text-violet-500 group-hover:text-violet-600" />
                      </div>
                      <span className="text-sm text-violet-600 font-medium">Add Account</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
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

      {/* Withdraw Modal */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                <Wallet className="text-white" size={20} />
              </div>
              Withdraw Funds
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Quick Amount Buttons */}
            <div>
              <Label className="text-gray-500 text-sm mb-3 block">Select amount (USD)</Label>
              <div className="grid grid-cols-5 gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setWithdrawAmount(amount)}
                    className={`py-3 rounded-xl font-semibold transition-all ${
                      withdrawAmount === amount
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Math.max(1, parseInt(e.target.value) || 0))}
                className="mt-3 text-center text-xl font-bold"
                min="5"
              />
            </div>

            {/* Select Saved Account */}
            <div>
              <Label className="text-gray-500 text-sm mb-3 block">Select Account</Label>
              <div className="grid gap-3 max-h-60 overflow-y-auto">
                {savedAccounts.map(account => {
                  const method = paymentMethods.find(m => m.code === account.payment_method_code);
                  return (
                    <button
                      key={account.id}
                      onClick={() => setSelectedAccountForWithdraw(account.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedAccountForWithdraw === account.id 
                          ? 'border-violet-500 bg-violet-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {method?.icon_url ? (
                            <img src={method.icon_url} className="w-8 h-8 object-contain" alt={method.name} />
                          ) : (
                            <CreditCard size={20} className="text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{account.account_name}</p>
                            <p className="text-sm text-gray-500">
                              {method?.name || account.payment_method_code} - {maskAccountNumber(account.account_number)}
                            </p>
                          </div>
                        </div>
                        {account.is_primary && <Badge variant="secondary">Primary</Badge>}
                      </div>
                    </button>
                  );
                })}
              </div>

              {savedAccounts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No accounts added yet</p>
                  <Button 
                    variant="link" 
                    onClick={() => { setShowWithdrawDialog(false); setActiveTab('accounts'); }}
                  >
                    Add an account first
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleWithdraw} 
              disabled={!selectedAccountForWithdraw || submitting || withdrawAmount < 5 || withdrawAmount > (wallet?.balance || 0)}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            >
              {submitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              Withdraw ${withdrawAmount}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Account Modal - Gradient design */}
      <Dialog open={showAddAccountModal} onOpenChange={setShowAddAccountModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/25">
                <CreditCard className="text-white" size={20} />
              </div>
              <span className="text-xl font-bold">Add Payment Account</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Select Payment Method */}
            <div>
              <Label className="text-gray-700 font-medium">Payment Method *</Label>
              <Select value={newAccountMethod} onValueChange={setNewAccountMethod}>
                <SelectTrigger className="mt-1.5 focus:ring-violet-500 focus:border-violet-500">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method.id} value={method.code}>
                      <div className="flex items-center gap-2">
                        {method.icon_url && <img src={method.icon_url} className="w-5 h-5 object-contain" alt={method.name} />}
                        {method.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Account Name */}
            <div>
              <Label className="text-gray-700 font-medium">Account Holder Name *</Label>
              <Input 
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="Enter name as shown on account"
                className="mt-1.5 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            {/* Account Number */}
            <div>
              <Label className="text-gray-700 font-medium">Account Number / Phone / Wallet Address *</Label>
              <Input 
                value={newAccountNumber}
                onChange={(e) => setNewAccountNumber(e.target.value)}
                placeholder="Enter account number or phone"
                className="mt-1.5 focus:ring-violet-500 focus:border-violet-500"
              />
            </div>

            {/* Bank Name (for bank transfers) */}
            {(newAccountMethod === 'bank' || newAccountMethod === 'wire') && (
              <div>
                <Label className="text-gray-700 font-medium">Bank Name</Label>
                <Input 
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  placeholder="Enter bank name"
                  className="mt-1.5 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
            )}

            {/* Primary checkbox with gradient */}
            <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-200">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="primary"
                  checked={newAccountPrimary}
                  onCheckedChange={(checked) => setNewAccountPrimary(checked as boolean)}
                  className="data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                />
                <div>
                  <Label htmlFor="primary" className="text-gray-700 font-medium cursor-pointer">Set as primary account</Label>
                  <p className="text-xs text-gray-500">This will be your default withdrawal account</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => { setShowAddAccountModal(false); resetAddAccountForm(); }} className="border-gray-300">
              Cancel
            </Button>
            <Button 
              onClick={handleAddAccount} 
              disabled={!newAccountMethod || !newAccountName.trim() || !newAccountNumber.trim() || submitting}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/25"
            >
              {submitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              Add Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerWallet;
