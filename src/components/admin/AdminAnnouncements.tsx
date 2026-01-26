import { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Edit2, Save, X, Calendar, Users, AlertCircle, Info, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminMutate } from '@/hooks/useAdminMutate';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target_audience: 'all' | 'buyers' | 'sellers';
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
}

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { fetchData } = useAdminData();
  const { mutateData } = useAdminMutate();
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    target_audience: 'all' as 'all' | 'buyers' | 'sellers',
    is_active: true,
    ends_at: ''
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const result = await fetchData('platform_announcements', {
      order: { column: 'created_at', ascending: false }
    });
    if (result?.data) {
      setAnnouncements(result.data);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      target_audience: 'all',
      is_active: true,
      ends_at: ''
    });
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const data = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        target_audience: formData.target_audience,
        is_active: formData.is_active,
        ends_at: formData.ends_at || null
      };

      if (editingId) {
        await mutateData('platform_announcements', 'update', data, editingId);
        toast.success('Announcement updated');
      } else {
        await mutateData('platform_announcements', 'insert', data);
        toast.success('Announcement created');
      }

      setShowDialog(false);
      resetForm();
      fetchAnnouncements();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      target_audience: announcement.target_audience,
      is_active: announcement.is_active,
      ends_at: announcement.ends_at ? format(new Date(announcement.ends_at), 'yyyy-MM-dd') : ''
    });
    setEditingId(announcement.id);
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await mutateData('platform_announcements', 'delete', undefined, id);
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await mutateData('platform_announcements', 'update', { is_active: !currentStatus }, id);
      setAnnouncements(prev => 
        prev.map(a => a.id === id ? { ...a, is_active: !currentStatus } : a)
      );
    } catch (error: any) {
      toast.error('Failed to update status');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertCircle className="w-5 h-5 text-orange-400" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      warning: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      error: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[type] || colors.info;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 bg-white/5" />
          <Skeleton className="h-10 w-40 bg-white/5" />
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Announcements</h1>
            <p className="text-sm text-slate-400">{announcements.filter(a => a.is_active).length} active announcements</p>
          </div>
        </div>
        <Button 
          onClick={() => { resetForm(); setShowDialog(true); }}
          className="bg-orange-600 hover:bg-orange-700 rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Announcement
        </Button>
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-12 text-center">
          <Megaphone className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Announcements</h3>
          <p className="text-slate-400 mb-6">Create your first announcement to notify users</p>
          <Button onClick={() => setShowDialog(true)} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Announcement
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {announcements.map((announcement) => (
            <div 
              key={announcement.id}
              className={`bg-slate-900/50 rounded-2xl border p-5 transition-colors ${
                announcement.is_active ? 'border-white/10' : 'border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  announcement.type === 'warning' ? 'bg-orange-500/20' :
                  announcement.type === 'success' ? 'bg-emerald-500/20' :
                  announcement.type === 'error' ? 'bg-red-500/20' : 'bg-blue-500/20'
                }`}>
                  {getTypeIcon(announcement.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">{announcement.title}</h3>
                    <Badge variant="outline" className={getTypeBadge(announcement.type)}>
                      {announcement.type}
                    </Badge>
                    <Badge variant="outline" className="bg-white/5 text-slate-400 border-white/10">
                      {announcement.target_audience}
                    </Badge>
                  </div>
                  
                  <p className="text-slate-400 text-sm mb-3 line-clamp-2">{announcement.message}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Created {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                    </span>
                    {announcement.ends_at && (
                      <span className="flex items-center gap-1">
                        Expires {format(new Date(announcement.ends_at), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={announcement.is_active}
                    onCheckedChange={() => toggleActive(announcement.id, announcement.is_active)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(announcement)}
                    className="text-slate-400 hover:text-white hover:bg-white/10"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(announcement.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-white/10 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingId ? 'Edit Announcement' : 'Create Announcement'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Announcement title"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Message</Label>
              <Textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Announcement message..."
                rows={4}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v: any) => setFormData(prev => ({ ...prev, type: v }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Target Audience</Label>
                <Select 
                  value={formData.target_audience} 
                  onValueChange={(v: any) => setFormData(prev => ({ ...prev, target_audience: v }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="buyers">Buyers Only</SelectItem>
                    <SelectItem value="sellers">Sellers Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Expires On (optional)</Label>
              <Input
                type="date"
                value={formData.ends_at}
                onChange={(e) => setFormData(prev => ({ ...prev, ends_at: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label className="text-slate-300">Active immediately</Label>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDialog(false)}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAnnouncements;
