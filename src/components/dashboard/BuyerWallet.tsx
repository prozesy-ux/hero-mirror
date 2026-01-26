import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { bffApi, handleUnauthorized } from '@/lib/api-fetch';
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
  TrendingUp,
  CreditCard,
  Plus,
  Trash2,
  Star,
  Building2,
  Smartphone,
  Bitcoin,
  History,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

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
  icon_url?: string;
}

interface SavedAccount {
  id: string;
  user_id: string;
  payment_method_code: string;
  account_name: string;
  account_number: string;
  bank_name: string | null;
  is_primary: boolean;
  is_verified: boolean;
  created_at: string;
  country?: string;
  account_details?: Record<string, unknown> | null;
}

type WalletTab = 'wallet' | 'withdrawals' | 'accounts';

// Country-based payment method configuration
const COUNTRY_PAYMENT_METHODS: Record<string, { name: string; methods: { code: string; label: string }[] }> = {
  IN: {
    name: 'India',
    methods: [
      { code: 'bank', label: 'Bank Transfer' },
      { code: 'upi', label: 'UPI' },
      { code: 'crypto', label: 'Crypto' }
    ]
  },
  BD: {
    name: 'Bangladesh',
    methods: [
      { code: 'bank', label: 'Bank Transfer' },
      { code: 'bkash', label: 'bKash' }
    ]
  },
  DEFAULT: {
    name: 'Other',
    methods: [
      { code: 'bank', label: 'Bank Transfer' },
      { code: 'crypto', label: 'Crypto' }
    ]
  }
};

const maskAccountNumber = (accountNumber: string): string => {
  if (accountNumber.length <= 4) return accountNumber;
  return '•••• ' + accountNumber.slice(-4);
};

const getMethodIcon = (code: string) => {
  switch (code) {
    case 'bank':
      return <Building2 className="w-5 h-5 text-blue-600" />;
    case 'upi':
      return <Smartphone className="w-5 h-5 text-green-600" />;
    case 'bkash':
      return <Wallet className="w-5 h-5 text-pink-600" />;
    case 'crypto':
      return <Bitcoin className="w-5 h-5 text-orange-500" />;
    default:
      return <CreditCard className="w-5 h-5 text-gray-600" />;
  }
};

const getMethodBg = (code: string) => {
  switch (code) {
    case 'bank': return 'bg-blue-50';
    case 'upi': return 'bg-green-50';
    case 'bkash': return 'bg-pink-50';
    case 'crypto': return 'bg-orange-50';
    default: return 'bg-gray-50';
  }
};

const BuyerWallet = () => {
  const { user } = useAuthContext();
  const { formatAmount, formatAmountOnly, selectedCurrency, currencies } = useCurrency();
  const currentRate = currencies.find(c => c.code === selectedCurrency)?.rate || 1;
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [withdrawals, setWithdrawals] = useState<BuyerWithdrawal[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<WalletTab>('wallet');
  const [userCountry, setUserCountry] = useState<string>('BD');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Withdraw dialog state
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(10);
  const [selectedAccountForWithdraw, setSelectedAccountForWithdraw] = useState<string | null>(null);

  // Add account modal state
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [addStep, setAddStep] = useState<1 | 2>(1);

  // OTP verification state
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpValue, setOTPValue] = useState('');
  const [otpSending, setOTPSending] = useState(false);
  const [otpVerifying, setOTPVerifying] = useState(false);
  const [pendingWithdrawalData, setPendingWithdrawalData] = useState<{amount: number; accountId: string} | null>(null);

  const quickAmounts = [5, 10, 25, 50, 100];

  const isBlockingWithdrawalStatus = (status?: string | null) => {
    const s = (status || '').trim().toLowerCase();
    // Treat any “not completed yet” state as blocking to prevent double-withdraw.
    return (
      s === 'pending' ||
      s === 'processing' ||
      s === 'queued' ||
      s === 'in_review' ||
      s === 'awaiting' ||
      s === 'requested'
    );
  };

  const getAvailableMethods = () => {
    const countryConfig = COUNTRY_PAYMENT_METHODS[userCountry] || COUNTRY_PAYMENT_METHODS.DEFAULT;
    return countryConfig.methods;
  };

  // Fetch all data from BFF API
  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await bffApi.getBuyerWallet();

      if (result.isUnauthorized) {
        handleUnauthorized();
        return;
      }

      if (result.error || !result.data) {
        setError(result.error || 'Failed to load wallet data');
        return;
      }

      const { wallet: walletData, withdrawals: withdrawalsData, paymentMethods: methodsData } = result.data;

      setWallet(walletData);
      setWithdrawals(withdrawalsData || []);
      setPaymentMethods(methodsData || []);
      
      // Fetch saved accounts separately
      const { data: accountsData } = await supabase
        .from('buyer_payment_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      setSavedAccounts((accountsData as unknown as SavedAccount[]) || []);
      
      // Fetch profile for 2FA setting
      const { data: profileData } = await supabase
        .from('profiles')
        .select('two_factor_enabled')
        .eq('user_id', user.id)
        .single();
      
      if (profileData?.two_factor_enabled !== undefined) {
        setTwoFactorEnabled(profileData.two_factor_enabled);
      }
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

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

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
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'buyer_payment_accounts',
        filter: `user_id=eq.${user.id}`
      }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  // Account management
  const handleAddAccount = async () => {
    if (!user || !selectedMethod || !accountName.trim() || !accountNumber.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (isPrimary) {
        await supabase
          .from('buyer_payment_accounts')
          .update({ is_primary: false })
          .eq('user_id', user.id)
          .eq('payment_method_code', selectedMethod);
      }

      const accountDetails: Record<string, string> = {};
      if (selectedMethod === 'bank' && ifscCode) {
        accountDetails.ifsc = ifscCode;
      }
      if (selectedMethod === 'crypto' && cryptoNetwork) {
        accountDetails.network = cryptoNetwork;
      }

      const { error } = await supabase
        .from('buyer_payment_accounts')
        .insert({
          user_id: user.id,
          payment_method_code: selectedMethod,
          account_name: accountName.trim(),
          account_number: accountNumber.trim(),
          bank_name: bankName.trim() || null,
          is_primary: isPrimary,
          country: userCountry,
          account_details: accountDetails
        });

      if (error) throw error;

      toast.success('Payment account added successfully');
      setShowAddAccountModal(false);
      resetAddAccountForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const { error } = await supabase
        .from('buyer_payment_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;
      toast.success('Account deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account');
    }
  };

  const handleSetPrimary = async (accountId: string, methodCode: string) => {
    try {
      await supabase
        .from('buyer_payment_accounts')
        .update({ is_primary: false })
        .eq('user_id', user?.id)
        .eq('payment_method_code', methodCode);

      const { error } = await supabase
        .from('buyer_payment_accounts')
        .update({ is_primary: true })
        .eq('id', accountId);

      if (error) throw error;
      toast.success('Primary account updated');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update primary');
    }
  };

  const resetAddAccountForm = () => {
    setSelectedMethod('');
    setAccountName('');
    setAccountNumber('');
    setBankName('');
    setIfscCode('');
    setCryptoNetwork('');
    setIsPrimary(false);
    setAddStep(1);
  };

  // Withdrawal handling with OTP
  const handleWithdraw = async () => {
    if (!user || !withdrawAmount || !selectedAccountForWithdraw) {
      toast.error('Please select an account');
      return;
    }

    const selectedAccount = savedAccounts.find(a => a.id === selectedAccountForWithdraw);
    if (!selectedAccount) {
      toast.error('Invalid account selected');
      return;
    }

    if (withdrawAmount < 5) {
      toast.error('Minimum withdrawal amount is $5');
      return;
    }

    if (withdrawAmount > (wallet?.balance || 0)) {
      toast.error('Insufficient balance');
      return;
    }

    const pendingWithdrawal = withdrawals.find(w => isBlockingWithdrawalStatus(w.status));
    if (pendingWithdrawal) {
      toast.error('You already have a pending withdrawal request');
      return;
    }

    if (twoFactorEnabled) {
      // Send OTP for verification
      setOTPSending(true);

      try {
        const response = await supabase.functions.invoke('send-buyer-withdrawal-otp', {
          body: { 
            amount: withdrawAmount, 
            account_id: selectedAccountForWithdraw 
          }
        });

        if (response.error || !response.data?.success) {
          throw new Error(response.data?.error || 'Failed to send OTP');
        }

        setPendingWithdrawalData({
          amount: withdrawAmount,
          accountId: selectedAccountForWithdraw
        });

        setShowWithdrawDialog(false);
        setShowOTPModal(true);
        toast.success('OTP sent to your email');
      } catch (error: any) {
        toast.error(error.message || 'Failed to send OTP');
      } finally {
        setOTPSending(false);
      }
    } else {
      // 2FA disabled - process withdrawal directly
      setSubmitting(true);
      try {
        const { error } = await supabase
          .from('buyer_withdrawals')
          .insert({
            user_id: user.id,
            amount: withdrawAmount,
            payment_method: selectedAccount.payment_method_code,
            account_details: `${selectedAccount.account_name} - ${selectedAccount.account_number}${selectedAccount.bank_name ? ` (${selectedAccount.bank_name})` : ''}`
          });

        if (error) throw error;

        // Deduct from balance
        const newBalance = (wallet?.balance || 0) - withdrawAmount;
        await supabase
          .from('user_wallets')
          .update({ balance: newBalance })
          .eq('user_id', user.id);

        toast.success('Withdrawal request submitted!');
        setShowWithdrawDialog(false);
        setWithdrawAmount(10);
        setSelectedAccountForWithdraw(null);
        fetchData();
      } catch (error: any) {
        toast.error(error.message || 'Failed to submit withdrawal');
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Verify OTP and complete withdrawal
  const handleVerifyOTP = async () => {
    if (!pendingWithdrawalData || otpValue.length !== 6) return;

    setOTPVerifying(true);

    try {
      const response = await supabase.functions.invoke('verify-buyer-withdrawal-otp', {
        body: { otp_code: otpValue }
      });

      if (response.error || !response.data?.success) {
        throw new Error(response.data?.error || 'Invalid or expired OTP');
      }

      toast.success(`Withdrawal of $${response.data.amount} submitted successfully!`);
      setShowOTPModal(false);
      setOTPValue('');
      setPendingWithdrawalData(null);
      setWithdrawAmount(10);
      setSelectedAccountForWithdraw(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Invalid or expired OTP');
    } finally {
      setOTPVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (!pendingWithdrawalData) return;
    setOTPSending(true);
    setOTPValue('');
    
    try {
      const response = await supabase.functions.invoke('send-buyer-withdrawal-otp', {
        body: { 
          amount: pendingWithdrawalData.amount, 
          account_id: pendingWithdrawalData.accountId 
        }
      });

      if (response.error || !response.data?.success) {
        throw new Error(response.data?.error || 'Failed to resend OTP');
      }
      
      toast.success('New OTP sent to your email');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setOTPSending(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: Clock, label: 'Pending', className: 'bg-amber-100 text-amber-700' };
      case 'approved':
      case 'completed':
        return { icon: CheckCircle, label: status === 'completed' ? 'Completed' : 'Approved', className: 'bg-emerald-100 text-emerald-700' };
      case 'rejected':
        return { icon: XCircle, label: 'Rejected', className: 'bg-red-100 text-red-700' };
      default:
        return { icon: Clock, label: status, className: 'bg-gray-100 text-gray-700' };
    }
  };

  const hasPendingWithdrawal = withdrawals.some(w => isBlockingWithdrawalStatus(w.status));
  const totalWithdrawn = withdrawals.filter(w => w.status === 'completed').reduce((sum, w) => sum + Number(w.amount), 0);
  const pendingAmount = withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + Number(w.amount), 0);

  const tabs = [
    { id: 'wallet' as WalletTab, label: 'Wallet', icon: Wallet },
    { id: 'accounts' as WalletTab, label: 'Accounts', icon: CreditCard },
    { id: 'withdrawals' as WalletTab, label: 'History', icon: History },
  ];

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
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-up px-3 sm:px-0">
      {/* Tab Navigation */}
      <div className="bg-card rounded-xl sm:rounded-2xl p-1 sm:p-1.5 lg:p-2 mb-3 sm:mb-4 lg:mb-8 border border-border shadow-md">
        <div className="flex gap-1 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center gap-1 sm:gap-1.5 lg:gap-2 whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95'
                }`}
              >
                <TabIcon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
                {tab.id === 'accounts' && savedAccounts.length > 0 && (
                  <span className={`text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
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
        <div className="space-y-4 sm:space-y-6">
          {/* Wallet Card */}
          <div className="bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Wallet size={24} className="sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs sm:text-sm font-medium">Available Balance</p>
                  <h3 className="text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
                    {formatAmount(wallet?.balance || 0, true)}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => {
                  // Double-check no pending withdrawal before opening dialog
                  if (hasPendingWithdrawal) {
                    toast.error('You already have a pending withdrawal request');
                    return;
                  }
                  setShowWithdrawDialog(true);
                }}
                disabled={!wallet?.balance || wallet.balance < 5 || hasPendingWithdrawal || savedAccounts.length === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-muted disabled:to-muted disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25"
              >
                <ArrowDownCircle size={20} />
                {hasPendingWithdrawal ? 'Pending...' : 'Withdraw'}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Pending</p>
                  <p className="text-lg font-bold text-foreground">{formatAmountOnly(pendingAmount)}</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Withdrawn</p>
                  <p className="text-lg font-bold text-foreground">{formatAmountOnly(totalWithdrawn)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Exchange Rate Info */}
          {selectedCurrency !== 'USD' && (
            <div className="p-4 bg-muted/50 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">
                Current Rate: <span className="font-semibold text-foreground">1 USD = {currentRate} {selectedCurrency}</span>
              </p>
            </div>
          )}

          {savedAccounts.length === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
              <div className="flex-1">
                <p className="text-amber-700 font-medium">Add Payment Account First</p>
                <p className="text-amber-600/70 text-sm">You need to add at least one payment account before withdrawing.</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setActiveTab('accounts')}
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
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
        </div>
      )}

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedAccounts.map(account => (
              <div 
                key={account.id}
                className="p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all relative"
              >
                {account.is_primary && (
                  <Badge className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[10px]">
                    <Star className="w-3 h-3 mr-0.5" /> Primary
                  </Badge>
                )}
                
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg ${getMethodBg(account.payment_method_code)}`}>
                    {getMethodIcon(account.payment_method_code)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{account.account_name}</p>
                    <p className="text-sm text-muted-foreground font-mono">{maskAccountNumber(account.account_number)}</p>
                    {account.bank_name && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{account.bank_name}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground uppercase">{account.payment_method_code}</span>
                  <div className="flex items-center gap-2">
                    {!account.is_primary && (
                      <button 
                        onClick={() => handleSetPrimary(account.id, account.payment_method_code)}
                        className="text-xs text-primary hover:text-primary/80 font-medium"
                      >
                        Set Primary
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeleteAccount(account.id)}
                      className="text-xs text-destructive hover:text-destructive/80"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add Account Card */}
            <button 
              onClick={() => setShowAddAccountModal(true)}
              className="p-6 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-muted/50 transition-all flex flex-col items-center justify-center gap-2 min-h-[140px]"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Plus className="w-6 h-6 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Add Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Withdrawals Tab */}
      {activeTab === 'withdrawals' && (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Withdrawal History</h2>
            <Button variant="ghost" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
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
                          {getMethodIcon(withdrawal.payment_method)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{formatAmountOnly(withdrawal.amount)}</p>
                          <p className="text-sm text-muted-foreground">
                            {withdrawal.payment_method} • {format(new Date(withdrawal.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig.className}`}>
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
      )}

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="bg-card max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownCircle className="text-emerald-600" size={20} />
              Withdraw Funds
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Quick Amount Selection */}
            <div>
              <Label className="text-foreground mb-2 block">Quick Amount (USD)</Label>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map(amt => (
                  <button
                    key={amt}
                    onClick={() => setWithdrawAmount(amt)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      withdrawAmount === amt
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <Label className="text-foreground mb-2 block">Custom Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="pl-8"
                  min={5}
                  max={wallet?.balance || 0}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Available: {formatAmountOnly(wallet?.balance || 0)}
              </p>
            </div>

            {/* Account Selection */}
            <div>
              <Label className="text-foreground mb-2 block">Withdraw To</Label>
              <Select value={selectedAccountForWithdraw || ''} onValueChange={setSelectedAccountForWithdraw}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {savedAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        {getMethodIcon(account.payment_method_code)}
                        <span>{account.account_name}</span>
                        <span className="text-muted-foreground">{maskAccountNumber(account.account_number)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2FA Notice */}
            {twoFactorEnabled && (
              <div className="p-3 bg-blue-50 rounded-xl flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <p className="text-sm text-blue-700">
                  OTP verification will be sent to your email
                </p>
              </div>
            )}

            <Button
              onClick={handleWithdraw}
              disabled={submitting || otpSending || !withdrawAmount || !selectedAccountForWithdraw}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {otpSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending OTP...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* OTP Verification Modal */}
      <Dialog open={showOTPModal} onOpenChange={setShowOTPModal}>
        <DialogContent className="bg-card max-w-sm text-center">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <DialogTitle>Verify Withdrawal</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Enter the 6-digit code sent to your email
            </p>
          </DialogHeader>

          <div className="py-6">
            <InputOTP
              value={otpValue}
              onChange={setOTPValue}
              maxLength={6}
              className="justify-center"
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <InputOTPSlot key={index} index={index} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <DialogFooter className="flex-col gap-2">
            <Button
              onClick={handleVerifyOTP}
              disabled={otpVerifying || otpValue.length !== 6}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {otpVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify & Withdraw'
              )}
            </Button>
            <button
              onClick={handleResendOTP}
              disabled={otpSending}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {otpSending ? 'Sending...' : "Didn't receive code? Resend"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Account Modal */}
      <Dialog open={showAddAccountModal} onOpenChange={(open) => {
        setShowAddAccountModal(open);
        if (!open) resetAddAccountForm();
      }}>
        <DialogContent className="bg-card max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Account</DialogTitle>
          </DialogHeader>

          {addStep === 1 ? (
            <div className="space-y-4 mt-4">
              <Label>Select Payment Method</Label>
              <div className="grid grid-cols-2 gap-3">
                {getAvailableMethods().map((method) => (
                  <button
                    key={method.code}
                    onClick={() => {
                      setSelectedMethod(method.code);
                      setAddStep(2);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      selectedMethod === method.code
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {getMethodIcon(method.code)}
                    <span className="text-sm font-medium text-foreground">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              <button
                onClick={() => setAddStep(1)}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                ← Back to methods
              </button>

              <div className="space-y-4">
                <div>
                  <Label>Account Name</Label>
                  <Input
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Enter account holder name"
                  />
                </div>

                <div>
                  <Label>Account Number / Address</Label>
                  <Input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={selectedMethod === 'crypto' ? 'Wallet address' : 'Account number'}
                  />
                </div>

                {selectedMethod === 'bank' && (
                  <>
                    <div>
                      <Label>Bank Name</Label>
                      <Input
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Enter bank name"
                      />
                    </div>
                    {userCountry === 'IN' && (
                      <div>
                        <Label>IFSC Code</Label>
                        <Input
                          value={ifscCode}
                          onChange={(e) => setIfscCode(e.target.value)}
                          placeholder="Enter IFSC code"
                        />
                      </div>
                    )}
                  </>
                )}

                {selectedMethod === 'crypto' && (
                  <div>
                    <Label>Network</Label>
                    <Select value={cryptoNetwork} onValueChange={setCryptoNetwork}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="erc20">ERC-20 (Ethereum)</SelectItem>
                        <SelectItem value="trc20">TRC-20 (Tron)</SelectItem>
                        <SelectItem value="bep20">BEP-20 (BSC)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isPrimary"
                    checked={isPrimary}
                    onCheckedChange={(checked) => setIsPrimary(checked as boolean)}
                  />
                  <Label htmlFor="isPrimary" className="text-sm cursor-pointer">
                    Set as primary account
                  </Label>
                </div>
              </div>

              <Button
                onClick={handleAddAccount}
                disabled={submitting || !accountName.trim() || !accountNumber.trim()}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  'Add Account'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuyerWallet;
