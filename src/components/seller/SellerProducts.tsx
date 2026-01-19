import { useState, useEffect } from 'react';
import { useSellerContext } from '@/contexts/SellerContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
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
  TrendingUp
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Category {
  id: string;
  name: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  category_id: string;
  icon_url: string;
  is_available: boolean;
  chat_allowed: boolean;
  requires_email: boolean;
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  price: '',
  stock: '',
  category_id: '',
  icon_url: '',
  is_available: true,
  chat_allowed: true,
  requires_email: false
};

const SellerProducts = () => {
  const { profile, products, refreshProducts, loading } = useSellerContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
          category_id: product.category_id || '',
          icon_url: product.icon_url || '',
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
      const productData = {
        seller_id: profile.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0,
        category_id: formData.category_id || null,
        icon_url: formData.icon_url.trim() || null,
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

  const handleDelete = async (productId: string) => {
    if (!confirm('Delete this product?')) return;

    setDeleting(productId);
    try {
      const { error } = await supabase
        .from('seller_products')
        .delete()
        .eq('id', productId);
      if (error) throw error;
      toast.success('Product deleted');
      refreshProducts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    } finally {
      setDeleting(null);
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

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const totalProducts = products.length;
  const liveProducts = products.filter(p => p.is_approved && p.is_available).length;
  const totalRevenue = products.reduce((sum, p) => sum + (p.sold_count || 0) * p.price, 0);

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
              <p className="seller-stat-number text-xl text-slate-900">${totalRevenue.toFixed(0)}</p>
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
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-sm shadow-emerald-200 rounded-xl"
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
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg hover:border-slate-200 transition-all group"
            >
              {/* Image */}
              <div className="aspect-[16/10] bg-slate-50 relative overflow-hidden">
                {product.icon_url ? (
                  <img 
                    src={product.icon_url} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
                    <Package className="h-12 w-12 text-slate-300" />
                  </div>
                )}
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
                {/* Actions Menu */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm rounded-lg">
                        <MoreVertical className="h-4 w-4 text-slate-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem onClick={() => handleOpenDialog(product.id)} className="rounded-lg">
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
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
                      <DropdownMenuItem 
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 focus:text-red-600 rounded-lg"
                        disabled={deleting === product.id}
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
                <p className="seller-stat-number text-xl text-emerald-600 mb-2">${Number(product.price).toFixed(2)}</p>
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
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="seller-heading">{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger className="border-slate-200 rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon_url">Image URL</Label>
              <Input
                id="icon_url"
                type="url"
                value={formData.icon_url}
                onChange={(e) => setFormData(prev => ({ ...prev, icon_url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="border-slate-200 rounded-xl"
              />
            </div>

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
    </div>
  );
};

export default SellerProducts;