import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Loader2, Bot, Save, X, Image as ImageIcon, TrendingUp, Star, Tag, MessageCircle, RefreshCw, Package, Grid, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { toast } from 'sonner';
import ImageUploader from './ImageUploader';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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
  chat_allowed: boolean;
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
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

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
    chat_allowed: true,
    display_order: 0,
    tags: [] as string[],
    icon_url: null as string | null
  });

  const accounts = aiAccounts as AIAccount[];
  const categoryList = (categories as Category[]).filter(c => c.is_active !== false);

  const stats = useMemo(() => {
    const total = accounts.length;
    const available = accounts.filter(a => a.is_available).length;
    const featured = accounts.filter(a => a.is_featured).length;
    const trending = accounts.filter(a => a.is_trending).length;
    return { total, available, featured, trending };
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    switch (activeTab) {
      case 'featured':
        return accounts.filter(a => a.is_featured);
      case 'trending':
        return accounts.filter(a => a.is_trending);
      case 'available':
        return accounts.filter(a => a.is_available);
      default:
        return accounts;
    }
  }, [accounts, activeTab]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshTable('ai_accounts');
    await refreshTable('categories');
    setRefreshing(false);
    toast.success('Data refreshed');
  };

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
      chat_allowed: formData.chat_allowed,
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
      chat_allowed: account.chat_allowed !== false,
      display_order: account.display_order || 0,
      tags: account.tags || [],
      icon_url: account.icon_url
    });
    setShowForm(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ open: true, id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return;

    setDeleting(true);
    const { error } = await supabase
      .from('ai_accounts')
      .delete()
      .eq('id', deleteConfirm.id);

    if (error) {
      toast.error('Failed to delete account');
    } else {
      toast.success('Account deleted');
      refreshTable('ai_accounts');
    }
    setDeleting(false);
    setDeleteConfirm({ open: false, id: null });
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
      chat_allowed: true,
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
    <div className="min-h-screen bg-slate-950">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Total Accounts</p>
              <p className="text-3xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-8 w-16 bg-slate-700" /> : stats.total}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <Package className="h-7 w-7 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Available</p>
              <p className="text-3xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-8 w-16 bg-slate-700" /> : stats.available}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-violet-500/20 flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-violet-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Featured</p>
              <p className="text-3xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-8 w-16 bg-slate-700" /> : stats.featured}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
              <Star className="h-7 w-7 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Trending</p>
              <p className="text-3xl font-bold text-white mt-1">
                {isLoading ? <Skeleton className="h-8 w-16 bg-slate-700" /> : stats.trending}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="h-7 w-7 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs with Refresh on same row */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-slate-900/50 border border-slate-800 p-1 rounded-xl">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4"
            >
              <Grid className="h-4 w-4 mr-2" />
              All
            </TabsTrigger>
            <TabsTrigger 
              value="featured" 
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4"
            >
              <Star className="h-4 w-4 mr-2" />
              Featured
            </TabsTrigger>
            <TabsTrigger 
              value="trending" 
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger 
              value="available" 
              className="data-[state=active]:bg-violet-600 data-[state=active]:text-white text-slate-400 rounded-lg px-4"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Available
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={refreshing || isLoading}
              className="bg-slate-900/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          {/* Accounts Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                  <Skeleton className="h-40 w-full bg-slate-700 rounded-xl mb-4" />
                  <Skeleton className="h-6 w-3/4 bg-slate-700 mb-2" />
                  <Skeleton className="h-4 w-1/2 bg-slate-700" />
                </div>
              ))}
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
              <Bot className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Accounts Found</h3>
              <p className="text-slate-400">
                {activeTab === 'all' ? 'Add your first AI account to get started' : `No ${activeTab} accounts found`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAccounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors"
                >
                  {/* Image */}
                  <div className="relative h-40 bg-slate-800">
                    {account.icon_url ? (
                      <img
                        src={account.icon_url}
                        alt={account.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Bot className="h-16 w-16 text-slate-600" />
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {account.is_featured && (
                        <span className="px-2 py-1 bg-amber-500/90 text-white text-xs font-medium rounded-lg flex items-center gap-1">
                          <Star className="h-3 w-3" /> Featured
                        </span>
                      )}
                      {account.is_trending && (
                        <span className="px-2 py-1 bg-blue-500/90 text-white text-xs font-medium rounded-lg flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" /> Trending
                        </span>
                      )}
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="absolute top-3 right-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(account)}
                        className="p-2 bg-slate-900/80 text-white rounded-lg hover:bg-slate-800"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(account.id)}
                        className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-semibold text-lg">{account.name}</h3>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(account.category_id)} text-white mt-1`}>
                          {getCategoryName(account.category_id)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-emerald-400">${account.price}</p>
                        {account.original_price && (
                          <p className="text-sm text-slate-500 line-through">${account.original_price}</p>
                        )}
                      </div>
                    </div>

                    {account.description && (
                      <p className="text-slate-400 text-sm line-clamp-2 mb-4">{account.description}</p>
                    )}

                    {/* Toggle Switches */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                      <button
                        onClick={() => handleQuickToggle(account, 'is_available')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          account.is_available
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {account.is_available ? 'Available' : 'Unavailable'}
                      </button>
                      <button
                        onClick={() => handleQuickToggle(account, 'is_featured')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          account.is_featured
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        <Star className="h-3 w-3 inline mr-1" />
                        Featured
                      </button>
                      <button
                        onClick={() => handleQuickToggle(account, 'is_trending')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          account.is_trending
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        <TrendingUp className="h-3 w-3 inline mr-1" />
                        Trending
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  Product Image
                </label>
                {formData.icon_url ? (
                  <div className="relative group">
                    <img
                      src={formData.icon_url}
                      alt="Product preview"
                      className="w-full h-40 object-cover rounded-xl border border-slate-700"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
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
                  <label className="block text-sm font-medium text-slate-300 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="ChatGPT Premium Account"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    rows={3}
                    placeholder="Premium AI account with full access"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
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
                  <label className="block text-sm font-medium text-slate-300 mb-1">Stock (optional)</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    min="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Unlimited"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    required
                    min="0"
                    step="0.01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Original Price (for discount)</label>
                  <input
                    type="number"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    min="0"
                    step="0.01"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Shows crossed-out price"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <p className="text-slate-500 text-xs mt-1">Lower numbers appear first</p>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Tags (for search)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Add tag and press Enter"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-slate-700 text-white rounded-full text-sm flex items-center gap-1"
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
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-white text-sm">Available</span>
                  </div>
                  <Switch
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Star className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-white text-sm">Featured</span>
                  </div>
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-white text-sm">Trending</span>
                  </div>
                  <Switch
                    checked={formData.is_trending}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_trending: checked })}
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-violet-400" />
                    </div>
                    <span className="text-white text-sm">Chat Allowed</span>
                  </div>
                  <Switch
                    checked={formData.chat_allowed}
                    onCheckedChange={(checked) => setFormData({ ...formData, chat_allowed: checked })}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {editingAccount ? 'Update Account' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAccountsManagement;
