import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Package, Key, User, Download, AlertTriangle, Search,
  Eye, EyeOff, Copy, Trash2, Loader2, Archive, Plus, Upload,
  Check, X, Pencil, BookOpen, Link as LinkIcon
} from 'lucide-react';

interface PoolItem {
  id: string;
  product_id: string;
  item_type: string;
  label: string | null;
  credentials: Record<string, any>;
  is_assigned: boolean;
  assigned_to: string | null;
  assigned_at: string | null;
  display_order: number;
  created_at: string;
}

type TabType = 'account' | 'license_key' | 'download';

const TABS: { id: TabType; label: string; icon: any }[] = [
  { id: 'account', label: 'Accounts', icon: User },
  { id: 'license_key', label: 'License Keys', icon: Key },
  { id: 'download', label: 'Downloads', icon: Download },
];

const SellerDeliveryInventory = () => {
  const { profile, products } = useSellerContext();
  const [items, setItems] = useState<PoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());

  // Add item state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [adding, setAdding] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newActivationUrl, setNewActivationUrl] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [usageGuide, setUsageGuide] = useState('');

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('delivery_pool_items')
      .select('*')
      .eq('seller_id', profile.id)
      .order('created_at', { ascending: false });
    if (error) toast.error('Failed to load inventory');
    else setItems((data || []) as PoolItem[]);
    setLoading(false);
  };

  // Load usage guide when product changes
  useEffect(() => {
    if (selectedProduct) {
      const p = products.find(p => p.id === selectedProduct);
      const meta = (p as any)?.product_metadata;
      setUsageGuide(meta?.delivery_guide || '');
    } else {
      setUsageGuide('');
    }
  }, [selectedProduct, products]);

  const addSingleItem = async () => {
    if (!selectedProduct) { toast.error('Select a product first'); return; }
    setAdding(true);

    let credentials: Record<string, any> = {};
    if (activeTab === 'account') {
      if (!newEmail || !newPassword) { toast.error('Email and password required'); setAdding(false); return; }
      credentials = { email: newEmail, password: newPassword, notes: newNotes };
    } else if (activeTab === 'license_key') {
      if (!newKey) { toast.error('License key required'); setAdding(false); return; }
      credentials = { key: newKey, activation_url: newActivationUrl };
    } else {
      if (!newFileUrl) { toast.error('File URL required'); setAdding(false); return; }
      credentials = { file_url: newFileUrl, file_name: newFileName || 'File' };
    }

    const { error } = await supabase.from('delivery_pool_items').insert({
      product_id: selectedProduct,
      seller_id: profile.id,
      item_type: activeTab,
      credentials,
      display_order: items.length,
    });

    if (error) toast.error('Failed to add item');
    else {
      toast.success('Item added');
      setNewEmail(''); setNewPassword(''); setNewNotes('');
      setNewKey(''); setNewActivationUrl('');
      setNewFileUrl(''); setNewFileName('');
      fetchItems();
    }
    setAdding(false);
  };

  const handleBulkImport = async () => {
    if (!selectedProduct) { toast.error('Select a product first'); return; }
    if (!bulkText.trim()) return;
    setAdding(true);

    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    const rows: any[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (activeTab === 'account') {
        const parts = line.split(/[:\t|]/).map(s => s.trim());
        if (parts.length < 2) continue;
        rows.push({
          product_id: selectedProduct, seller_id: profile.id, item_type: 'account',
          credentials: { email: parts[0], password: parts[1], notes: parts[2] || '' },
          display_order: items.length + i,
        });
      } else if (activeTab === 'license_key') {
        rows.push({
          product_id: selectedProduct, seller_id: profile.id, item_type: 'license_key',
          credentials: { key: line },
          display_order: items.length + i,
        });
      } else {
        rows.push({
          product_id: selectedProduct, seller_id: profile.id, item_type: 'download',
          credentials: { file_url: line, file_name: `File ${items.length + i + 1}` },
          display_order: items.length + i,
        });
      }
    }

    if (rows.length === 0) { toast.error('No valid items found'); setAdding(false); return; }
    const { error } = await supabase.from('delivery_pool_items').insert(rows);
    if (error) toast.error('Failed to import');
    else { toast.success(`${rows.length} items imported`); setBulkText(''); setBulkMode(false); fetchItems(); }
    setAdding(false);
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('delivery_pool_items').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Removed'); fetchItems(); }
  };

  const startEdit = (item: PoolItem) => {
    setEditingId(item.id);
    if (item.item_type === 'account') {
      setEditFields({ email: item.credentials.email || '', password: item.credentials.password || '', notes: item.credentials.notes || '' });
    } else if (item.item_type === 'license_key') {
      setEditFields({ key: item.credentials.key || '', activation_url: item.credentials.activation_url || '' });
    } else {
      setEditFields({ file_url: item.credentials.file_url || '', file_name: item.credentials.file_name || '' });
    }
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    const { error } = await supabase.from('delivery_pool_items').update({ credentials: editFields }).eq('id', id);
    if (error) toast.error('Failed to update');
    else { toast.success('Updated'); setEditingId(null); fetchItems(); }
    setSaving(false);
  };

  const saveUsageGuide = async () => {
    if (!selectedProduct) return;
    // First fetch existing metadata to merge
    const { data: existing } = await supabase.from('seller_products')
      .select('product_metadata')
      .eq('id', selectedProduct)
      .single();
    const existingMeta = (existing?.product_metadata as Record<string, any>) || {};
    const { error } = await supabase.from('seller_products')
      .update({ product_metadata: { ...existingMeta, delivery_guide: usageGuide } })
      .eq('id', selectedProduct);
    if (error) toast.error('Failed to save guide');
    else toast.success('Usage guide saved');
  };

  const togglePassword = (id: string) => {
    setShowPasswords(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copied'); };

  const filtered = useMemo(() => {
    let result = items.filter(i => i.item_type === activeTab);
    if (statusFilter === 'available') result = result.filter(i => !i.is_assigned);
    if (statusFilter === 'assigned') result = result.filter(i => i.is_assigned);
    if (productFilter !== 'all') result = result.filter(i => i.product_id === productFilter);
    if (search) result = result.filter(i =>
      JSON.stringify(i.credentials).toLowerCase().includes(search.toLowerCase()) ||
      (i.label || '').toLowerCase().includes(search.toLowerCase())
    );
    return result;
  }, [items, activeTab, statusFilter, productFilter, search]);

  const totalByTab = (tab: TabType) => items.filter(i => i.item_type === tab).length;
  const availableByTab = (tab: TabType) => items.filter(i => i.item_type === tab && !i.is_assigned).length;
  const assignedByTab = (tab: TabType) => items.filter(i => i.item_type === tab && i.is_assigned).length;
  const lowStockProducts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.filter(i => !i.is_assigned).forEach(i => { counts[i.product_id] = (counts[i.product_id] || 0) + 1; });
    return Object.entries(counts).filter(([_, c]) => c <= 5).length;
  }, [items]);

  const getProductName = (productId: string) => products.find(p => p.id === productId)?.name || 'Unknown';

  if (loading) {
    return (
      <div className="bg-[#FCFCFC] min-h-screen p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-[#FCFCFC] min-h-screen p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-black">Auto-Delivery Manager</h1>
        <p className="text-sm text-black/50">Manage accounts, license keys & downloads for auto-delivery</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: items.length, icon: Package, color: 'text-black' },
          { label: 'Available', value: items.filter(i => !i.is_assigned).length, icon: Archive, color: 'text-emerald-600' },
          { label: 'Assigned', value: items.filter(i => i.is_assigned).length, icon: User, color: 'text-black/50' },
          { label: 'Low Stock', value: lowStockProducts, icon: AlertTriangle, color: lowStockProducts > 0 ? 'text-amber-500' : 'text-black/30' },
        ].map(card => {
          const Icon = card.icon;
          return (
         <div key={card.label} className="bg-white rounded-2xl shadow-sm p-6">
               <p className="text-sm text-[#6B7280] mb-2">{card.label}</p>
               <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
             </div>
          );
        })}
      </div>

       {/* Tabs */}
       <div className="flex gap-2 w-fit">
         {TABS.map(tab => {
           const Icon = tab.icon;
           const count = totalByTab(tab.id);
           return (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                 activeTab === tab.id 
                   ? 'bg-[#FF7F00] text-white' 
                   : 'bg-white border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB]'
               }`}
             >
              <Icon className="w-4 h-4" />
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-black/10 text-black/50'
                }`}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

       {/* Add Item Section */}
       <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-black/40 uppercase tracking-widest font-bold">
            Add {activeTab === 'account' ? 'Accounts' : activeTab === 'license_key' ? 'License Keys' : 'Downloads'}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant={bulkMode ? 'default' : 'outline'} onClick={() => setBulkMode(!bulkMode)} className={`h-7 text-xs ${bulkMode ? 'bg-black text-white' : 'border-black/10'}`}>
              <Upload className="w-3 h-3 mr-1" />Bulk
            </Button>
          </div>
        </div>

        {/* Product Selector */}
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="w-full h-10 border-black/10 rounded-lg text-sm">
            <SelectValue placeholder="Select product..." />
          </SelectTrigger>
          <SelectContent>
            {products.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!bulkMode ? (
          <>
            {activeTab === 'account' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="h-9 text-sm border-black/10" />
                  <Input placeholder="Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-9 text-sm border-black/10" />
                </div>
                <Input placeholder="Notes (optional)" value={newNotes} onChange={e => setNewNotes(e.target.value)} className="h-9 text-sm border-black/10" />
              </div>
            )}
            {activeTab === 'license_key' && (
              <div className="space-y-2">
                <Input placeholder="License key / serial number" value={newKey} onChange={e => setNewKey(e.target.value)} className="h-9 text-sm border-black/10" />
                <Input placeholder="Activation URL (optional)" value={newActivationUrl} onChange={e => setNewActivationUrl(e.target.value)} className="h-9 text-sm border-black/10" />
              </div>
            )}
            {activeTab === 'download' && (
              <div className="space-y-2">
                <Input placeholder="File URL" value={newFileUrl} onChange={e => setNewFileUrl(e.target.value)} className="h-9 text-sm border-black/10" />
                <Input placeholder="File name (optional)" value={newFileName} onChange={e => setNewFileName(e.target.value)} className="h-9 text-sm border-black/10" />
              </div>
            )}
            <Button size="sm" onClick={addSingleItem} disabled={adding || !selectedProduct} className="bg-black hover:bg-black/90 text-white h-8 text-xs">
              {adding ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
              Add Item
            </Button>
          </>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-black/50">
              {activeTab === 'account' ? 'One per line: email:password or email:password:notes' 
               : activeTab === 'license_key' ? 'One key per line'
               : 'One URL per line'}
            </p>
            <Textarea
              value={bulkText} onChange={e => setBulkText(e.target.value)}
              placeholder={activeTab === 'account' ? 'user1@email.com:pass123\nuser2@email.com:pass456' : activeTab === 'license_key' ? 'XXXX-XXXX-XXXX\nYYYY-YYYY-YYYY' : 'https://file1.com/file.zip\nhttps://file2.com/file.zip'}
              rows={5} className="text-sm border-black/10 font-mono"
            />
            <Button size="sm" onClick={handleBulkImport} disabled={adding || !selectedProduct} className="bg-black hover:bg-black/90 text-white h-8 text-xs">
              {adding ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
              Import {bulkText.split('\n').filter(l => l.trim()).length} items
            </Button>
          </div>
        )}

        {/* Usage Guide */}
         {selectedProduct && (
           <div className="border-t border-[#E5E7EB] pt-4 space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-black/40" />
              <span className="text-[10px] text-black/40 uppercase tracking-widest font-bold">Usage Guide for Buyers</span>
            </div>
            <Textarea
              value={usageGuide} onChange={e => setUsageGuide(e.target.value)}
              placeholder="Step 1: Go to site...\nStep 2: Login with the credentials..."
              rows={3} className="text-sm border-black/10"
            />
            <Button size="sm" variant="outline" onClick={saveUsageGuide} className="h-7 text-xs border-black/10">
              Save Guide
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
          <Input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 border-black/10 rounded-lg" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-10 border-black/10 rounded-lg text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-[180px] h-10 border-black/10 rounded-lg text-sm">
            <SelectValue placeholder="Product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tab Stats */}
      <div className="flex items-center gap-4 text-xs text-black/50">
        <span>Showing: <strong className="text-black">{filtered.length}</strong></span>
        <span>Available: <strong className="text-emerald-600">{availableByTab(activeTab)}</strong></span>
        <span>Assigned: <strong className="text-black/40">{assignedByTab(activeTab)}</strong></span>
      </div>

      {/* Items Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-black/10 rounded-xl p-12 text-center">
          <Package className="w-10 h-10 text-black/10 mx-auto mb-3" />
          <p className="text-sm font-bold text-black mb-1">No {activeTab === 'account' ? 'accounts' : activeTab === 'license_key' ? 'license keys' : 'downloads'} found</p>
          <p className="text-xs text-black/40">Add items above to get started</p>
        </div>
      ) : (
        <div className="bg-white border border-black/10 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[40px_1fr_140px_80px_80px] gap-2 px-4 py-2.5 border-b border-black/5 text-[10px] text-black/40 uppercase tracking-widest font-bold">
            <span>#</span>
            <span>Content</span>
            <span>Product</span>
            <span>Status</span>
            <span></span>
          </div>

          {/* Table Body */}
          <div className="max-h-[500px] overflow-y-auto">
            {filtered.map((item, idx) => (
              <div key={item.id} className={`grid grid-cols-[40px_1fr_140px_80px_80px] gap-2 px-4 py-2.5 items-center text-xs border-b border-black/5 last:border-0 ${item.is_assigned ? 'opacity-50' : ''}`}>
                <span className="text-black/30">{idx + 1}</span>

                {/* Content - Inline Edit or View */}
                <div className="flex items-center gap-2 min-w-0">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {item.item_type === 'account' && (
                        <>
                          <Input value={editFields.email || ''} onChange={e => setEditFields(f => ({ ...f, email: e.target.value }))} className="h-7 text-xs border-black/10 w-32" />
                          <Input value={editFields.password || ''} onChange={e => setEditFields(f => ({ ...f, password: e.target.value }))} className="h-7 text-xs border-black/10 w-28" />
                          <Input value={editFields.notes || ''} onChange={e => setEditFields(f => ({ ...f, notes: e.target.value }))} className="h-7 text-xs border-black/10 w-24" placeholder="Notes" />
                        </>
                      )}
                      {item.item_type === 'license_key' && (
                        <Input value={editFields.key || ''} onChange={e => setEditFields(f => ({ ...f, key: e.target.value }))} className="h-7 text-xs border-black/10 flex-1 font-mono" />
                      )}
                      {item.item_type === 'download' && (
                        <>
                          <Input value={editFields.file_url || ''} onChange={e => setEditFields(f => ({ ...f, file_url: e.target.value }))} className="h-7 text-xs border-black/10 flex-1" />
                          <Input value={editFields.file_name || ''} onChange={e => setEditFields(f => ({ ...f, file_name: e.target.value }))} className="h-7 text-xs border-black/10 w-24" />
                        </>
                      )}
                      <button onClick={() => saveEdit(item.id)} disabled={saving} className="text-emerald-600 hover:text-emerald-700"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingId(null)} className="text-black/30 hover:text-black/60"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <>
                      {item.item_type === 'account' && (
                        <>
                          <span className="text-black font-medium truncate">{item.credentials.email}</span>
                          <button onClick={() => togglePassword(item.id)} className="text-black/30 hover:text-black/60 flex-shrink-0">
                            {showPasswords.has(item.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          {showPasswords.has(item.id) && <span className="text-black/40 font-mono truncate">{item.credentials.password}</span>}
                          {item.credentials.notes && <span className="text-black/30 truncate text-[10px]">({item.credentials.notes})</span>}
                          <button onClick={() => copyText(`${item.credentials.email}:${item.credentials.password}`)} className="text-black/20 hover:text-black/50 flex-shrink-0"><Copy className="w-3 h-3" /></button>
                        </>
                      )}
                      {item.item_type === 'license_key' && (
                        <>
                          <span className="text-black font-mono truncate">{item.credentials.key}</span>
                          <button onClick={() => copyText(item.credentials.key)} className="text-black/20 hover:text-black/50 flex-shrink-0"><Copy className="w-3 h-3" /></button>
                          {item.credentials.activation_url && (
                            <a href={item.credentials.activation_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 flex-shrink-0"><LinkIcon className="w-3 h-3" /></a>
                          )}
                        </>
                      )}
                      {item.item_type === 'download' && (
                        <>
                          <span className="text-black truncate">{item.credentials.file_name || 'File'}</span>
                          <button onClick={() => copyText(item.credentials.file_url)} className="text-black/20 hover:text-black/50 flex-shrink-0"><Copy className="w-3 h-3" /></button>
                        </>
                      )}
                    </>
                  )}
                </div>

                <span className="text-black/60 truncate">{getProductName(item.product_id)}</span>

                {item.is_assigned ? (
                  <Badge className="bg-black/10 text-black/50 border-0 text-[10px] w-fit">Assigned</Badge>
                ) : (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] w-fit">Available</Badge>
                )}

                <div className="flex justify-end gap-1">
                  {!item.is_assigned && editingId !== item.id && (
                    <>
                      <button onClick={() => startEdit(item)} className="text-black/20 hover:text-black/50 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="text-black/20 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDeliveryInventory;
