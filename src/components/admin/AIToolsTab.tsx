import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, GripVertical } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface AITool {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

const AIToolsTab = () => {
  const [tools, setTools] = useState<AITool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AITool | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    color: '',
    description: '',
    is_active: true,
    display_order: 0
  });

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
      is_active: true,
      display_order: 0
    });
    setEditing(null);
    setShowForm(false);
  };

  const renderIcon = (iconName: string | null) => {
    if (!iconName) return null;
    const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : <span>{iconName}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add AI Tool
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. ChatGPT"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Icon (Lucide icon name)</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="e.g. MessageSquare, Image, Bot"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Gradient Color Classes</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="e.g. from-green-500 to-emerald-600"
                />
              </div>
              <div className="space-y-2 flex items-end gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the AI tool"
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave}>
                {editing ? 'Update' : 'Create'} AI Tool
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead className="w-16">Icon</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-20">Status</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tools.map((tool, index) => (
            <TableRow key={tool.id}>
              <TableCell className="text-muted-foreground">
                <GripVertical className="w-4 h-4 inline mr-1" />
                {index + 1}
              </TableCell>
              <TableCell>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${tool.color || 'from-gray-500 to-gray-600'} flex items-center justify-center text-white`}>
                  {renderIcon(tool.icon)}
                </div>
              </TableCell>
              <TableCell className="font-medium">{tool.name}</TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {tool.color || 'none'}
                </code>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {tool.description || '-'}
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  tool.is_active 
                    ? 'bg-green-500/20 text-green-600' 
                    : 'bg-red-500/20 text-red-600'
                }`}>
                  {tool.is_active ? 'Active' : 'Inactive'}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(tool)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(tool.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {tools.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No AI tools found. Add your first one!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AIToolsTab;
