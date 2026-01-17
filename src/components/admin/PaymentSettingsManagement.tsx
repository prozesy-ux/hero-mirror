import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { 
  CreditCard, Plus, Edit, Trash2, Save, X, Loader2, 
  Check, QrCode, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import ImageUploader from './ImageUploader';
import { Skeleton } from '@/components/ui/skeleton';

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  icon_url: string | null;
  qr_image_url: string | null;
  account_number: string | null;
  account_name: string | null;
  instructions: string | null;
  is_automatic: boolean;
  is_enabled: boolean;
  display_order: number;
  created_at: string;
}

const PaymentSettingsManagement = () => {
  const { paymentMethods, isLoading, refreshTable } = useAdminDataContext();
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    icon_url: '',
    qr_image_url: '',
    account_number: '',
    account_name: '',
    instructions: '',
    is_automatic: false,
    is_enabled: true,
    display_order: 0
  });

  const methods = paymentMethods as PaymentMethod[];

  const handleAdd = () => {
    setEditingMethod(null);
    setFormData({
      name: '',
      code: '',
      icon_url: '',
      qr_image_url: '',
      account_number: '',
      account_name: '',
      instructions: '',
      is_automatic: false,
      is_enabled: true,
      display_order: methods.length
    });
    setShowModal(true);
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      code: method.code,
      icon_url: method.icon_url || '',
      qr_image_url: method.qr_image_url || '',
      account_number: method.account_number || '',
      account_name: method.account_name || '',
      instructions: method.instructions || '',
      is_automatic: method.is_automatic || false,
      is_enabled: method.is_enabled ?? true,
      display_order: method.display_order || 0
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error('Name and code are required');
      return;
    }

    setSaving(true);

    const payload = {
      name: formData.name.trim(),
      code: formData.code.trim().toLowerCase(),
      icon_url: formData.icon_url || null,
      qr_image_url: formData.qr_image_url || null,
      account_number: formData.account_number || null,
      account_name: formData.account_name || null,
      instructions: formData.instructions || null,
      is_automatic: formData.is_automatic,
      is_enabled: formData.is_enabled,
      display_order: formData.display_order
    };

    // Get admin session token
    const token = localStorage.getItem('admin_session_token');
    if (!token) {
      toast.error('Admin session expired');
      setSaving(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-mutate-data', {
        body: {
          token,
          table: 'payment_methods',
          operation: editingMethod ? 'update' : 'insert',
          data: payload,
          id: editingMethod?.id
        }
      });

      setSaving(false);

      if (error || data?.error) {
        toast.error(data?.error || 'Failed to save payment method');
        console.error(error || data?.error);
      } else {
        toast.success(editingMethod ? 'Payment method updated' : 'Payment method added');
        setShowModal(false);
        refreshTable('payment_methods');
      }
    } catch (err) {
      setSaving(false);
      toast.error('Failed to save payment method');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return;

    setDeletingId(id);

    const token = localStorage.getItem('admin_session_token');
    if (!token) {
      toast.error('Admin session expired');
      setDeletingId(null);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-mutate-data', {
        body: {
          token,
          table: 'payment_methods',
          operation: 'delete',
          id
        }
      });

      setDeletingId(null);

      if (error || data?.error) {
        toast.error(data?.error || 'Failed to delete payment method');
      } else {
        toast.success('Payment method deleted');
        refreshTable('payment_methods');
      }
    } catch (err) {
      setDeletingId(null);
      toast.error('Failed to delete payment method');
      console.error(err);
    }
  };

  const toggleEnabled = async (method: PaymentMethod) => {
    const token = localStorage.getItem('admin_session_token');
    if (!token) {
      toast.error('Admin session expired');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-mutate-data', {
        body: {
          token,
          table: 'payment_methods',
          operation: 'update',
          data: { is_enabled: !method.is_enabled },
          id: method.id
        }
      });

      if (error || data?.error) {
        toast.error(data?.error || 'Failed to update status');
      } else {
        toast.success(method.is_enabled ? 'Payment method disabled' : 'Payment method enabled');
        refreshTable('payment_methods');
      }
    } catch (err) {
      toast.error('Failed to update status');
      console.error(err);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-end mb-6">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
        >
          <Plus size={18} />
          Add Method
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Total Methods</div>
          <div className="text-2xl font-bold text-white">
            {isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : methods.length}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Enabled</div>
          <div className="text-2xl font-bold text-green-400">
            {isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : methods.filter(m => m.is_enabled).length}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-gray-400 text-sm">Automatic</div>
          <div className="text-2xl font-bold text-blue-400">
            {isLoading ? <Skeleton className="h-8 w-12 bg-white/10" /> : methods.filter(m => m.is_automatic).length}
          </div>
        </div>
      </div>

      {/* Payment Methods List */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Method</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Account</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Type</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium text-sm">Status</th>
              <th className="text-right px-6 py-4 text-gray-400 font-medium text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-lg bg-white/10" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24 bg-white/10" />
                        <Skeleton className="h-3 w-16 bg-white/10" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-32 bg-white/10" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full bg-white/10" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full bg-white/10" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-8 w-24 ml-auto bg-white/10" /></td>
                </tr>
              ))
            ) : (
              methods.map((method) => (
                <tr key={method.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {method.icon_url ? (
                        <img 
                          src={method.icon_url} 
                          alt={method.name} 
                          className="w-10 h-10 rounded-lg object-contain bg-white/10 p-1"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                          <CreditCard size={20} className="text-gray-400" />
                        </div>
                      )}
                      <div>
                        <span className="text-white font-medium">{method.name}</span>
                        <p className="text-gray-500 text-xs uppercase">{method.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-400 text-sm">
                      {method.account_number ? (
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-mono">{method.account_number}</p>
                            {method.account_name && (
                              <p className="text-gray-500 text-xs">{method.account_name}</p>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(method.account_number!);
                              toast.success('Account number copied!');
                            }}
                            className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                            title="Copy Account Number"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      method.is_automatic 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {method.is_automatic ? 'Automatic' : 'Manual'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleEnabled(method)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        method.is_enabled 
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                          : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                      }`}
                    >
                      {method.is_enabled ? (
                        <>
                          <Check size={12} />
                          Enabled
                        </>
                      ) : (
                        <>
                          <X size={12} />
                          Disabled
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {method.qr_image_url && (
                        <button
                          onClick={() => window.open(method.qr_image_url!, '_blank')}
                          className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                          title="View QR Code"
                        >
                          <QrCode size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(method)}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(method.id)}
                        disabled={deletingId === method.id}
                        className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
                        title="Delete"
                      >
                        {deletingId === method.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!isLoading && methods.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No payment methods configured
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Stripe, bKash"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="e.g., stripe, bkash"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Account Number</label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                  placeholder="e.g., 01844291940"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              {/* Account Name */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Account Name</label>
                <input
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
                  placeholder="e.g., John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_automatic: !prev.is_automatic }))}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      formData.is_automatic ? 'bg-blue-500' : 'bg-white/20'
                    }`}
                  >
                    <span className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                      formData.is_automatic ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                  <span className="text-gray-400 text-sm">Automatic Payment</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_enabled: !prev.is_enabled }))}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      formData.is_enabled ? 'bg-green-500' : 'bg-white/20'
                    }`}
                  >
                    <span className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                      formData.is_enabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                  <span className="text-gray-400 text-sm">Enabled</span>
                </label>
              </div>

              {/* Icon URL */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">Icon/Logo URL</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={formData.icon_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon_url: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                  {formData.icon_url && (
                    <img src={formData.icon_url} alt="Icon" className="w-12 h-12 rounded-lg object-contain bg-white/10" />
                  )}
                </div>
              </div>

              {/* QR Code URL */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">QR Code URL</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={formData.qr_image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, qr_image_url: e.target.value }))}
                    placeholder="https://example.com/qr.png"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                  {formData.qr_image_url && (
                    <img src={formData.qr_image_url} alt="QR" className="w-12 h-12 rounded-lg object-contain bg-white/10" />
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-2">Instructions</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Payment instructions for users..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {editingMethod ? 'Update' : 'Add'} Payment Method
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSettingsManagement;
