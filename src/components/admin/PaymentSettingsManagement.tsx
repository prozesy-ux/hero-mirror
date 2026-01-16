import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  CreditCard, Plus, Trash2, Loader2, ToggleLeft, ToggleRight, 
  Edit2, Save, X, ArrowUp, ArrowDown, Zap, Clock
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  icon_url: string | null;
  account_number: string | null;
  account_name: string | null;
  instructions: string | null;
  is_enabled: boolean;
  is_automatic: boolean;
  display_order: number;
  qr_image_url: string | null;
  created_at: string;
  updated_at: string;
}

const PaymentSettingsManagement = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    icon_url: '',
    account_number: '',
    account_name: '',
    instructions: '',
    is_enabled: true,
    is_automatic: false,
    qr_image_url: ''
  });

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('display_order');
    
    if (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    } else {
      setPaymentMethods(data || []);
    }
    setLoading(false);
  };

  const handleToggleEnabled = async (method: PaymentMethod) => {
    setSaving(method.id);
    
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_enabled: !method.is_enabled })
      .eq('id', method.id);
    
    if (error) {
      toast.error('Failed to update payment method');
    } else {
      toast.success(`${method.name} ${!method.is_enabled ? 'enabled' : 'disabled'}`);
      fetchPaymentMethods();
    }
    setSaving(null);
  };

  const handleMoveOrder = async (method: PaymentMethod, direction: 'up' | 'down') => {
    const currentIndex = paymentMethods.findIndex(m => m.id === method.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= paymentMethods.length) return;
    
    const targetMethod = paymentMethods[targetIndex];
    
    // Swap display orders
    await Promise.all([
      supabase.from('payment_methods').update({ display_order: targetMethod.display_order }).eq('id', method.id),
      supabase.from('payment_methods').update({ display_order: method.display_order }).eq('id', targetMethod.id)
    ]);
    
    fetchPaymentMethods();
  };

  const handleDelete = async (method: PaymentMethod) => {
    if (!confirm(`Are you sure you want to delete ${method.name}?`)) return;
    
    setSaving(method.id);
    
    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', method.id);
    
    if (error) {
      toast.error('Failed to delete payment method');
    } else {
      toast.success(`${method.name} deleted`);
      fetchPaymentMethods();
    }
    setSaving(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      icon_url: '',
      account_number: '',
      account_name: '',
      instructions: '',
      is_enabled: true,
      is_automatic: false,
      qr_image_url: ''
    });
  };

  const openEditModal = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      code: method.code,
      icon_url: method.icon_url || '',
      account_number: method.account_number || '',
      account_name: method.account_name || '',
      instructions: method.instructions || '',
      is_enabled: method.is_enabled,
      is_automatic: method.is_automatic,
      qr_image_url: method.qr_image_url || ''
    });
  };

  const openAddModal = () => {
    resetForm();
    setEditingMethod(null);
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toast.error('Name and code are required');
      return;
    }
    
    setSaving('form');
    
    const payload = {
      name: formData.name,
      code: formData.code.toLowerCase().replace(/\s+/g, '-'),
      icon_url: formData.icon_url || null,
      account_number: formData.account_number || null,
      account_name: formData.account_name || null,
      instructions: formData.instructions || null,
      is_enabled: formData.is_enabled,
      is_automatic: formData.is_automatic,
      qr_image_url: formData.qr_image_url || null
    };
    
    if (editingMethod) {
      const { error } = await supabase
        .from('payment_methods')
        .update(payload)
        .eq('id', editingMethod.id);
      
      if (error) {
        toast.error('Failed to update payment method');
      } else {
        toast.success(`${formData.name} updated`);
        setEditingMethod(null);
        fetchPaymentMethods();
      }
    } else {
      const maxOrder = Math.max(...paymentMethods.map(m => m.display_order), 0);
      const { error } = await supabase
        .from('payment_methods')
        .insert({ ...payload, display_order: maxOrder + 1 });
      
      if (error) {
        if (error.code === '23505') {
          toast.error('A payment method with this code already exists');
        } else {
          toast.error('Failed to add payment method');
        }
      } else {
        toast.success(`${formData.name} added`);
        setShowAddModal(false);
        resetForm();
        fetchPaymentMethods();
      }
    }
    
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header - Add Method Button Only */}
      <div className="flex items-center justify-end mb-6">
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition-colors"
        >
          <Plus size={18} />
          Add Method
        </button>
      </div>

      {/* Payment Methods List */}
      <div className="space-y-3">
        {paymentMethods.map((method, index) => (
          <div 
            key={method.id}
            className={`bg-[#111113] border border-[#27272a] rounded-xl p-4 transition-all hover:border-[#3f3f46] ${
              !method.is_enabled ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Logo */}
                <div className="w-14 h-14 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center overflow-hidden">
                  {method.icon_url ? (
                    <img 
                      src={method.icon_url} 
                      alt={method.name} 
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <CreditCard size={24} className="text-gray-400" />
                  )}
                </div>
                
                {/* Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold">{method.name}</h3>
                    {method.is_automatic ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                        <Zap size={10} /> Automatic
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                        <Clock size={10} /> Manual
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">Code: {method.code}</p>
                  {method.account_number && (
                    <p className="text-gray-400 text-sm mt-1">
                      Account: <span className="font-mono">{method.account_number}</span>
                      {method.account_name && <span className="text-gray-500"> ({method.account_name})</span>}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Reorder buttons */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMoveOrder(method, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => handleMoveOrder(method, 'down')}
                    disabled={index === paymentMethods.length - 1}
                    className="p-1 rounded bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
                
                {/* Toggle */}
                <button
                  onClick={() => handleToggleEnabled(method)}
                  disabled={saving === method.id}
                  className={`p-2 rounded-lg transition-all ${
                    method.is_enabled 
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                  title={method.is_enabled ? 'Disable' : 'Enable'}
                >
                  {saving === method.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : method.is_enabled ? (
                    <ToggleRight size={18} />
                  ) : (
                    <ToggleLeft size={18} />
                  )}
                </button>
                
                {/* Edit */}
                <button
                  onClick={() => openEditModal(method)}
                  className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                  title="Edit"
                >
                  <Edit2 size={18} />
                </button>
                
                {/* Delete */}
                <button
                  onClick={() => handleDelete(method)}
                  disabled={saving === method.id}
                  className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
                  title="Delete"
                >
                  {saving === method.id ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {paymentMethods.length === 0 && (
          <div className="text-center py-12 text-zinc-400 bg-[#111113] rounded-xl border border-[#27272a]">
            No payment methods configured. Add one to get started.
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal || !!editingMethod} onOpenChange={(open) => {
        if (!open) {
          setShowAddModal(false);
          setEditingMethod(null);
          resetForm();
        }
      }}>
        <DialogContent className="bg-[#1a1a24] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., bKash"
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-400">Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., bkash"
                  className="bg-white/5 border-white/10 text-white mt-1"
                  disabled={!!editingMethod}
                />
              </div>
            </div>
            
            <div>
              <Label className="text-gray-400">Logo URL</Label>
              <Input
                value={formData.icon_url}
                onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="bg-white/5 border-white/10 text-white mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Account Number</Label>
                <Input
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="e.g., 01712-XXXXXX"
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-400">Account Name</Label>
                <Input
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="Account holder name"
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-gray-400">Instructions for Users</Label>
              <Textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                placeholder="Instructions shown to users when they select this payment method..."
                className="bg-white/5 border-white/10 text-white mt-1 min-h-[80px]"
              />
            </div>
            
            {/* QR Code Upload - Only for Manual Payments */}
            {!formData.is_automatic && (
              <div>
                <Label className="text-gray-400 mb-2 block">QR Code Image (Optional)</Label>
                <div className="flex items-start gap-4">
                  {formData.qr_image_url ? (
                    <div className="relative">
                      <img 
                        src={formData.qr_image_url} 
                        alt="QR Code" 
                        className="w-32 h-32 object-contain border border-white/10 rounded-lg bg-white p-2"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, qr_image_url: '' })}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <Input
                        value={formData.qr_image_url}
                        onChange={(e) => setFormData({ ...formData, qr_image_url: e.target.value })}
                        placeholder="https://example.com/qr-code.png"
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <p className="text-gray-500 text-xs mt-1">Paste QR code image URL for manual payments</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <p className="text-white font-medium">Automatic Payment</p>
                <p className="text-gray-400 text-sm">Process payments automatically (like Stripe)</p>
              </div>
              <Switch
                checked={formData.is_automatic}
                onCheckedChange={(checked) => setFormData({ ...formData, is_automatic: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <p className="text-white font-medium">Enabled</p>
                <p className="text-gray-400 text-sm">Show this payment method to users</p>
              </div>
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setEditingMethod(null);
                resetForm();
              }}
              className="border-white/10 text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving === 'form'}
              className="bg-white text-black hover:bg-white/90"
            >
              {saving === 'form' ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              {editingMethod ? 'Update' : 'Add Method'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentSettingsManagement;
