import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Prompt {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  tool: string;
  is_free: boolean;
  is_featured: boolean;
  category_id: string | null;
  categories?: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

const PromptsManagement = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    tool: 'ChatGPT',
    is_free: false,
    is_featured: false,
    category_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [{ data: promptsData }, { data: categoriesData }] = await Promise.all([
      supabase.from('prompts').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('id, name').order('name')
    ]);

    setPrompts(promptsData || []);
    setCategories(categoriesData || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }

    const promptData = {
      title: formData.title,
      description: formData.description || null,
      content: formData.content || null,
      tool: formData.tool,
      is_free: formData.is_free,
      is_featured: formData.is_featured,
      category_id: formData.category_id || null
    };

    if (editingId) {
      const { error } = await supabase.from('prompts').update(promptData).eq('id', editingId);
      if (error) toast.error('Failed to update prompt');
      else {
        toast.success('Prompt updated');
        fetchData();
      }
    } else {
      const { error } = await supabase.from('prompts').insert(promptData);
      if (error) toast.error('Failed to create prompt');
      else {
        toast.success('Prompt created');
        fetchData();
      }
    }
    resetForm();
  };

  const handleEdit = (prompt: Prompt) => {
    setFormData({
      title: prompt.title,
      description: prompt.description || '',
      content: prompt.content || '',
      tool: prompt.tool,
      is_free: prompt.is_free,
      is_featured: prompt.is_featured,
      category_id: prompt.category_id || ''
    });
    setEditingId(prompt.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prompt?')) return;
    const { error } = await supabase.from('prompts').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else {
      toast.success('Prompt deleted');
      fetchData();
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', content: '', tool: 'ChatGPT', is_free: false, is_featured: false, category_id: '' });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Prompts Management</h2>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
          <Plus size={18} />Add Prompt
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">{editingId ? 'Edit Prompt' : 'New Prompt'}</h3>
          <div className="space-y-4">
            <input type="text" placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white" />
            <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white h-20" />
            <textarea placeholder="Prompt content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white h-32" />
            <div className="grid md:grid-cols-3 gap-4">
              <select value={formData.tool} onChange={(e) => setFormData({ ...formData, tool: e.target.value })} className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white">
                <option value="ChatGPT">ChatGPT</option>
                <option value="Midjourney">Midjourney</option>
                <option value="Claude">Claude</option>
                <option value="DALL-E">DALL-E</option>
              </select>
              <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white">
                <option value="">No Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={formData.is_free} onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })} className="w-4 h-4" />Free</label>
                <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} className="w-4 h-4" />Featured</label>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"><Save size={18} />Save</button>
              <button onClick={resetForm} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"><X size={18} />Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Title</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Tool</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Category</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Status</th>
              <th className="text-right px-6 py-4 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {prompts.map((prompt) => (
              <tr key={prompt.id} className="border-t border-gray-700">
                <td className="px-6 py-4 text-white font-medium">{prompt.title}</td>
                <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">{prompt.tool}</span></td>
                <td className="px-6 py-4 text-gray-400">{prompt.categories?.name || '-'}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {prompt.is_free && <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded">Free</span>}
                    {prompt.is_featured && <span className="px-2 py-1 bg-purple-900/50 text-purple-400 text-xs rounded">Featured</span>}
                    {!prompt.is_free && <span className="px-2 py-1 bg-yellow-900/50 text-yellow-400 text-xs rounded">Premium</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(prompt)} className="p-2 text-blue-400 hover:bg-gray-700 rounded"><Edit size={18} /></button>
                    <button onClick={() => handleDelete(prompt.id)} className="p-2 text-red-400 hover:bg-gray-700 rounded"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PromptsManagement;
