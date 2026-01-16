import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, GripVertical, Save, X, Search, ChevronDown, icons, ImageIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Popular icons for quick selection
const POPULAR_ICONS = [
  'MessageSquare', 'Image', 'Bot', 'Sparkles', 'Wand2', 'Brain', 'Zap',
  'Camera', 'Video', 'Music', 'FileText', 'Code', 'Palette', 'Mic',
  'Globe', 'Star', 'Heart', 'Rocket', 'Lightbulb', 'Target', 'Layers'
];

interface AITool {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  is_active: boolean;
  display_order: number;
  image_url: string | null;
  created_at: string;
}

const AIToolsTab = () => {
  const [tools, setTools] = useState<AITool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AITool | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    color: '',
    description: '',
    image_url: '',
    is_active: true,
    display_order: 0
  });

  // Get all available icon names from lucide-react
  const allIconNames = useMemo(() => {
    return Object.keys(icons).filter(
      (name) => typeof icons[name as keyof typeof icons] === 'function'
    );
  }, []);

  // Filter icons based on search
  const filteredIcons = useMemo(() => {
    if (!iconSearch) return POPULAR_ICONS;
    const search = iconSearch.toLowerCase();
    return allIconNames.filter((name) => name.toLowerCase().includes(search)).slice(0, 50);
  }, [iconSearch, allIconNames]);

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ai_tools')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      toast.error('Failed to fetch AI tools');
      console.error(error);
    } else {
      setTools(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (editing) {
      const { error } = await supabase
        .from('ai_tools')
        .update({
          name: formData.name,
          icon: formData.icon || null,
          color: formData.color || null,
          description: formData.description || null,
          image_url: formData.image_url || null,
          is_active: formData.is_active,
          display_order: formData.display_order
        })
        .eq('id', editing.id);

      if (error) {
        toast.error('Failed to update AI tool');
        console.error(error);
      } else {
        toast.success('AI tool updated successfully');
        resetForm();
        fetchTools();
      }
    } else {
      const { error } = await supabase
        .from('ai_tools')
        .insert({
          name: formData.name,
          icon: formData.icon || null,
          color: formData.color || null,
          description: formData.description || null,
          image_url: formData.image_url || null,
          is_active: formData.is_active,
          display_order: tools.length + 1
        });

      if (error) {
        toast.error('Failed to create AI tool');
        console.error(error);
      } else {
        toast.success('AI tool created successfully');
        resetForm();
        fetchTools();
      }
    }
  };

  const handleEdit = (tool: AITool) => {
    setEditing(tool);
    setFormData({
      name: tool.name,
      icon: tool.icon || '',
      color: tool.color || '',
      description: tool.description || '',
      image_url: tool.image_url || '',
      is_active: tool.is_active,
      display_order: tool.display_order
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this AI tool?')) return;

    const { error } = await supabase
      .from('ai_tools')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete AI tool');
      console.error(error);
    } else {
      toast.success('AI tool deleted successfully');
      fetchTools();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      icon: '',
      color: '',
      description: '',
      image_url: '',
      is_active: true,
      display_order: 0
    });
    setEditing(null);
    setShowForm(false);
    setShowIconPicker(false);
    setIconSearch('');
  };

  const selectIcon = (iconName: string) => {
    setFormData({ ...formData, icon: iconName });
    setShowIconPicker(false);
    setIconSearch('');
  };

  const renderIcon = (iconName: string | null, className: string = "w-5 h-5") => {
    if (!iconName) return null;
    const IconComponent = icons[iconName as keyof typeof icons] as LucideIcon | undefined;
    return IconComponent ? <IconComponent className={className} /> : <span>{iconName}</span>;
  };

  const renderToolIcon = (tool: AITool) => {
    // If image_url exists, show the image
    if (tool.image_url) {
      return (
        <img 
          src={tool.image_url} 
          alt={tool.name} 
          className="w-10 h-10 rounded-lg object-contain bg-white/10 p-1"
          onError={(e) => {
            // Fallback to icon if image fails to load
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    }
    // Otherwise show the gradient with icon
    return (
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color || 'from-gray-500 to-gray-600'} flex items-center justify-center text-white shadow-lg border border-white/10`}>
        {renderIcon(tool.icon)}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button 
          onClick={() => setShowForm(true)} 
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add AI Tool
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editing ? 'Edit AI Tool' : 'Add New AI Tool'}
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. ChatGPT"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="space-y-2 relative">
                <label className="block text-sm font-medium text-gray-300">Icon (fallback)</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-left text-white flex items-center justify-between hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <span className="flex items-center gap-2">
                      {formData.icon ? (
                        <>
                          {renderIcon(formData.icon, "w-4 h-4")}
                          <span>{formData.icon}</span>
                        </>
                      ) : (
                        <span className="text-gray-500">Select an icon...</span>
                      )}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showIconPicker ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showIconPicker && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-72 overflow-hidden">
                      <div className="p-2 border-b border-gray-700">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="text"
                            value={iconSearch}
                            onChange={(e) => setIconSearch(e.target.value)}
                            placeholder="Search icons..."
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="p-2 overflow-y-auto max-h-52">
                        {!iconSearch && (
                          <p className="text-xs text-gray-500 mb-2 px-1">Popular icons</p>
                        )}
                        <div className="grid grid-cols-6 gap-1">
                          {filteredIcons.map((iconName) => (
                            <button
                              key={iconName}
                              type="button"
                              onClick={() => selectIcon(iconName)}
                              className={`p-2 rounded-lg hover:bg-gray-700 flex items-center justify-center transition-colors ${
                                formData.icon === iconName ? 'bg-purple-600 hover:bg-purple-700' : ''
                              }`}
                              title={iconName}
                            >
                              {renderIcon(iconName, "w-5 h-5")}
                            </button>
                          ))}
                        </div>
                        {filteredIcons.length === 0 && (
                          <p className="text-center text-gray-500 text-sm py-4">No icons found</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  <ImageIcon className="w-4 h-4 inline mr-1" />
                  Logo Image URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500">If provided, this image will be used instead of the icon</p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Gradient Color Classes</label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="e.g. from-green-500 to-emerald-600"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the AI tool"
                  rows={2}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <div className="flex items-center gap-3 bg-gray-900 px-4 py-3 rounded-lg border border-gray-700">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-300">Active</label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                {editing ? 'Update' : 'Create'} AI Tool
              </button>
              <button 
                onClick={resetForm}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="text-left px-4 py-4 text-gray-400 font-medium w-12">#</th>
              <th className="text-left px-4 py-4 text-gray-400 font-medium w-16">Logo</th>
              <th className="text-left px-4 py-4 text-gray-400 font-medium">Name</th>
              <th className="text-left px-4 py-4 text-gray-400 font-medium">Color</th>
              <th className="text-left px-4 py-4 text-gray-400 font-medium">Description</th>
              <th className="text-left px-4 py-4 text-gray-400 font-medium w-20">Status</th>
              <th className="text-left px-4 py-4 text-gray-400 font-medium w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tools.map((tool, index) => (
              <tr key={tool.id} className="border-t border-gray-700 hover:bg-gray-700/50 transition-colors">
                <td className="px-4 py-4 text-gray-400">
                  <GripVertical className="w-4 h-4 inline mr-1 cursor-grab" />
                  {index + 1}
                </td>
                <td className="px-4 py-4">
                  {renderToolIcon(tool)}
                </td>
                <td className="px-4 py-4 font-medium text-white">{tool.name}</td>
                <td className="px-4 py-4">
                  <code className="text-xs bg-gray-900 text-gray-300 px-2 py-1 rounded border border-gray-700">
                    {tool.color || 'none'}
                  </code>
                </td>
                <td className="px-4 py-4 text-gray-400 text-sm max-w-xs truncate">
                  {tool.description || '-'}
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tool.is_active 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {tool.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEdit(tool)}
                      className="p-2 text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(tool.id)}
                      className="p-2 text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {tools.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-8">
                  No AI tools found. Add your first one!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AIToolsTab;
