import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, GripVertical, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import ImageUploader from './ImageUploader';
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface Category {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
  color: string | null;
  image_url: string | null;
  category_type: string;
  created_at: string;
}

const BADGE_COLORS = [
  { value: 'violet', label: 'Violet', class: 'bg-violet-500' },
  { value: 'emerald', label: 'Emerald', class: 'bg-emerald-500' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
  { value: 'rose', label: 'Rose', class: 'bg-rose-500' },
  { value: 'amber', label: 'Amber', class: 'bg-amber-500' },
  { value: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
  { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
  { value: 'teal', label: 'Teal', class: 'bg-teal-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
];

const CategoriesManagement = () => {
  const { categories, isLoading, refreshTable, aiAccounts } = useAdminDataContext();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    description: '',
    display_order: 0,
    is_active: true,
    color: 'violet',
    image_url: null as string | null,
    category_type: 'product' as 'product' | 'prompt'
  });

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Category name is required');
      return;
    }

    const token = localStorage.getItem('admin_session_token');
    if (!token) {
      toast.error('Admin session expired. Please login again.');
      return;
    }

    const categoryData = {
      name: formData.name,
      icon: formData.icon || null,
      description: formData.description || null,
      display_order: formData.display_order,
      is_active: formData.is_active,
      color: formData.color,
      image_url: formData.image_url,
      category_type: formData.category_type
    };

    try {
      const { data, error } = await supabase.functions.invoke('admin-mutate-data', {
        body: {
          token,
          table: 'categories',
          operation: editingId ? 'update' : 'insert',
          data: categoryData,
          id: editingId
        }
      });

      if (error || data?.error) {
        console.error('Category save error:', error || data?.error);
        toast.error(data?.error || 'Failed to save category');
        return;
      }

      toast.success(editingId ? 'Category updated' : 'Category created');
      refreshTable('categories');
      resetForm();
    } catch (err) {
      console.error('Category save exception:', err);
      toast.error('Failed to save category');
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      icon: category.icon || '',
      description: category.description || '',
      display_order: category.display_order || 0,
      is_active: category.is_active !== false,
      color: category.color || 'violet',
      image_url: category.image_url,
      category_type: (category.category_type as 'product' | 'prompt') || 'product'
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ open: true, id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return;

    const token = localStorage.getItem('admin_session_token');
    if (!token) {
      toast.error('Admin session expired. Please login again.');
      setDeleteConfirm({ open: false, id: null });
      return;
    }

    setDeleting(true);

    try {
      const { data, error } = await supabase.functions.invoke('admin-mutate-data', {
        body: {
          token,
          table: 'categories',
          operation: 'delete',
          id: deleteConfirm.id
        }
      });

      if (error || data?.error) {
        console.error('Category delete error:', error || data?.error);
        toast.error(data?.error || 'Failed to delete category');
        return;
      }

      toast.success('Category deleted');
      refreshTable('categories');
    } catch (err) {
      console.error('Category delete exception:', err);
      toast.error('Failed to delete category');
    } finally {
      setDeleting(false);
      setDeleteConfirm({ open: false, id: null });
    }
  };

  const handleToggleActive = async (category: Category) => {
    const token = localStorage.getItem('admin_session_token');
    if (!token) {
      toast.error('Admin session expired. Please login again.');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('admin-mutate-data', {
        body: {
          token,
          table: 'categories',
          operation: 'update',
          data: { is_active: !category.is_active },
          id: category.id
        }
      });

      if (error || data?.error) {
        console.error('Category toggle error:', error || data?.error);
        toast.error(data?.error || 'Failed to update category');
        return;
      }

      toast.success(category.is_active ? 'Category hidden' : 'Category visible');
      refreshTable('categories');
    } catch (err) {
      console.error('Category toggle exception:', err);
      toast.error('Failed to update category');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      icon: '',
      description: '',
      display_order: 0,
      is_active: true,
      color: 'violet',
      image_url: null,
      category_type: 'product'
    });
    setEditingId(null);
    setShowForm(false);
  };

  // Count accounts per category
  const getAccountCount = (categoryId: string) => {
    return (aiAccounts as any[]).filter(
      (acc) => acc.category_id === categoryId
    ).length;
  };

  const categoryList = (categories as Category[]).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const getColorClass = (color: string | null) => {
    const found = BADGE_COLORS.find(c => c.value === color);
    return found?.class || 'bg-violet-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-400 text-sm">
          Manage categories for your digital accounts marketplace. Categories appear in user filters.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingId ? 'Edit Category' : 'New Category'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Category Image */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  Category Image (Optional)
                </label>
                {formData.image_url ? (
                  <div className="relative group">
                    <img
                      src={formData.image_url}
                      alt="Category preview"
                      className="w-full h-32 object-cover rounded-lg border border-gray-700"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image_url: null })}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <ImageUploader
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                    bucket="ai-account-images"
                    folder="categories"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Social Media"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Icon (Emoji)</label>
                  <input
                    type="text"
                    placeholder="📱"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>

              {/* Category Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category Type *</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category_type: 'product' })}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.category_type === 'product'
                        ? 'border-violet-500 bg-violet-500/20 text-white'
                        : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <span className="text-lg">🛒</span>
                    <span className="font-medium">Marketplace</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category_type: 'prompt' })}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.category_type === 'prompt'
                        ? 'border-emerald-500 bg-emerald-500/20 text-white'
                        : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    <span className="text-lg">📝</span>
                    <span className="font-medium">Prompts</span>
                  </button>
                </div>
                <p className="text-gray-500 text-xs mt-1.5">
                  {formData.category_type === 'product' 
                    ? 'This category will appear in the AI Accounts marketplace' 
                    : 'This category will appear in the Prompts section'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Brief description of this category"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Badge Color</label>
                  <select
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  >
                    {BADGE_COLORS.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                  <div className={`mt-2 h-6 rounded-full ${getColorClass(formData.color)} flex items-center justify-center`}>
                    <span className="text-white text-xs font-semibold">{formData.name || 'Preview'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                  <p className="text-gray-500 text-xs mt-1">Lower numbers appear first</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div>
                  <span className="text-white font-medium">Active (Visible to users)</span>
                  <p className="text-gray-500 text-xs">Inactive categories won't appear in filters</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                >
                  <Save size={18} />
                  Save
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  <X size={18} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left px-6 py-4 text-gray-400 font-medium w-12">#</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Category</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Type</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Badge</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Accounts</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Status</th>
              <th className="text-right px-6 py-4 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-t border-gray-700">
                  <td className="px-6 py-4"><Skeleton className="h-8 w-8 bg-white/10" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-32 bg-white/10" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-20 bg-white/10" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-20 bg-white/10" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-12 bg-white/10" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-16 bg-white/10" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-8 w-20 ml-auto bg-white/10" /></td>
                </tr>
              ))
            ) : categoryList.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No categories yet. Add your first category to get started.
                </td>
              </tr>
            ) : (
              categoryList.map((category, index) => (
                <tr key={category.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-gray-500 font-medium">{category.display_order || index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {category.image_url ? (
                        <img src={category.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <span className="text-2xl">{category.icon || '📁'}</span>
                      )}
                      <div>
                        <p className="text-white font-medium">{category.name}</p>
                        {category.description && (
                          <p className="text-gray-500 text-sm truncate max-w-[200px]">{category.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      category.category_type === 'prompt' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-violet-500/20 text-violet-400'
                    }`}>
                      {category.category_type === 'prompt' ? '📝 Prompts' : '🛒 Marketplace'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getColorClass(category.color)}`}>
                      {category.name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white font-medium">{getAccountCount(category.id)}</span>
                    <span className="text-gray-500 ml-1">products</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleActive(category)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                        category.is_active !== false
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-600/20 text-gray-400'
                      }`}
                    >
                      {category.is_active !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                      {category.is_active !== false ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-blue-400 hover:bg-gray-700 rounded"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(category.id)}
                        className="p-2 text-red-400 hover:bg-gray-700 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, id: open ? deleteConfirm.id : null })}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
      />
    </div>
  );
};

export default CategoriesManagement;
