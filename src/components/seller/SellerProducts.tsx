import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSellerContext } from '@/contexts/SellerContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ProductCardRenderer from '@/components/marketplace/ProductCardRenderer';
import ProductTypeBadge from '@/components/marketplace/ProductTypeBadge';
import CardCustomizer from './CardCustomizer';
import { CardSettings, CardProduct, DEFAULT_CARD_SETTINGS } from '@/components/marketplace/card-types';
import { BarChart, Bar, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { 
  Plus, Package, Edit2, Trash2, Loader2, Search, MoreVertical,
  Eye, EyeOff, X, Copy, Filter, TrendingUp, ShoppingBag, DollarSign,
  ExternalLink, ChevronDown, Palette, CheckSquare, BarChart3, Clock,
  AlertTriangle, FileText, Headphones, Video, BookOpen, Layers, Coffee,
  Image as ImageIcon, Music, Code, Users, Zap, Share2, Link2,
  Archive, Tag, Globe, Sparkles, Star, ArrowUpRight, ChevronRight
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import MultiImageUploader from './MultiImageUploader';
import { getProductShareUrl } from '@/lib/url-utils';

interface Category { id: string; name: string; }

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  compare_at_price: string;
  category_ids: string[];
  tags: string[];
  icon_url: string;
  images: string[];
  is_available: boolean;
  chat_allowed: boolean;
  requires_email: boolean;
  slug: string;
  seo_description: string;
  is_pwyw: boolean;
  min_price: string;
  delivery_type: string;
  thank_you_message: string;
}

const initialFormData: ProductFormData = {
  name: '', description: '', price: '', stock: '', compare_at_price: '',
  category_ids: [], tags: [], icon_url: '', images: [],
  is_available: true, chat_allowed: true, requires_email: false,
  slug: '', seo_description: '', is_pwyw: false, min_price: '',
  delivery_type: 'instant', thank_you_message: '',
};

const popularTags = ['Digital', 'Premium', 'Instant Delivery', 'Lifetime', 'Subscription', 'API', 'Software', 'Course'];

const PRODUCT_TYPE_ICONS: Record<string, React.ElementType> = {
  'digital': FileText, 'digital_product': FileText, 'ebook': BookOpen, 'course': Video,
  'video': Video, 'audio': Music, 'template': Layers, 'software': Code,
  'service': Headphones, 'membership': Users, 'bundle': Layers,
  'graphics': ImageIcon, 'coffee': Coffee, 'call': Headphones, 'commission': Zap,
};

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  'digital': 'Digital', 'digital_product': 'Digital', 'ebook': 'E-book', 'course': 'Course',
  'video': 'Video', 'audio': 'Audio', 'template': 'Template', 'software': 'Software',
  'service': 'Service', 'membership': 'Membership', 'bundle': 'Bundle',
  'graphics': 'Graphics', 'coffee': 'Coffee', 'call': 'Call', 'commission': 'Commission',
};

const SellerProducts = () => {
  const navigate = useNavigate();
  const { profile, products, orders, refreshProducts, loading } = useSellerContext();
  const { formatAmountOnly } = useCurrency();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editSheetProductId, setEditSheetProductId] = useState<string | null>(null);
  const [cardCustomizerOpen, setCardCustomizerOpen] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [editCardSettings, setEditCardSettings] = useState<Partial<CardSettings>>({});
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);
  const [recentlyEdited, setRecentlyEdited] = useState<string[]>([]);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').eq('is_active', true).order('display_order');
    if (data) setCategories(data);
  };

  const openEditSheet = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const p = product as any;
    setFormData({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      stock: String(product.stock),
      compare_at_price: String(p.original_price || ''),
      category_ids: p.category_ids || (product.category_id ? [product.category_id] : []),
      tags: p.tags || [],
      icon_url: product.icon_url || '',
      images: p.images || [],
      is_available: product.is_available,
      chat_allowed: product.chat_allowed !== false,
      requires_email: p.requires_email || false,
      slug: p.slug || '',
      seo_description: p.seo_description || '',
      is_pwyw: p.is_pwyw || false,
      min_price: String(p.min_price || ''),
      delivery_type: p.delivery_type || 'instant',
      thank_you_message: p.thank_you_message || '',
    });
    setEditSheetProductId(productId);
    setEditCardSettings(extractCardSettings());
    setEditSheetOpen(true);
    setRecentlyEdited(prev => [productId, ...prev.filter(id => id !== productId)].slice(0, 5));
  };

  const handleSheetSubmit = async (asDraft = false) => {
    if (!formData.name.trim() || !formData.price) { toast.error('Name and price are required'); return; }
    setSubmitting(true);
    try {
      const primaryImage = formData.images.length > 0 ? formData.images[0] : formData.icon_url.trim() || null;
      const productData: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        original_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        category_id: formData.category_ids[0] || null,
        category_ids: formData.category_ids,
        tags: formData.tags,
        icon_url: primaryImage,
        images: formData.images,
        is_available: asDraft ? false : formData.is_available,
        chat_allowed: formData.chat_allowed,
        requires_email: formData.requires_email,
        slug: formData.slug.trim() || null,
        seo_description: formData.seo_description.trim() || null,
        is_pwyw: formData.is_pwyw,
        min_price: formData.min_price ? parseFloat(formData.min_price) : null,
        delivery_type: formData.delivery_type || null,
        thank_you_message: formData.thank_you_message.trim() || null,
      };
      if (editSheetProductId) {
        const { error } = await supabase.from('seller_products').update(productData).eq('id', editSheetProductId);
        if (error) throw error;
        toast.success(asDraft ? 'Saved as draft' : 'Product updated');
      }
      setEditSheetOpen(false);
      refreshProducts();
    } catch (error: any) { toast.error(error.message || 'Failed to save product'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteClick = (productId: string) => { setDeleteConfirm({ open: true, id: productId }); };
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('seller_products').delete().eq('id', deleteConfirm.id);
      if (error) throw error;
      toast.success('Product deleted');
      if (selectedProduct === deleteConfirm.id) setSelectedProduct(null);
      refreshProducts();
    } catch (error: any) { toast.error(error.message || 'Failed to delete'); }
    finally { setDeleting(false); setDeleteConfirm({ open: false, id: null }); }
  };

  const toggleAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('seller_products').update({ is_available: !currentStatus }).eq('id', productId);
      if (error) throw error;
      toast.success(`Product ${!currentStatus ? 'enabled' : 'disabled'}`);
      refreshProducts();
    } catch { toast.error('Failed to update'); }
  };

  const copyProductLink = async (productId: string, productName: string, productSlug?: string | null) => {
    const storeSlug = (profile as any)?.store_slug || profile?.id;
    const slug = productSlug || `${productName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)}-${productId.slice(0, 8)}`;
    const url = getProductShareUrl(storeSlug, slug);
    try { await navigator.clipboard.writeText(url); toast.success(`Link copied`); } catch { toast.error('Failed to copy link'); }
  };

  const duplicateProduct = (productId: string) => { navigate(`/seller/products/new?duplicate=${productId}`); };
  const viewInStore = (product: any) => {
    const storeSlug = (profile as any)?.store_slug || profile?.id;
    const slug = product.slug || `${product.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)}-${product.id.slice(0, 8)}`;
    window.open(`/store/${storeSlug}/${slug}`, '_blank');
  };

  const handleAddTag = (tag: string) => {
    const t = tag.trim();
    if (t && !formData.tags.includes(t)) setFormData(prev => ({ ...prev, tags: [...prev.tags, t] }));
    setTagInput('');
  };
  const handleRemoveTag = (t: string) => { setFormData(prev => ({ ...prev, tags: prev.tags.filter(x => x !== t) })); };
  const handleTagKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(tagInput); } };
  const toggleCategory = (id: string) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(id) ? prev.category_ids.filter(x => x !== id) : [...prev.category_ids, id]
    }));
  };

  const toggleBulkSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };
  const clearBulkSelection = () => { setSelectedIds(new Set()); setBulkMode(false); };
  const handleBulkToggleVisibility = async (show: boolean) => {
    try {
      const { error } = await supabase.from('seller_products').update({ is_available: show }).in('id', Array.from(selectedIds));
      if (error) throw error;
      toast.success(`${selectedIds.size} products ${show ? 'shown' : 'hidden'}`);
      clearBulkSelection(); refreshProducts();
    } catch { toast.error('Failed to update'); }
  };
  const handleBulkDelete = async () => {
    try {
      const { error } = await supabase.from('seller_products').delete().in('id', Array.from(selectedIds));
      if (error) throw error;
      toast.success(`${selectedIds.size} products deleted`);
      clearBulkSelection(); refreshProducts();
    } catch { toast.error('Failed to delete'); }
  };

  // Filters
  let filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  if (statusFilter !== 'all') {
    if (statusFilter === 'live') filteredProducts = filteredProducts.filter(p => p.is_approved && p.is_available);
    else if (statusFilter === 'pending') filteredProducts = filteredProducts.filter(p => !p.is_approved && p.is_available);
    else if (statusFilter === 'draft') filteredProducts = filteredProducts.filter(p => !p.is_available && !p.is_approved);
    else if (statusFilter === 'hidden') filteredProducts = filteredProducts.filter(p => !p.is_available && p.is_approved);
  }
  if (categoryFilter !== 'all') {
    filteredProducts = filteredProducts.filter(p => {
      const ids = (p as any).category_ids || (p.category_id ? [p.category_id] : []);
      return ids.includes(categoryFilter);
    });
  }
  if (sortBy === 'newest') filteredProducts = [...filteredProducts].sort((a, b) => new Date((b as any).created_at || 0).getTime() - new Date((a as any).created_at || 0).getTime());
  else if (sortBy === 'price-high') filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  else if (sortBy === 'price-low') filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  else if (sortBy === 'best-selling') filteredProducts = [...filteredProducts].sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0));

  const totalProducts = products.length;
  const liveProducts = products.filter(p => p.is_approved && p.is_available).length;
  const pendingProducts = products.filter(p => !p.is_approved && p.is_available).length;
  const draftProducts = products.filter(p => !p.is_available && !p.is_approved).length;
  const hiddenProducts = products.filter(p => !p.is_available && p.is_approved).length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.seller_earning || 0), 0);
  const totalSales = orders.length;

  const getCategoryNames = (product: any) => {
    const ids = product.category_ids || (product.category_id ? [product.category_id] : []);
    return ids.map((id: string) => categories.find(c => c.id === id)?.name).filter(Boolean);
  };
  const getProductStatus = (p: any) => {
    if (p.is_approved && p.is_available) return { label: 'Live', dotColor: 'bg-emerald-500', icon: Eye };
    if (!p.is_available && !p.is_approved) return { label: 'Draft', dotColor: 'bg-black/20', icon: FileText };
    if (!p.is_available && p.is_approved) return { label: 'Hidden', dotColor: 'bg-amber-500', icon: EyeOff };
    return { label: 'Pending', dotColor: 'bg-amber-400', icon: Clock };
  };
  const getProductSales = (id: string) => orders.filter(o => o.product_id === id).length;
  const getProductRevenue = (id: string) => orders.filter(o => o.product_id === id).reduce((sum, o) => sum + Number(o.seller_earning || 0), 0);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      const ids = (p as any).category_ids || (p.category_id ? [p.category_id] : []);
      ids.forEach((id: string) => { counts[id] = (counts[id] || 0) + 1; });
    });
    return counts;
  }, [products]);

  // Sales trend data for sparkline
  const getSalesTrend = (productId: string) => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      const count = orders.filter(o => o.product_id === productId && (o as any).created_at?.startsWith(key)).length;
      return { day: d.toLocaleDateString('en', { weekday: 'short' }), sales: count };
    });
    return last7;
  };

  const topPerforming = useMemo(() => {
    if (!products.length) return null;
    return products.reduce((best, p) => (getProductSales(p.id) > getProductSales(best.id) ? p : best), products[0]);
  }, [products, orders]);

  const needsAttention = useMemo(() => {
    return products.filter(p => {
      const sales = getProductSales(p.id);
      const lowStock = p.stock > 0 && p.stock < 5;
      return sales === 0 || lowStock;
    }).slice(0, 3);
  }, [products, orders]);

  const previewProduct = selectedProduct ? products.find(p => p.id === selectedProduct) : null;

  const extractCardSettings = (): Partial<CardSettings> => ({
    style: (profile as any).card_style || 'classic',
    buttonText: (profile as any).card_button_text || 'Buy',
    buttonColor: (profile as any).card_button_color || '#10b981',
    buttonTextColor: (profile as any).card_button_text_color || '#ffffff',
    accentColor: (profile as any).card_accent_color || '#000000',
    borderRadius: (profile as any).card_border_radius || 'rounded',
    showRating: (profile as any).card_show_rating ?? true,
    showSellerName: (profile as any).card_show_seller_name ?? true,
    showBadge: (profile as any).card_show_badge ?? true,
  });

  const toCardProduct = (p: any): CardProduct => ({
    id: p.id, name: p.name, description: p.description, price: p.price,
    icon_url: p.icon_url, category_id: p.category_id, tags: p.tags,
    sold_count: p.sold_count, chat_allowed: p.chat_allowed,
    seller_id: p.seller_id || profile.id, product_type: p.product_type || null,
    product_metadata: p.product_metadata || null, rating: p.rating, review_count: p.review_count,
  });

  const sellerCardSettings = extractCardSettings();

  if (loading) {
    return (
      <div className="p-6 lg:p-8 bg-white min-h-screen">
        <div className="flex justify-between items-center mb-6"><Skeleton className="h-8 w-32" /><Skeleton className="h-10 w-32" /></div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-80 rounded-lg" />)}</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid lg:grid-cols-12 gap-5">

        {/* ============ LEFT PANEL ============ */}
        <div className={`hidden lg:block lg:col-span-2 space-y-3 ${!leftPanelOpen ? 'lg:hidden' : ''}`}>
          {/* Quick Stats Card - Gumroad Style */}
          <div className="bg-white border border-black/10 rounded-xl p-4 space-y-0">
            <h3 className="text-black/40 uppercase tracking-widest text-[10px] font-bold mb-3">Overview</h3>
            {[
              { label: 'Total Products', value: totalProducts, icon: Package },
              { label: 'Live', value: liveProducts, icon: Eye },
              { label: 'Pending', value: pendingProducts, icon: Clock },
              { label: 'Drafts', value: draftProducts, icon: FileText },
            ].map((s, i) => (
              <div key={s.label} className={`flex items-center justify-between py-2.5 ${i > 0 ? 'border-t border-black/5' : ''}`}>
                <div className="flex items-center gap-2">
                  <s.icon className="w-3.5 h-3.5 text-black/40" />
                  <span className="text-xs text-black/60">{s.label}</span>
                </div>
                <span className="text-sm font-extrabold text-black">{s.value}</span>
              </div>
            ))}
            {/* Revenue row highlighted */}
            <div className="mt-2 bg-black rounded-lg px-3 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-white/60" />
                <span className="text-xs text-white/70">Revenue</span>
              </div>
              <span className="text-sm font-extrabold text-white">{formatAmountOnly(totalRevenue)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-t border-black/5">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5 text-black/40" />
                <span className="text-xs text-black/60">Total Sales</span>
              </div>
              <span className="text-sm font-extrabold text-black">{totalSales}</span>
            </div>
          </div>

          {/* Status Filters Card */}
          <div className="bg-white border border-black/10 rounded-xl p-4 space-y-1">
            <h3 className="text-black/40 uppercase tracking-widest text-[10px] font-bold mb-2">Status</h3>
            {[
              { key: 'all', label: 'All Products', count: totalProducts, dot: 'bg-black/30' },
              { key: 'live', label: 'Live', count: liveProducts, dot: 'bg-emerald-500' },
              { key: 'pending', label: 'Pending', count: pendingProducts, dot: 'bg-amber-400' },
              { key: 'draft', label: 'Draft', count: draftProducts, dot: 'bg-black/20' },
              { key: 'hidden', label: 'Hidden', count: hiddenProducts, dot: 'bg-amber-500' },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === f.key ? 'bg-black text-white' : 'hover:bg-black/[0.03] text-black/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${statusFilter === f.key ? 'bg-white/60' : f.dot}`} />
                  <span>{f.label}</span>
                </div>
                <span className={`text-[10px] font-bold ${statusFilter === f.key ? 'text-white/70' : 'text-black/30'}`}>{f.count}</span>
              </button>
            ))}
          </div>

          {/* Category Card */}
          {categories.length > 0 && (
            <div className="bg-white border border-black/10 rounded-xl p-4 space-y-1">
              <h3 className="text-black/40 uppercase tracking-widest text-[10px] font-bold mb-2">Categories</h3>
              <button
                onClick={() => setCategoryFilter('all')}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  categoryFilter === 'all' ? 'text-black font-bold underline underline-offset-2' : 'hover:bg-black/[0.03] text-black/50'
                }`}
              >All Categories</button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all ${
                    categoryFilter === cat.id ? 'text-black font-bold underline underline-offset-2' : 'hover:bg-black/[0.03] text-black/50'
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[10px] text-black/30 font-medium">{categoryCounts[cat.id] || 0}</span>
                </button>
              ))}
            </div>
          )}

          {/* Sort Card */}
          <div className="bg-white border border-black/10 rounded-xl p-4 space-y-3">
            <h3 className="text-black/40 uppercase tracking-widest text-[10px] font-bold">Sort</h3>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full h-9 text-xs border-black/10 rounded-lg text-black">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="best-selling">Best Selling</SelectItem>
                <SelectItem value="price-high">Price: High→Low</SelectItem>
                <SelectItem value="price-low">Price: Low→High</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline" size="sm"
              onClick={() => { setBulkMode(!bulkMode); if (bulkMode) clearBulkSelection(); }}
              className={`w-full h-9 text-xs rounded-lg ${bulkMode ? 'bg-black text-white border-black hover:bg-black/90' : 'border-black/10 text-black hover:bg-black/[0.03]'}`}
            >
              <CheckSquare className="w-3.5 h-3.5 mr-1.5" />Bulk Select
            </Button>
          </div>

          {/* Recently Edited Card */}
          {recentlyEdited.length > 0 && (
            <div className="bg-white border border-black/10 rounded-xl p-4 space-y-1">
              <h3 className="text-black/40 uppercase tracking-widest text-[10px] font-bold mb-2">Recently Edited</h3>
              {recentlyEdited.map(id => {
                const p = products.find(x => x.id === id);
                if (!p) return null;
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedProduct(id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/[0.03] text-left transition-all"
                  >
                    {p.icon_url ? (
                      <img src={p.icon_url} className="w-7 h-7 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded bg-black/5 flex items-center justify-center flex-shrink-0">
                        <Package className="w-3.5 h-3.5 text-black/30" />
                      </div>
                    )}
                    <span className="text-xs font-medium text-black truncate flex-1">{p.name}</span>
                    <ChevronRight className="w-3 h-3 text-black/20 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ============ MAIN PRODUCT GRID ============ */}
        <div className="lg:col-span-7 space-y-5">
          {/* Banner - Text/Icon Based (replaces image) */}
          <div className="bg-black rounded-xl p-5 flex items-center justify-between overflow-hidden relative mb-3">
            <div className="relative z-10">
              <h2 className="text-white font-bold text-xl leading-tight">Your Products</h2>
              <p className="text-white/50 text-sm mt-1">{totalProducts} products in your store</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full bg-white/10 text-white/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{liveProducts} Live
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full bg-white/10 text-white/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{pendingProducts} Pending
                </span>
              </div>
            </div>
            {/* Decorative icon cluster */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-3 opacity-[0.08]">
              <Package className="w-16 h-16 text-white" />
              <ShoppingBag className="w-12 h-12 text-white mt-4" />
              <Layers className="w-10 h-10 text-white mt-1" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-black/30" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-black/10 rounded-xl h-11"
              />
            </div>
            <Button onClick={() => navigate('/seller/products/new')} className="bg-black text-white hover:bg-black/90 rounded-xl h-11 px-5 font-semibold">
              <Plus className="h-4 w-4 mr-2" />New Product
            </Button>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-black/10 rounded-xl">
              <Package className="w-14 h-14 text-black/10 mx-auto mb-4" />
              <p className="text-black/40 text-sm">No products found</p>
              <Button onClick={() => navigate('/seller/products/new')} variant="outline" className="mt-4 rounded-lg border-black/10 text-black hover:bg-black/[0.03]">
                <Plus className="w-4 h-4 mr-2" />Create Product
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const isSelected = selectedProduct === product.id;
                const status = getProductStatus(product);
                const productType = (product as any).product_type;
                const TypeIcon = productType ? PRODUCT_TYPE_ICONS[productType] || FileText : null;
                const typeLabel = productType ? PRODUCT_TYPE_LABELS[productType] || productType : null;
                const salesCount = getProductSales(product.id);
                const isBulkSelected = selectedIds.has(product.id);
                const catNames = getCategoryNames(product);
                const hasLowStock = product.stock > 0 && product.stock < 5;
                const comparePrice = (product as any).original_price;

                return (
                  <div
                    key={product.id}
                    className={`relative group transition-all cursor-pointer ${isSelected ? 'ring-2 ring-pink-500 rounded-xl' : ''} ${isBulkSelected ? 'ring-2 ring-black rounded-xl' : ''}`}
                    onClick={() => setSelectedProduct(product.id)}
                  >
                    {/* Bulk Checkbox */}
                    {(bulkMode || selectedIds.size > 0) && (
                      <div className="absolute top-3 left-3 z-20" onClick={e => e.stopPropagation()}>
                        <Checkbox
                          checked={isBulkSelected}
                          onCheckedChange={() => toggleBulkSelect(product.id)}
                          className="h-5 w-5 border-2 border-white bg-white/90 backdrop-blur-sm shadow-md data-[state=checked]:bg-black data-[state=checked]:border-black"
                        />
                      </div>
                    )}

                    {/* Product Type Badge - Black Pill */}
                    {typeLabel && TypeIcon && (
                      <div className="absolute top-3 left-3 z-10" style={bulkMode ? { left: '2.5rem' } : {}}>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-black text-white shadow-sm">
                          <TypeIcon className="w-3 h-3" />
                          {typeLabel}
                        </span>
                      </div>
                    )}

                    {/* Low Stock Warning */}
                    {hasLowStock && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-700 shadow-sm">
                          <AlertTriangle className="w-3 h-3" />Low Stock
                        </span>
                      </div>
                    )}

                    {/* Full-Card Hover Overlay */}
                    <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[2px] rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
                      {[
                        { icon: Edit2, label: 'Edit', action: () => openEditSheet(product.id), primary: true },
                        { icon: Copy, label: 'Duplicate', action: () => duplicateProduct(product.id) },
                        { icon: Link2, label: 'Copy Link', action: () => copyProductLink(product.id, product.name, (product as any).slug) },
                        { icon: ExternalLink, label: 'View Store', action: () => viewInStore(product) },
                        { icon: Trash2, label: 'Delete', action: () => handleDeleteClick(product.id), danger: true },
                      ].map(btn => (
                        <button
                          key={btn.label}
                          onClick={(e) => { e.stopPropagation(); btn.action(); }}
                          className={`flex items-center gap-2.5 w-40 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                            (btn as any).danger
                              ? 'bg-red-500/20 text-red-300 hover:bg-red-500/40'
                              : (btn as any).primary
                                ? 'bg-pink-500 text-white hover:bg-pink-600'
                                : 'bg-white/15 text-white hover:bg-white/25'
                          }`}
                        >
                          <btn.icon className="w-3.5 h-3.5" />
                          {btn.label}
                        </button>
                      ))}
                    </div>

                    {/* Bottom Info Bar - Clean White */}
                    <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm p-3 rounded-b-xl pointer-events-none border-t border-black/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${status.dotColor}`} />
                          <span className="text-[10px] text-black/50 font-medium">{status.label}</span>
                          {salesCount > 0 && (
                            <span className="text-[10px] text-black/40">{salesCount} sold</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {comparePrice && comparePrice > product.price && (
                            <span className="text-xs text-black/30 line-through">{formatAmountOnly(comparePrice)}</span>
                          )}
                          <span className="text-sm font-extrabold text-black">{formatAmountOnly(product.price)}</span>
                        </div>
                      </div>
                    </div>

                    <ProductCardRenderer
                      product={toCardProduct(product)}
                      storeCardSettings={sellerCardSettings}
                      sellerName={profile.store_name}
                      sellerAvatar={profile.store_logo_url}
                      onClick={() => setSelectedProduct(product.id)}
                    />

                    {/* Category Tags Below Card */}
                    {catNames.length > 0 && (
                      <div className="flex flex-wrap gap-0 mt-1.5 px-1">
                        {catNames.map((name: string, idx: number) => (
                          <span key={name} className="text-[10px] text-black/30">
                            {idx > 0 && <span className="mx-1">/</span>}{name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ============ RIGHT PANEL ============ */}
        <div className="lg:col-span-3 space-y-3">
          {previewProduct ? (
            <>
              {/* Product Type Badge at Top */}
              {(previewProduct as any).product_type && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-black text-white">
                    {(() => { const T = PRODUCT_TYPE_ICONS[(previewProduct as any).product_type]; return T ? <T className="w-3 h-3" /> : null; })()}
                    {PRODUCT_TYPE_LABELS[(previewProduct as any).product_type] || (previewProduct as any).product_type}
                  </span>
                  <span className="text-xs text-black/30">•</span>
                  <span className="text-xs text-black/50 truncate">{previewProduct.name}</span>
                </div>
              )}

              {/* Card Preview */}
              <div className="bg-white border border-black/10 rounded-xl p-4">
                <p className="text-black/30 uppercase text-[10px] font-bold tracking-widest mb-3">Buyer Preview</p>
                <ProductCardRenderer
                  product={toCardProduct(previewProduct)}
                  storeCardSettings={sellerCardSettings}
                  sellerName={profile.store_name}
                  sellerAvatar={profile.store_logo_url}
                  onClick={() => {}}
                />
              </div>

              {/* Quick Actions - Vertical List */}
              <div className="bg-white border border-black/10 rounded-xl p-4 space-y-0">
                <h3 className="text-black/40 uppercase tracking-widest text-[10px] font-bold mb-2">Actions</h3>
                {[
                  { icon: Edit2, label: 'Edit Product', desc: 'Open editor panel', action: () => openEditSheet(previewProduct.id) },
                  { icon: Copy, label: 'Duplicate', desc: 'Create a copy', action: () => duplicateProduct(previewProduct.id) },
                  { icon: Link2, label: 'Copy Link', desc: 'Share product URL', action: () => copyProductLink(previewProduct.id, previewProduct.name, (previewProduct as any).slug) },
                  { icon: ExternalLink, label: 'View in Store', desc: 'Open in new tab', action: () => viewInStore(previewProduct) },
                  { icon: BarChart3, label: 'Analytics', desc: 'View product stats', action: () => navigate('/seller/analytics') },
                  { icon: Share2, label: 'Share', desc: 'Social share options', action: () => copyProductLink(previewProduct.id, previewProduct.name, (previewProduct as any).slug) },
                ].map((a, i) => (
                  <button
                    key={a.label}
                    onClick={a.action}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-black/[0.03] transition-all text-left ${i > 0 ? 'border-t border-black/5' : ''}`}
                  >
                    <a.icon className="w-4 h-4 text-black/50 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black">{a.label}</p>
                      <p className="text-[10px] text-black/40">{a.desc}</p>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-black/20" />
                  </button>
                ))}
              </div>

              {/* Stats with Sparkline */}
              <div className="bg-white border border-black/10 rounded-xl p-4">
                <h3 className="text-black/40 uppercase tracking-widest text-[10px] font-bold mb-3">Stats</h3>
                {/* Mini Sparkline - Black bars */}
                <div className="h-16 mb-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getSalesTrend(previewProduct.id)}>
                      <Bar dataKey="sales" fill="#000000" radius={[2, 2, 0, 0]} />
                      <RechartsTooltip
                        contentStyle={{ fontSize: 10, borderRadius: 8, padding: '4px 8px' }}
                        labelStyle={{ fontSize: 10 }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-black/50">Sales</span>
                    <span className="font-bold text-black">{getProductSales(previewProduct.id)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-black/50">Revenue</span>
                    <span className="font-bold text-black">{formatAmountOnly(getProductRevenue(previewProduct.id))}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-black/50">Views</span>
                    <span className="font-bold text-black">{(previewProduct as any).view_count || 0}</span>
                  </div>
                  {getProductSales(previewProduct.id) > 0 && (previewProduct as any).view_count > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-black/50">Conversion</span>
                      <span className="font-bold text-black">
                        {((getProductSales(previewProduct.id) / ((previewProduct as any).view_count || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  <div className="border-t border-black/5 pt-2.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-black/50">Status</span>
                      {(() => { const s = getProductStatus(previewProduct); return (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-black/60">
                          <span className={`w-2 h-2 rounded-full ${s.dotColor}`} />{s.label}
                        </span>
                      ); })()}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-black/50">Created</span>
                    <span className="text-black/60">{new Date((previewProduct as any).created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white border border-red-500/20 rounded-xl p-4">
                <h3 className="text-red-500 uppercase tracking-widest text-[10px] font-bold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" />Danger Zone
                </h3>
                <div className="space-y-1.5">
                  <Button size="sm" variant="outline" className="w-full justify-start rounded-lg h-9 text-xs border-black/10 text-black hover:bg-black/[0.03]"
                    onClick={() => toggleAvailability(previewProduct.id, previewProduct.is_available)}>
                    {previewProduct.is_available ? <><EyeOff className="w-3.5 h-3.5 mr-2" />Hide from Store</> : <><Eye className="w-3.5 h-3.5 mr-2" />Show in Store</>}
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start rounded-lg h-9 text-xs border-transparent text-red-500 hover:bg-red-50"
                    onClick={() => handleDeleteClick(previewProduct.id)}>
                    <Trash2 className="w-3.5 h-3.5 mr-2" />Delete Product
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Default: Welcome card with icon */}
              <div className="bg-white border border-black/10 rounded-xl p-6 text-center">
                <ShoppingBag className="w-10 h-10 text-black/10 mx-auto mb-3" />
                <p className="text-sm font-bold text-black mb-1">Select a product</p>
                <p className="text-xs text-black/40 leading-relaxed">Click any product card to see its preview, stats, and quick actions here.</p>
              </div>

              {/* Store Summary Card */}
              <div className="bg-white border border-black/10 rounded-xl p-4">
                <h3 className="text-black/40 uppercase tracking-widest text-[10px] font-bold mb-3">Store Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Products', value: totalProducts },
                    { label: 'Live', value: liveProducts },
                    { label: 'Sales', value: totalSales },
                    { label: 'Revenue', value: formatAmountOnly(totalRevenue) },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-2xl font-extrabold text-black leading-none">{s.value}</p>
                      <p className="text-[10px] text-black/40 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Performing */}
              {topPerforming && getProductSales(topPerforming.id) > 0 && (
                <div className="bg-white border border-black/10 rounded-xl p-4 border-l-[3px] border-l-black">
                  <h3 className="text-black/40 uppercase tracking-widest text-[10px] font-bold mb-2 flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-black/40" />Top Performing
                  </h3>
                  <button onClick={() => setSelectedProduct(topPerforming.id)} className="w-full text-left flex items-center gap-3 p-2 rounded-lg hover:bg-black/[0.03]">
                    {topPerforming.icon_url ? (
                      <img src={topPerforming.icon_url} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-black/5 flex items-center justify-center"><Package className="w-5 h-5 text-black/20" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-black truncate">{topPerforming.name}</p>
                      <p className="text-[10px] text-black/50">{getProductSales(topPerforming.id)} sales • {formatAmountOnly(getProductRevenue(topPerforming.id))}</p>
                    </div>
                  </button>
                </div>
              )}

              {/* Needs Attention */}
              {needsAttention.length > 0 && (
                <div className="bg-white border border-black/10 rounded-xl p-4 border-l-[3px] border-l-amber-400">
                  <h3 className="text-black/40 uppercase tracking-widest text-[10px] font-bold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />Needs Attention
                  </h3>
                  <div className="space-y-1.5">
                    {needsAttention.map(p => (
                      <button key={p.id} onClick={() => setSelectedProduct(p.id)}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-black/[0.03] text-left">
                        <span className="text-xs text-black truncate flex-1">{p.name}</span>
                        <span className="text-[10px] text-black/50 font-medium ml-2 bg-black/5 px-2 py-0.5 rounded-full">
                          {p.stock > 0 && p.stock < 5 ? 'Low Stock' : '0 Sales'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <Button onClick={() => navigate('/seller/products/new')}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 rounded-xl h-11 font-semibold">
            <Plus className="h-4 w-4 mr-2" />Create New Product
          </Button>
        </div>

        {/* ============ BULK ACTIONS FLOATING BAR ============ */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4">
            <span className="text-sm font-semibold">{selectedIds.size} selected</span>
            <div className="w-px h-6 bg-white/20" />
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 h-8 text-xs" onClick={() => handleBulkToggleVisibility(false)}>
              <EyeOff className="w-3.5 h-3.5 mr-1.5" />Hide
            </Button>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 h-8 text-xs" onClick={() => handleBulkToggleVisibility(true)}>
              <Eye className="w-3.5 h-3.5 mr-1.5" />Show
            </Button>
            <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-900/30 h-8 text-xs" onClick={handleBulkDelete}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />Delete
            </Button>
            <div className="w-px h-6 bg-white/20" />
            <Button size="sm" variant="ghost" className="text-white/50 hover:bg-white/10 h-8 text-xs" onClick={clearBulkSelection}>
              <X className="w-3.5 h-3.5 mr-1.5" />Clear
            </Button>
          </div>
        )}

        {/* ============ EDIT SHEET PANEL ============ */}
        <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg p-0 bg-white">
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-black/10">
              <div className="flex items-center gap-3">
                <SheetTitle className="text-lg font-bold text-black">Edit Product</SheetTitle>
                {editSheetProductId && (() => {
                  const ep = products.find(p => p.id === editSheetProductId);
                  if (!ep || !(ep as any).product_type) return null;
                  return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-black text-white">
                      {PRODUCT_TYPE_LABELS[(ep as any).product_type] || (ep as any).product_type}
                    </span>
                  );
                })()}
              </div>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-160px)]">
              <div className="px-6 py-5 space-y-5">

                {/* Live Preview Mini Card */}
                {editSheetProductId && (
                  <div className="bg-black/[0.02] rounded-xl p-3 border border-black/5">
                    <p className="text-[10px] text-black/40 font-bold uppercase tracking-widest mb-2">Live Preview</p>
                    <div className="transform scale-[0.85] origin-top-left">
                      <ProductCardRenderer
                        product={{
                          ...toCardProduct(products.find(p => p.id === editSheetProductId) || products[0]),
                          name: formData.name || 'Product Name',
                          price: parseFloat(formData.price) || 0,
                          description: formData.description || null,
                          icon_url: formData.images[0] || formData.icon_url || null,
                        }}
                        storeCardSettings={sellerCardSettings}
                        sellerName={profile.store_name}
                        sellerAvatar={profile.store_logo_url}
                        onClick={() => {}}
                      />
                    </div>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-black">Product Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., ChatGPT Plus Account" className="border-black/10 rounded-lg h-11" />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-black">Description</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your product..." rows={3} className="border-black/10 rounded-lg" />
                </div>

                {/* Pricing */}
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-black">Pricing</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-black/40">Price (USD) *</Label>
                      <Input type="number" step="0.01" min="0" value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))} className="border-black/10 rounded-lg h-10" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-black/40">Stock</Label>
                      <Input type="number" min="0" value={formData.stock}
                        onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))} className="border-black/10 rounded-lg h-10" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-black/40">Compare Price</Label>
                      <Input type="number" step="0.01" min="0" value={formData.compare_at_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, compare_at_price: e.target.value }))} className="border-black/10 rounded-lg h-10" />
                    </div>
                  </div>
                  {/* PWYW Toggle */}
                  <div className="flex items-center justify-between py-2 px-3 bg-black/[0.02] rounded-lg">
                    <div>
                      <Label className="text-xs font-semibold text-black">Pay What You Want</Label>
                      <p className="text-[10px] text-black/40">Let buyers choose their price</p>
                    </div>
                    <Switch checked={formData.is_pwyw} onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_pwyw: v }))} className="data-[state=checked]:bg-pink-500" />
                  </div>
                  {formData.is_pwyw && (
                    <div className="space-y-1">
                      <Label className="text-[10px] text-black/40">Minimum Price</Label>
                      <Input type="number" step="0.01" min="0" value={formData.min_price}
                        onChange={(e) => setFormData(prev => ({ ...prev, min_price: e.target.value }))} placeholder="0.00" className="border-black/10 rounded-lg h-10" />
                    </div>
                  )}
                </div>

                {/* Category Chips */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-black">Categories</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                          formData.category_ids.includes(cat.id) ? 'bg-black text-white border-black' : 'bg-white text-black/60 border-black/10 hover:border-black/30'
                        }`}>{cat.name}</button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-black">Tags</Label>
                  <div className="flex flex-wrap gap-2 p-3 bg-black/[0.02] rounded-lg border border-black/10 min-h-[52px]">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="px-2.5 py-1 bg-black text-white border-0 cursor-pointer hover:bg-black/80" onClick={() => handleRemoveTag(tag)}>
                        {tag}<X className="w-3 h-3 ml-1.5" />
                      </Badge>
                    ))}
                    <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown}
                      placeholder="Add tag..." className="flex-1 min-w-[80px] border-0 bg-transparent p-0 h-7 focus-visible:ring-0 text-sm" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {popularTags.filter(t => !formData.tags.includes(t)).slice(0, 5).map(tag => (
                      <button key={tag} type="button" onClick={() => handleAddTag(tag)} className="text-[10px] px-2.5 py-1 border border-black/10 hover:border-black/30 hover:bg-black/[0.03] text-black/50 rounded-full transition-colors">+ {tag}</button>
                    ))}
                  </div>
                </div>

                {/* Images */}
                <MultiImageUploader images={formData.images} onChange={(images) => setFormData(prev => ({ ...prev, images }))} maxImages={5} />

                {/* Toggles */}
                <div className="space-y-2.5 pt-2 border-t border-black/5">
                  {[
                    { label: 'Available for sale', key: 'is_available' as const, value: formData.is_available },
                    { label: 'Allow chat', key: 'chat_allowed' as const, value: formData.chat_allowed },
                    { label: 'Email required', key: 'requires_email' as const, value: formData.requires_email },
                  ].map(t => (
                    <div key={t.key} className="flex items-center justify-between py-1">
                      <Label className="text-xs font-medium text-black">{t.label}</Label>
                      <Switch checked={t.value} onCheckedChange={(v) => setFormData(prev => ({ ...prev, [t.key]: v }))} className="data-[state=checked]:bg-pink-500" />
                    </div>
                  ))}
                </div>

                {/* SEO Section (Collapsible) */}
                <Collapsible open={seoOpen} onOpenChange={setSeoOpen}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between py-3 border-t border-black/5">
                      <span className="flex items-center gap-2 text-sm font-bold text-black">
                        <Globe className="w-4 h-4 text-black/40" />SEO Settings
                      </span>
                      <ChevronDown className={`w-4 h-4 text-black/40 transition-transform ${seoOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-black/40">URL Slug</Label>
                      <Input value={formData.slug} onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                        placeholder="my-product-name" className="border-black/10 rounded-lg h-10 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-black/40">Meta Description</Label>
                      <Textarea value={formData.seo_description} onChange={(e) => setFormData(prev => ({ ...prev, seo_description: e.target.value }))}
                        placeholder="Brief description for search engines..." rows={2} className="border-black/10 rounded-lg text-sm" maxLength={160} />
                      <p className="text-[10px] text-black/30 text-right">{formData.seo_description.length}/160</p>
                    </div>
                    {/* Preview */}
                    <div className="bg-black/[0.02] rounded-lg p-3 border border-black/5">
                      <p className="text-[10px] text-black/40 uppercase tracking-wider mb-1">Search Preview</p>
                      <p className="text-sm text-blue-700 font-medium truncate">{formData.name || 'Product Title'}</p>
                      <p className="text-[10px] text-emerald-700 truncate">{`yourstore.com/product/${formData.slug || 'product-slug'}`}</p>
                      <p className="text-xs text-black/50 line-clamp-2 mt-0.5">{formData.seo_description || formData.description || 'Product description...'}</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Delivery Settings (Collapsible) */}
                <Collapsible open={deliveryOpen} onOpenChange={setDeliveryOpen}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between py-3 border-t border-black/5">
                      <span className="flex items-center gap-2 text-sm font-bold text-black">
                        <Zap className="w-4 h-4 text-black/40" />Delivery Settings
                      </span>
                      <ChevronDown className={`w-4 h-4 text-black/40 transition-transform ${deliveryOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-black/40">Delivery Type</Label>
                      <Select value={formData.delivery_type} onValueChange={(v) => setFormData(prev => ({ ...prev, delivery_type: v }))}>
                        <SelectTrigger className="h-10 border-black/10 rounded-lg text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instant">Instant Download</SelectItem>
                          <SelectItem value="auto_account">Auto Account Delivery</SelectItem>
                          <SelectItem value="auto_license">Auto License Key</SelectItem>
                          <SelectItem value="auto_download">Auto Unique Download</SelectItem>
                          <SelectItem value="manual">Manual Delivery</SelectItem>
                          <SelectItem value="email">Email Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-black/40">Thank You / Delivery Message</Label>
                      <Textarea value={formData.thank_you_message} onChange={(e) => setFormData(prev => ({ ...prev, thank_you_message: e.target.value }))}
                        placeholder="Instructions shown to buyer after purchase..." rows={3} className="border-black/10 rounded-lg text-sm" />
                    </div>
                    {['auto_account', 'auto_license', 'auto_download'].includes(formData.delivery_type) && editSheetProductId && (
                      <div className="pt-2 border-t border-black/5">
                        <p className="text-[10px] text-black/40 uppercase tracking-widest font-bold mb-2">Pool Inventory</p>
                        <p className="text-xs text-black/50 mb-2">Manage delivery items for this product in the <a href="/seller/delivery-inventory" className="text-pink-500 underline">Delivery Inventory</a> page.</p>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Card Appearance (Collapsible) */}
                <Collapsible open={cardCustomizerOpen} onOpenChange={setCardCustomizerOpen}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between py-3 border-t border-black/5">
                      <span className="flex items-center gap-2 text-sm font-bold text-black">
                        <Palette className="w-4 h-4 text-black/40" />Card Appearance
                      </span>
                      <ChevronDown className={`w-4 h-4 text-black/40 transition-transform ${cardCustomizerOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <CardCustomizer settings={{ ...DEFAULT_CARD_SETTINGS, ...editCardSettings }} onChange={setEditCardSettings} mode="product" />
                  </CollapsibleContent>
                </Collapsible>

                {/* Last Updated Timestamp */}
                {editSheetProductId && (() => {
                  const ep = products.find(p => p.id === editSheetProductId);
                  if (!ep) return null;
                  const updated = (ep as any).updated_at || (ep as any).created_at;
                  if (!updated) return null;
                  const mins = Math.floor((Date.now() - new Date(updated).getTime()) / 60000);
                  return (
                    <p className="text-[10px] text-black/30 text-center pt-2 border-t border-black/5">
                      Last saved {mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`}
                    </p>
                  );
                })()}
              </div>
            </ScrollArea>

            {/* Bottom Action Bar */}
            <div className="px-6 py-4 border-t border-black/10 bg-white flex gap-3">
              <Button variant="outline" onClick={() => setEditSheetOpen(false)} className="flex-1 rounded-lg h-11 border-black/10 text-black">Cancel</Button>
              <Button variant="outline" onClick={() => handleSheetSubmit(true)} disabled={submitting} className="rounded-lg h-11 border-black/10 text-black text-xs">Draft</Button>
              <Button onClick={() => handleSheetSubmit(false)} disabled={submitting}
                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg h-11 font-semibold">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm({ open, id: open ? deleteConfirm.id : null })}
          title="Delete Product"
          description="Are you sure? This action cannot be undone."
          onConfirm={handleDeleteConfirm}
          confirmText="Delete"
          variant="destructive"
          loading={deleting}
        />
      </div>
    </TooltipProvider>
  );
};

export default SellerProducts;
