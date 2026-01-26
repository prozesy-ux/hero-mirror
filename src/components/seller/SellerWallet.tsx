import { useState, useEffect, useCallback } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { useCurrency } from '@/contexts/CurrencyContext';
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
  Building2,
  Smartphone,
  Bitcoin,
  Mail,
  RefreshCw,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { 
  ACCOUNT_TYPES, 
  getDigitalWalletsForCountry, 
  getWalletByCode, 
  isDigitalWalletCode,
  getCountryName,
  getSortedCountries,
  getBanksForCountry,
  getBankByCode,
  isBankCode,
  type AccountType,
  type DigitalWallet,
  type Bank,
  type AddAccountStep
} from '@/lib/digital-wallets-config';
import { Globe } from 'lucide-react';

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
  country?: string;
  account_details?: Record<string, unknown> | null;
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

const getMethodIcon = (code: string) => {
  // Check if it's a digital wallet first
  if (isDigitalWalletCode(code)) {
    return <Smartphone className="w-5 h-5 text-violet-600" />;
  }
  switch (code) {
    case 'bank':
      return <Building2 className="w-5 h-5 text-blue-600" />;
    case 'crypto':
      return <Bitcoin className="w-5 h-5 text-orange-500" />;
    default:
      return <CreditCard className="w-5 h-5 text-gray-600" />;
  }
};

const getMethodBg = (code: string) => {
  // Check if it's a digital wallet
  const wallet = getWalletByCode(code);
  if (wallet) return wallet.bgColor;
  
  switch (code) {
    case 'bank': return 'bg-blue-50';
    case 'crypto': return 'bg-orange-50';
    default: return 'bg-gray-50';
  }
};

const SellerWallet = () => {
  const { profile, wallet, withdrawals, refreshWallet, refreshWithdrawals, loading } = useSellerContext();
  const { formatAmountOnly, formatAmount } = useCurrency();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(10);
  const [selectedAccountForWithdraw, setSelectedAccountForWithdraw] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<WalletTab>('wallet');
  const [sellerCountry, setSellerCountry] = useState<string>('BD');
  
  // Add account form state - NEW 4-tier system
  const [addAccountStep, setAddAccountStep] = useState<AddAccountStep>('country');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType | null>(null);
  const [selectedDigitalWallet, setSelectedDigitalWallet] = useState<DigitalWallet | null>(null);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [cryptoNetwork, setCryptoNetwork] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  
  // OTP verification state
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpValue, setOTPValue] = useState('');
  const [otpSending, setOTPSending] = useState(false);
  const [otpVerifying, setOTPVerifying] = useState(false);
  const [pendingWithdrawalData, setPendingWithdrawalData] = useState<{amount: number; accountId: string} | null>(null);
  const [otpExpiry, setOTPExpiry] = useState<Date | null>(null);

  const quickAmounts = [5, 10, 25, 50, 100];

  const getAvailableDigitalWallets = () => {
    return getDigitalWalletsForCountry(selectedCountry || sellerCountry);
  };

  const getAvailableBanks = () => {
    return getBanksForCountry(selectedCountry || sellerCountry);
  };

  useEffect(() => {
    fetchPaymentMethods();
    if (profile?.id) {
      fetchSavedAccounts();
      fetchSellerCountry();
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
    if (data) setSavedAccounts(data as unknown as SavedAccount[]);
  };

  const fetchSellerCountry = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('seller_profiles')
      .select('country')
      .eq('id', profile.id)
      .single();
    if (data?.country) {
      setSellerCountry(data.country);
    }
  };

  const handleAddAccount = async () => {
    if (!profile?.id || !accountName.trim() || !accountNumber.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Determine the payment method code
    let methodCode = '';
    let finalBankName = bankName;
    
    if (selectedAccountType === 'bank') {
      if (selectedBank) {
        methodCode = selectedBank.code;
        finalBankName = selectedBank.name;
      } else {
        methodCode = 'bank';
      }
    } else if (selectedAccountType === 'crypto') {
      methodCode = 'crypto';
    } else if (selectedDigitalWallet) {
      methodCode = selectedDigitalWallet.code;
    } else {
      toast.error('Please select a payment method');
      return;
    }

    setSubmitting(true);
    try {
      // If setting as primary, unset other primary accounts for same method
      if (isPrimary) {
        await supabase
          .from('seller_payment_accounts')
          .update({ is_primary: false })
          .eq('seller_id', profile.id)
          .eq('payment_method_code', methodCode);
      }

      // Build account details JSON
      const accountDetails: Record<string, string> = {};
      if (selectedAccountType === 'bank' && ifscCode) {
        accountDetails.ifsc = ifscCode;
      }
      if (selectedAccountType === 'crypto' && cryptoNetwork) {
        accountDetails.network = cryptoNetwork;
      }

      const { error } = await supabase
        .from('seller_payment_accounts')
        .insert({
          seller_id: profile.id,
          payment_method_code: methodCode,
          account_name: accountName.trim(),
          account_number: accountNumber.trim(),
          bank_name: finalBankName.trim() || null,
          is_primary: isPrimary,
          country: selectedCountry || sellerCountry,
          account_details: accountDetails
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
    setAddAccountStep('country');
    setSelectedCountry(null);
    setSelectedAccountType(null);
    setSelectedDigitalWallet(null);
    setSelectedBank(null);
    setAccountName('');
    setAccountNumber('');
    setBankName('');
    setIfscCode('');
    setCryptoNetwork('');
    setIsPrimary(false);
  };

  // Send OTP for withdrawal verification (if 2FA enabled) or process directly
  const handleWithdraw = async () => {
    console.log('[WITHDRAW] Starting withdrawal process...');
    
    if (!profile || !withdrawAmount || !selectedAccountForWithdraw) {
      toast.error('Please select an account');
      return;
    }

    const selectedAccount = savedAccounts.find(a => a.id === selectedAccountForWithdraw);
    if (!selectedAccount) {
      toast.error('Invalid account selected');
      return;
    }

    const selectedMethodObj = paymentMethods.find(m => m.code === selectedAccount.payment_method_code);
    const minWithdrawal = selectedMethodObj?.min_withdrawal || 5;
    const maxWithdrawal = selectedMethodObj?.max_withdrawal || 1000;

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

    // Check if 2FA is enabled
    const is2FAEnabled = profile.two_factor_enabled === true;
    console.log('[WITHDRAW] Profile 2FA status:', { two_factor_enabled: profile.two_factor_enabled, is2FAEnabled });

    if (is2FAEnabled) {
      // Send OTP for verification
      console.log('[WITHDRAW] 2FA enabled - sending OTP...');
      setOTPSending(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('[WITHDRAW] No session found');
          toast.error('Please log in again');
          return;
        }

        console.log('[WITHDRAW] Calling send-withdrawal-otp edge function...');
        const response = await supabase.functions.invoke('send-withdrawal-otp', {
          body: { 
            amount: withdrawAmount, 
            account_id: selectedAccountForWithdraw 
          }
        });

        console.log('[WITHDRAW] Edge function response:', response);

        if (response.error) {
          throw new Error(response.error.message || 'Failed to send OTP');
        }

        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Failed to send OTP');
        }

        setPendingWithdrawalData({
          amount: withdrawAmount,
          accountId: selectedAccountForWithdraw
        });
        
        if (response.data.expires_at) {
          setOTPExpiry(new Date(response.data.expires_at));
        }

        setShowWithdrawDialog(false);
        setShowOTPModal(true);
        console.log('[WITHDRAW] OTP modal opened successfully');
        toast.success('OTP sent to your email');
      } catch (error: any) {
        console.error('[WITHDRAW] OTP send error:', error);
        toast.error(error.message || 'Failed to send OTP');
      } finally {
        setOTPSending(false);
      }
    } else {
      console.log('[WITHDRAW] 2FA disabled - processing direct withdrawal...');
      // 2FA disabled - process withdrawal directly
      setSubmitting(true);
      try {
        const { error } = await supabase
          .from('seller_withdrawals')
          .insert({
            seller_id: profile.id,
            amount: withdrawAmount,
            payment_method: selectedAccount.payment_method_code,
            account_details: `${selectedAccount.account_name} - ${selectedAccount.account_number}${selectedAccount.bank_name ? ` (${selectedAccount.bank_name})` : ''}`,
            status: 'pending'
          });

        if (error) throw error;

        // Deduct from balance
        const { error: walletError } = await supabase
          .from('seller_wallets')
          .update({ balance: (wallet?.balance || 0) - withdrawAmount })
          .eq('seller_id', profile.id);

        if (walletError) {
          console.error('Wallet update error:', walletError);
        }

        toast.success('Withdrawal request submitted!');
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
    }
  };

  // Verify OTP and complete withdrawal
  const handleVerifyOTP = async () => {
    console.log('[VERIFY_OTP] Starting OTP verification...');
    
    if (!pendingWithdrawalData || otpValue.length !== 6) {
      console.log('[VERIFY_OTP] Invalid state:', { pendingWithdrawalData, otpLength: otpValue.length });
      return;
    }

    setOTPVerifying(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('[VERIFY_OTP] No session found');
        toast.error('Please log in again');
        return;
      }

      console.log('[VERIFY_OTP] Calling verify-withdrawal-otp edge function...');
      const response = await supabase.functions.invoke('verify-withdrawal-otp', {
        body: { otp_code: otpValue }
      });

      console.log('[VERIFY_OTP] Edge function response:', response);

      if (response.error) {
        throw new Error(response.error.message || 'Invalid OTP');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Invalid or expired OTP');
      }

      console.log('[VERIFY_OTP] Withdrawal successful:', response.data);
      toast.success(`Withdrawal of $${response.data.amount} submitted successfully!`);
      setShowOTPModal(false);
      setOTPValue('');
      setPendingWithdrawalData(null);
      setWithdrawAmount(10);
      setSelectedAccountForWithdraw(null);
      refreshWallet();
      refreshWithdrawals();
    } catch (error: any) {
      console.error('[VERIFY_OTP] Error:', error);
      toast.error(error.message || 'Invalid or expired OTP');
    } finally {
      setOTPVerifying(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (!pendingWithdrawalData) return;
    setOTPSending(true);
    setOTPValue('');
    
    try {
      const response = await supabase.functions.invoke('send-withdrawal-otp', {
        body: { 
          amount: pendingWithdrawalData.amount, 
          account_id: pendingWithdrawalData.accountId 
        }
      });

      if (response.error || !response.data?.success) {
        throw new Error(response.data?.error || 'Failed to resend OTP');
      }

      if (response.data.expires_at) {
        setOTPExpiry(new Date(response.data.expires_at));
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
        return { icon: CheckCircle, label: 'Approved', className: 'bg-violet-100 text-violet-700' };
      case 'rejected':
        return { icon: XCircle, label: 'Rejected', className: 'bg-red-100 text-red-700' };
      default:
        return { icon: Clock, label: status, className: 'bg-gray-100 text-gray-700' };
    }
  };

  const tabs = [
    { id: 'wallet' as WalletTab, label: 'Wallet', icon: Wallet },
    { id: 'accounts' as WalletTab, label: 'Accounts', icon: CreditCard },
    { id: 'withdrawals' as WalletTab, label: 'Withdrawals', icon: History },
  ];

  // Get display label for saved account
  const getAccountDisplayLabel = (account: SavedAccount) => {
    const wallet = getWalletByCode(account.payment_method_code);
    if (wallet) return wallet.label;
    
    switch (account.payment_method_code) {
      case 'bank': return 'Bank Account';
      case 'crypto': return 'Crypto Wallet';
      default: return account.payment_method_code.toUpperCase();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-up px-3 sm:px-0">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-1 sm:p-1.5 lg:p-2 mb-3 sm:mb-4 lg:mb-8 border border-gray-200 shadow-md">
        <div className="flex gap-1 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center gap-1 sm:gap-1.5 lg:gap-2 whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white shadow-lg'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95'
                }`}
              >
                <TabIcon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
                {tab.id === 'accounts' && savedAccounts.length > 0 && (
                  <span className={`text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-200'}`}>
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
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600">
                  <Wallet size={24} className="sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <p className="text-gray-500 text-xs sm:text-sm font-medium">Wallet Balance</p>
                  <h3 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                    {formatAmount(wallet?.balance || 0, true)}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowWithdrawDialog(true)}
                disabled={!wallet?.balance || wallet.balance < 5 || savedAccounts.length === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/25"
              >
                <ArrowDownCircle size={20} />
                Withdraw
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

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          {/* Active Accounts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedAccounts.map(account => {
              const walletInfo = getWalletByCode(account.payment_method_code);
              return (
                <div 
                  key={account.id}
                  className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-md transition-all relative"
                >
                  {account.is_primary && (
                    <Badge className="absolute -top-2 -right-2 bg-violet-600 text-white text-[10px]">
                      <Star className="w-3 h-3 mr-0.5" /> Primary
                    </Badge>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg ${getMethodBg(account.payment_method_code)} flex items-center justify-center`}>
                      {walletInfo?.logo ? (
                        <img src={walletInfo.logo} alt={walletInfo.label} className="w-6 h-6 object-contain" />
                      ) : (
                        getMethodIcon(account.payment_method_code)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{account.account_name}</p>
                      <p className="text-sm text-gray-500 font-mono">{maskAccountNumber(account.account_number)}</p>
                      {account.bank_name && (
                        <p className="text-xs text-gray-400 mt-1 truncate">{account.bank_name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">{getAccountDisplayLabel(account)}</span>
                    <div className="flex items-center gap-2">
                      {!account.is_primary && (
                        <button 
                          onClick={() => handleSetPrimary(account.id, account.payment_method_code)}
                          className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                        >
                          Set Primary
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteAccount(account.id)}
                        className="text-xs text-red-500 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Add Account Card */}
            <button 
              onClick={() => setShowAddAccountModal(true)}
              className="p-6 rounded-xl border-2 border-dashed border-violet-200 hover:border-violet-400 hover:bg-violet-50 transition-all flex flex-col items-center justify-center gap-2 min-h-[140px]"
            >
              <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
                <Plus className="text-violet-600" size={24} />
              </div>
              <span className="text-violet-600 font-medium">Add Account</span>
            </button>
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
                const walletInfo = getWalletByCode(withdrawal.payment_method);
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
                          <p className="text-gray-900 font-medium">{formatAmount(Number(withdrawal.amount), true)}</p>
                          <p className="text-gray-500 text-sm">
                            {format(new Date(withdrawal.created_at), 'MMM d, yyyy')}
                            <span className="ml-2 text-xs text-gray-400">
                              via {walletInfo?.label || withdrawal.payment_method}
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
                  const walletInfo = getWalletByCode(account.payment_method_code);
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
                          {walletInfo?.logo ? (
                            <img src={walletInfo.logo} className="w-8 h-8 object-contain" alt={walletInfo.label} />
                          ) : method?.icon_url ? (
                            <img src={method.icon_url} className="w-8 h-8 object-contain" alt={method.name} />
                          ) : (
                            <CreditCard size={20} className="text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{account.account_name}</p>
                            <p className="text-sm text-gray-500">
                              {walletInfo?.label || method?.name || account.payment_method_code} - {maskAccountNumber(account.account_number)}
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

      {/* Add Account Modal - NEW 3-TIER SYSTEM */}
      <Dialog open={showAddAccountModal} onOpenChange={(open) => { setShowAddAccountModal(open); if (!open) resetAddAccountForm(); }}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white">
            <div className="flex items-center gap-3">
              {addAccountStep !== 'country' && (
                <button 
                  onClick={() => {
                    if (addAccountStep === 'details') {
                      if (selectedAccountType === 'digital_wallet') {
                        setAddAccountStep('wallet');
                        setSelectedDigitalWallet(null);
                      } else if (selectedAccountType === 'bank') {
                        setAddAccountStep('bank');
                        setSelectedBank(null);
                      } else {
                        setAddAccountStep('type');
                        setSelectedAccountType(null);
                      }
                    } else if (addAccountStep === 'wallet' || addAccountStep === 'bank') {
                      setAddAccountStep('type');
                      setSelectedAccountType(null);
                    } else if (addAccountStep === 'type') {
                      setAddAccountStep('country');
                      setSelectedCountry(null);
                    }
                  }}
                  className="p-2 -ml-2 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Add Payment Account</h2>
                <p className="text-violet-100 text-sm">{selectedCountry ? getCountryName(selectedCountry) : 'Select your country'}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Step 0: Select Country */}
            {addAccountStep === 'country' && (
              <div className="animate-fade-up">
                <Label className="text-gray-600 text-sm font-medium mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-xs flex items-center justify-center font-bold">1</span>
                  Select Your Country
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {getSortedCountries().map((country) => (
                    <button
                      key={country.code}
                      onClick={() => {
                        setSelectedCountry(country.code);
                        setAddAccountStep('type');
                      }}
                      className="p-4 rounded-xl border-2 border-gray-200 hover:border-violet-400 hover:bg-violet-50 transition-all text-center"
                    >
                      <div className="h-12 w-12 mx-auto mb-2 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden">
                        {country.code === 'DEFAULT' ? (
                          <Globe className="w-8 h-8 text-gray-500" />
                        ) : (
                          <img src={country.flag} alt={country.name} className="w-10 h-8 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        )}
                      </div>
                      <p className="text-gray-900 font-medium text-sm">{country.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Select Account Type */}
            {addAccountStep === 'type' && (
              <div className="animate-fade-up">
                <Label className="text-gray-600 text-sm font-medium mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-xs flex items-center justify-center font-bold">2</span>
                  Select Account Type
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {ACCOUNT_TYPES.map((type) => (
                    <button
                      key={type.code}
                      onClick={() => {
                        setSelectedAccountType(type.code);
                        if (type.code === 'digital_wallet') {
                          setAddAccountStep('wallet');
                        } else if (type.code === 'bank') {
                          setAddAccountStep('bank');
                        } else {
                          setAddAccountStep('details');
                        }
                      }}
                      className="p-4 rounded-xl border-2 border-gray-200 hover:border-violet-400 hover:bg-violet-50 transition-all text-center"
                    >
                      <div className={`h-12 w-12 mx-auto mb-2 rounded-xl flex items-center justify-center ${type.code === 'bank' ? 'bg-blue-50' : type.code === 'digital_wallet' ? 'bg-violet-50' : 'bg-orange-50'}`}>
                        {type.code === 'bank' && <Building2 className="w-6 h-6 text-blue-600" />}
                        {type.code === 'digital_wallet' && <Smartphone className="w-6 h-6 text-violet-600" />}
                        {type.code === 'crypto' && <Bitcoin className="w-6 h-6 text-orange-500" />}
                      </div>
                      <p className="text-gray-900 font-medium text-sm">{type.label}</p>
                      <p className="text-gray-400 text-xs mt-1">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2a: Select Bank */}
            {addAccountStep === 'bank' && (
              <div className="animate-fade-up">
                <Label className="text-gray-600 text-sm font-medium mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-xs flex items-center justify-center font-bold">3</span>
                  Select Bank
                </Label>
                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {getAvailableBanks().map((bank) => (
                    <button key={bank.code} onClick={() => { setSelectedBank(bank); setBankName(bank.name); setAddAccountStep('details'); }} className="p-3 rounded-xl border-2 border-gray-200 hover:border-violet-400 transition-all text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                          <img src={bank.logo} alt={bank.name} className="w-8 h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                        <span className="text-gray-900 font-medium text-sm truncate">{bank.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={() => { setSelectedBank(null); setBankName(''); setAddAccountStep('details'); }} className="w-full mt-3 p-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-violet-400 hover:bg-violet-50 transition-all text-center">
                  <span className="text-gray-600 font-medium">+ Other Bank (Enter Manually)</span>
                </button>
              </div>
            )}

            {/* Step 2b: Select Digital Wallet */}
            {addAccountStep === 'wallet' && (
              <div className="animate-fade-up">
                <Label className="text-gray-600 text-sm font-medium mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-xs flex items-center justify-center font-bold">3</span>
                  Select Wallet
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {getAvailableDigitalWallets().map((wallet) => (
                    <button key={wallet.code} onClick={() => { setSelectedDigitalWallet(wallet); setAddAccountStep('details'); }} className="p-4 rounded-xl border-2 border-gray-200 hover:border-violet-400 transition-all text-center group" style={{ '--wallet-color': wallet.color } as React.CSSProperties}>
                      <div className={`h-14 w-14 mx-auto mb-2 rounded-xl ${wallet.bgColor} flex items-center justify-center p-2 group-hover:scale-105 transition-transform`}>
                        <img src={wallet.logo} alt={wallet.label} className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                      <p className="text-gray-900 font-medium text-sm">{wallet.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Enter Account Details */}
            {addAccountStep === 'details' && (
              <div className="space-y-4 animate-fade-up">
                <Label className="text-gray-600 text-sm font-medium flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-xs flex items-center justify-center font-bold">4</span>
                  Enter Account Details
                </Label>

                {/* Show selected bank branding */}
                {selectedBank && (
                  <div className="p-4 rounded-xl bg-blue-50 flex items-center gap-3 mb-4">
                    <img src={selectedBank.logo} alt={selectedBank.name} className="w-10 h-10 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <div>
                      <p className="font-semibold text-gray-900">{selectedBank.name}</p>
                      <p className="text-sm text-gray-500">Enter your account details</p>
                    </div>
                  </div>
                )}

                {/* Show selected wallet branding for digital wallets */}
                {selectedDigitalWallet && (
                  <div className={`p-4 rounded-xl ${selectedDigitalWallet.bgColor} flex items-center gap-3 mb-4`}>
                    <img src={selectedDigitalWallet.logo} alt={selectedDigitalWallet.label} className="w-10 h-10 object-contain" />
                    <div>
                      <p className="font-semibold text-gray-900">{selectedDigitalWallet.label}</p>
                      <p className="text-sm text-gray-500">Enter your account details</p>
                    </div>
                  </div>
                )}

                {/* Account Holder Name - All types */}
                <div className="relative">
                  <Input 
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder=" "
                    className="h-14 pt-5 rounded-xl border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all peer"
                  />
                  <label className="absolute left-3 top-2 text-[10px] text-gray-400 uppercase tracking-wide font-medium peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-violet-600 transition-all">
                    Account Holder Name
                  </label>
                </div>

                {/* Bank Account Fields */}
                {selectedAccountType === 'bank' && (
                  <>
                    <div className="relative">
                      <Input 
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder=" "
                        className="h-14 pt-5 rounded-xl border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all peer"
                      />
                      <label className="absolute left-3 top-2 text-[10px] text-gray-400 uppercase tracking-wide font-medium peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-violet-600 transition-all">
                        Account Number
                      </label>
                    </div>
                    <div className="relative">
                      <Input 
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder=" "
                        className="h-14 pt-5 rounded-xl border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all peer"
                      />
                      <label className="absolute left-3 top-2 text-[10px] text-gray-400 uppercase tracking-wide font-medium peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-violet-600 transition-all">
                        Bank Name
                      </label>
                    </div>
                    <div className="relative">
                      <Input 
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                        placeholder=" "
                        className="h-14 pt-5 rounded-xl border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all peer"
                      />
                      <label className="absolute left-3 top-2 text-[10px] text-gray-400 uppercase tracking-wide font-medium peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-violet-600 transition-all">
                        {sellerCountry === 'IN' ? 'IFSC Code' : 'Branch / Routing'}
                      </label>
                    </div>
                  </>
                )}

                {/* Digital Wallet Fields */}
                {selectedAccountType === 'digital_wallet' && selectedDigitalWallet && (
                  <div className="relative">
                    <Input 
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder={selectedDigitalWallet.placeholder}
                      className="h-14 pt-5 rounded-xl border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all peer"
                    />
                    <label className="absolute left-3 top-2 text-[10px] text-gray-400 uppercase tracking-wide font-medium peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-violet-600 transition-all">
                      {selectedDigitalWallet.inputLabel}
                    </label>
                  </div>
                )}

                {/* Crypto Fields */}
                {selectedAccountType === 'crypto' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Network</label>
                      <Select value={cryptoNetwork} onValueChange={setCryptoNetwork}>
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100">
                          <SelectValue placeholder="Select network" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TRC20">TRC20 (USDT)</SelectItem>
                          <SelectItem value="ERC20">ERC20 (USDT/ETH)</SelectItem>
                          <SelectItem value="BEP20">BEP20 (Binance)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="relative">
                      <Input 
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder=" "
                        className="h-14 pt-5 rounded-xl border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all peer font-mono text-sm"
                      />
                      <label className="absolute left-3 top-2 text-[10px] text-gray-400 uppercase tracking-wide font-medium peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-500 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-violet-600 transition-all">
                        Wallet Address
                      </label>
                    </div>
                  </>
                )}

                {/* Primary Account Toggle */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Checkbox 
                    id="primary-seller"
                    checked={isPrimary}
                    onCheckedChange={(checked) => setIsPrimary(checked as boolean)}
                  />
                  <Label htmlFor="primary-seller" className="cursor-pointer">
                    <span className="text-gray-900 font-medium">Set as primary</span>
                    <span className="text-gray-500 text-sm block">Use this account for all withdrawals</span>
                  </Label>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => { setShowAddAccountModal(false); resetAddAccountForm(); }}
                    className="flex-1 h-12 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddAccount} 
                    disabled={!accountName || !accountNumber || submitting}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Account
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* OTP Verification Modal */}
      <Dialog open={showOTPModal} onOpenChange={(open) => {
        if (!open) {
          setShowOTPModal(false);
          setOTPValue('');
        }
      }}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold">Verify Withdrawal</h3>
            <p className="text-violet-100 text-sm mt-2">
              Enter the 6-digit code sent to your email
            </p>
            {pendingWithdrawalData && (
              <div className="mt-4 p-3 bg-white/10 rounded-xl">
                <p className="text-white/80 text-sm">Withdrawing</p>
                <p className="text-2xl font-bold">${pendingWithdrawalData.amount}</p>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="flex justify-center mb-6">
              <InputOTP
                value={otpValue}
                onChange={setOTPValue}
                maxLength={6}
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot key={index} index={index} className="w-12 h-14 text-xl" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handleVerifyOTP}
              disabled={otpVerifying || otpValue.length !== 6}
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
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

            <div className="mt-4 text-center">
              <button
                onClick={handleResendOTP}
                disabled={otpSending}
                className="text-sm text-gray-500 hover:text-violet-600 transition-colors"
              >
                {otpSending ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  "Didn't receive code? Resend"
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerWallet;
