import { useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface Category {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  created_at: string;
}

const CategoriesManagement = () => {
  const { categories, isLoading, refreshTable } = useAdminDataContext();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: '', description: '' });

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Category name is required');
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from('categories')
        .update({
          name: formData.name,
          icon: formData.icon || null,
          description: formData.description || null
        })
        .eq('id', editingId);

      if (error) {
        toast.error('Failed to update category');
      } else {
        toast.success('Category updated');
        refreshTable('categories');
      }
    } else {
      const { error } = await supabase
        .from('categories')
        .insert({
          name: formData.name,
          icon: formData.icon || null,
          description: formData.description || null
        });

      if (error) {
        toast.error('Failed to create category');
      } else {
        toast.success('Category created');
        refreshTable('categories');
      }
    }

    resetForm();
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      icon: category.icon || '',
      description: category.description || ''
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete category');
    } else {
      toast.success('Category deleted');
      refreshTable('categories');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', icon: '', description: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const categoryList = categories as Category[];

  return (
    <div>
      <div className="flex items-center justify-end mb-6">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingId ? 'Edit Category' : 'New Category'}
          </h3>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Category name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
            <input
              type="text"
              placeholder="Icon (emoji)"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
            <input
              type="text"
              placeholder="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              <Save size={18} />
              Save
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              <X size={18} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Icon</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Name</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Description</th>
              <th className="text-right px-6 py-4 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-t border-gray-700">
                  <td className="px-6 py-4"><Skeleton className="h-8 w-8 bg-white/10" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-32 bg-white/10" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-48 bg-white/10" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-8 w-20 ml-auto bg-white/10" /></td>
                </tr>
              ))
            ) : (
              categoryList.map((category) => (
                <tr key={category.id} className="border-t border-gray-700">
                  <td className="px-6 py-4 text-2xl">{category.icon || '📁'}</td>
                  <td className="px-6 py-4 text-white font-medium">{category.name}</td>
                  <td className="px-6 py-4 text-gray-400">{category.description || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-blue-400 hover:bg-gray-700 rounded"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
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
    </div>
  );
};

export default CategoriesManagement;
