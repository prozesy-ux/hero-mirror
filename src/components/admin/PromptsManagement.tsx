import { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, Eye, Image, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useAdminDataContext } from '@/contexts/AdminDataContext';
import { useAdminMutate } from '@/hooks/useAdminMutate';
import { toast } from 'sonner';
import RichTextEditor from './RichTextEditor';
import ImageUploader from './ImageUploader';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

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
  const { prompts, categories, isLoading, refreshTable } = useAdminDataContext();
  const { insertData, updateData, deleteData } = useAdminMutate();
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewPrompt, setPreviewPrompt] = useState<Prompt | null>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);
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

  const promptList = prompts as Prompt[];
  const categoryList = categories as Category[];

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
      category_id: formData.category_id || null
    };

    try {
      if (editingId) {
        const result = await updateData('prompts', editingId, promptData);
        if (!result.success) {
          toast.error(`Failed to update: ${result.error}`);
        } else {
          toast.success('Prompt updated successfully!');
          refreshTable('prompts');
          resetForm();
        }
      } else {
        const result = await insertData('prompts', promptData);
        if (!result.success) {
          toast.error(`Failed to create: ${result.error}`);
        } else {
          toast.success('Prompt created successfully!');
          refreshTable('prompts');
          resetForm();
        }
      }
    } catch (error: any) {
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

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ open: true, id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return;

    setDeleting(true);

    try {
      const result = await deleteData('prompts', deleteConfirm.id);
      if (!result.success) {
        toast.error(`Failed to delete: ${result.error}`);
      } else {
        toast.success('Prompt deleted successfully!');
        refreshTable('prompts');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete prompt');
    } finally {
      setDeleting(false);
      setDeleteConfirm({ open: false, id: null });
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

  return (
    <div>
      <div className="flex items-center justify-end mb-6">
        <button 
          onClick={() => setShowForm(true)} 
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Add Prompt
        </button>
      </div>

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
                        {categoryList.map(c => (
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
                  disabled={saving}
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
                    categories: categoryList.find(c => c.id === formData.category_id) 
                      ? { name: categoryList.find(c => c.id === formData.category_id)!.name } 
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
              <h3 className="text-xl font-bold text-white mb-2">{previewPrompt.title}</h3>
              {previewPrompt.description && (
                <p className="text-gray-400 mb-4">{previewPrompt.description}</p>
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
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Image</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Tool</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="w-12 h-12 rounded-lg bg-white/10" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-40 bg-white/10" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full bg-white/10" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24 bg-white/10" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full bg-white/10" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24 ml-auto bg-white/10" /></td>
                  </tr>
                ))
              ) : (
                promptList.map((prompt) => (
                  <>
                    <tr key={prompt.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        {prompt.image_url ? (
                          <img 
                            src={prompt.image_url} 
                            alt={prompt.title}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                            <Image size={20} className="text-gray-500" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleRowExpand(prompt.id)}
                            className="p-1 text-gray-400 hover:text-white"
                          >
                            {expandedRows.includes(prompt.id) ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </button>
                          <span className="text-white font-medium">{prompt.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-purple-600/20 text-purple-400 text-xs font-medium rounded-full">
                          {prompt.tool}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {prompt.categories?.name || 'Uncategorized'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {prompt.is_free && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                              Free
                            </span>
                          )}
                          {prompt.is_featured && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                              Featured
                            </span>
                          )}
                          {!prompt.is_free && !prompt.is_featured && (
                            <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                              Pro
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setPreviewPrompt(prompt)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                            title="Preview"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(prompt)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(prompt.id)}
                            disabled={deleting}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows.includes(prompt.id) && (
                      <tr key={`${prompt.id}-expanded`} className="bg-gray-900/50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-2">
                            {prompt.description && (
                              <div>
                                <span className="text-gray-500 text-sm">Description:</span>
                                <p className="text-gray-300 text-sm">{prompt.description}</p>
                              </div>
                            )}
                            {prompt.content && (
                              <div>
                                <span className="text-gray-500 text-sm">Content Preview:</span>
                                <div 
                                  className="text-gray-300 text-sm line-clamp-3"
                                  dangerouslySetInnerHTML={{ __html: prompt.content.substring(0, 300) + '...' }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && promptList.length === 0 && (
          <div className="text-center py-12">
            <Image size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No prompts found. Create your first prompt!</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, id: open ? deleteConfirm.id : null })}
        title="Delete Prompt"
        description="Are you sure you want to delete this prompt? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        confirmText="Delete"
        variant="destructive"
        loading={deleting}
      />
    </div>
  );
};

export default PromptsManagement;
