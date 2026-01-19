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
  Loader2,
  ShoppingBag,
  MessageCircle,
  X,
  Users,
  Check,
  Eye,
  Wallet,
  TrendingUp,
  Store as StoreIcon
} from 'lucide-react';
import { Instagram, Twitter, Youtube, Music } from 'lucide-react';
import theLogo from '@/assets/the-logo.png';
import StoreSidebar from '@/components/store/StoreSidebar';
import StoreProductCard from '@/components/store/StoreProductCard';

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
  social_links: Record<string, string> | null;
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SellerProduct | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<SellerProduct | null>(null);

  // Handle return from auth with pending purchase
  useEffect(() => {
    if (user && products.length > 0) {
      const storeReturn = localStorage.getItem('storeReturn');
      if (storeReturn) {
        try {
          const data = JSON.parse(storeReturn);
          localStorage.removeItem('storeReturn');
          
          if (data.pendingProductId && data.autoOpenPurchase) {
            const pendingProd = products.find(p => p.id === data.pendingProductId);
            if (pendingProd) {
              setSelectedProduct(pendingProd);
              toast.info(`Continue your purchase of "${pendingProd.name}"`);
            }
          }
        } catch (e) {
          console.error('Failed to parse storeReturn', e);
        }
      }
    }
  }, [user, products]);

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
      .single();

    if (sellerError || !sellerData) {
      setLoading(false);
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

    setPurchasing(product.id);

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
      setPurchasing(null);
    }
  };

  const handleLoginRedirect = (isSignUp: boolean) => {
    // Save return info to localStorage
    const returnData = {
      returnUrl: `/store/${storeSlug}`,
      pendingProductId: pendingProduct?.id,
      autoOpenPurchase: true
    };
    localStorage.setItem('storeReturn', JSON.stringify(returnData));
    setShowLoginModal(false);
    navigate('/signin');
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleChat = (product: SellerProduct) => {
    if (!user) {
      setPendingProduct(product);
      setShowLoginModal(true);
      return;
    }
    // Navigate to dashboard with seller chat
    navigate(`/dashboard/marketplace?chat=${seller?.id}`);
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    const matchesTags = selectedTags.length === 0 || product.tags?.some(tag => selectedTags.includes(tag));
    return matchesSearch && matchesCategory && matchesTags;
  });

  const hasEnoughBalance = (price: number) => {
    return (wallet?.balance || 0) >= price;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Header - Clean minimal */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-center">
          <Link to="/" className="flex items-center gap-2">
            <img src={theLogo} alt="Logo" className="h-8 w-auto" />
          </Link>
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>
        ) : seller.store_banner_url ? (
          <div className="relative h-64 md:h-80">
            <img 
              src={seller.store_banner_url}
              alt={seller.store_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>
        ) : (
          <div className="h-64 md:h-80 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500" />
        )}

        {/* Store Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-end gap-6">
            <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white shadow-2xl">
              <AvatarImage src={seller.store_logo_url || ''} />
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-3xl font-bold">
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
              <div className="flex items-center gap-6 mt-4 text-sm text-white/80 flex-wrap">
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

              {/* Social Links */}
              {seller.social_links && Object.keys(seller.social_links).length > 0 && (
                <div className="flex items-center gap-3 mt-4">
                  {seller.social_links.instagram && (
                    <a 
                      href={`https://instagram.com/${seller.social_links.instagram}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                      <Instagram className="w-4 h-4 text-white" />
                    </a>
                  )}
                  {seller.social_links.twitter && (
                    <a 
                      href={`https://twitter.com/${seller.social_links.twitter}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                      <Twitter className="w-4 h-4 text-white" />
                    </a>
                  )}
                  {seller.social_links.tiktok && (
                    <a 
                      href={`https://tiktok.com/@${seller.social_links.tiktok}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                      <Music className="w-4 h-4 text-white" />
                    </a>
                  )}
                  {seller.social_links.youtube && (
                    <a 
                      href={seller.social_links.youtube.startsWith('http') ? seller.social_links.youtube : `https://youtube.com/@${seller.social_links.youtube}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                      <Youtube className="w-4 h-4 text-white" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <StoreSidebar
            products={products}
            categories={categories}
            selectedCategory={selectedCategory}
            selectedTags={selectedTags}
            onCategorySelect={setSelectedCategory}
            onTagSelect={handleTagSelect}
            onProductClick={(product) => setSelectedProduct(product)}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className="flex gap-3 mb-6">
              {/* Mobile Filter */}
              <div className="lg:hidden">
                <StoreSidebar
                  products={products}
                  categories={categories}
                  selectedCategory={selectedCategory}
                  selectedTags={selectedTags}
                  onCategorySelect={setSelectedCategory}
                  onTagSelect={handleTagSelect}
                  onProductClick={(product) => setSelectedProduct(product)}
                />
              </div>

              {/* Search Input */}
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-gray-100 rounded-lg">
                  <Search size={18} className="text-gray-500" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, tags..."
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-14 pr-4 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all font-medium shadow-md"
                />
                {(searchQuery || selectedTags.length > 0 || selectedCategory !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTags([]);
                      setSelectedCategory('all');
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={18} className="text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Active Filters Pills */}
            {(selectedTags.length > 0 || selectedCategory !== 'all') && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white rounded-full text-xs font-medium">
                    {categories.find(c => c.id === selectedCategory)?.name || 'Category'}
                    <button onClick={() => setSelectedCategory('all')} className="hover:bg-white/20 rounded-full p-0.5">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedTags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-medium">
                    {tag}
                    <button onClick={() => handleTagSelect(tag)} className="hover:bg-white/20 rounded-full p-0.5">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Store Description */}
            {seller.store_description && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-md">
                <h3 className="font-bold text-gray-900 mb-2">About this store</h3>
                <p className="text-gray-600">{seller.store_description}</p>
              </div>
            )}

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center border border-gray-200 shadow-md">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                  <Package className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Products Found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTags([]);
                    setSelectedCategory('all');
                  }}
                  className="text-emerald-600 font-medium hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
                {filteredProducts.map(product => (
                  <StoreProductCard
                    key={product.id}
                    product={product}
                    storeName={seller.store_name}
                    hasEnoughBalance={hasEnoughBalance(product.price)}
                    purchasing={purchasing === product.id}
                    onChat={() => handleChat(product)}
                    onView={() => setSelectedProduct(product)}
                    onBuy={() => handlePurchase(product)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
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
          
          {selectedProduct && (
            <div className="space-y-4">
              {/* Tags */}
              {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="rounded-full">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>5.0</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{selectedProduct.sold_count || 0} sold</span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between py-4 border-t border-slate-100">
                <span className="text-2xl font-bold text-emerald-600">${selectedProduct.price}</span>
                {user && wallet && (
                  <span className="text-sm text-slate-500">
                    Balance: ${wallet.balance.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {selectedProduct.chat_allowed !== false && (
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => handleChat(selectedProduct)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                )}
                <Button
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 rounded-xl"
                  onClick={() => handlePurchase(selectedProduct)}
                  disabled={purchasing === selectedProduct.id}
                >
                  {purchasing === selectedProduct.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-4 h-4 mr-2" />
                  )}
                  Buy Now
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sign in to continue</DialogTitle>
            <DialogDescription>
              Create an account or sign in to purchase products from this store.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <Button
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 rounded-xl"
              onClick={() => handleLoginRedirect(false)}
            >
              Sign In
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl"
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
