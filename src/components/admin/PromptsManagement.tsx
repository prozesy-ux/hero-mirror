import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Eye, Image, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import RichTextEditor from './RichTextEditor';
import ImageUploader from './ImageUploader';

interface Prompt {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  image_url: string | null;
  tool: string;
  is_free: boolean;
  is_featured: boolean;
  is_trending?: boolean;
  category_id: string | null;
  categories?: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

interface AITool {
  id: string;
  name: string;
  is_active: boolean;
}

const PromptsManagement = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [aiTools, setAITools] = useState<AITool[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewPrompt, setPreviewPrompt] = useState<Prompt | null>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    image_url: null as string | null,
    tool: 'ChatGPT',
    is_free: false,
    is_featured: false,
    is_trending: false,
    category_id: ''
  });

  useEffect(() => {
    fetchData();

    // Subscribe to realtime updates for prompts
    const channel = supabase
      .channel('admin-prompts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prompts'
        },
        () => {
          // Refetch data when prompts change
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [{ data: promptsData, error: promptsError }, { data: categoriesData }, { data: toolsData }] = await Promise.all([
        supabase.from('prompts').select('id, title, description, content, image_url, tool, is_free, is_featured, category_id, categories(name)').order('created_at', { ascending: false }),
        supabase.from('categories').select('id, name').order('name'),
        supabase.from('ai_tools').select('id, name, is_active').eq('is_active', true).order('display_order')
      ]);

      if (promptsError) {
        console.error('Error fetching prompts:', promptsError);
        toast.error('Failed to load prompts');
      }

      setPrompts(promptsData || []);
      setCategories(categoriesData || []);
      setAITools(toolsData || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);

    const promptData = {
      title: formData.title,
      description: formData.description || null,
      content: formData.content || null,
      image_url: formData.image_url,
      tool: formData.tool,
      is_free: formData.is_free,
      is_featured: formData.is_featured,
      is_trending: formData.is_trending,
      category_id: formData.category_id || null
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('prompts').update(promptData).eq('id', editingId);
        if (error) {
          console.error('Update error:', error);
          toast.error(`Failed to update: ${error.message}`);
        } else {
          toast.success('Prompt updated successfully!');
          resetForm();
        }
      } else {
        const { error } = await supabase.from('prompts').insert(promptData);
        if (error) {
          console.error('Insert error:', error);
          toast.error(`Failed to create: ${error.message}`);
        } else {
          toast.success('Prompt created successfully!');
          resetForm();
        }
      }
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error?.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setFormData({
      title: prompt.title,
      description: prompt.description || '',
      content: prompt.content || '',
      image_url: prompt.image_url,
      tool: prompt.tool,
      is_free: prompt.is_free,
      is_featured: prompt.is_featured,
      is_trending: prompt.is_trending || false,
      category_id: prompt.category_id || ''
    });
    setEditingId(prompt.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prompt?')) return;

    setDeleting(id);

    try {
      const { error } = await supabase.from('prompts').delete().eq('id', id);
      if (error) {
        console.error('Delete error:', error);
        toast.error(`Failed to delete: ${error.message}`);
      } else {
        toast.success('Prompt deleted successfully!');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error?.message || 'Failed to delete prompt');
    } finally {
      setDeleting(null);
    }
  };

  const resetForm = () => {
    setFormData({ 
      title: '', 
      description: '', 
      content: '', 
      image_url: null,
      tool: 'ChatGPT', 
      is_free: false, 
      is_featured: false,
      is_trending: false, 
      category_id: '' 
    });
    setEditingId(null);
    setShowForm(false);
  };

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
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
      <div className="flex items-center justify-end mb-6">
        <button 
          onClick={() => setShowForm(true)} 
          className="flex items-center gap-2 bg-white text-black font-semibold px-4 py-2 rounded-lg hover:bg-white/90 transition-colors"
        >
          <Plus size={18} />
          Add Prompt
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 overflow-y-auto">
          <div className="bg-[#09090b] border border-[#1a1a1a] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-[#09090b] border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">
                {editingId ? 'Edit Prompt' : 'Create New Prompt'}
              </h3>
              <button 
                onClick={resetForm} 
                className="p-2 text-zinc-400 hover:text-white hover:bg-[#0f0f11] rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Title *</label>
                    <input 
                      type="text" 
                      placeholder="Enter prompt title" 
                      value={formData.title} 
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                      className="w-full bg-[#030303] border border-[#1a1a1a] rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
                    <textarea 
                      placeholder="Brief description of the prompt" 
                      value={formData.description} 
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                      className="w-full bg-[#030303] border border-[#1a1a1a] rounded-lg px-4 py-3 text-white placeholder-zinc-500 h-24 focus:ring-2 focus:ring-white/20 focus:border-transparent resize-none transition-all" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Tool</label>
                      <select 
                        value={formData.tool} 
                        onChange={(e) => setFormData({ ...formData, tool: e.target.value })} 
                        className="w-full bg-[#030303] border border-[#1a1a1a] rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                      >
                        {aiTools.map(tool => (
                          <option key={tool.id} value={tool.name}>{tool.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Category</label>
                      <select 
                        value={formData.category_id} 
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} 
                        className="w-full bg-[#030303] border border-[#1a1a1a] rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                      >
                        <option value="">No Category</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2 flex-wrap">
                    <label className="flex items-center gap-2 text-white cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.is_free} 
                        onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })} 
                        className="w-5 h-5 rounded bg-[#030303] border-[#1a1a1a] text-white focus:ring-white/20" 
                      />
                      <span>Free Prompt</span>
                    </label>
                    <label className="flex items-center gap-2 text-white cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.is_featured} 
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} 
                        className="w-5 h-5 rounded bg-[#030303] border-[#1a1a1a] text-white focus:ring-white/20" 
                      />
                      <span>Featured</span>
                    </label>
                    <label className="flex items-center gap-2 text-white cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.is_trending} 
                        onChange={(e) => setFormData({ ...formData, is_trending: e.target.checked })} 
                        className="w-5 h-5 rounded bg-[#030303] border-[#1a1a1a] text-orange-500 focus:ring-orange-500/20" 
                      />
                      <span>Trending</span>
                    </label>
                  </div>
                </div>

                <div>
                  <ImageUploader
                    value={formData.image_url}
                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                  />
                </div>
              </div>

              {/* Rich Text Editor for Content */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Prompt Content
                </label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  placeholder="Write your prompt content here... Use formatting to make it easier to read."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-[#1a1a1a]">
                <button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="flex items-center gap-2 bg-white text-black font-semibold disabled:bg-zinc-600 disabled:text-zinc-400 px-6 py-3 rounded-lg transition-colors hover:bg-white/90"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {editingId ? 'Update Prompt' : 'Create Prompt'}
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setPreviewPrompt({ 
                    ...formData, 
                    id: 'preview', 
                    categories: categories.find(c => c.id === formData.category_id) 
                      ? { name: categories.find(c => c.id === formData.category_id)!.name } 
                      : null 
                  } as Prompt)} 
                  className="flex items-center gap-2 bg-[#09090b] border border-[#1a1a1a] hover:bg-[#0f0f11] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <Eye size={18} />
                  Preview
                </button>
                <button 
                  onClick={resetForm} 
                  className="flex items-center gap-2 bg-[#09090b] border border-[#1a1a1a] hover:bg-[#0f0f11] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <X size={18} />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
          <div className="bg-[#09090b] border border-[#1a1a1a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              {previewPrompt.image_url ? (
                <img 
                  src={previewPrompt.image_url} 
                  alt={previewPrompt.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center">
                  <Image size={48} className="text-zinc-600" />
                </div>
              )}
              <button
                onClick={() => setPreviewPrompt(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-white/10 text-xs font-medium text-white rounded-full">
                  {previewPrompt.tool}
                </span>
                {previewPrompt.categories && (
                  <span className="px-3 py-1 bg-[#1a1a1a] text-xs font-medium text-zinc-300 rounded-full">
                    {previewPrompt.categories.name}
                  </span>
                )}
                {previewPrompt.is_free && (
                  <span className="px-3 py-1 bg-green-500/10 text-xs font-medium text-green-400 rounded-full">
                    Free
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{previewPrompt.title}</h3>
              {previewPrompt.description && (
                <p className="text-zinc-400 mb-4">{previewPrompt.description}</p>
              )}
              {previewPrompt.content && (
                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewPrompt.content }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prompts Table */}
      <div className="bg-[#09090b] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0d0d0f]">
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Image</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Tool</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-zinc-400">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {prompts.map((prompt) => (
                <>
                  <tr key={prompt.id} className="border-t border-[#1a1a1a] hover:bg-[#0f0f11] transition-all">
                    <td className="px-6 py-4">
                      {prompt.image_url ? (
                        <img 
                          src={prompt.image_url} 
                          alt={prompt.title}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-[#0d0d0f] rounded-lg flex items-center justify-center">
                          <Image size={20} className="text-zinc-600" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleRowExpand(prompt.id)}
                          className="p-1 text-zinc-500 hover:text-white transition-colors"
                        >
                          {expandedRows.includes(prompt.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <span className="text-white font-medium">{prompt.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-white/5 text-zinc-300 text-sm rounded">
                        {prompt.tool}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {prompt.categories?.name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {prompt.is_free && (
                          <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">Free</span>
                        )}
                        {prompt.is_featured && (
                          <span className="px-2 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-full">Featured</span>
                        )}
                        {prompt.is_trending && (
                          <span className="px-2 py-1 bg-orange-500/10 text-orange-400 text-xs rounded-full">Trending</span>
                        )}
                        {!prompt.is_free && !prompt.is_featured && !prompt.is_trending && (
                          <span className="text-zinc-500">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewPrompt(prompt)}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-[#0f0f11] rounded-lg transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(prompt)}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-[#0f0f11] rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(prompt.id)}
                          disabled={deleting === prompt.id}
                          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deleting === prompt.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.includes(prompt.id) && (
                    <tr key={`${prompt.id}-expanded`} className="border-t border-[#1a1a1a]">
                      <td colSpan={6} className="px-6 py-4 bg-[#050506]">
                        <div className="space-y-2">
                          {prompt.description && (
                            <p className="text-zinc-400 text-sm">{prompt.description}</p>
                          )}
                          {prompt.content && (
                            <div 
                              className="prose prose-invert prose-sm max-w-none"
                              dangerouslySetInnerHTML={{ __html: prompt.content }}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {prompts.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-zinc-500">
                    No prompts found. Add your first one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PromptsManagement;
