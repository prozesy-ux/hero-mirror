import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { useAdminMutate } from '@/hooks/useAdminMutate';
import { LogoWithFallback } from '@/components/ui/logo-with-fallback';
import { getPaymentLogo, COUNTRY_CONFIG, ACCOUNT_TYPES } from '@/lib/payment-logos';
import {
  RefreshCw,
  Plus,
  Trash2,
  CreditCard,
  Wallet,
  Building2,
  Bitcoin,
  Globe,
  Check,
  Settings,
  Eye,
  EyeOff,
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface DepositMethod {
  id: string;
  code: string;
  name: string;
  icon_url?: string;
  is_enabled: boolean;
  is_automatic: boolean;
  api_key?: string;
  api_secret?: string;
  account_number?: string;
  account_name?: string;
  qr_image_url?: string;
  instructions?: string;
  currency_code?: string;
  exchange_rate?: number;
  display_order?: number;
}

interface WithdrawalMethod {
  id: string;
  country_code: string;
  account_type: 'bank' | 'digital_wallet' | 'crypto';
  method_code: string | null;
  method_name: string;
  is_enabled: boolean;
  min_withdrawal: number;
  max_withdrawal: number;
  exchange_rate: number;
  custom_logo_url?: string;
  brand_color?: string;
}

const PaymentSettingsManagement = () => {
  const { paymentMethods, withdrawalMethodConfig, refreshAll, refreshTable } = useAdminDataContext();
  const { mutateData, mutating: isMutating } = useAdminMutate();
  
  const [activeTab, setActiveTab] = useState('deposit');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedAccountType, setSelectedAccountType] = useState<'bank' | 'digital_wallet' | 'crypto'>('digital_wallet');
  const [showAddDepositModal, setShowAddDepositModal] = useState(false);
  const [showAddWithdrawalModal, setShowAddWithdrawalModal] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<DepositMethod | null>(null);
  const [editingWithdrawal, setEditingWithdrawal] = useState<WithdrawalMethod | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form state for new deposit method
  const [newDeposit, setNewDeposit] = useState<Partial<DepositMethod>>({
    code: '',
    name: '',
    is_enabled: true,
    is_automatic: false,
    currency_code: 'USD',
    exchange_rate: 1,
    display_order: 0,
  });

  // Form state for new/edit withdrawal method
  const [withdrawalForm, setWithdrawalForm] = useState<Partial<WithdrawalMethod>>({
    country_code: 'BD',
    account_type: 'digital_wallet',
    method_code: '',
    method_name: '',
    is_enabled: true,
    min_withdrawal: 5,
    max_withdrawal: 1000,
    exchange_rate: 1,
  });

  // Get countries that have configured withdrawal methods
  const configuredCountries = useMemo(() => {
    const countries = [...new Set((withdrawalMethodConfig || []).map((m: WithdrawalMethod) => m.country_code))];
    return countries.sort((a, b) => {
      const aName = COUNTRY_CONFIG[a]?.name || a;
      const bName = COUNTRY_CONFIG[b]?.name || b;
      return aName.localeCompare(bName);
    });
  }, [withdrawalMethodConfig]);

  // Auto-select first configured country or BD as default
  useEffect(() => {
    if (!selectedCountry && configuredCountries.length > 0) {
      setSelectedCountry(configuredCountries[0]);
    } else if (!selectedCountry) {
      setSelectedCountry('BD');
    }
  }, [configuredCountries, selectedCountry]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAll();
    setIsRefreshing(false);
    toast.success('Data refreshed');
  };

  // Filter withdrawal methods by country and type
  const filteredWithdrawalMethods = useMemo(() => {
    return (withdrawalMethodConfig || []).filter(
      (m: WithdrawalMethod) => 
        m.country_code === selectedCountry && 
        m.account_type === selectedAccountType
    );
  }, [withdrawalMethodConfig, selectedCountry, selectedAccountType]);

  // Get all enabled methods for selected country (for "Available Methods" section)
  const enabledMethodsForCountry = useMemo(() => {
    return (withdrawalMethodConfig || []).filter(
      (m: WithdrawalMethod) => m.country_code === selectedCountry && m.is_enabled
    );
  }, [withdrawalMethodConfig, selectedCountry]);

  // Get method counts per account type for selected country
  const methodCountsByType = useMemo(() => {
    const methods = withdrawalMethodConfig || [];
    return {
      bank: methods.filter((m: WithdrawalMethod) => m.country_code === selectedCountry && m.account_type === 'bank').length,
      digital_wallet: methods.filter((m: WithdrawalMethod) => m.country_code === selectedCountry && m.account_type === 'digital_wallet').length,
      crypto: methods.filter((m: WithdrawalMethod) => m.country_code === selectedCountry && m.account_type === 'crypto').length,
    };
  }, [withdrawalMethodConfig, selectedCountry]);

  // Stats calculations
  const depositStats = {
    total: paymentMethods.length,
    active: paymentMethods.filter((m: DepositMethod) => m.is_enabled).length,
    automatic: paymentMethods.filter((m: DepositMethod) => m.is_automatic).length,
  };

  const withdrawalStats = {
    countries: configuredCountries.length,
    enabled: (withdrawalMethodConfig || []).filter((m: WithdrawalMethod) => m.is_enabled).length,
    total: (withdrawalMethodConfig || []).length,
  };

  // CRUD operations for deposit methods
  const handleSaveDeposit = async (method: Partial<DepositMethod>) => {
    try {
      if (method.id) {
        await mutateData('payment_methods', 'update', method, method.id);
        toast.success('Deposit method updated');
      } else {
        await mutateData('payment_methods', 'insert', method);
        toast.success('Deposit method added');
      }
      setShowAddDepositModal(false);
      setEditingDeposit(null);
      setNewDeposit({
        code: '',
        name: '',
        is_enabled: true,
        is_automatic: false,
        currency_code: 'USD',
        exchange_rate: 1,
        display_order: 0,
      });
      refreshTable('payment_methods');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    }
  };

  const handleDeleteDeposit = async (id: string) => {
    if (!confirm('Delete this deposit method?')) return;
    try {
      await mutateData('payment_methods', 'delete', undefined, id);
      toast.success('Deposit method deleted');
      refreshTable('payment_methods');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const handleToggleDeposit = async (method: DepositMethod) => {
    try {
      await mutateData('payment_methods', 'update', { is_enabled: !method.is_enabled }, method.id);
      refreshTable('payment_methods');
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle');
    }
  };

  // CRUD operations for withdrawal methods
  const handleSaveWithdrawal = async () => {
    try {
      const data = {
        ...withdrawalForm,
        method_code: withdrawalForm.method_code || null,
      };
      
      if (editingWithdrawal?.id) {
        await mutateData('withdrawal_method_config', 'update', data, editingWithdrawal.id);
        toast.success('Withdrawal method updated');
      } else {
        await mutateData('withdrawal_method_config', 'insert', data);
        toast.success('Withdrawal method added');
      }
      setShowAddWithdrawalModal(false);
      setEditingWithdrawal(null);
      setWithdrawalForm({
        country_code: selectedCountry,
        account_type: selectedAccountType,
        method_code: '',
        method_name: '',
        is_enabled: true,
        min_withdrawal: 5,
        max_withdrawal: 1000,
        exchange_rate: 1,
      });
      refreshTable('withdrawal_method_config');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    }
  };

  const handleDeleteWithdrawal = async (id: string) => {
    if (!confirm('Delete this withdrawal method?')) return;
    try {
      await mutateData('withdrawal_method_config', 'delete', undefined, id);
      toast.success('Withdrawal method deleted');
      refreshTable('withdrawal_method_config');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const handleToggleWithdrawal = async (method: WithdrawalMethod) => {
    try {
      await mutateData('withdrawal_method_config', 'update', { is_enabled: !method.is_enabled }, method.id);
      refreshTable('withdrawal_method_config');
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle');
    }
  };

  const handleEditWithdrawal = (method: WithdrawalMethod) => {
    setEditingWithdrawal(method);
    setWithdrawalForm({
      country_code: method.country_code,
      account_type: method.account_type,
      method_code: method.method_code || '',
      method_name: method.method_name,
      is_enabled: method.is_enabled,
      min_withdrawal: method.min_withdrawal,
      max_withdrawal: method.max_withdrawal,
      exchange_rate: method.exchange_rate,
      custom_logo_url: method.custom_logo_url,
      brand_color: method.brand_color,
    });
    setShowAddWithdrawalModal(true);
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'bank': return <Building2 className="w-4 h-4" />;
      case 'digital_wallet': return <Wallet className="w-4 h-4" />;
      case 'crypto': return <Bitcoin className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  // Helper to get method logo - prioritizes custom_logo_url from DB
  const getMethodLogo = (method: WithdrawalMethod) => {
    const logoConfig = getPaymentLogo(method.method_code || method.account_type);
    return {
      url: method.custom_logo_url || logoConfig.url,
      color: method.brand_color || logoConfig.color,
      name: method.method_name || logoConfig.name,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header with tabs and refresh */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="bg-slate-800/50 p-1">
            <TabsTrigger 
              value="deposit" 
              className="data-[state=active]:bg-emerald-600/90 data-[state=active]:text-white px-4"
            >
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              Deposit Methods
            </TabsTrigger>
            <TabsTrigger 
              value="withdrawal"
              className="data-[state=active]:bg-violet-600/90 data-[state=active]:text-white px-4"
            >
              <ArrowUpFromLine className="w-4 h-4 mr-2" />
              Withdrawal Methods
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="border-slate-600 hover:bg-slate-800"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* ========================================== */}
      {/* DEPOSIT METHODS TAB - Emerald Theme */}
      {/* ========================================== */}
      {activeTab === 'deposit' && (
        <div className="space-y-6">
          {/* Deposit Stats - Emerald gradient theme */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 border-emerald-500/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Total Gateways</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-1">{depositStats.total}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/15 to-green-600/5 border-green-500/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Active</p>
                    <p className="text-3xl font-bold text-green-400 mt-1">{depositStats.active}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-teal-500/15 to-teal-600/5 border-teal-500/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Automatic (API)</p>
                    <p className="text-3xl font-bold text-teal-400 mt-1">{depositStats.automatic}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                    <Settings className="w-6 h-6 text-teal-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Deposit Button */}
          <div className="flex justify-end">
            <Dialog open={showAddDepositModal} onOpenChange={(open) => {
              setShowAddDepositModal(open);
              if (!open) {
                setEditingDeposit(null);
                setNewDeposit({
                  code: '',
                  name: '',
                  is_enabled: true,
                  is_automatic: false,
                  currency_code: 'USD',
                  exchange_rate: 1,
                  display_order: 0,
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Deposit Gateway
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700 max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-emerald-400">{editingDeposit ? 'Edit' : 'Add'} Deposit Gateway</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Code</Label>
                      <Input
                        value={newDeposit.code}
                        onChange={(e) => setNewDeposit({ ...newDeposit, code: e.target.value })}
                        placeholder="stripe"
                        className="bg-slate-800 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={newDeposit.name}
                        onChange={(e) => setNewDeposit({ ...newDeposit, name: e.target.value })}
                        placeholder="Stripe"
                        className="bg-slate-800 border-slate-600"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newDeposit.is_enabled}
                        onCheckedChange={(checked) => setNewDeposit({ ...newDeposit, is_enabled: checked })}
                      />
                      <Label>Enabled</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newDeposit.is_automatic}
                        onCheckedChange={(checked) => setNewDeposit({ ...newDeposit, is_automatic: checked })}
                      />
                      <Label>Automatic (API)</Label>
                    </div>
                  </div>
                  {newDeposit.is_automatic && (
                    <div className="space-y-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                      <p className="text-xs text-emerald-400 font-medium">API Credentials</p>
                      <div>
                        <Label>API Key</Label>
                        <Input
                          type="password"
                          value={newDeposit.api_key || ''}
                          onChange={(e) => setNewDeposit({ ...newDeposit, api_key: e.target.value })}
                          placeholder="pk_live_..."
                          className="bg-slate-800 border-slate-600"
                        />
                      </div>
                      <div>
                        <Label>API Secret</Label>
                        <Input
                          type="password"
                          value={newDeposit.api_secret || ''}
                          onChange={(e) => setNewDeposit({ ...newDeposit, api_secret: e.target.value })}
                          placeholder="sk_live_..."
                          className="bg-slate-800 border-slate-600"
                        />
                      </div>
                    </div>
                  )}
                  {!newDeposit.is_automatic && (
                    <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-400 font-medium">Manual Payment Details</p>
                      <div>
                        <Label>Account Name</Label>
                        <Input
                          value={newDeposit.account_name || ''}
                          onChange={(e) => setNewDeposit({ ...newDeposit, account_name: e.target.value })}
                          className="bg-slate-800 border-slate-600"
                        />
                      </div>
                      <div>
                        <Label>Account Number</Label>
                        <Input
                          value={newDeposit.account_number || ''}
                          onChange={(e) => setNewDeposit({ ...newDeposit, account_number: e.target.value })}
                          className="bg-slate-800 border-slate-600"
                        />
                      </div>
                      <div>
                        <Label>Instructions</Label>
                        <Input
                          value={newDeposit.instructions || ''}
                          onChange={(e) => setNewDeposit({ ...newDeposit, instructions: e.target.value })}
                          placeholder="Send payment to..."
                          className="bg-slate-800 border-slate-600"
                        />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Currency</Label>
                      <Input
                        value={newDeposit.currency_code || 'USD'}
                        onChange={(e) => setNewDeposit({ ...newDeposit, currency_code: e.target.value })}
                        className="bg-slate-800 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label>Exchange Rate</Label>
                      <Input
                        type="number"
                        value={newDeposit.exchange_rate || 1}
                        onChange={(e) => setNewDeposit({ ...newDeposit, exchange_rate: parseFloat(e.target.value) })}
                        className="bg-slate-800 border-slate-600"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Icon URL</Label>
                    <Input
                      value={newDeposit.icon_url || ''}
                      onChange={(e) => setNewDeposit({ ...newDeposit, icon_url: e.target.value })}
                      placeholder="https://..."
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>
                  <Button
                    onClick={() => handleSaveDeposit(newDeposit)}
                    disabled={isMutating}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    {editingDeposit ? 'Update' : 'Add'} Gateway
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Deposit Methods Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentMethods.map((method: DepositMethod) => {
              const logo = getPaymentLogo(method.code);
              return (
                <Card key={method.id} className={`bg-slate-900/60 border-slate-700/50 transition-all hover:border-emerald-500/30 ${!method.is_enabled ? 'opacity-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <LogoWithFallback
                          src={method.icon_url || logo.url}
                          alt={method.name}
                          color={logo.color}
                          className="w-11 h-11 rounded-lg"
                        />
                        <div>
                          <h3 className="font-semibold text-white">{method.name}</h3>
                          <p className="text-xs text-slate-500 font-mono">{method.code}</p>
                        </div>
                      </div>
                      <Switch
                        checked={method.is_enabled}
                        onCheckedChange={() => handleToggleDeposit(method)}
                      />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge 
                        className={`text-xs ${method.is_automatic ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-700 text-slate-300'}`}
                      >
                        {method.is_automatic ? 'Automatic' : 'Manual'}
                      </Badge>
                      {method.currency_code && (
                        <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                          {method.currency_code}
                        </Badge>
                      )}
                    </div>
                    {method.is_automatic && method.api_key && (
                      <div className="mb-3 p-2 bg-slate-800/70 rounded-lg text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">API Key:</span>
                          <button
                            onClick={() => setShowSecrets({ ...showSecrets, [method.id]: !showSecrets[method.id] })}
                            className="text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            {showSecrets[method.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                        <span className="text-slate-300 font-mono text-xs">
                          {showSecrets[method.id] ? method.api_key : '••••••••••••••••'}
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingDeposit(method);
                          setNewDeposit(method);
                          setShowAddDepositModal(true);
                        }}
                        className="flex-1 border-slate-600 hover:bg-slate-800"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteDeposit(method.id)}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* WITHDRAWAL METHODS TAB - Violet Theme */}
      {/* ========================================== */}
      {activeTab === 'withdrawal' && (
        <div className="space-y-6">
          {/* Withdrawal Stats - Violet gradient theme */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-violet-500/15 to-violet-600/5 border-violet-500/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Countries Configured</p>
                    <p className="text-3xl font-bold text-violet-400 mt-1">{withdrawalStats.countries}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-violet-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/15 to-purple-600/5 border-purple-500/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Enabled Methods</p>
                    <p className="text-3xl font-bold text-purple-400 mt-1">{withdrawalStats.enabled}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-fuchsia-500/15 to-fuchsia-600/5 border-fuchsia-500/30">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Total Methods</p>
                    <p className="text-3xl font-bold text-fuchsia-400 mt-1">{withdrawalStats.total}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-fuchsia-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Country Selector - Auto-selects configured countries */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[220px]">
              <Label className="text-sm text-violet-400 mb-2 block font-medium">Select Country</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="bg-slate-800/80 border-violet-500/30 focus:border-violet-500">
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 max-h-[300px]">
                  {/* Show configured countries first */}
                  {configuredCountries.length > 0 && (
                    <>
                      <div className="px-2 py-1.5 text-xs text-violet-400 font-medium">Configured Countries</div>
                      {configuredCountries.map((code) => {
                        const config = COUNTRY_CONFIG[code];
                        const enabledCount = (withdrawalMethodConfig || []).filter(
                          (m: WithdrawalMethod) => m.country_code === code && m.is_enabled
                        ).length;
                        return (
                          <SelectItem key={code} value={code}>
                            <span className="flex items-center gap-2">
                              <span className="text-lg">{config?.flag}</span>
                              <span>{config?.name || code}</span>
                              <Badge className="ml-auto text-xs bg-violet-500/20 text-violet-400 border-0">
                                {enabledCount} active
                              </Badge>
                            </span>
                          </SelectItem>
                        );
                      })}
                      <div className="h-px bg-slate-700 my-2" />
                    </>
                  )}
                  <div className="px-2 py-1.5 text-xs text-slate-500 font-medium">All Countries</div>
                  {Object.entries(COUNTRY_CONFIG)
                    .filter(([code]) => !configuredCountries.includes(code))
                    .map(([code, config]) => (
                      <SelectItem key={code} value={code}>
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{config.flag}</span>
                          <span>{config.name}</span>
                          <span className="text-slate-500 text-xs">({config.currency})</span>
                        </span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Account Type Filter with counts */}
            <div className="flex gap-2">
              {ACCOUNT_TYPES.map((type) => {
                const count = methodCountsByType[type.code as keyof typeof methodCountsByType];
                return (
                  <Button
                    key={type.code}
                    variant={selectedAccountType === type.code ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedAccountType(type.code as any)}
                    className={
                      selectedAccountType === type.code
                        ? 'bg-violet-600 hover:bg-violet-700 text-white'
                        : 'border-slate-600 hover:border-violet-500/50 hover:bg-slate-800'
                    }
                  >
                    {getAccountTypeIcon(type.code)}
                    <span className="ml-2 hidden sm:inline">{type.label}</span>
                    {count > 0 && (
                      <Badge className="ml-2 text-xs bg-white/20 border-0 px-1.5">
                        {count}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>

            {/* Add Method Button */}
            <Dialog open={showAddWithdrawalModal} onOpenChange={(open) => {
              setShowAddWithdrawalModal(open);
              if (!open) {
                setEditingWithdrawal(null);
                setWithdrawalForm({
                  country_code: selectedCountry,
                  account_type: selectedAccountType,
                  method_code: '',
                  method_name: '',
                  is_enabled: true,
                  min_withdrawal: 5,
                  max_withdrawal: 1000,
                  exchange_rate: 1,
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Method
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700 max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-violet-400">{editingWithdrawal ? 'Edit' : 'Add'} Withdrawal Method</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Country</Label>
                      <Select
                        value={withdrawalForm.country_code}
                        onValueChange={(v) => setWithdrawalForm({ ...withdrawalForm, country_code: v })}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600 max-h-[200px]">
                          {Object.entries(COUNTRY_CONFIG).map(([code, config]) => (
                            <SelectItem key={code} value={code}>
                              {config.flag} {config.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Account Type</Label>
                      <Select
                        value={withdrawalForm.account_type}
                        onValueChange={(v) => setWithdrawalForm({ ...withdrawalForm, account_type: v as any })}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600">
                          {ACCOUNT_TYPES.map((type) => (
                            <SelectItem key={type.code} value={type.code}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Method Code</Label>
                      <Input
                        value={withdrawalForm.method_code || ''}
                        onChange={(e) => setWithdrawalForm({ ...withdrawalForm, method_code: e.target.value })}
                        placeholder="bkash, paypal, etc."
                        className="bg-slate-800 border-slate-600"
                      />
                      <p className="text-xs text-slate-500 mt-1">Used to fetch logo automatically</p>
                    </div>
                    <div>
                      <Label>Display Name</Label>
                      <Input
                        value={withdrawalForm.method_name || ''}
                        onChange={(e) => setWithdrawalForm({ ...withdrawalForm, method_name: e.target.value })}
                        placeholder="bKash, PayPal, etc."
                        className="bg-slate-800 border-slate-600"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Min Withdrawal</Label>
                      <Input
                        type="number"
                        value={withdrawalForm.min_withdrawal}
                        onChange={(e) => setWithdrawalForm({ ...withdrawalForm, min_withdrawal: parseFloat(e.target.value) })}
                        className="bg-slate-800 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label>Max Withdrawal</Label>
                      <Input
                        type="number"
                        value={withdrawalForm.max_withdrawal}
                        onChange={(e) => setWithdrawalForm({ ...withdrawalForm, max_withdrawal: parseFloat(e.target.value) })}
                        className="bg-slate-800 border-slate-600"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Exchange Rate</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={withdrawalForm.exchange_rate}
                        onChange={(e) => setWithdrawalForm({ ...withdrawalForm, exchange_rate: parseFloat(e.target.value) })}
                        className="bg-slate-800 border-slate-600"
                      />
                    </div>
                    <div>
                      <Label>Brand Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={withdrawalForm.brand_color || '#6366F1'}
                          onChange={(e) => setWithdrawalForm({ ...withdrawalForm, brand_color: e.target.value })}
                          className="w-12 h-10 p-1 bg-slate-800 border-slate-600 cursor-pointer"
                        />
                        <Input
                          value={withdrawalForm.brand_color || '#6366F1'}
                          onChange={(e) => setWithdrawalForm({ ...withdrawalForm, brand_color: e.target.value })}
                          className="flex-1 bg-slate-800 border-slate-600 font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-violet-500/10 rounded-lg">
                    <Switch
                      checked={withdrawalForm.is_enabled}
                      onCheckedChange={(checked) => setWithdrawalForm({ ...withdrawalForm, is_enabled: checked })}
                    />
                    <Label className="text-violet-300">Enable this method</Label>
                  </div>
                  <div>
                    <Label>Custom Logo URL (optional)</Label>
                    <Input
                      value={withdrawalForm.custom_logo_url || ''}
                      onChange={(e) => setWithdrawalForm({ ...withdrawalForm, custom_logo_url: e.target.value })}
                      placeholder="https://... (overrides auto-detected logo)"
                      className="bg-slate-800 border-slate-600"
                    />
                    <p className="text-xs text-slate-500 mt-1">Leave empty to use logo from method code</p>
                  </div>
                  <Button
                    onClick={handleSaveWithdrawal}
                    disabled={isMutating}
                    className="w-full bg-violet-600 hover:bg-violet-700"
                  >
                    {editingWithdrawal ? 'Update' : 'Add'} Method
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Selected Country Info with Available Methods */}
          <Card className="bg-slate-800/30 border-violet-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{COUNTRY_CONFIG[selectedCountry]?.flag}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg">{COUNTRY_CONFIG[selectedCountry]?.name}</h3>
                  <p className="text-sm text-slate-400">
                    Currency: {COUNTRY_CONFIG[selectedCountry]?.currency} ({COUNTRY_CONFIG[selectedCountry]?.currencySymbol})
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-violet-400">{enabledMethodsForCountry.length}</p>
                  <p className="text-xs text-slate-500">Active Methods</p>
                </div>
              </div>
              
              {/* Available Withdrawal Methods - Shows ALL enabled methods for this country */}
              {enabledMethodsForCountry.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <p className="text-xs text-violet-400 font-medium mb-3">AVAILABLE WITHDRAWAL METHODS</p>
                  <div className="flex flex-wrap gap-2">
                    {enabledMethodsForCountry.map((method: WithdrawalMethod) => {
                      const logo = getMethodLogo(method);
                      return (
                        <div
                          key={method.id}
                          className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 rounded-lg border border-slate-700/50"
                        >
                          <LogoWithFallback
                            src={logo.url}
                            alt={method.method_name}
                            color={logo.color}
                            className="w-6 h-6 rounded"
                          />
                          <span className="text-sm text-white font-medium">{method.method_name}</span>
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Withdrawal Methods Grid */}
          {filteredWithdrawalMethods.length === 0 ? (
            <Card className="bg-slate-900/30 border-slate-700 border-dashed">
              <CardContent className="p-8 text-center">
                <Wallet className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <h3 className="text-lg font-medium text-slate-400 mb-1">No methods configured</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Add {ACCOUNT_TYPES.find(t => t.code === selectedAccountType)?.label} methods for {COUNTRY_CONFIG[selectedCountry]?.name}
                </p>
                <Button
                  onClick={() => {
                    setWithdrawalForm({
                      country_code: selectedCountry,
                      account_type: selectedAccountType,
                      method_code: '',
                      method_name: '',
                      is_enabled: true,
                      min_withdrawal: 5,
                      max_withdrawal: 1000,
                      exchange_rate: 1,
                    });
                    setShowAddWithdrawalModal(true);
                  }}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Method
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWithdrawalMethods.map((method: WithdrawalMethod) => {
                const logo = getMethodLogo(method);
                
                return (
                  <Card 
                    key={method.id} 
                    className={`bg-slate-900/60 border-l-4 transition-all hover:shadow-lg hover:shadow-violet-500/10 ${
                      method.is_enabled 
                        ? 'border-slate-700/50 hover:border-violet-500/30' 
                        : 'opacity-50 border-slate-700/30'
                    }`}
                    style={{ borderLeftColor: logo.color }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <LogoWithFallback
                            src={logo.url}
                            alt={method.method_name}
                            color={logo.color}
                            className="w-11 h-11 rounded-lg"
                          />
                          <div>
                            <h3 className="font-semibold text-white">{method.method_name}</h3>
                            <p className="text-xs text-slate-500 font-mono">{method.method_code || 'generic'}</p>
                          </div>
                        </div>
                        <Switch
                          checked={method.is_enabled}
                          onCheckedChange={() => handleToggleWithdrawal(method)}
                        />
                      </div>
                      <div className="space-y-1.5 mb-3 text-sm">
                        <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                          <span className="text-slate-400">Min</span>
                          <span className="text-white font-medium font-mono">
                            {COUNTRY_CONFIG[method.country_code]?.currencySymbol}{method.min_withdrawal.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                          <span className="text-slate-400">Max</span>
                          <span className="text-white font-medium font-mono">
                            {COUNTRY_CONFIG[method.country_code]?.currencySymbol}{method.max_withdrawal.toLocaleString()}
                          </span>
                        </div>
                        {method.exchange_rate !== 1 && (
                          <div className="flex justify-between items-center p-2 bg-amber-500/10 rounded">
                            <span className="text-amber-400">Rate</span>
                            <span className="text-amber-300 font-medium">{method.exchange_rate}x</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditWithdrawal(method)}
                          className="flex-1 border-slate-600 hover:bg-slate-800 hover:border-violet-500/50"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteWithdrawal(method.id)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentSettingsManagement;
