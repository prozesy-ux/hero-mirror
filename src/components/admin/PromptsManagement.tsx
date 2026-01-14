import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Eye, Image, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import RichTextEditor from './RichTextEditor';
import ImageUploader from './ImageUploader';
import { useAdmin } from '@/contexts/AdminContext';

interface Prompt {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  image_url: string | null;
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
  const { hasAdminRole, adminUser } = useAdmin();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewPrompt, setPreviewPrompt] = useState<Prompt | null>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [authError, setAuthError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    image_url: null as string | null,
    tool: 'ChatGPT',
    is_free: false,
    is_featured: false,
    category_id: ''
  });

  const tools = ['ChatGPT', 'Midjourney', 'Claude', 'DALL-E', 'Gemini', 'Stable Diffusion', 'Leonardo AI', 'Copilot'];

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

  useEffect(() => {
    // Check auth status
    if (!adminUser) {
      setAuthError('Please sign in with your admin account (mdmerajul614@gmail.com) to manage prompts');
    } else if (!hasAdminRole) {
      setAuthError('Your account does not have admin permissions');
    } else {
      setAuthError(null);
    }
  }, [adminUser, hasAdminRole]);

  const fetchData = async () => {
    try {
      const [{ data: promptsData, error: promptsError }, { data: categoriesData }] = await Promise.all([
        supabase.from('prompts').select('*, categories(name)').order('created_at', { ascending: false }),
        supabase.from('categories').select('id, name').order('name')
      ]);

      if (promptsError) {
        console.error('Error fetching prompts:', promptsError);
        toast.error('Failed to load prompts');
      }

      setPrompts(promptsData || []);
      setCategories(categoriesData || []);
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

    if (!hasAdminRole) {
      toast.error('Admin permissions required. Please sign in with your admin account.');
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
      category_id: formData.category_id || null
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('prompts').update(promptData).eq('id', editingId);
        if (error) {
          console.error('Update error:', error);
          if (error.message.includes('row-level security')) {
            toast.error('Permission denied. Please sign in with admin account.');
          } else {
            toast.error(`Failed to update: ${error.message}`);
          }
        } else {
          toast.success('Prompt updated successfully!');
          resetForm();
        }
      } else {
        const { error } = await supabase.from('prompts').insert(promptData);
        if (error) {
          console.error('Insert error:', error);
          if (error.message.includes('row-level security')) {
            toast.error('Permission denied. Please sign in with admin account.');
          } else {
            toast.error(`Failed to create: ${error.message}`);
          }
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
      category_id: prompt.category_id || ''
    });
    setEditingId(prompt.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this prompt?')) return;
    
    if (!hasAdminRole) {
      toast.error('Admin permissions required. Please sign in with your admin account.');
      return;
    }

    setDeleting(id);

    try {
      const { error } = await supabase.from('prompts').delete().eq('id', id);
      if (error) {
        console.error('Delete error:', error);
        if (error.message.includes('row-level security')) {
          toast.error('Permission denied. Please sign in with admin account.');
        } else {
          toast.error(`Failed to delete: ${error.message}`);
        }
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Prompts Management</h2>
        <button 
          onClick={() => setShowForm(true)} 
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Add Prompt
        </button>
      </div>

      {/* Auth Warning */}
      {authError && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400">
          <AlertCircle size={20} />
          <div>
            <p className="font-medium">Authentication Required</p>
            <p className="text-sm">{authError}</p>
            <a 
              href="/signin" 
              target="_blank"
              className="text-yellow-300 underline text-sm mt-1 inline-block"
            >
              Sign in with admin account →
            </a>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto">
          <div className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">
                {editingId ? 'Edit Prompt' : 'Create New Prompt'}
              </h3>
              <button 
                onClick={resetForm} 
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Auth Warning in Modal */}
              {authError && (
                <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400">
                  <AlertCircle size={20} />
                  <div>
                    <p className="font-medium">Sign in required to save changes</p>
                    <p className="text-sm">{authError}</p>
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                    <input 
                      type="text" 
                      placeholder="Enter prompt title" 
                      value={formData.title} 
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea 
                      placeholder="Brief description of the prompt" 
                      value={formData.description} 
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white h-24 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Tool</label>
                      <select 
                        value={formData.tool} 
                        onChange={(e) => setFormData({ ...formData, tool: e.target.value })} 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        {tools.map(tool => (
                          <option key={tool} value={tool}>{tool}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                      <select 
                        value={formData.category_id} 
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} 
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">No Category</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 text-white cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.is_free} 
                        onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })} 
                        className="w-5 h-5 rounded bg-gray-900 border-gray-700 text-purple-500 focus:ring-purple-500" 
                      />
                      <span>Free Prompt</span>
                    </label>
                    <label className="flex items-center gap-2 text-white cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.is_featured} 
                        onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} 
                        className="w-5 h-5 rounded bg-gray-900 border-gray-700 text-purple-500 focus:ring-purple-500" 
                      />
                      <span>Featured</span>
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prompt Content
                </label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  placeholder="Write your prompt content here... Use formatting to make it easier to read."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button 
                  onClick={handleSave} 
                  disabled={saving || !!authError}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors"
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
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <Eye size={18} />
                  Preview
                </button>
                <button 
                  onClick={resetForm} 
                  className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              {previewPrompt.image_url ? (
                <img 
                  src={previewPrompt.image_url} 
                  alt={previewPrompt.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center">
                  <Image size={48} className="text-gray-600" />
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
                <span className="px-3 py-1 bg-purple-600 text-xs font-medium text-white rounded-full">
                  {previewPrompt.tool}
                </span>
                {previewPrompt.categories && (
                  <span className="px-3 py-1 bg-gray-700 text-xs font-medium text-gray-300 rounded-full">
                    {previewPrompt.categories.name}
                  </span>
                )}
                {previewPrompt.is_free && (
                  <span className="px-3 py-1 bg-green-600 text-xs font-medium text-white rounded-full">
                    Free
                  </span>
                )}
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-3">{previewPrompt.title}</h2>
              <p className="text-gray-400 mb-6">{previewPrompt.description}</p>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">Prompt Content</h3>
                <div 
                  className="text-gray-300 prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewPrompt.content || 'No content available' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prompts Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left px-6 py-4 text-gray-400 font-medium w-8"></th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Image</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Title</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Tool</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Category</th>
              <th className="text-left px-6 py-4 text-gray-400 font-medium">Status</th>
              <th className="text-right px-6 py-4 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {prompts.map((prompt) => (
              <>
                <tr key={prompt.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleRowExpand(prompt.id)}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      {expandedRows.includes(prompt.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    {prompt.image_url ? (
                      <img 
                        src={prompt.image_url} 
                        alt={prompt.title}
                        className="w-16 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                        <Image size={16} className="text-gray-500" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-white font-medium max-w-xs truncate">{prompt.title}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">{prompt.tool}</span>
                  </td>
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
                      <button 
                        onClick={() => setPreviewPrompt(prompt)} 
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                        title="Preview"
                      >
                        <Eye size={18} />
                      </button>
                      <button 
                        onClick={() => handleEdit(prompt)} 
                        className="p-2 text-blue-400 hover:bg-gray-700 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(prompt.id)} 
                        disabled={deleting === prompt.id}
                        className="p-2 text-red-400 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
                        title="Delete"
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
                  <tr key={`${prompt.id}-expanded`} className="bg-gray-900/50">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
                          <p className="text-gray-300 text-sm">{prompt.description || 'No description'}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Content Preview</h4>
                          <div 
                            className="text-gray-300 text-sm line-clamp-3 prose prose-invert prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: prompt.content || 'No content' }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        
        {prompts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No prompts yet. Create your first prompt!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptsManagement;
