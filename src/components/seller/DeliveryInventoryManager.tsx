import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Plus, Trash2, Upload, Key, User, Download, AlertTriangle,
  Loader2, Copy, Check, Eye, EyeOff, Package
} from 'lucide-react';

type DeliveryMode = 'auto_account' | 'auto_license' | 'auto_download' | 'instant_download' | 'manual';
type ItemType = 'account' | 'license_key' | 'download';

interface PoolItem {
  id: string;
  item_type: ItemType;
  label: string | null;
  credentials: Record<string, any>;
  is_assigned: boolean;
  assigned_to: string | null;
  assigned_at: string | null;
  display_order: number;
  created_at: string;
}

interface Props {
  productId: string | null;
  sellerId: string;
  deliveryMode: DeliveryMode;
  onDeliveryModeChange: (mode: DeliveryMode) => void;
  productType: string;
}

const DELIVERY_MODES: { id: DeliveryMode; label: string; icon: any; desc: string }[] = [
  { id: 'auto_account', label: 'Auto Accounts', icon: User, desc: 'Unique account per buyer' },
  { id: 'auto_license', label: 'License Keys', icon: Key, desc: 'Unique key per buyer' },
  { id: 'auto_download', label: 'Unique Downloads', icon: Download, desc: 'Unique file per buyer' },
  { id: 'instant_download', label: 'File Download', icon: Package, desc: 'Same files for all' },
  { id: 'manual', label: 'Manual', icon: Eye, desc: 'Deliver manually' },
];

const SUPPORTED_PRODUCT_TYPES = ['digital_product', 'ebook', 'template', 'graphics', 'audio', 'video', 'software'];

const DeliveryInventoryManager = ({ productId, sellerId, deliveryMode, onDeliveryModeChange, productType }: Props) => {
  const [items, setItems] = useState<PoolItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());

  // Single item fields
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newActivationUrl, setNewActivationUrl] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const isAutoMode = ['auto_account', 'auto_license', 'auto_download'].includes(deliveryMode);
  const itemType: ItemType = deliveryMode === 'auto_account' ? 'account' : deliveryMode === 'auto_license' ? 'license_key' : 'download';

  useEffect(() => {
    if (productId && isAutoMode) fetchItems();
  }, [productId, deliveryMode]);

  const fetchItems = async () => {
    if (!productId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('delivery_pool_items')
      .select('*')
      .eq('product_id', productId)
      .eq('item_type', itemType)
      .order('display_order')
      .order('created_at');
    if (error) { toast.error('Failed to load inventory'); console.error(error); }
    else setItems((data || []) as PoolItem[]);
    setLoading(false);
  };

  const addSingleItem = async () => {
    if (!productId) { toast.error('Save the product first'); return; }
    setAdding(true);
    
    let credentials: Record<string, any> = {};
    if (itemType === 'account') {
      if (!newEmail || !newPassword) { toast.error('Email and password required'); setAdding(false); return; }
      credentials = { email: newEmail, password: newPassword, notes: newNotes };
    } else if (itemType === 'license_key') {
      if (!newKey) { toast.error('License key required'); setAdding(false); return; }
      credentials = { key: newKey, activation_url: newActivationUrl };
    } else if (itemType === 'download') {
      if (!newLabel) { toast.error('File URL required'); setAdding(false); return; }
      credentials = { file_url: newLabel, file_name: newActivationUrl || 'File' };
    }

    const { error } = await supabase.from('delivery_pool_items').insert({
      product_id: productId,
      seller_id: sellerId,
      item_type: itemType,
      label: newLabel || null,
      credentials,
      display_order: items.length,
    });

    if (error) { toast.error('Failed to add item'); console.error(error); }
    else {
      toast.success('Item added');
      setNewEmail(''); setNewPassword(''); setNewNotes(''); setNewKey(''); setNewActivationUrl(''); setNewLabel('');
      fetchItems();
    }
    setAdding(false);
  };

  const handleBulkImport = async () => {
    if (!productId) { toast.error('Save the product first'); return; }
    if (!bulkText.trim()) return;
    
    setAdding(true);
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    const rows: any[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (itemType === 'account') {
        const parts = line.split(/[:\t|]/).map(s => s.trim());
        if (parts.length < 2) continue;
        rows.push({
          product_id: productId,
          seller_id: sellerId,
          item_type: 'account',
          credentials: { email: parts[0], password: parts[1], notes: parts[2] || '' },
          display_order: items.length + i,
        });
      } else if (itemType === 'license_key') {
        rows.push({
          product_id: productId,
          seller_id: sellerId,
          item_type: 'license_key',
          credentials: { key: line },
          display_order: items.length + i,
        });
      } else if (itemType === 'download') {
        rows.push({
          product_id: productId,
          seller_id: sellerId,
          item_type: 'download',
          credentials: { file_url: line, file_name: `File ${items.length + i + 1}` },
          display_order: items.length + i,
        });
      }
    }

    if (rows.length === 0) { toast.error('No valid items found'); setAdding(false); return; }

    const { error } = await supabase.from('delivery_pool_items').insert(rows);
    if (error) { toast.error('Failed to import'); console.error(error); }
    else {
      toast.success(`${rows.length} items imported`);
      setBulkText('');
      setBulkMode(false);
      fetchItems();
    }
    setAdding(false);
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('delivery_pool_items').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Removed'); fetchItems(); }
  };

  const togglePassword = (id: string) => {
    setShowPasswords(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  const available = items.filter(i => !i.is_assigned).length;
  const assigned = items.filter(i => i.is_assigned).length;

  // Usage guide state
  const [usageGuide, setUsageGuide] = useState('');
  const [savingGuide, setSavingGuide] = useState(false);

  useEffect(() => {
    if (productId) {
      supabase.from('seller_products').select('product_metadata').eq('id', productId).single()
        .then(({ data }) => {
          const meta = data?.product_metadata as Record<string, any> | null;
          setUsageGuide(meta?.delivery_guide || '');
        });
    }
  }, [productId]);

  const saveUsageGuide = async () => {
    if (!productId) return;
    setSavingGuide(true);
    // Fetch existing metadata to merge
    const { data: existing } = await supabase.from('seller_products')
      .select('product_metadata')
      .eq('id', productId)
      .single();
    const existingMeta = (existing?.product_metadata as Record<string, any>) || {};
    const { error } = await supabase.from('seller_products')
      .update({ product_metadata: { ...existingMeta, delivery_guide: usageGuide } })
      .eq('id', productId);
    if (error) toast.error('Failed to save guide');
    else toast.success('Usage guide saved');
    setSavingGuide(false);
  };

  if (!SUPPORTED_PRODUCT_TYPES.includes(productType)) return null;

  return (
    <div className="space-y-4">
      {/* Delivery Mode Selector */}
      <div>
        <Label className="text-sm font-bold text-black mb-2 block">Delivery Mode</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DELIVERY_MODES.map(mode => {
            const Icon = mode.icon;
            const active = deliveryMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onDeliveryModeChange(mode.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all ${
                  active 
                    ? 'bg-black text-white border-black' 
                    : 'bg-white text-black/60 border-black/10 hover:border-black/30'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{mode.label}</p>
                  <p className={`text-[10px] truncate ${active ? 'text-white/60' : 'text-black/40'}`}>{mode.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Auto/Manual Explanation */}
      <div className="p-3 bg-black/[0.02] rounded-lg border border-black/5 text-xs text-black/60">
        {isAutoMode
          ? '✅ Auto Mode: Orders auto-deliver from pool. No manual action needed.'
          : deliveryMode === 'instant_download'
            ? '📁 File Download: Same files delivered to all buyers automatically.'
            : '🤚 Manual Mode: You manually deliver each order from the Sales page.'}
      </div>

      {/* Usage Guide */}
      {isAutoMode && productId && (
        <div className="space-y-2 p-3 border border-black/10 rounded-lg">
          <p className="text-[10px] text-black/40 uppercase tracking-widest font-bold">Usage Guide for Buyers</p>
          <Textarea
            value={usageGuide} onChange={e => setUsageGuide(e.target.value)}
            placeholder="How to use this product (shown to buyer after delivery)..."
            rows={3} className="text-sm border-black/10"
          />
          <Button size="sm" variant="outline" onClick={saveUsageGuide} disabled={savingGuide} className="h-7 text-xs border-black/10">
            {savingGuide ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
            Save Guide
          </Button>
        </div>
      )}

      {/* Link to full dashboard */}
      {isAutoMode && (
        <a href="/seller/delivery-inventory" className="flex items-center gap-1.5 text-xs text-black/40 hover:text-black/70 transition-colors">
          <Package className="w-3.5 h-3.5" />
          Manage all inventory in Delivery Dashboard →
        </a>
      )}

      {/* Pool Inventory (only for auto modes) */}
      {isAutoMode && (
        <div className="space-y-3">
          {/* Stock Counter */}
          <div className="flex items-center gap-3 p-3 bg-black/[0.02] rounded-lg border border-black/5">
            <div className="flex-1">
              <div className="flex items-center gap-4 text-xs">
                <span className="text-black/50">Total: <strong className="text-black">{items.length}</strong></span>
                <span className="text-emerald-600">Available: <strong>{available}</strong></span>
                <span className="text-black/40">Assigned: <strong>{assigned}</strong></span>
              </div>
            </div>
            {available > 0 && available <= 5 && (
              <div className="flex items-center gap-1 text-amber-600 text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Low stock</span>
              </div>
            )}
          </div>

          {!productId && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <p className="text-sm text-amber-800">Save the product first, then add inventory items here.</p>
            </div>
          )}

          {productId && (
            <>
              {/* Add Single Item */}
              {!bulkMode && (
                <div className="space-y-2 p-3 border border-black/10 rounded-lg">
                  <p className="text-[10px] text-black/40 uppercase tracking-widest font-bold">
                    Add {itemType === 'account' ? 'Account' : itemType === 'license_key' ? 'License Key' : 'Download'}
                  </p>

                  {itemType === 'account' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="h-9 text-sm border-black/10" />
                        <Input placeholder="Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-9 text-sm border-black/10" />
                      </div>
                      <Input placeholder="Notes (optional)" value={newNotes} onChange={e => setNewNotes(e.target.value)} className="h-9 text-sm border-black/10" />
                    </div>
                  )}

                  {itemType === 'license_key' && (
                    <div className="space-y-2">
                      <Input placeholder="License key / serial number" value={newKey} onChange={e => setNewKey(e.target.value)} className="h-9 text-sm border-black/10" />
                      <Input placeholder="Activation URL (optional)" value={newActivationUrl} onChange={e => setNewActivationUrl(e.target.value)} className="h-9 text-sm border-black/10" />
                    </div>
                  )}

                  {itemType === 'download' && (
                    <div className="space-y-2">
                      <Input placeholder="File URL" value={newLabel} onChange={e => setNewLabel(e.target.value)} className="h-9 text-sm border-black/10" />
                      <Input placeholder="File name (optional)" value={newActivationUrl} onChange={e => setNewActivationUrl(e.target.value)} className="h-9 text-sm border-black/10" />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" onClick={addSingleItem} disabled={adding} className="bg-black hover:bg-black/90 text-white h-8 text-xs">
                      {adding ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                      Add
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setBulkMode(true)} className="h-8 text-xs border-black/10">
                      <Upload className="w-3 h-3 mr-1" />Bulk Import
                    </Button>
                  </div>
                </div>
              )}

              {/* Bulk Import */}
              {bulkMode && (
                <div className="space-y-2 p-3 border border-black/10 rounded-lg">
                  <p className="text-[10px] text-black/40 uppercase tracking-widest font-bold">Bulk Import</p>
                  <p className="text-xs text-black/50">
                    {itemType === 'account' 
                      ? 'Paste one account per line: email:password or email|password'
                      : 'Paste one key per line'
                    }
                  </p>
                  <Textarea
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                    placeholder={itemType === 'account' ? 'user1@email.com:pass123\nuser2@email.com:pass456' : 'XXXX-XXXX-XXXX\nYYYY-YYYY-YYYY'}
                    rows={5}
                    className="text-sm border-black/10 font-mono"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleBulkImport} disabled={adding} className="bg-black hover:bg-black/90 text-white h-8 text-xs">
                      {adding ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Upload className="w-3 h-3 mr-1" />}
                      Import {bulkText.split('\n').filter(l => l.trim()).length} items
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setBulkMode(false); setBulkText(''); }} className="h-8 text-xs border-black/10">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Items List */}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-black/30" />
                </div>
              ) : items.length > 0 ? (
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {items.map((item, idx) => (
                    <div key={item.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${item.is_assigned ? 'bg-black/[0.03] opacity-60' : 'bg-white border border-black/5'}`}>
                      <span className="text-black/30 w-5 text-center">{idx + 1}</span>
                      
                      {itemType === 'account' && (
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className="text-black font-medium truncate">{item.credentials.email}</span>
                          <button onClick={() => togglePassword(item.id)} className="text-black/30 hover:text-black/60">
                            {showPasswords.has(item.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          {showPasswords.has(item.id) && (
                            <span className="text-black/50 font-mono">{item.credentials.password}</span>
                          )}
                        </div>
                      )}

                      {itemType === 'license_key' && (
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className="text-black font-mono truncate">{item.credentials.key}</span>
                          <button onClick={() => copyToClipboard(item.credentials.key)} className="text-black/30 hover:text-black/60">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {item.is_assigned ? (
                        <Badge className="bg-black/10 text-black/50 border-0 text-[10px]">Assigned</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">Available</Badge>
                      )}

                      {!item.is_assigned && (
                        <button onClick={() => deleteItem(item.id)} className="text-black/20 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-black/30 text-sm">
                  No items yet. Add accounts or keys above.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryInventoryManager;
