import { useState, useEffect } from 'react';
import gumroadBanner from '@/assets/gumroad-banner.png';
import gumroadComic from '@/assets/gumroad-comic.png';
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
import CardCustomizer from './CardCustomizer';
import { CardSettings, CardProduct, DEFAULT_CARD_SETTINGS } from '@/components/marketplace/card-types';
import { 
  Plus, 
  Package, 
  Edit2, 
  Trash2, 
  Loader2,
  Search,
  MoreVertical,
  Eye,
  EyeOff,
  X,
  Copy,
  Filter,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  ExternalLink,
  ChevronDown,
  Palette,
  CheckSquare,
  BarChart3,
  Clock,
  AlertTriangle,
  FileText,
  Headphones,
  Video,
  BookOpen,
  Layers,
  Coffee,
  Image as ImageIcon,
  Music,
  Code,
  Users,
  Zap
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import MultiImageUploader from './MultiImageUploader';
import { getProductShareUrl } from '@/lib/url-utils';

interface Category {
  id: string;
  name: string;
}

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
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  price: '',
  stock: '',
  compare_at_price: '',
  category_ids: [],
  tags: [],
  icon_url: '',
  images: [],
  is_available: true,
  chat_allowed: true,
  requires_email: false
};

const popularTags = ['Digital', 'Premium', 'Instant Delivery', 'Lifetime', 'Subscription', 'API', 'Software', 'Course'];

const PRODUCT_TYPE_ICONS: Record<string, React.ElementType> = {
  'digital': FileText,
  'ebook': BookOpen,
  'course': Video,
  'video': Video,
  'audio': Music,
  'template': Layers,
  'software': Code,
  'service': Headphones,
  'membership': Users,
  'bundle': Layers,
  'graphics': ImageIcon,
  'coffee': Coffee,
  'call': Headphones,
  'commission': Zap,
};

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  'digital': 'Digital',
  'ebook': 'E-book',
  'course': 'Course',
  'video': 'Video',
  'audio': 'Audio',
  'template': 'Template',
  'software': 'Software',
  'service': 'Service',
  'membership': 'Membership',
  'bundle': 'Bundle',
  'graphics': 'Graphics',
  'coffee': 'Coffee',
  'call': 'Call',
  'commission': 'Commission',
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
  
  // Sheet edit state
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editSheetProductId, setEditSheetProductId] = useState<string | null>(null);
  const [cardCustomizerOpen, setCardCustomizerOpen] = useState(false);
  const [editCardSettings, setEditCardSettings] = useState<Partial<CardSettings>>({});
  
  // Bulk selection
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .order('display_order');
    if (data) setCategories(data);
  };

  const openEditSheet = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setFormData({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      stock: String(product.stock),
      compare_at_price: String((product as any).original_price || ''),
      category_ids: (product as any).category_ids || (product.category_id ? [product.category_id] : []),
      tags: (product as any).tags || [],
      icon_url: product.icon_url || '',
      images: (product as any).images || [],
      is_available: product.is_available,
      chat_allowed: product.chat_allowed !== false,
      requires_email: (product as any).requires_email || false,
    });
    setEditSheetProductId(productId);
    setEditCardSettings(extractCardSettings());
    setEditSheetOpen(true);
  };

  const handleSheetSubmit = async (asDraft = false) => {
    if (!formData.name.trim() || !formData.price) {
      toast.error('Name and price are required');
      return;
    }
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
      };

      if (editSheetProductId) {
        const { error } = await supabase
          .from('seller_products')
          .update(productData)
          .eq('id', editSheetProductId);
        if (error) throw error;
        toast.success(asDraft ? 'Saved as draft' : 'Product updated');
      }
      setEditSheetOpen(false);
      refreshProducts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (productId: string) => {
    setDeleteConfirm({ open: true, id: productId });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('seller_products')
        .delete()
        .eq('id', deleteConfirm.id);
      if (error) throw error;
      toast.success('Product deleted');
      if (selectedProduct === deleteConfirm.id) setSelectedProduct(null);
      refreshProducts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    } finally {
      setDeleting(false);
      setDeleteConfirm({ open: false, id: null });
    }
  };

  const toggleAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('seller_products')
        .update({ is_available: !currentStatus })
        .eq('id', productId);
      if (error) throw error;
      toast.success(`Product ${!currentStatus ? 'enabled' : 'disabled'}`);
      refreshProducts();
    } catch (error: any) {
      toast.error('Failed to update');
    }
  };

  const copyProductLink = async (productId: string, productName: string, productSlug?: string | null) => {
    const storeSlug = (profile as any)?.store_slug || profile?.id;
    const slug = productSlug || `${productName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)}-${productId.slice(0, 8)}`;
    const url = getProductShareUrl(storeSlug, slug);
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`Link copied for "${productName}"`);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const duplicateProduct = (productId: string) => {
    navigate(`/seller/products/new?duplicate=${productId}`);
  };

  const viewInStore = (product: any) => {
    const storeSlug = (profile as any)?.store_slug || profile?.id;
    const slug = product.slug || `${product.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)}-${product.id.slice(0, 8)}`;
    window.open(`/store/${storeSlug}/${slug}`, '_blank');
  };

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, trimmedTag] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }));
  };

  // Bulk selection helpers
  const toggleBulkSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearBulkSelection = () => {
    setSelectedIds(new Set());
    setBulkMode(false);
  };

  const handleBulkToggleVisibility = async (show: boolean) => {
    try {
      const { error } = await supabase
        .from('seller_products')
        .update({ is_available: show })
        .in('id', Array.from(selectedIds));
      if (error) throw error;
      toast.success(`${selectedIds.size} products ${show ? 'shown' : 'hidden'}`);
      clearBulkSelection();
      refreshProducts();
    } catch { toast.error('Failed to update'); }
  };

  const handleBulkDelete = async () => {
    try {
      const { error } = await supabase
        .from('seller_products')
        .delete()
        .in('id', Array.from(selectedIds));
      if (error) throw error;
      toast.success(`${selectedIds.size} products deleted`);
      clearBulkSelection();
      refreshProducts();
    } catch { toast.error('Failed to delete'); }
  };

  // Apply filters
  let filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (sortBy === 'newest') {
    filteredProducts = [...filteredProducts].sort((a, b) => new Date((b as any).created_at || 0).getTime() - new Date((a as any).created_at || 0).getTime());
  } else if (sortBy === 'price-high') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  } else if (sortBy === 'price-low') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sortBy === 'best-selling') {
    filteredProducts = [...filteredProducts].sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0));
  }

  const totalProducts = products.length;
  const liveProducts = products.filter(p => p.is_approved && p.is_available).length;
  const pendingProducts = products.filter(p => !p.is_approved && p.is_available).length;
  const draftProducts = products.filter(p => !p.is_available && !p.is_approved).length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.seller_earning || 0), 0);
  const totalSales = orders.length;

  const getCategoryNames = (product: any) => {
    const ids = product.category_ids || (product.category_id ? [product.category_id] : []);
    return ids.map((id: string) => categories.find(c => c.id === id)?.name).filter(Boolean);
  };

  const getProductStatus = (p: any) => {
    if (p.is_approved && p.is_available) return { label: 'Live', color: 'bg-emerald-500 text-white', icon: Eye };
    if (!p.is_available && !p.is_approved) return { label: 'Draft', color: 'bg-slate-200 text-slate-600', icon: FileText };
    if (!p.is_available && p.is_approved) return { label: 'Hidden', color: 'bg-orange-100 text-orange-700', icon: EyeOff };
    return { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock };
  };

  const getProductSales = (productId: string) => {
    return orders.filter(o => o.product_id === productId).length;
  };

  const getProductRevenue = (productId: string) => {
    return orders.filter(o => o.product_id === productId).reduce((sum, o) => sum + Number(o.seller_earning || 0), 0);
  };

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
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    icon_url: p.icon_url,
    category_id: p.category_id,
    tags: p.tags,
    sold_count: p.sold_count,
    chat_allowed: p.chat_allowed,
    seller_id: p.seller_id || profile.id,
    product_type: p.product_type || null,
    product_metadata: p.product_metadata || null,
    rating: p.rating,
    review_count: p.review_count,
  });

  const sellerCardSettings = extractCardSettings();

  if (loading) {
    return (
      <div className="p-6 lg:p-8 bg-white min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-80 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid lg:grid-cols-10 gap-6">
        {/* Main Products Section - 70% */}
        <div className="lg:col-span-7 space-y-6">
          {/* Banner */}
          <div className="mb-4">
            <img src={gumroadBanner} alt="Start creating and selling" className="w-full h-auto object-contain rounded-xl shadow-lg" />
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white border rounded p-8 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
              <p className="text-base text-slate-700 mb-2">Products</p>
              <p className="text-4xl font-semibold text-slate-900"><AnimatedCounter value={totalProducts} /></p>
            </div>
            <div className="bg-white border rounded p-8 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
              <p className="text-base text-slate-700 mb-2">Live</p>
              <p className="text-4xl font-semibold text-slate-900"><AnimatedCounter value={liveProducts} /></p>
            </div>
            <div className="bg-white border rounded p-8 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
              <p className="text-base text-slate-700 mb-2">Revenue</p>
              <p className="text-4xl font-semibold text-slate-900">{formatAmountOnly(totalRevenue)}</p>
            </div>
          </div>

          {/* Search & Filters Bar */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-xl w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 bg-white border border-gray-300 rounded-xl h-12 shadow-sm focus:border-pink-500 focus:ring-pink-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] h-10 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <Filter className="w-3.5 h-3.5 mr-2 text-gray-400" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px] h-10 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] h-10 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="best-selling">Best Selling</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => { setBulkMode(!bulkMode); if (bulkMode) clearBulkSelection(); }}
                className={`h-10 px-3 rounded-lg border ${bulkMode ? 'bg-pink-50 border-pink-300 text-pink-700' : 'border-gray-200'}`}
              >
                <CheckSquare className="w-4 h-4 mr-1.5" />
                Bulk
              </Button>

              <Button 
                onClick={() => navigate('/seller/products/new')} 
                className="bg-black text-white hover:bg-black/90 rounded-lg h-10 px-5 font-semibold shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Product
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white border rounded">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No products yet. Create your first product!</p>
            </div>
          ) : (
            <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => {
                const isSelected = selectedProduct === product.id;
                const status = getProductStatus(product);
                const StatusIcon = status.icon;
                const productType = (product as any).product_type;
                const TypeIcon = productType ? PRODUCT_TYPE_ICONS[productType] || FileText : null;
                const typeLabel = productType ? PRODUCT_TYPE_LABELS[productType] || productType : null;
                const salesCount = getProductSales(product.id);
                const isBulkSelected = selectedIds.has(product.id);

                return (
                  <div 
                    key={product.id} 
                    className={`relative group transition-all ${isSelected ? 'ring-2 ring-pink-500 rounded-xl' : ''} ${isBulkSelected ? 'ring-2 ring-blue-500 rounded-xl' : ''}`}
                  >
                    {/* Bulk Checkbox */}
                    {(bulkMode || selectedIds.size > 0) && (
                      <div className="absolute top-3 left-3 z-20">
                        <Checkbox
                          checked={isBulkSelected}
                          onCheckedChange={() => toggleBulkSelect(product.id)}
                          className="h-5 w-5 border-2 border-white bg-white/90 backdrop-blur-sm shadow-md data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                        />
                      </div>
                    )}

                    {/* Product Type Badge - Top Right */}
                    {typeLabel && TypeIcon && (
                      <div className="absolute top-3 right-3 z-10">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-white/90 backdrop-blur-sm text-slate-700 shadow-sm border border-slate-200">
                          <TypeIcon className="w-3 h-3" />
                          {typeLabel}
                        </span>
                      </div>
                    )}

                    {/* Hover Actions Overlay */}
                    <div className={`absolute top-3 ${typeLabel ? 'right-24' : 'right-3'} z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); openEditSheet(product.id); }}
                            className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-white rounded-lg shadow-sm"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom"><p>Edit</p></TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); copyProductLink(product.id, product.name, (product as any).slug); }}
                            className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-white rounded-lg shadow-sm"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom"><p>Copy Link</p></TooltipContent>
                      </Tooltip>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-white rounded-lg shadow-sm"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-lg border border-gray-200">
                          <DropdownMenuItem onClick={() => toggleAvailability(product.id, product.is_available)} className="rounded-md">
                            {product.is_available ? <><EyeOff className="h-4 w-4 mr-2" />Hide</> : <><Eye className="h-4 w-4 mr-2" />Show</>}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => duplicateProduct(product.id)} className="rounded-md">
                            <Copy className="h-4 w-4 mr-2" />Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteClick(product.id)} className="text-red-600 focus:text-red-600 rounded-md" disabled={deleting}>
                            <Trash2 className="h-4 w-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Bottom Info Bar: Status + Sales + Price */}
                    <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 via-black/40 to-transparent p-3 rounded-b-xl pointer-events-none">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                          {salesCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-white/90 text-slate-700">
                              <ShoppingBag className="w-3 h-3" />
                              {salesCount} sold
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-white drop-shadow-md">
                          {formatAmountOnly(product.price)}
                        </span>
                      </div>
                    </div>

                    <ProductCardRenderer
                      product={toCardProduct(product)}
                      storeCardSettings={sellerCardSettings}
                      sellerName={profile.store_name}
                      sellerAvatar={profile.store_logo_url}
                      onClick={() => setSelectedProduct(product.id)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Sidebar - Product Command Center */}
        <div className="lg:col-span-3 space-y-5">
          {previewProduct ? (
            <>
              {/* Card Preview */}
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <ProductCardRenderer
                  product={toCardProduct(previewProduct)}
                  storeCardSettings={sellerCardSettings}
                  sellerName={profile.store_name}
                  sellerAvatar={profile.store_logo_url}
                  onClick={() => {}}
                />
                <p className="text-center text-xs text-slate-400 mt-3 font-medium tracking-wide uppercase">As seen by buyers</p>
              </div>

              {/* Quick Actions 2x2 Grid */}
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => openEditSheet(previewProduct.id)}
                    className="bg-black text-white hover:bg-black/90 rounded-lg h-9 text-xs font-semibold"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => duplicateProduct(previewProduct.id)}
                    className="rounded-lg h-9 text-xs font-semibold border-gray-200"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Duplicate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyProductLink(previewProduct.id, previewProduct.name, (previewProduct as any).slug)}
                    className="rounded-lg h-9 text-xs font-semibold border-gray-200"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy Link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => viewInStore(previewProduct)}
                    className="rounded-lg h-9 text-xs font-semibold border-gray-200"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                    View Store
                  </Button>
                </div>
              </div>

              {/* Product Stats */}
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-pink-500" />
                  Product Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Sales</span>
                    <span className="text-sm font-bold text-slate-900">{getProductSales(previewProduct.id)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Revenue</span>
                    <span className="text-sm font-bold text-pink-600">{formatAmountOnly(getProductRevenue(previewProduct.id))}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Views</span>
                    <span className="text-sm font-bold text-slate-900">{(previewProduct as any).view_count || 0}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Status</span>
                      {(() => {
                        const s = getProductStatus(previewProduct);
                        return <Badge className={`text-[10px] ${s.color} border-0`}>{s.label}</Badge>;
                      })()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Created</span>
                    <span className="text-xs text-slate-600">{new Date((previewProduct as any).created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Updated</span>
                    <span className="text-xs text-slate-600">{new Date((previewProduct as any).updated_at || (previewProduct as any).created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-white border border-red-100 rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Danger Zone
                </h3>
                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start rounded-lg h-9 text-xs border-gray-200"
                    onClick={() => toggleAvailability(previewProduct.id, previewProduct.is_available)}
                  >
                    {previewProduct.is_available ? <><EyeOff className="w-3.5 h-3.5 mr-2" />Hide from Store</> : <><Eye className="w-3.5 h-3.5 mr-2" />Show in Store</>}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start rounded-lg h-9 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleDeleteClick(previewProduct.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete Product
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Default: Comic + Stats */}
              <div className="bg-white border rounded overflow-hidden hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                <img src={gumroadComic} alt="Gumroad Creator" className="w-full h-auto object-contain" />
              </div>

              <div className="bg-white border rounded p-8 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
                <h3 className="text-base text-slate-700 mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Total Products</span>
                    <span className="text-xl font-semibold text-slate-900">{totalProducts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Live Products</span>
                    <span className="text-xl font-semibold text-green-600">{liveProducts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Pending Approval</span>
                    <span className="text-xl font-semibold text-amber-600">{pendingProducts}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Drafts</span>
                    <span className="text-xl font-semibold text-gray-500">{draftProducts}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Total Sales</span>
                      <span className="text-xl font-semibold text-slate-900">{totalSales}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Total Revenue</span>
                    <span className="text-xl font-semibold text-pink-600">{formatAmountOnly(totalRevenue)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-dashed rounded p-6 text-center">
                <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Click a product to preview</p>
              </div>
            </>
          )}

          <Button 
            onClick={() => navigate('/seller/products/new')} 
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 rounded-xl h-12 font-semibold shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Product
          </Button>
        </div>

        {/* Bulk Actions Floating Bar */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4">
            <span className="text-sm font-semibold">{selectedIds.size} selected</span>
            <div className="w-px h-6 bg-slate-600" />
            <Button size="sm" variant="ghost" className="text-white hover:bg-slate-700 h-8 text-xs" onClick={() => handleBulkToggleVisibility(false)}>
              <EyeOff className="w-3.5 h-3.5 mr-1.5" />Hide
            </Button>
            <Button size="sm" variant="ghost" className="text-white hover:bg-slate-700 h-8 text-xs" onClick={() => handleBulkToggleVisibility(true)}>
              <Eye className="w-3.5 h-3.5 mr-1.5" />Show
            </Button>
            <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-900/30 h-8 text-xs" onClick={handleBulkDelete}>
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />Delete
            </Button>
            <div className="w-px h-6 bg-slate-600" />
            <Button size="sm" variant="ghost" className="text-slate-400 hover:bg-slate-700 h-8 text-xs" onClick={clearBulkSelection}>
              <X className="w-3.5 h-3.5 mr-1.5" />Clear
            </Button>
          </div>
        )}

        {/* Edit Sheet Panel */}
        <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg p-0 bg-white">
            <SheetHeader className="px-6 pt-6 pb-4 border-b">
              <SheetTitle className="text-lg font-bold text-slate-900">Edit Product</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-160px)]">
              <div className="px-6 py-5 space-y-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-900">Product Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., ChatGPT Plus Account"
                    className="border border-gray-200 rounded-lg h-11"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-900">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your product..."
                    rows={3}
                    className="border border-gray-200 rounded-lg"
                  />
                </div>

                {/* Price / Stock / Compare */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-900">Price (USD) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                      className="border border-gray-200 rounded-lg h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-900">Stock</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                      placeholder="0"
                      className="border border-gray-200 rounded-lg h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-900">Compare Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.compare_at_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, compare_at_price: e.target.value }))}
                      placeholder="0.00"
                      className="border border-gray-200 rounded-lg h-10"
                    />
                  </div>
                </div>

                {/* Category Chips */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-900">Categories</Label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                          formData.category_ids.includes(cat.id)
                            ? 'bg-pink-500 text-white border-pink-500'
                            : 'bg-white text-slate-600 border-gray-200 hover:border-pink-300'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-900">Tags</Label>
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[60px]">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="px-2.5 py-1 bg-pink-500 text-white border-0 cursor-pointer hover:bg-pink-600" onClick={() => handleRemoveTag(tag)}>
                        {tag}<X className="w-3 h-3 ml-1.5" />
                      </Badge>
                    ))}
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder="Add tag..."
                      className="flex-1 min-w-[100px] border-0 bg-transparent p-0 h-7 focus-visible:ring-0 text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {popularTags.filter(t => !formData.tags.includes(t)).slice(0, 5).map(tag => (
                      <button key={tag} type="button" onClick={() => handleAddTag(tag)} className="text-xs px-2.5 py-1 border border-gray-200 hover:border-pink-500 hover:bg-pink-50 text-gray-600 rounded-full transition-colors">
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Images */}
                <MultiImageUploader
                  images={formData.images}
                  onChange={(images) => setFormData(prev => ({ ...prev, images }))}
                  maxImages={5}
                />

                {/* Toggles */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between py-1.5">
                    <Label className="text-sm font-medium text-slate-900">Available for sale</Label>
                    <Switch checked={formData.is_available} onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_available: v }))} className="data-[state=checked]:bg-pink-500" />
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <Label className="text-sm font-medium text-slate-900">Allow chat</Label>
                    <Switch checked={formData.chat_allowed} onCheckedChange={(v) => setFormData(prev => ({ ...prev, chat_allowed: v }))} className="data-[state=checked]:bg-pink-500" />
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <Label className="text-sm font-medium text-slate-900">Email required</Label>
                    <Switch checked={formData.requires_email} onCheckedChange={(v) => setFormData(prev => ({ ...prev, requires_email: v }))} className="data-[state=checked]:bg-pink-500" />
                  </div>
                </div>

                {/* Card Appearance Customizer (Collapsible) */}
                <Collapsible open={cardCustomizerOpen} onOpenChange={setCardCustomizerOpen}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between py-3 border-t border-gray-100">
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Palette className="w-4 h-4 text-pink-500" />
                        Card Appearance
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${cardCustomizerOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <CardCustomizer
                      settings={{ ...DEFAULT_CARD_SETTINGS, ...editCardSettings }}
                      onChange={setEditCardSettings}
                      mode="product"
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </ScrollArea>

            {/* Bottom Action Bar */}
            <div className="px-6 py-4 border-t bg-white flex gap-3">
              <Button variant="outline" onClick={() => setEditSheetOpen(false)} className="flex-1 rounded-lg h-11 border-gray-200">
                Cancel
              </Button>
              <Button variant="outline" onClick={() => handleSheetSubmit(true)} disabled={submitting} className="rounded-lg h-11 border-gray-200 text-xs">
                Save as Draft
              </Button>
              <Button onClick={() => handleSheetSubmit(false)} disabled={submitting} className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg h-11 font-semibold">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm({ open, id: open ? deleteConfirm.id : null })}
          title="Delete Product"
          description="Are you sure you want to delete this product? This action cannot be undone."
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
