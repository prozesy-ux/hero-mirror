import { useState, useEffect } from 'react';
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
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Link2,
  X,
  Copy,
  Images,
  Sparkles
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import MultiImageUploader from './MultiImageUploader';
import { ProductTypeSelector } from './ProductTypeSelector';
import { getProductType } from '@/lib/product-types';
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
  product_type: string;
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
  requires_email: false,
  product_type: 'digital'
};

const popularTags = ['Digital', 'Premium', 'Instant Delivery', 'Lifetime', 'Subscription', 'API', 'Software', 'Course'];

const SellerProducts = () => {
  const { profile, products, refreshProducts, loading } = useSellerContext();
  const { formatAmountOnly } = useCurrency();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagInput, setTagInput] = useState('');
  
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
          requires_email: (product as any).requires_email || false,
          product_type: (product as any).product_type || 'digital'
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
      // Set primary image from images array if not manually set
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
        requires_email: formData.requires_email,
        product_type: formData.product_type
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

  const copyProductLink = async (productId: string, productName: string) => {
    const storeSlug = (profile as any)?.store_slug || profile?.id;
    const url = `${window.location.origin}/store/${storeSlug}/product/${productId}`;
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

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalProducts = products.length;
  const liveProducts = products.filter(p => p.is_approved && p.is_available).length;
  const totalRevenue = products.reduce((sum, p) => sum + (p.sold_count || 0) * p.price, 0);

  const getCategoryNames = (product: any) => {
    const ids = product.category_ids || (product.category_id ? [product.category_id] : []);
    return ids.map((id: string) => categories.find(c => c.id === id)?.name).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 bg-slate-50 min-h-screen seller-dashboard">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 bg-slate-50 min-h-screen seller-dashboard">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="seller-label text-slate-500">TOTAL</p>
              <p className="seller-stat-number text-xl text-slate-900">{totalProducts}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="seller-label text-slate-500">LIVE</p>
              <p className="seller-stat-number text-xl text-slate-900">{liveProducts}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="seller-label text-slate-500">REVENUE</p>
              <p className="seller-stat-number text-xl text-slate-900">{formatAmountOnly(totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-slate-200 rounded-xl"
          />
        </div>
        <Button 
          onClick={() => handleOpenDialog()} 
          className="bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 rounded-xl"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="seller-heading text-slate-900 mb-2">No products yet</h3>
          <p className="text-slate-500 text-sm mb-4">Start adding products to your store</p>
          <Button onClick={() => handleOpenDialog()} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl">
            <Plus className="h-4 w-4 mr-2" />
            Add First Product
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const categoryNames = getCategoryNames(product);
            const productTags = (product as any).tags || [];
            
            return (
              <div 
                key={product.id} 
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-slate-200 hover:-translate-y-1 transition-all duration-300 group"
              >
                {/* Image */}
                <div className="aspect-[16/10] bg-slate-50 relative overflow-hidden">
                  {product.icon_url ? (
                    <img 
                      src={product.icon_url} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
                      <Package className="h-12 w-12 text-slate-300" />
                    </div>
                  )}
                  
                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Status Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] font-semibold backdrop-blur-sm ${
                        product.is_approved 
                          ? 'bg-emerald-500/90 text-white border-emerald-500' 
                          : 'bg-amber-500/90 text-white border-amber-500'
                      }`}
                    >
                      {product.is_approved ? 'Approved' : 'Pending'}
                    </Badge>
                    {!product.is_available && (
                      <Badge variant="outline" className="text-[10px] bg-slate-500/90 text-white border-slate-500 backdrop-blur-sm font-semibold">
                        Hidden
                      </Badge>
                    )}
                  </div>
                  
                  {/* Sold Count Badge */}
                  {product.sold_count > 0 && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-semibold text-slate-700">
                      <TrendingUp className="w-3 h-3 text-emerald-600" />
                      {product.sold_count}
                    </div>
                  )}
                  
                  {/* Quick Actions on Hover */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenDialog(product.id)}
                        className="h-8 px-3 bg-white/90 hover:bg-white backdrop-blur-sm rounded-lg shadow-sm"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => copyProductLink(product.id, product.name)}
                        className="h-8 px-3 bg-white/90 hover:bg-white backdrop-blur-sm rounded-lg shadow-sm"
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Link
                      </Button>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm rounded-lg">
                          <MoreVertical className="h-4 w-4 text-slate-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={() => toggleAvailability(product.id, product.is_available)} className="rounded-lg">
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
                          onClick={() => handleDeleteClick(product.id)}
                          className="text-red-600 focus:text-red-600 rounded-lg"
                          disabled={deleting}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="seller-heading text-slate-900 truncate mb-1">{product.name}</h3>
                  <p className="seller-stat-number text-xl text-emerald-600 mb-2">{formatAmountOnly(Number(product.price))}</p>
                  
                  {/* Categories & Tags */}
                  <div className="flex flex-wrap gap-1 mb-3 min-h-[24px]">
                    {categoryNames.slice(0, 2).map((name: string) => (
                      <Badge key={name} variant="outline" className="text-[10px] px-1.5 py-0 bg-violet-50 text-violet-700 border-violet-200">
                        {name}
                      </Badge>
                    ))}
                    {productTags.slice(0, 2).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50 text-slate-600 border-slate-200">
                        {tag}
                      </Badge>
                    ))}
                    {(categoryNames.length + productTags.length) > 4 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-50 text-slate-500 border-slate-200">
                        +{categoryNames.length + productTags.length - 4}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3 min-h-[2.5rem]">
                    {product.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <ShoppingBag className="w-3 h-3" />
                      Stock: {product.stock}
                    </span>
                    <span className="text-slate-400">
                      Sold: {product.sold_count}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="seller-heading">{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product Type Selector */}
            <ProductTypeSelector
              value={formData.product_type}
              onChange={(type) => setFormData(prev => ({ ...prev, product_type: type }))}
            />

            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., ChatGPT Plus Account"
                className="border-slate-200 rounded-xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your product..."
                rows={3}
                className="border-slate-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  className="border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="0"
                  className="border-slate-200 rounded-xl"
                />
              </div>
            </div>

            {/* Multi-Category Selection */}
            <div className="space-y-2">
              <Label>Categories</Label>
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${cat.id}`}
                      checked={formData.category_ids.includes(cat.id)}
                      onCheckedChange={() => toggleCategory(cat.id)}
                    />
                    <label
                      htmlFor={`cat-${cat.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {cat.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags Input */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 min-h-[80px]">
                {formData.tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="px-2 py-1 bg-emerald-100 text-emerald-700 border-emerald-200 cursor-pointer hover:bg-emerald-200"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <X className="w-3 h-3 ml-1" />
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
              {/* Popular Tags */}
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-xs text-slate-500 mr-1">Popular:</span>
                {popularTags.filter(t => !formData.tags.includes(t)).slice(0, 5).map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="text-xs px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
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

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="is_available" className="font-normal text-slate-600">Available for sale</Label>
              <Switch
                id="is_available"
                checked={formData.is_available}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="chat_allowed" className="font-normal text-slate-600">Allow buyers to chat</Label>
              <Switch
                id="chat_allowed"
                checked={formData.chat_allowed}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, chat_allowed: checked }))}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-slate-100 pt-4">
              <div className="flex flex-col">
                <Label htmlFor="requires_email" className="font-medium text-slate-700">Email Required</Label>
                <span className="text-xs text-slate-500 mt-0.5">
                  Buyer must provide email for shared access
                </span>
              </div>
              <Switch
                id="requires_email"
                checked={formData.requires_email}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_email: checked }))}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 border-slate-200 rounded-xl"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1 bg-emerald-500 hover:bg-emerald-600 rounded-xl">
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
