import { useState, useEffect, useMemo } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Package, Key, User, Download, AlertTriangle, Search,
  Eye, EyeOff, Copy, Trash2, Loader2, Archive
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

const SellerDeliveryInventory = () => {
  const { profile, products } = useSellerContext();
  const [items, setItems] = useState<PoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [showPasswords, setShowPasswords] = useState<Set<string>>(new Set());

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

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from('delivery_pool_items').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Removed'); fetchItems(); }
  };

  const togglePassword = (id: string) => {
    setShowPasswords(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copied'); };

  const filtered = useMemo(() => {
    let result = items;
    if (typeFilter !== 'all') result = result.filter(i => i.item_type === typeFilter);
    if (statusFilter === 'available') result = result.filter(i => !i.is_assigned);
    if (statusFilter === 'assigned') result = result.filter(i => i.is_assigned);
    if (productFilter !== 'all') result = result.filter(i => i.product_id === productFilter);
    if (search) result = result.filter(i => 
      JSON.stringify(i.credentials).toLowerCase().includes(search.toLowerCase()) ||
      (i.label || '').toLowerCase().includes(search.toLowerCase())
    );
    return result;
  }, [items, typeFilter, statusFilter, productFilter, search]);

  const totalItems = items.length;
  const availableItems = items.filter(i => !i.is_assigned).length;
  const assignedItems = items.filter(i => i.is_assigned).length;
  const lowStockProducts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.filter(i => !i.is_assigned).forEach(i => { counts[i.product_id] = (counts[i.product_id] || 0) + 1; });
    return Object.entries(counts).filter(([_, c]) => c <= 5).length;
  }, [items]);

  const getProductName = (productId: string) => {
    const p = products.find(p => p.id === productId);
    return p?.name || 'Unknown Product';
  };

  const typeIcon = (type: string) => {
    if (type === 'account') return User;
    if (type === 'license_key') return Key;
    return Download;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-black">Delivery Inventory</h1>
        <p className="text-sm text-black/50">Manage auto-delivery pool items across all products</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: totalItems, icon: Package, color: 'text-black' },
          { label: 'Available', value: availableItems, icon: Archive, color: 'text-emerald-600' },
          { label: 'Assigned', value: assignedItems, icon: User, color: 'text-black/50' },
          { label: 'Low Stock', value: lowStockProducts, icon: AlertTriangle, color: lowStockProducts > 0 ? 'text-amber-500' : 'text-black/30' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-black/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${card.color}`} />
                <span className="text-[10px] text-black/40 uppercase tracking-widest font-bold">{card.label}</span>
              </div>
              <p className={`text-2xl font-extrabold ${card.color}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
          <Input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 border-black/10 rounded-lg" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px] h-10 border-black/10 rounded-lg text-sm">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="account">Accounts</SelectItem>
            <SelectItem value="license_key">License Keys</SelectItem>
            <SelectItem value="download">Downloads</SelectItem>
          </SelectContent>
        </Select>
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

      {/* Items Table */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-black/10 rounded-xl p-12 text-center">
          <Package className="w-10 h-10 text-black/10 mx-auto mb-3" />
          <p className="text-sm font-bold text-black mb-1">No items found</p>
          <p className="text-xs text-black/40">Add delivery items from the product editor</p>
        </div>
      ) : (
        <div className="bg-white border border-black/10 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[40px_1fr_120px_140px_80px_60px] gap-2 px-4 py-2.5 border-b border-black/5 text-[10px] text-black/40 uppercase tracking-widest font-bold">
            <span>#</span>
            <span>Content</span>
            <span>Type</span>
            <span>Product</span>
            <span>Status</span>
            <span></span>
          </div>

          {/* Table Body */}
          <div className="max-h-[500px] overflow-y-auto">
            {filtered.map((item, idx) => {
              const TypeIcon = typeIcon(item.item_type);
              return (
                <div key={item.id} className={`grid grid-cols-[40px_1fr_120px_140px_80px_60px] gap-2 px-4 py-2.5 items-center text-xs border-b border-black/5 last:border-0 ${item.is_assigned ? 'opacity-50' : ''}`}>
                  <span className="text-black/30">{idx + 1}</span>
                  
                  <div className="flex items-center gap-2 min-w-0">
                    {item.item_type === 'account' && (
                      <>
                        <span className="text-black font-medium truncate">{item.credentials.email}</span>
                        <button onClick={() => togglePassword(item.id)} className="text-black/30 hover:text-black/60 flex-shrink-0">
                          {showPasswords.has(item.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        {showPasswords.has(item.id) && <span className="text-black/40 font-mono truncate">{item.credentials.password}</span>}
                      </>
                    )}
                    {item.item_type === 'license_key' && (
                      <>
                        <span className="text-black font-mono truncate">{item.credentials.key}</span>
                        <button onClick={() => copyText(item.credentials.key)} className="text-black/30 hover:text-black/60 flex-shrink-0">
                          <Copy className="w-3 h-3" />
                        </button>
                      </>
                    )}
                    {item.item_type === 'download' && (
                      <span className="text-black truncate">{item.credentials.file_name || 'File'}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <TypeIcon className="w-3 h-3 text-black/40" />
                    <span className="text-black/60 capitalize">{item.item_type.replace('_', ' ')}</span>
                  </div>

                  <span className="text-black/60 truncate">{getProductName(item.product_id)}</span>

                  {item.is_assigned ? (
                    <Badge className="bg-black/10 text-black/50 border-0 text-[10px] w-fit">Assigned</Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] w-fit">Available</Badge>
                  )}

                  <div className="flex justify-end">
                    {!item.is_assigned && (
                      <button onClick={() => deleteItem(item.id)} className="text-black/20 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDeliveryInventory;
