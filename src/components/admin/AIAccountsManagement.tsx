import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, Bot, Save, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ImageUploader from './ImageUploader';

interface AIAccount {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  category: string | null;
  is_available: boolean;
  stock: number | null;
  created_at: string;
}

const AIAccountsManagement = () => {
  const [accounts, setAccounts] = useState<AIAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AIAccount | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 5,
    category: 'chatgpt',
    stock: '',
    is_available: true,
    icon_url: null as string | null
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('ai_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAccounts(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const accountData = {
      name: formData.name,
      description: formData.description || null,
      price: formData.price,
      category: formData.category,
      stock: formData.stock ? parseInt(formData.stock) : null,
      is_available: formData.is_available,
      icon_url: formData.icon_url
    };

    if (editingAccount) {
      const { error } = await supabase
        .from('ai_accounts')
        .update(accountData)
        .eq('id', editingAccount.id);

      if (error) {
        toast.error('Failed to update account');
      } else {
        toast.success('Account updated successfully');
        fetchAccounts();
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('ai_accounts')
        .insert(accountData);

      if (error) {
        toast.error('Failed to create account');
      } else {
        toast.success('Account created successfully');
        fetchAccounts();
        resetForm();
      }
    }

    setSaving(false);
  };

  const handleEdit = (account: AIAccount) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      description: account.description || '',
      price: account.price,
      category: account.category || 'chatgpt',
      stock: account.stock?.toString() || '',
      is_available: account.is_available,
      icon_url: account.icon_url
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    const { error } = await supabase
      .from('ai_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete account');
    } else {
      toast.success('Account deleted');
      fetchAccounts();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 5,
      category: 'chatgpt',
      stock: '',
      is_available: true,
      icon_url: null
    });
    setEditingAccount(null);
    setShowForm(false);
  };

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case 'chatgpt': return '🤖';
      case 'claude': return '🧠';
      case 'midjourney': return '🎨';
      case 'gemini': return '✨';
      default: return '🔮';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">AI Accounts</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Account
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  Product Image
                </label>
                {formData.icon_url ? (
                  <div className="relative group">
                    <img
                      src={formData.icon_url}
                      alt="Product preview"
                      className="w-full h-40 object-cover rounded-lg border border-gray-700"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, icon_url: null })}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <ImageUploader
                    value={formData.icon_url}
                    onChange={(url) => setFormData({ ...formData, icon_url: url })}
                    bucket="ai-account-images"
                    folder="products"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  placeholder="ChatGPT Premium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  rows={3}
                  placeholder="Premium AI account with full access"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Price ($)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    required
                    min="0"
                    step="0.01"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Stock (optional)</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    min="0"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="chatgpt">ChatGPT</option>
                  <option value="claude">Claude</option>
                  <option value="midjourney">Midjourney</option>
                  <option value="gemini">Gemini</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-purple-600"
                />
                <label htmlFor="is_available" className="text-sm text-gray-300">Available for purchase</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingAccount ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center">
          <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No AI Accounts</h3>
          <p className="text-gray-400">Add your first AI account for sale</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`bg-gray-800 rounded-xl overflow-hidden border ${account.is_available ? 'border-gray-700' : 'border-red-500/30'}`}
            >
              {/* Product Image */}
              {account.icon_url ? (
                <img
                  src={account.icon_url}
                  alt={account.name}
                  className="w-full h-32 object-cover"
                />
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                  <span className="text-5xl">{getCategoryIcon(account.category)}</span>
                </div>
              )}
              
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{account.name}</h3>
                    <span className="text-sm text-gray-400 capitalize">{account.category}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(account)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{account.description}</p>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-2xl font-bold text-white">${account.price}</span>
                  <div className="flex items-center gap-2">
                    {account.stock !== null && (
                      <span className="text-gray-400">Stock: {account.stock}</span>
                    )}
                    <span className={`px-2 py-1 rounded-full text-xs ${account.is_available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {account.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIAccountsManagement;
