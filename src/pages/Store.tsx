import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  ShoppingCart,
  CheckCircle,
  Package,
  Star,
  ArrowLeft,
  Loader2,
  Play,
  ExternalLink,
  ShoppingBag,
  MessageCircle,
  Filter,
  X,
  ChevronRight,
  Users
} from 'lucide-react';
import theLogo from '@/assets/the-logo.png';

interface SellerProfile {
  id: string;
  user_id: string;
  store_name: string;
  store_description: string | null;
  store_logo_url: string | null;
  store_banner_url: string | null;
  store_video_url: string | null;
  store_tagline: string | null;
  store_slug: string | null;
  is_verified: boolean;
  is_active: boolean;
  total_sales: number;
  total_orders: number;
  social_links: Record<string, string>;
}

interface SellerProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  category_id: string | null;
  is_available: boolean;
  is_approved: boolean;
  tags: string[] | null;
  stock: number | null;
  sold_count: number | null;
  chat_allowed: boolean | null;
  seller_id: string;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

const Store = () => {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<SellerProduct | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<SellerProduct | null>(null);

  useEffect(() => {
    if (storeSlug) {
      fetchStoreData();
    }
  }, [storeSlug]);

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  const fetchStoreData = async () => {
    setLoading(true);
    
    // Fetch seller profile by slug
    const { data: sellerData, error: sellerError } = await supabase
      .from('seller_profiles')
      .select('*')
      .eq('store_slug', storeSlug)
      .eq('is_active', true)
      .eq('is_verified', true)
      .single();

    if (sellerError || !sellerData) {
      toast.error('Store not found');
      navigate('/');
      return;
    }

    setSeller(sellerData as SellerProfile);

    // Fetch seller products
    const { data: productsData } = await supabase
      .from('seller_products')
      .select('*')
      .eq('seller_id', sellerData.id)
      .eq('is_available', true)
      .eq('is_approved', true)
      .order('sold_count', { ascending: false });

    if (productsData) {
      setProducts(productsData);
    }

    // Fetch categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true);

    if (categoriesData) {
      setCategories(categoriesData);
    }

    setLoading(false);
  };

  const fetchWallet = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();
    if (data) setWallet(data);
  };

  const handlePurchase = async (product: SellerProduct) => {
    if (!user) {
      setPendingProduct(product);
      setShowLoginModal(true);
      return;
    }

    if (!wallet || wallet.balance < product.price) {
      toast.error('Insufficient balance. Please top up your wallet.');
      navigate('/dashboard/marketplace');
      return;
    }

    setPurchasing(true);

    try {
      // Create seller order
      const { error } = await supabase.from('seller_orders').insert({
        seller_id: product.seller_id,
        buyer_id: user.id,
        product_id: product.id,
        amount: product.price,
        seller_earning: product.price * 0.85,
        status: 'pending'
      });

      if (error) throw error;

      // Deduct from wallet
      await supabase
        .from('user_wallets')
        .update({ balance: wallet.balance - product.price })
        .eq('user_id', user.id);

      toast.success('Purchase successful! The seller will deliver your order soon.');
      setSelectedProduct(null);
      fetchWallet();
    } catch (error: any) {
      toast.error(error.message || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const handleLoginRedirect = (isSignUp: boolean) => {
    const returnUrl = `/store/${storeSlug}`;
    localStorage.setItem('returnAfterAuth', returnUrl);
    if (pendingProduct) {
      localStorage.setItem('pendingProductId', pendingProduct.id);
    }
    navigate(isSignUp ? '/signup' : '/signin');
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from products
  const productCategories = categories.filter(cat => 
    products.some(p => p.category_id === cat.id)
  );

  const getCategoryColor = (color: string | null) => {
    const colorMap: Record<string, string> = {
      violet: 'bg-violet-100 text-violet-700',
      emerald: 'bg-emerald-100 text-emerald-700',
      blue: 'bg-blue-100 text-blue-700',
      rose: 'bg-rose-100 text-rose-700',
      amber: 'bg-amber-100 text-amber-700',
    };
    return colorMap[color || 'violet'] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full rounded-3xl mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Store not found</h1>
          <p className="text-slate-600 mb-4">This store doesn't exist or is not available.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={theLogo} alt="Logo" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Button 
                onClick={() => navigate('/dashboard/marketplace')}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                My Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/signin')}>
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate('/signup')}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Store Banner */}
      <div className="relative">
        {seller.store_video_url ? (
          <div className="relative h-64 md:h-80 overflow-hidden">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              poster={seller.store_banner_url || undefined}
            >
              <source src={seller.store_video_url} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : seller.store_banner_url ? (
          <div 
            className="h-64 md:h-80 bg-cover bg-center"
            style={{ backgroundImage: `url(${seller.store_banner_url})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <div className="h-64 md:h-80 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600" />
        )}

        {/* Store Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-end gap-6">
            <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white shadow-2xl">
              <AvatarImage src={seller.store_logo_url || ''} />
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-3xl font-bold">
                {seller.store_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-white">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-4xl font-bold">{seller.store_name}</h1>
                {seller.is_verified && (
                  <Badge className="bg-emerald-500 text-white border-0">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              {seller.store_tagline && (
                <p className="text-lg text-white/90 mt-2">{seller.store_tagline}</p>
              )}
              <div className="flex items-center gap-6 mt-4 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>{products.length} Products</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  <span>{seller.total_orders || 0} Orders</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>4.9 Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-slate-200 focus:border-violet-500 focus:ring-violet-500/20"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className={`rounded-xl whitespace-nowrap ${
                selectedCategory === 'all' 
                  ? 'bg-violet-600 hover:bg-violet-700' 
                  : 'hover:bg-violet-50'
              }`}
            >
              All Products
            </Button>
            {productCategories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-xl whitespace-nowrap ${
                  selectedCategory === cat.id 
                    ? 'bg-violet-600 hover:bg-violet-700' 
                    : 'hover:bg-violet-50'
                }`}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Store Description */}
        {seller.store_description && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-8">
            <h3 className="font-semibold text-slate-900 mb-2">About this store</h3>
            <p className="text-slate-600">{seller.store_description}</p>
          </div>
        )}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No products found</h3>
            <p className="text-slate-600">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
                onClick={() => setSelectedProduct(product)}
              >
                {/* Product Image */}
                <div className="relative aspect-square bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden">
                  {product.icon_url ? (
                    <img
                      src={product.icon_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-slate-300" />
                    </div>
                  )}
                  {product.sold_count && product.sold_count > 10 && (
                    <Badge className="absolute top-3 left-3 bg-orange-500 text-white border-0">
                      🔥 Hot
                    </Badge>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-5">
                  <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                    {product.description || 'Premium digital product'}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-violet-600">${product.price}</span>
                      <span className="text-xs text-slate-400">• {product.sold_count || 0} sold</span>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl"
                    >
                      Buy
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Product Details Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedProduct?.icon_url && (
                <img 
                  src={selectedProduct.icon_url} 
                  alt={selectedProduct.name}
                  className="w-12 h-12 rounded-xl object-cover"
                />
              )}
              {selectedProduct?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct?.description || 'Premium digital product from this store.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <span className="text-slate-600">Price</span>
              <span className="text-2xl font-bold text-violet-600">${selectedProduct?.price}</span>
            </div>

            {selectedProduct?.tags && selectedProduct.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedProduct.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="rounded-full">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users className="w-4 h-4" />
              <span>{selectedProduct?.sold_count || 0} people bought this</span>
            </div>

            <Button
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl text-lg font-semibold"
              onClick={() => selectedProduct && handlePurchase(selectedProduct)}
              disabled={purchasing}
            >
              {purchasing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Buy Now for ${selectedProduct?.price}
                </>
              )}
            </Button>

            {!user && (
              <p className="text-center text-sm text-slate-500">
                You'll need to sign in to complete your purchase
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Required Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to purchase</DialogTitle>
            <DialogDescription>
              Create an account or sign in to complete your purchase of "{pendingProduct?.name}".
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <Button
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl"
              onClick={() => handleLoginRedirect(false)}
            >
              Sign In
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl"
              onClick={() => handleLoginRedirect(true)}
            >
              Create Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Store;
