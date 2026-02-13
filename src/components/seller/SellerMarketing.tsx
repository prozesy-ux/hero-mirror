import { useState, useEffect } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tag, Plus, Percent, DollarSign, Calendar, Trash2, Copy, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const SellerMarketing = () => {
  const { profile } = useSellerContext();
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: 10,
    min_order_amount: 0,
    max_uses: '',
    expires_days: ''
  });

  // Fetch discount codes
  useEffect(() => {
    fetchDiscountCodes();
  }, [profile?.id]);

  const fetchDiscountCodes = async () => {
    if (!profile?.id) return;
    
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDiscountCodes(data as DiscountCode[]);
    }
    setLoading(false);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  const handleCreateCode = async () => {
    if (!formData.code.trim()) {
      toast.error('Please enter a discount code');
      return;
    }
    if (formData.value <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    setCreating(true);
    try {
      const expiresAt = formData.expires_days 
        ? new Date(Date.now() + parseInt(formData.expires_days) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('discount_codes')
        .insert({
          seller_id: profile?.id,
          code: formData.code.toUpperCase().trim(),
          type: formData.type,
          value: formData.value,
          min_order_amount: formData.min_order_amount || 0,
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
          expires_at: expiresAt
        });

      if (error) throw error;

      toast.success('Discount code created!');
      setShowCreateDialog(false);
      setFormData({
        code: '',
        type: 'percentage',
        value: 10,
        min_order_amount: 0,
        max_uses: '',
        expires_days: ''
      });
      fetchDiscountCodes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create discount code');
    } finally {
      setCreating(false);
    }
  };

  const toggleCodeStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('discount_codes')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update code');
    } else {
      setDiscountCodes(prev => 
        prev.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c)
      );
      toast.success(`Code ${!currentStatus ? 'activated' : 'deactivated'}`);
    }
  };

  const deleteCode = async (id: string) => {
    const { error } = await supabase
      .from('discount_codes')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete code');
    } else {
      setDiscountCodes(prev => prev.filter(c => c.id !== id));
      toast.success('Code deleted');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  // Stats
  const activeCount = discountCodes.filter(c => c.is_active).length;
  const totalUses = discountCodes.reduce((sum, c) => sum + c.used_count, 0);

  if (loading) {
    return (
      <div className="bg-[#FCFCFC] min-h-screen p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-[#FCFCFC] min-h-screen p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
           <DialogTrigger asChild>
             <Button className="bg-[#FF7F00] hover:bg-[#FF7F00]/90 text-white rounded-xl">
               <Plus className="w-4 h-4 mr-2" />
               Create Discount
             </Button>
           </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Discount Code</DialogTitle>
              <DialogDescription>
                Create a new discount code for your customers
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Code */}
              <div className="space-y-2">
                <Label>Discount Code</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="SUMMER20"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={generateCode}>
                    Generate
                  </Button>
                </div>
              </div>

              {/* Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(v: 'percentage' | 'fixed') => setFormData(prev => ({ ...prev, type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <div className="relative">
                    {formData.type === 'percentage' ? (
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    ) : (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                    )}
                    <Input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                      className="pl-10"
                      min={0}
                      max={formData.type === 'percentage' ? 100 : undefined}
                    />
                  </div>
                </div>
              </div>

              {/* Min Order */}
              <div className="space-y-2">
                <Label>Minimum Order Amount (optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                  <Input
                    type="number"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_order_amount: parseFloat(e.target.value) || 0 }))}
                    className="pl-10"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Max Uses & Expiry */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Uses (optional)</Label>
                  <Input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value }))}
                    placeholder="Unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expires In (days)</Label>
                  <Input
                    type="number"
                    value={formData.expires_days}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires_days: e.target.value }))}
                    placeholder="Never"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateCode} disabled={creating} className="bg-emerald-500 hover:bg-emerald-600">
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create Code
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

       {/* Stats Cards */}
       <div className="grid grid-cols-3 gap-4">
         <div className="bg-white rounded-2xl shadow-sm p-6">
           <p className="text-sm text-[#6B7280] mb-2">Total Codes</p>
           <p className="text-3xl font-bold text-[#1F2937]">{discountCodes.length}</p>
         </div>
         <div className="bg-white rounded-2xl shadow-sm p-6">
           <p className="text-sm text-[#6B7280] mb-2">Active Codes</p>
           <p className="text-3xl font-bold text-emerald-600">{activeCount}</p>
         </div>
         <div className="bg-white rounded-2xl shadow-sm p-6">
           <p className="text-sm text-[#6B7280] mb-2">Total Uses</p>
           <p className="text-3xl font-bold text-violet-600">{totalUses}</p>
         </div>
       </div>

       {/* Discount Codes Table */}
       <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="font-semibold">Code</TableHead>
              <TableHead className="font-semibold text-center">Discount</TableHead>
              <TableHead className="font-semibold text-center">Uses</TableHead>
              <TableHead className="font-semibold text-center">Min Order</TableHead>
              <TableHead className="font-semibold text-center">Expires</TableHead>
              <TableHead className="font-semibold text-center">Status</TableHead>
              <TableHead className="font-semibold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discountCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                  <Tag className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p>No discount codes yet</p>
                  <p className="text-sm">Create your first discount code to attract more customers</p>
                </TableCell>
              </TableRow>
            ) : (
              discountCodes.map((code) => (
                <TableRow key={code.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-slate-100 rounded text-sm font-mono font-medium">
                        {code.code}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyCode(code.code)}
                        className="h-7 w-7 p-0"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {code.type === 'percentage' ? `${code.value}%` : `₹${code.value}`}
                  </TableCell>
                  <TableCell className="text-center">
                    {code.used_count}{code.max_uses ? `/${code.max_uses}` : ''}
                  </TableCell>
                  <TableCell className="text-center">
                    {code.min_order_amount > 0 ? `₹${code.min_order_amount}` : '-'}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {code.expires_at 
                      ? format(new Date(code.expires_at), 'MMM d, yyyy')
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={code.is_active}
                      onCheckedChange={() => toggleCodeStatus(code.id, code.is_active)}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteCode(code.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
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
    </div>
  );
};

export default SellerMarketing;
