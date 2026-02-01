import { useState, useEffect } from 'react';
import gumroadBanner from '@/assets/gumroad-banner.png';
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
  Copy
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
    <div className="p-6 lg:p-8 bg-[#FBF8F3] min-h-screen">
      {/* Banner - Clean with subtle glow */}
      <div className="mb-4">
        <img 
          src={gumroadBanner} 
          alt="Start creating and selling" 
          className="w-full h-auto object-contain rounded-xl shadow-lg"
        />
      </div>

      {/* Stats Row - Neo-Brutalist */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border-2 border-black rounded-lg p-5 shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">PRODUCTS</p>
          <p className="text-3xl font-black text-black">{totalProducts}</p>
        </div>
        <div className="bg-white border-2 border-black rounded-lg p-5 shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">LIVE</p>
          <p className="text-3xl font-black text-black">{liveProducts}</p>
        </div>
        <div className="bg-white border-2 border-black rounded-lg p-5 shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">REVENUE</p>
          <p className="text-3xl font-black text-black">{formatAmountOnly(totalRevenue)}</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 bg-white border-2 border-black rounded-lg h-12 shadow-neobrutalism focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5 transition-all"
          />
        </div>
        <Button 
          onClick={() => navigate('/seller/products/new')} 
          className="bg-black text-white hover:bg-black/90 rounded-lg h-12 px-6 font-semibold"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Product
        </Button>
      </div>

      {/* Products Grid - 4 columns */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No products yet. Create your first product!</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => {
            const categoryNames = getCategoryNames(product);
            
            return (
              <div 
                key={product.id} 
                className="bg-white border-2 border-black rounded-lg overflow-hidden group shadow-neobrutalism hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
              >
                {/* Image - Square */}
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                  {product.icon_url ? (
                    <img 
                      src={product.icon_url} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <Package className="h-16 w-16 text-gray-300" />
                    </div>
                  )}
                  
                  {/* Status Badge - Minimal */}
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded ${
                      product.is_approved 
                        ? 'bg-black text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {product.is_approved ? 'Live' : 'Pending'}
                    </span>
                  </div>
                  
                  {/* Hidden indicator */}
                  {!product.is_available && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded bg-gray-200 text-gray-600">
                        Hidden
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Title */}
                  <h3 className="font-bold text-black text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
                    {product.name}
                  </h3>
                  
                  {/* Price */}
                  <p className="text-2xl font-black text-black mb-3">
                    {formatAmountOnly(Number(product.price))}
                  </p>
                  
                  {/* Category & Type */}
                  <p className="text-xs text-gray-500 mb-3">
                    {(product as any).product_type?.replace(/_/g, ' ') || 'Digital'} 
                    {categoryNames.length > 0 && ` • ${categoryNames[0]}`}
                  </p>
                  
                  {/* Divider */}
                  <div className="border-t border-black/10 my-3" />
                  
                  {/* Stats */}
                  <p className="text-xs text-gray-400 mb-4">
                    {product.sold_count || 0} sold • {product.stock} in stock
                  </p>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(product.id)}
                      className="flex-1 h-9 border-2 border-black text-black hover:bg-black hover:text-white rounded-lg font-medium transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                      Edit
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyProductLink(product.id, product.name, (product as any).slug)}
                      className="h-9 w-9 p-0 border-2 border-black/20 hover:border-black hover:bg-black hover:text-white rounded-lg transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 w-9 p-0 border-2 border-black/20 hover:border-black hover:bg-black hover:text-white rounded-lg transition-colors"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-lg border-2 border-black/10">
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

      {/* Edit Dialog - B&W Style */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-2 border-black/10 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-black">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-black">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., ChatGPT Plus Account"
                className="border-2 border-black/10 rounded-lg h-11 focus:border-black transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-black">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your product..."
                rows={3}
                className="border-2 border-black/10 rounded-lg focus:border-black transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-semibold text-black">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  className="border-2 border-black/10 rounded-lg h-11 focus:border-black transition-colors"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-sm font-semibold text-black">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="0"
                  className="border-2 border-black/10 rounded-lg h-11 focus:border-black transition-colors"
                />
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-black">Categories</Label>
              <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg border-2 border-black/10">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${cat.id}`}
                      checked={formData.category_ids.includes(cat.id)}
                      onCheckedChange={() => toggleCategory(cat.id)}
                      className="border-2 border-black/20 data-[state=checked]:bg-black data-[state=checked]:border-black"
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
              <Label className="text-sm font-semibold text-black">Tags</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border-2 border-black/10 min-h-[80px]">
                {formData.tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="px-2.5 py-1 bg-black text-white border-0 cursor-pointer hover:bg-gray-800"
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
                    className="text-xs px-2.5 py-1 border border-black/20 hover:border-black hover:bg-black hover:text-white text-gray-600 rounded-full transition-colors"
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

            <div className="space-y-3 pt-4 border-t-2 border-black/10">
              <div className="flex items-center justify-between py-2">
                <Label htmlFor="is_available" className="font-medium text-black">Available for sale</Label>
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
                  className="data-[state=checked]:bg-black"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <Label htmlFor="chat_allowed" className="font-medium text-black">Allow buyers to chat</Label>
                <Switch
                  id="chat_allowed"
                  checked={formData.chat_allowed}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, chat_allowed: checked }))}
                  className="data-[state=checked]:bg-black"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor="requires_email" className="font-medium text-black">Email Required</Label>
                  <p className="text-xs text-gray-500 mt-0.5">Buyer must provide email</p>
                </div>
                <Switch
                  id="requires_email"
                  checked={formData.requires_email}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requires_email: checked }))}
                  className="data-[state=checked]:bg-black"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 border-2 border-black/20 hover:border-black hover:bg-black hover:text-white rounded-lg h-11 transition-colors"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting} 
                className="flex-1 bg-black hover:bg-black/90 text-white rounded-lg h-11 font-semibold"
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
