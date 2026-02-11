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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatedCounter } from '@/components/ui/animated-counter';
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
  Calendar,
  Filter,
  TrendingUp,
  ShoppingBag,
  DollarSign
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
  category_ids: [],
  tags: [],
  icon_url: '',
  images: [],
  is_available: true,
  chat_allowed: true,
  requires_email: false
};

const popularTags = ['Digital', 'Premium', 'Instant Delivery', 'Lifetime', 'Subscription', 'API', 'Software', 'Course'];

const SellerProducts = () => {
  const navigate = useNavigate();
  const { profile, products, orders, refreshProducts, loading } = useSellerContext();
  const { formatAmountOnly } = useCurrency();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  
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

  const handleOpenDialog = (productId?: string) => {
    if (productId) {
      const product = products.find(p => p.id === productId);
      if (product) {
        setFormData({
          name: product.name,
          description: product.description || '',
          price: String(product.price),
          stock: String(product.stock),
          category_ids: (product as any).category_ids || (product.category_id ? [product.category_id] : []),
          tags: (product as any).tags || [],
          icon_url: product.icon_url || '',
          images: (product as any).images || [],
          is_available: product.is_available,
          chat_allowed: product.chat_allowed !== false,
          requires_email: (product as any).requires_email || false
        });
        setEditingProduct(productId);
      }
    } else {
      setFormData(initialFormData);
      setEditingProduct(null);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.price) {
      toast.error('Name and price are required');
      return;
    }

    setSubmitting(true);
    try {
      const primaryImage = formData.images.length > 0 ? formData.images[0] : formData.icon_url.trim() || null;
      
      const productData = {
        seller_id: profile.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        category_id: formData.category_ids[0] || null,
        category_ids: formData.category_ids,
        tags: formData.tags,
        icon_url: primaryImage,
        images: formData.images,
        is_available: formData.is_available,
        chat_allowed: formData.chat_allowed,
        requires_email: formData.requires_email
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('seller_products')
          .update(productData)
          .eq('id', editingProduct);
        if (error) throw error;
        toast.success('Product updated');
      } else {
        const { error } = await supabase
          .from('seller_products')
          .insert(productData);
        if (error) throw error;
        toast.success('Product added! Awaiting approval.');
      }

      setIsDialogOpen(false);
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

  // Apply filters
  let filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Status filter
  if (statusFilter !== 'all') {
    if (statusFilter === 'live') {
      filteredProducts = filteredProducts.filter(p => p.is_approved && p.is_available);
    } else if (statusFilter === 'pending') {
      filteredProducts = filteredProducts.filter(p => !p.is_approved && p.is_available);
    } else if (statusFilter === 'draft') {
      filteredProducts = filteredProducts.filter(p => !p.is_available && !p.is_approved);
    } else if (statusFilter === 'hidden') {
      filteredProducts = filteredProducts.filter(p => !p.is_available && p.is_approved);
    }
  }

  // Category filter
  if (categoryFilter !== 'all') {
    filteredProducts = filteredProducts.filter(p => {
      const ids = (p as any).category_ids || (p.category_id ? [p.category_id] : []);
      return ids.includes(categoryFilter);
    });
  }

  // Sort
  if (sortBy === 'newest') {
    filteredProducts = [...filteredProducts].sort((a, b) => 
      new Date((b as any).created_at || 0).getTime() - new Date((a as any).created_at || 0).getTime()
    );
  } else if (sortBy === 'price-high') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  } else if (sortBy === 'price-low') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sortBy === 'best-selling') {
    filteredProducts = [...filteredProducts].sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0));
  }

  // Calculate stats using real order data
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

  // Get selected product for preview
  const previewProduct = selectedProduct ? products.find(p => p.id === selectedProduct) : null;

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
    <div className="grid lg:grid-cols-10 gap-6">
      {/* Main Products Section - 70% */}
      <div className="lg:col-span-7 space-y-6">
        {/* Banner - Clean with subtle glow */}
        <div className="mb-4">
          <img 
            src={gumroadBanner} 
            alt="Start creating and selling" 
            className="w-full h-auto object-contain rounded-xl shadow-lg"
          />
        </div>

        {/* Stats Row - Modern Soft Design */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border rounded p-8 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
            <p className="text-base text-slate-700 mb-2">Products</p>
            <p className="text-4xl font-semibold text-slate-900">
              <AnimatedCounter value={totalProducts} />
            </p>
          </div>
          <div className="bg-white border rounded p-8 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
            <p className="text-base text-slate-700 mb-2">Live</p>
            <p className="text-4xl font-semibold text-slate-900">
              <AnimatedCounter value={liveProducts} />
            </p>
          </div>
          <div className="bg-white border rounded p-8 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
            <p className="text-base text-slate-700 mb-2">Revenue</p>
            <p className="text-4xl font-semibold text-slate-900">{formatAmountOnly(totalRevenue)}</p>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-6">
          {/* Search - Wider */}
          <div className="relative flex-1 max-w-xl w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 bg-white border border-gray-300 rounded-xl h-12 shadow-sm focus:border-pink-500 focus:ring-pink-500 transition-all"
            />
          </div>
          
          {/* Filters */}
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
              onClick={() => navigate('/seller/products/new')} 
              className="bg-black text-white hover:bg-black/90 rounded-lg h-10 px-5 font-semibold shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Product
            </Button>
          </div>
        </div>

        {/* Products Grid - 3 columns for main section */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white border rounded">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No products yet. Create your first product!</p>
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => {
              const categoryNames = getCategoryNames(product);
              const isSelected = selectedProduct === product.id;
              
              return (
                <div 
                  key={product.id} 
                  onClick={() => setSelectedProduct(product.id)}
                  className={`bg-white border rounded-xl overflow-hidden group shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer ${
                    isSelected ? 'border-pink-500 ring-2 ring-pink-100' : 'border-gray-200'
                  }`}
                >
                  {/* Image - Square */}
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    {product.icon_url ? (
                      <img 
                        src={product.icon_url} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <Package className="h-16 w-16 text-gray-300" />
                      </div>
                    )}
                    
                    {/* Status Badge - Modern */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full ${
                        product.is_approved && product.is_available
                          ? 'bg-green-500 text-white' 
                          : !product.is_available && !product.is_approved
                            ? 'bg-gray-200 text-gray-600'
                            : 'bg-amber-100 text-amber-700'
                      }`}>
                        {product.is_approved && product.is_available ? 'Live' : !product.is_available && !product.is_approved ? 'Draft' : 'Pending'}
                      </span>
                    </div>
                    
                    {/* Hidden indicator */}
                    {!product.is_available && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full bg-gray-100 text-gray-600">
                          Hidden
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
                      {product.name}
                    </h3>
                    
                    {/* Price */}
                    <p className="text-xl font-bold text-black mb-2">
                      {formatAmountOnly(Number(product.price))}
                    </p>
                    
                    {/* Category & Type */}
                    <p className="text-xs text-gray-500 mb-3">
                      {(product as any).product_type?.replace(/_/g, ' ') || 'Digital'} 
                      {categoryNames.length > 0 && ` • ${categoryNames[0]}`}
                    </p>
                    
                    {/* Divider */}
                    <div className="border-t border-gray-100 my-3" />
                    
                    {/* Stats */}
                    <p className="text-xs text-gray-400 mb-4">
                      {product.sold_count || 0} sold • {product.stock} in stock
                    </p>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/seller/products/edit/${product.id}`);
                        }}
                        className="flex-1 h-9 border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-lg font-medium transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyProductLink(product.id, product.name, (product as any).slug);
                        }}
                        className="h-9 w-9 p-0 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-lg transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => e.stopPropagation()}
                            className="h-9 w-9 p-0 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-lg transition-colors"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-lg border border-gray-200">
                          <DropdownMenuItem 
                            onClick={() => toggleAvailability(product.id, product.is_available)} 
                            className="rounded-md"
                          >
                            {product.is_available ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Show
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => navigate(`/seller/products/new?duplicate=${product.id}`)}
                            className="rounded-md"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(product.id)}
                            className="text-red-600 focus:text-red-600 rounded-md"
                            disabled={deleting}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Section - 30% */}
      <div className="lg:col-span-3 space-y-6">
        {/* Comic Illustration */}
        <div className="bg-white border rounded overflow-hidden hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
          <img 
            src={gumroadComic} 
            alt="Gumroad Creator" 
            className="w-full h-auto object-contain"
          />
        </div>

        {/* Quick Stats Summary */}
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

        {/* Selected Product Preview */}
        {previewProduct ? (
          <div className="bg-white border rounded p-8 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow">
            <h3 className="text-base text-slate-700 mb-4">Selected Product</h3>
            <div className="space-y-4">
              {previewProduct.icon_url && (
                <img 
                  src={previewProduct.icon_url} 
                  alt={previewProduct.name}
                  className="w-full aspect-video object-cover rounded-lg"
                />
              )}
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">{previewProduct.name}</h4>
                <p className="text-2xl font-bold text-black">{formatAmountOnly(previewProduct.price)}</p>
              </div>
              <div className="text-sm text-gray-500">
                <p>{previewProduct.sold_count || 0} sold • {previewProduct.stock} in stock</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-black text-white hover:bg-black/90 rounded-lg"
                  onClick={() => handleOpenDialog(previewProduct.id)}
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border border-gray-200 rounded-lg"
                  onClick={() => copyProductLink(previewProduct.id, previewProduct.name, (previewProduct as any).slug)}
                >
                  <Copy className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-dashed rounded p-6 text-center">
            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Click a product to preview</p>
          </div>
        )}

        {/* Quick Action */}
        <Button 
          onClick={() => navigate('/seller/products/new')} 
          className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 rounded-xl h-12 font-semibold shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Product
        </Button>
      </div>

      {/* Edit Dialog - Modern Style */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-900">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., ChatGPT Plus Account"
                className="border border-gray-200 rounded-lg h-11 focus:border-pink-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-900">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your product..."
                rows={3}
                className="border border-gray-200 rounded-lg focus:border-pink-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-semibold text-gray-900">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  className="border border-gray-200 rounded-lg h-11 focus:border-pink-500 transition-colors"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-sm font-semibold text-gray-900">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="0"
                  className="border border-gray-200 rounded-lg h-11 focus:border-pink-500 transition-colors"
                />
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900">Categories</Label>
              <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${cat.id}`}
                      checked={formData.category_ids.includes(cat.id)}
                      onCheckedChange={() => toggleCategory(cat.id)}
                      className="border border-gray-300 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                    />
                    <label
                      htmlFor={`cat-${cat.id}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {cat.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags Input */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-900">Tags</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[80px]">
                {formData.tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="px-2.5 py-1 bg-pink-500 text-white border-0 cursor-pointer hover:bg-pink-600"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <X className="w-3 h-3 ml-1.5" />
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
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-xs text-gray-500 mr-1">Popular:</span>
                {popularTags.filter(t => !formData.tags.includes(t)).slice(0, 5).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="text-xs px-2.5 py-1 border border-gray-200 hover:border-pink-500 hover:bg-pink-50 hover:text-pink-600 text-gray-600 rounded-full transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Multi-Image Uploader */}
            <MultiImageUploader
              images={formData.images}
              onChange={(images) => setFormData(prev => ({ ...prev, images }))}
              maxImages={5}
            />

            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="is_available" className="font-medium text-gray-900">Available for sale</Label>
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
                  className="data-[state=checked]:bg-pink-500"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <Label htmlFor="chat_allowed" className="font-medium text-gray-900">Allow buyers to chat</Label>
                <Switch
                  id="chat_allowed"
                  checked={formData.chat_allowed}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, chat_allowed: checked }))}
                  className="data-[state=checked]:bg-pink-500"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor="requires_email" className="font-medium text-gray-900">Email Required</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Buyer must provide email</p>
                </div>
                <Switch
                  id="requires_email"
                  checked={formData.requires_email}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_email: checked }))}
                  className="data-[state=checked]:bg-pink-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 border border-gray-200 hover:bg-gray-50 rounded-lg h-11 transition-colors"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting} 
                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg h-11 font-semibold"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : editingProduct ? 'Update' : 'Add Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
  );
};

export default SellerProducts;
