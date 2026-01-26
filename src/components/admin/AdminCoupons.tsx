import { useState, useEffect } from 'react';
import { Tag, Plus, Trash2, Copy, Percent, DollarSign, Loader2, RefreshCw, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminMutate } from '@/hooks/useAdminMutate';

interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  seller_id: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const { fetchData } = useAdminData();
  const { mutateData } = useAdminMutate();

  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 10,
    min_order_amount: 0,
    max_uses: '',
    expires_days: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    const result = await fetchData('discount_codes', {
      order: { column: 'created_at', ascending: false }
    });
    if (result?.data) {
      setCoupons(result.data);
    }
    setLoading(false);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'PROMO';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  const handleCreate = async () => {
    if (!formData.code.trim()) {
      toast.error('Please enter a discount code');
      return;
    }
    if (formData.value <= 0) {
      toast.error('Value must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      const expiresAt = formData.expires_days 
        ? new Date(Date.now() + parseInt(formData.expires_days) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      await mutateData('discount_codes', 'insert', {
        code: formData.code.toUpperCase().trim(),
        type: formData.type,
        value: formData.value,
        min_order_amount: formData.min_order_amount || 0,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        expires_at: expiresAt,
        seller_id: null // Platform-wide coupon
      });

      toast.success('Coupon created!');
      setShowDialog(false);
      setFormData({
        code: '',
        type: 'percentage',
        value: 10,
        min_order_amount: 0,
        max_uses: '',
        expires_days: ''
      });
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create coupon');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await mutateData('discount_codes', 'update', { is_active: !currentStatus }, id);
      setCoupons(prev => 
        prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c)
      );
      toast.success(`Coupon ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await mutateData('discount_codes', 'delete', undefined, id);
      setCoupons(prev => prev.filter(c => c.id !== id));
      toast.success('Coupon deleted');
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied!');
  };

  const activeCount = coupons.filter(c => c.is_active).length;
  const totalUses = coupons.reduce((sum, c) => sum + c.used_count, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl bg-white/5" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl bg-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <Tag className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Platform Coupons</h1>
            <p className="text-sm text-slate-400">Manage platform-wide discount codes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchCoupons}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowDialog(true)}
            className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Coupon
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Coupons</p>
              <p className="text-3xl font-bold text-white mt-1">{coupons.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Tag className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Active</p>
              <p className="text-3xl font-bold text-white mt-1">{activeCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <ToggleRight className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Uses</p>
              <p className="text-3xl font-bold text-white mt-1">{totalUses}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Percent className="h-6 w-6 text-violet-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-slate-400 font-semibold">Code</TableHead>
              <TableHead className="text-slate-400 font-semibold text-center">Discount</TableHead>
              <TableHead className="text-slate-400 font-semibold text-center">Uses</TableHead>
              <TableHead className="text-slate-400 font-semibold text-center">Min Order</TableHead>
              <TableHead className="text-slate-400 font-semibold text-center">Expires</TableHead>
              <TableHead className="text-slate-400 font-semibold text-center">Status</TableHead>
              <TableHead className="text-slate-400 font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Tag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No platform coupons yet</p>
                  <p className="text-sm text-slate-500">Create your first coupon to attract users</p>
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.id} className="border-white/5 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="px-3 py-1.5 bg-white/10 rounded-lg text-sm font-mono text-white font-medium">
                        {coupon.code}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyCode(coupon.code)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-white/10"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-slate-300">
                    {coupon.used_count}{coupon.max_uses ? `/${coupon.max_uses}` : ''}
                  </TableCell>
                  <TableCell className="text-center text-slate-300">
                    {coupon.min_order_amount > 0 ? `$${coupon.min_order_amount}` : '-'}
                  </TableCell>
                  <TableCell className="text-center text-sm text-slate-400">
                    {coupon.expires_at 
                      ? format(new Date(coupon.expires_at), 'MMM d, yyyy')
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={coupon.is_active}
                      onCheckedChange={() => toggleStatus(coupon.id, coupon.is_active)}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(coupon.id)}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Create Platform Coupon</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Coupon Code</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="SUMMER20"
                  className="flex-1 bg-white/5 border-white/10 text-white"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={generateCode}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  Generate
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v: 'percentage' | 'fixed') => setFormData(prev => ({ ...prev, type: v }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Value</Label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  className="bg-white/5 border-white/10 text-white"
                  min={0}
                  max={formData.type === 'percentage' ? 100 : undefined}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Minimum Order ($)</Label>
              <Input
                type="number"
                value={formData.min_order_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, min_order_amount: parseFloat(e.target.value) || 0 }))}
                className="bg-white/5 border-white/10 text-white"
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Max Uses</Label>
                <Input
                  type="number"
                  value={formData.max_uses}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value }))}
                  placeholder="Unlimited"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Expires In (days)</Label>
                <Input
                  type="number"
                  value={formData.expires_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, expires_days: e.target.value }))}
                  placeholder="Never"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
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
              onClick={handleCreate} 
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoupons;
