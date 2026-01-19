import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
  MessageCircle,
  X,
  Users,
  Check,
  Wallet,
  Share2,
  Store as StoreIcon,
  AlertTriangle
} from 'lucide-react';
import { Instagram, Twitter, Youtube, Music } from 'lucide-react';
import StoreSidebar from '@/components/store/StoreSidebar';
import StoreProductCard from '@/components/store/StoreProductCard';
import ShareStoreModal from '@/components/seller/ShareStoreModal';
import { FloatingChatProvider, useFloatingChat } from '@/contexts/FloatingChatContext';
import FloatingChatWidget from '@/components/dashboard/FloatingChatWidget';

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
  // Display settings
  banner_height?: 'small' | 'medium' | 'large';
  show_reviews?: boolean;
  show_product_count?: boolean;
  show_order_count?: boolean;
  show_description?: boolean;
  show_social_links?: boolean;
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

// Banner height mapping
const bannerHeightClasses: Record<string, string> = {
  small: 'h-32 md:h-40',
  medium: 'h-48 md:h-64',
  large: 'h-64 md:h-80'
};

// Inner component that uses FloatingChat context
const StoreContent = () => {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { openChat } = useFloatingChat();
  
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
  const [pendingAction, setPendingAction] = useState<'buy' | 'chat'>('buy');
  const [showShareModal, setShowShareModal] = useState(false);
  const [insufficientFundsModal, setInsufficientFundsModal] = useState<{
    show: boolean;
    required: number;
    current: number;
    shortfall: number;
    productName?: string;
  }>({ show: false, required: 0, current: 0, shortfall: 0 });

  // Handle return from auth with pending purchase or chat
  useEffect(() => {
    if (!user || products.length === 0 || !seller) {
      return;
    }

    const storeReturn = localStorage.getItem('storeReturn');
    if (!storeReturn) return;

    try {
      const data = JSON.parse(storeReturn);
      
      if (data.returnUrl && !data.returnUrl.includes(storeSlug)) {
        return;
      }

      const pendingProd = products.find(p => p.id === data.pendingProductId);
      
      if (pendingProd) {
        localStorage.removeItem('storeReturn');
        
        if (data.pendingAction === 'chat') {
          openChat({
            sellerId: seller.id,
            sellerName: seller.store_name,
            productId: pendingProd.id,
            productName: pendingProd.name,
            type: 'seller'
          });
          toast.success(`Welcome back! Chat with ${seller.store_name} is now open`);
        } else {
          setSelectedProduct(pendingProd);
          toast.success(`Welcome back! Continue your purchase of "${pendingProd.name}"`);
        }
      } else if (data.pendingProductId) {
        localStorage.removeItem('storeReturn');
        toast.info(`Welcome back to ${seller.store_name}!`);
      }
    } catch (e) {
      console.error('Failed to parse storeReturn', e);
      localStorage.removeItem('storeReturn');
    }
  }, [user, products, seller, storeSlug, openChat]);

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

  const persistStoreReturn = (productId: string, action: 'buy' | 'chat') => {
    const returnData = {
      returnUrl: `/store/${storeSlug}`,
      pendingProductId: productId,
      pendingAction: action,
      autoOpenPurchase: action === 'buy'
    };
    localStorage.setItem('storeReturn', JSON.stringify(returnData));
  };

  const handlePurchase = async (product: SellerProduct) => {
    if (!user) {
      localStorage.setItem('pendingPurchase', JSON.stringify({
        productId: product.id,
        productName: product.name,
        sellerId: product.seller_id,
        price: product.price,
        storeSlug: storeSlug,
        iconUrl: product.icon_url
      }));
      navigate('/signin');
      return;
    }

    const currentBalance = wallet?.balance || 0;

    if (currentBalance < product.price) {
      setInsufficientFundsModal({
        show: true,
        required: product.price,
        current: currentBalance,
        shortfall: product.price - currentBalance,
        productName: product.name
      });
      return;
    }

    setPurchasing(product.id);

    try {
      const { error } = await supabase.from('seller_orders').insert({
        seller_id: product.seller_id,
        buyer_id: user.id,
        product_id: product.id,
        amount: product.price,
        seller_earning: product.price * 0.85,
        status: 'pending'
      });

      if (error) throw error;

      await supabase
        .from('user_wallets')
        .update({ balance: wallet!.balance - product.price })
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

  const handleLoginRedirect = (isSignup = false) => {
    setShowLoginModal(false);
    const returnTo = encodeURIComponent(`/store/${storeSlug}`);
    navigate(isSignup ? `/signin?mode=signup&returnTo=${returnTo}` : `/signin?returnTo=${returnTo}`);
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
      localStorage.setItem('pendingChat', JSON.stringify({
        productId: product.id,
        productName: product.name,
        sellerId: product.seller_id,
        storeSlug: storeSlug,
        sellerName: seller?.store_name || ''
      }));
      navigate('/signin');
      return;
    }
    
    if (seller) {
      openChat({
        sellerId: seller.id,
        sellerName: seller.store_name,
        productId: product.id,
        productName: product.name,
        type: 'seller'
      });
    }
  };

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

  // Get banner height class
  const bannerHeight = bannerHeightClasses[seller?.banner_height || 'medium'];

  // Check display settings
  const showReviews = seller?.show_reviews !== false;
  const showProductCount = seller?.show_product_count !== false;
  const showOrderCount = seller?.show_order_count !== false;
  const showDescription = seller?.show_description !== false;
  const showSocialLinks = seller?.show_social_links !== false;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
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
      {/* Header - Store Info Bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Store Logo + Name */}
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-emerald-200">
              <AvatarImage src={seller.store_logo_url || ''} />
              <AvatarFallback className="bg-emerald-500 text-white text-sm font-bold">
                {seller.store_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900">{seller.store_name}</span>
                {seller.is_verified && <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-100" />}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {showReviews && (
                  <>
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>4.9</span>
                    <span>•</span>
                  </>
                )}
                {showProductCount && (
                  <>
                    <span>{products.length} products</span>
                  </>
                )}
                {showOrderCount && (
                  <>
                    <span>•</span>
                    <span>{seller.total_orders || 0} orders</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setShowShareModal(true)}
            >
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
            {user ? (
              <Button
                size="sm"
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </Button>
            ) : (
              <Button
                size="sm"
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                onClick={() => navigate('/signin')}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Store Banner - Dynamic Height */}
      <div className="relative">
        {seller.store_video_url ? (
          <div className={`relative ${bannerHeight} overflow-hidden`}>
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
          <div className={`relative ${bannerHeight}`}>
            <img 
              src={seller.store_banner_url}
              alt={seller.store_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>
        ) : (
          <div className={`${bannerHeight} bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500`} />
        )}

        {/* Store Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-end gap-4">
            <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-white shadow-2xl">
              <AvatarImage src={seller.store_logo_url || ''} />
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-2xl font-bold">
                {seller.store_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-white">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl md:text-3xl font-bold">{seller.store_name}</h1>
                {seller.is_verified && (
                  <Badge className="bg-emerald-500 text-white border-0">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              {seller.store_tagline && (
                <p className="text-sm md:text-base text-white/90 mt-1">{seller.store_tagline}</p>
              )}
              
              {/* Stats Row in Banner */}
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {showReviews && (
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-semibold">4.9</span>
                  </div>
                )}
                {showProductCount && (
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <Package className="w-4 h-4" />
                    <span className="text-sm font-semibold">{products.length} products</span>
                  </div>
                )}
                {showOrderCount && (
                  <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-semibold">{seller.total_orders || 0} orders</span>
                  </div>
                )}
              </div>
              
              {/* Social Links */}
              {showSocialLinks && seller.social_links && Object.keys(seller.social_links).length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  {seller.social_links.instagram && (
                    <a 
                      href={`https://instagram.com/${seller.social_links.instagram}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                      <Instagram className="w-3.5 h-3.5 text-white" />
                    </a>
                  )}
                  {seller.social_links.twitter && (
                    <a 
                      href={`https://twitter.com/${seller.social_links.twitter}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                      <Twitter className="w-3.5 h-3.5 text-white" />
                    </a>
                  )}
                  {seller.social_links.tiktok && (
                    <a 
                      href={`https://tiktok.com/@${seller.social_links.tiktok}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                      <Music className="w-3.5 h-3.5 text-white" />
                    </a>
                  )}
                  {seller.social_links.youtube && (
                    <a 
                      href={seller.social_links.youtube.startsWith('http') ? seller.social_links.youtube : `https://youtube.com/@${seller.social_links.youtube}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                      <Youtube className="w-3.5 h-3.5 text-white" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <main className="max-w-7xl mx-auto px-4 py-6">
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

            {/* Store Description - with checkmarks */}
            {showDescription && seller.store_description && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  About this store
                </h3>
                <div className="space-y-2">
                  {seller.store_description.split('\n').filter(Boolean).map((line, i) => (
                    <p key={i} className="text-gray-600 flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{line}</span>
                    </p>
                  ))}
                </div>
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
                    isLoggedIn={!!user}
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
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
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
              Create an account or sign in to {pendingAction === 'chat' ? 'chat with the seller' : 'purchase products from this store'}.
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

      {/* Share Modal */}
      <ShareStoreModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        storeSlug={seller.store_slug}
        storeName={seller.store_name}
      />

      {/* Insufficient Funds Modal */}
      {insufficientFundsModal.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setInsufficientFundsModal({ show: false, required: 0, current: 0, shortfall: 0 })}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">Insufficient Balance</h3>
              
              <p className="text-gray-600 mb-4">
                To purchase <span className="font-semibold text-gray-900">{insufficientFundsModal.productName}</span>
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Required Amount:</span>
                  <span className="text-gray-900 font-bold">${insufficientFundsModal.required.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Your Balance:</span>
                  <span className="text-amber-600 font-bold">${insufficientFundsModal.current.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
                  <span className="text-gray-500">Amount Needed:</span>
                  <span className="text-emerald-600 font-bold">${insufficientFundsModal.shortfall.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setInsufficientFundsModal({ show: false, required: 0, current: 0, shortfall: 0 })}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setInsufficientFundsModal({ show: false, required: 0, current: 0, shortfall: 0 });
                    navigate('/dashboard/billing');
                  }}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <Wallet size={18} />
                  Top Up Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Widget */}
      <FloatingChatWidget />
    </div>
  );
};

// Main Store component wrapped with FloatingChatProvider
const Store = () => {
  return (
    <FloatingChatProvider>
      <StoreContent />
    </FloatingChatProvider>
  );
};

export default Store;