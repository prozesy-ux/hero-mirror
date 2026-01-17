import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Loader2, Bot, Save, X, Image as ImageIcon, TrendingUp, Star, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { toast } from 'sonner';
import ImageUploader from './ImageUploader';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

interface AIAccount {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  category: string | null;
  category_id: string | null;
  is_available: boolean;
  is_trending: boolean;
  is_featured: boolean;
  display_order: number;
  tags: string[] | null;
  original_price: number | null;
  sold_count: number;
  stock: number | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_active: boolean;
}

const AIAccountsManagement = () => {
  const { aiAccounts, categories, isLoading, refreshTable } = useAdminDataContext();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AIAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 5,
    original_price: '',
    category_id: '',
    stock: '',
    is_available: true,
    is_trending: false,
    is_featured: false,
    display_order: 0,
    tags: [] as string[],
    icon_url: null as string | null
  });

  const accounts = aiAccounts as AIAccount[];
  const categoryList = (categories as Category[]).filter(c => c.is_active !== false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const selectedCategory = categoryList.find(c => c.id === formData.category_id);

    const accountData = {
      name: formData.name,
      description: formData.description || null,
      price: formData.price,
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      category: selectedCategory?.name?.toLowerCase() || 'other',
      category_id: formData.category_id || null,
      stock: formData.stock ? parseInt(formData.stock) : null,
      is_available: formData.is_available,
      is_trending: formData.is_trending,
      is_featured: formData.is_featured,
      display_order: formData.display_order,
      tags: formData.tags.length > 0 ? formData.tags : null,
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
        refreshTable('ai_accounts');
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
        refreshTable('ai_accounts');
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
      original_price: account.original_price?.toString() || '',
      category_id: account.category_id || '',
      stock: account.stock?.toString() || '',
      is_available: account.is_available,
      is_trending: account.is_trending || false,
      is_featured: account.is_featured || false,
      display_order: account.display_order || 0,
      tags: account.tags || [],
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
      refreshTable('ai_accounts');
    }
  };

  const handleQuickToggle = async (account: AIAccount, field: 'is_trending' | 'is_featured' | 'is_available') => {
    const { error } = await supabase
      .from('ai_accounts')
      .update({ [field]: !account[field] })
      .eq('id', account.id);

    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success('Updated');
      refreshTable('ai_accounts');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 5,
      original_price: '',
      category_id: '',
      stock: '',
      is_available: true,
      is_trending: false,
      is_featured: false,
      display_order: 0,
      tags: [],
      icon_url: null
    });
    setTagInput('');
    setEditingAccount(null);
    setShowForm(false);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Uncategorized';
    const cat = categoryList.find(c => c.id === categoryId);
    return cat?.name || 'Uncategorized';
  };

  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return 'bg-gray-500';
    const cat = (categories as Category[]).find(c => c.id === categoryId);
    const colorMap: Record<string, string> = {
      violet: 'bg-violet-500',
      emerald: 'bg-emerald-500',
      blue: 'bg-blue-500',
      rose: 'bg-rose-500',
      amber: 'bg-amber-500',
      cyan: 'bg-cyan-500',
      pink: 'bg-pink-500',
      indigo: 'bg-indigo-500',
      teal: 'bg-teal-500',
      orange: 'bg-orange-500',
    };
    return colorMap[cat?.color || 'violet'] || 'bg-violet-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-400 text-sm">
          Manage digital accounts for your marketplace. Use trending & featured to highlight products.
        </p>
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
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    placeholder="ChatGPT Premium Account"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    rows={3}
                    placeholder="Premium AI account with full access"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">Select category...</option>
                    {categoryList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Price ($) *</label>
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
                  <label className="block text-sm font-medium text-gray-300 mb-1">Original Price (for discount)</label>
                  <input
                    type="number"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    min="0"
                    step="0.01"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    placeholder="Shows crossed-out price"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                  />
                  <p className="text-gray-500 text-xs mt-1">Lower numbers appear first</p>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Tags (for search)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    placeholder="Add tag and press Enter"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-700 text-white rounded-full text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-400"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Toggle Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-white text-sm">Available</span>
                  </div>
                  <Switch
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                  />
                </div>

                <div className="flex items-center justify-between bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-orange-400" />
                    </div>
                    <span className="text-white text-sm">Trending</span>
                  </div>
                  <Switch
                    checked={formData.is_trending}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_trending: checked })}
                  />
                </div>

                <div className="flex items-center justify-between bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Star className="w-4 h-4 text-yellow-400" />
                    </div>
                    <span className="text-white text-sm">Featured</span>
                  </div>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                </div>
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
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
              <Skeleton className="w-full h-32 bg-white/10" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4 bg-white/10" />
                <Skeleton className="h-4 w-1/2 bg-white/10" />
                <Skeleton className="h-8 w-20 bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center">
          <Bot className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Accounts</h3>
          <p className="text-gray-400">Add your first digital account for sale</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`bg-gray-800 rounded-xl overflow-hidden border ${account.is_available ? 'border-gray-700' : 'border-red-500/30'}`}
            >
              {/* Product Image */}
              <div className="relative">
                {account.icon_url ? (
                  <img
                    src={account.icon_url}
                    alt={account.name}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                    <Bot className="w-12 h-12 text-gray-500" />
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {account.is_trending && (
                    <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                      <TrendingUp size={10} /> Trending
                    </span>
                  )}
                  {account.is_featured && (
                    <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full flex items-center gap-1">
                      <Star size={10} /> Featured
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white line-clamp-1">{account.name}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold text-white ${getCategoryColor(account.category_id)}`}>
                      {getCategoryName(account.category_id)}
                    </span>
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

                {/* Tags */}
                {account.tags && account.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {account.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                    {account.tags.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs">
                        +{account.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-2xl font-bold text-white">${account.price}</span>
                    {account.original_price && (
                      <span className="text-gray-500 line-through ml-2">${account.original_price}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {account.stock !== null && (
                      <span className="text-gray-400">Stock: {account.stock}</span>
                    )}
                  </div>
                </div>

                {/* Quick Toggles */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => handleQuickToggle(account, 'is_trending')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                      account.is_trending
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    <TrendingUp size={12} />
                    Trending
                  </button>
                  <button
                    onClick={() => handleQuickToggle(account, 'is_featured')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${
                      account.is_featured
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    <Star size={12} />
                    Featured
                  </button>
                  <button
                    onClick={() => handleQuickToggle(account, 'is_available')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${
                      account.is_available
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {account.is_available ? 'Active' : 'Hidden'}
                  </button>
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
