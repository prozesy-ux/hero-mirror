import { useState } from 'react';
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
  const [selectedCountry, setSelectedCountry] = useState('BD');
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAll();
    setIsRefreshing(false);
    toast.success('Data refreshed');
  };

  // Filter withdrawal methods by country and type
  const filteredWithdrawalMethods = (withdrawalMethodConfig || []).filter(
    (m: WithdrawalMethod) => 
      m.country_code === selectedCountry && 
      m.account_type === selectedAccountType
  );

  // Stats calculations
  const depositStats = {
    total: paymentMethods.length,
    active: paymentMethods.filter((m: DepositMethod) => m.is_enabled).length,
    automatic: paymentMethods.filter((m: DepositMethod) => m.is_automatic).length,
  };

  const withdrawalStats = {
    countries: [...new Set((withdrawalMethodConfig || []).map((m: WithdrawalMethod) => m.country_code))].length,
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

  return (
    <div className="space-y-6">
      {/* Header with tabs and refresh */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger 
              value="deposit" 
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
            >
              <ArrowDownToLine className="w-4 h-4 mr-2" />
              Deposit Methods
            </TabsTrigger>
            <TabsTrigger 
              value="withdrawal"
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white"
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
          className="border-slate-600"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Deposit Methods Tab */}
      {activeTab === 'deposit' && (
        <div className="space-y-6">
          {/* Deposit Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Gateways</p>
                    <p className="text-2xl font-bold text-emerald-400">{depositStats.total}</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-emerald-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Active</p>
                    <p className="text-2xl font-bold text-green-400">{depositStats.active}</p>
                  </div>
                  <Check className="w-8 h-8 text-green-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Automatic</p>
                    <p className="text-2xl font-bold text-blue-400">{depositStats.automatic}</p>
                  </div>
                  <Settings className="w-8 h-8 text-blue-500/50" />
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
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Deposit Method
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700 max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingDeposit ? 'Edit' : 'Add'} Deposit Method</DialogTitle>
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
                  <div className="flex items-center gap-4">
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
                    <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg">
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
                    <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg">
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
                    {editingDeposit ? 'Update' : 'Add'} Method
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
                <Card key={method.id} className={`bg-slate-900/50 border-slate-700 ${!method.is_enabled ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <LogoWithFallback
                          src={method.icon_url || logo.url}
                          alt={method.name}
                          color={logo.color}
                          className="w-10 h-10"
                        />
                        <div>
                          <h3 className="font-semibold text-white">{method.name}</h3>
                          <p className="text-xs text-slate-400">{method.code}</p>
                        </div>
                      </div>
                      <Switch
                        checked={method.is_enabled}
                        onCheckedChange={() => handleToggleDeposit(method)}
                      />
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={method.is_automatic ? 'default' : 'secondary'} className="text-xs">
                        {method.is_automatic ? 'Automatic' : 'Manual'}
                      </Badge>
                      {method.currency_code && (
                        <Badge variant="outline" className="text-xs">
                          {method.currency_code}
                        </Badge>
                      )}
                    </div>
                    {method.is_automatic && method.api_key && (
                      <div className="mb-3 p-2 bg-slate-800/50 rounded text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">API Key:</span>
                          <button
                            onClick={() => setShowSecrets({ ...showSecrets, [method.id]: !showSecrets[method.id] })}
                            className="text-slate-500 hover:text-slate-300"
                          >
                            {showSecrets[method.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                        <span className="text-slate-300 font-mono">
                          {showSecrets[method.id] ? method.api_key : '••••••••••••'}
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
                        className="flex-1 border-slate-600"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteDeposit(method.id)}
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

      {/* Withdrawal Methods Tab */}
      {activeTab === 'withdrawal' && (
        <div className="space-y-6">
          {/* Withdrawal Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Countries</p>
                    <p className="text-2xl font-bold text-violet-400">{withdrawalStats.countries}</p>
                  </div>
                  <Globe className="w-8 h-8 text-violet-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Enabled Methods</p>
                    <p className="text-2xl font-bold text-purple-400">{withdrawalStats.enabled}</p>
                  </div>
                  <Check className="w-8 h-8 text-purple-500/50" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-fuchsia-500/10 to-fuchsia-600/5 border-fuchsia-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Total Methods</p>
                    <p className="text-2xl font-bold text-fuchsia-400">{withdrawalStats.total}</p>
                  </div>
                  <Wallet className="w-8 h-8 text-fuchsia-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Country and Type Filters */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-sm text-slate-400 mb-1 block">Country</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="bg-slate-800 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600 max-h-[300px]">
                  {Object.entries(COUNTRY_CONFIG).map(([code, config]) => (
                    <SelectItem key={code} value={code}>
                      <span className="flex items-center gap-2">
                        <span>{config.flag}</span>
                        <span>{config.name}</span>
                        <span className="text-slate-400 text-xs">({config.currency})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              {ACCOUNT_TYPES.map((type) => (
                <Button
                  key={type.code}
                  variant={selectedAccountType === type.code ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedAccountType(type.code as any)}
                  className={
                    selectedAccountType === type.code
                      ? 'bg-violet-600 hover:bg-violet-700'
                      : 'border-slate-600'
                  }
                >
                  {getAccountTypeIcon(type.code)}
                  <span className="ml-2 hidden sm:inline">{type.label}</span>
                </Button>
              ))}
            </div>

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
                <Button className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Method
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700 max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingWithdrawal ? 'Edit' : 'Add'} Withdrawal Method</DialogTitle>
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
                      <p className="text-xs text-slate-500 mt-1">Leave empty for generic type</p>
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
                          className="w-12 h-10 p-1 bg-slate-800 border-slate-600"
                        />
                        <Input
                          value={withdrawalForm.brand_color || '#6366F1'}
                          onChange={(e) => setWithdrawalForm({ ...withdrawalForm, brand_color: e.target.value })}
                          className="flex-1 bg-slate-800 border-slate-600"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={withdrawalForm.is_enabled}
                      onCheckedChange={(checked) => setWithdrawalForm({ ...withdrawalForm, is_enabled: checked })}
                    />
                    <Label>Enabled</Label>
                  </div>
                  <div>
                    <Label>Custom Logo URL (optional)</Label>
                    <Input
                      value={withdrawalForm.custom_logo_url || ''}
                      onChange={(e) => setWithdrawalForm({ ...withdrawalForm, custom_logo_url: e.target.value })}
                      placeholder="https://..."
                      className="bg-slate-800 border-slate-600"
                    />
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

          {/* Selected Country Info */}
          <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
            <span className="text-3xl">{COUNTRY_CONFIG[selectedCountry]?.flag}</span>
            <div>
              <h3 className="font-semibold text-white">{COUNTRY_CONFIG[selectedCountry]?.name}</h3>
              <p className="text-sm text-slate-400">
                Currency: {COUNTRY_CONFIG[selectedCountry]?.currency} ({COUNTRY_CONFIG[selectedCountry]?.currencySymbol})
              </p>
            </div>
            <div className="ml-auto">
              <Badge variant="outline" className="text-violet-400 border-violet-500/50">
                {filteredWithdrawalMethods.length} methods configured
              </Badge>
            </div>
          </div>

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
                const logo = getPaymentLogo(method.method_code || method.account_type);
                const brandColor = method.brand_color || logo.color;
                
                return (
                  <Card 
                    key={method.id} 
                    className={`bg-slate-900/50 border-slate-700 ${!method.is_enabled ? 'opacity-60' : ''}`}
                    style={{ borderLeftColor: brandColor, borderLeftWidth: '3px' }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <LogoWithFallback
                            src={method.custom_logo_url || logo.url}
                            alt={method.method_name}
                            color={brandColor}
                            className="w-10 h-10"
                          />
                          <div>
                            <h3 className="font-semibold text-white">{method.method_name}</h3>
                            <p className="text-xs text-slate-400">{method.method_code || 'Generic'}</p>
                          </div>
                        </div>
                        <Switch
                          checked={method.is_enabled}
                          onCheckedChange={() => handleToggleWithdrawal(method)}
                        />
                      </div>
                      <div className="space-y-2 mb-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Min:</span>
                          <span className="text-white font-medium">
                            {COUNTRY_CONFIG[method.country_code]?.currencySymbol}{method.min_withdrawal.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Max:</span>
                          <span className="text-white font-medium">
                            {COUNTRY_CONFIG[method.country_code]?.currencySymbol}{method.max_withdrawal.toLocaleString()}
                          </span>
                        </div>
                        {method.exchange_rate !== 1 && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Rate:</span>
                            <span className="text-yellow-400 font-medium">{method.exchange_rate}x</span>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditWithdrawal(method)}
                          className="flex-1 border-slate-600"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteWithdrawal(method.id)}
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
