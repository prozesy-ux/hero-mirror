import { useState, useEffect, useCallback, useRef } from 'react';
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
  AlertTriangle,
  SlidersHorizontal,
  Shield,
  Zap,
  Clock
} from 'lucide-react';
import { Instagram, Twitter, Youtube, Music } from 'lucide-react';
import StoreSidebar from '@/components/store/StoreSidebar';
import StoreProductCard from '@/components/store/StoreProductCard';
import StoreProductCardCompact from '@/components/store/StoreProductCardCompact';
import ProductDetailModal from '@/components/store/ProductDetailModal';
import MiniViewModal from '@/components/marketplace/MiniViewModal';
import ShareStoreModal from '@/components/seller/ShareStoreModal';
import MobileStoreHeader from '@/components/store/MobileStoreHeader';
import StoreCategoryChips from '@/components/store/StoreCategoryChips';
import { FloatingChatProvider, useFloatingChat } from '@/contexts/FloatingChatContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import FloatingChatWidget from '@/components/dashboard/FloatingChatWidget';
import { useIsMobile } from '@/hooks/use-mobile';
// Marketplace search components
import { SearchSuggestions } from '@/components/marketplace/SearchSuggestions';
import { VoiceSearchButton } from '@/components/marketplace/VoiceSearchButton';
import { ImageSearchButton } from '@/components/marketplace/ImageSearchButton';
import { SearchFiltersBar, FilterState } from '@/components/marketplace/SearchFiltersBar';
import { MobileSearchOverlay } from '@/components/marketplace/MobileSearchOverlay';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';

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
  // Rating from BFF
  averageRating?: number;
  totalReviews?: number;
}

interface SellerProduct {
  id: string;
  name: string;
  slug?: string | null;
  description: string | null;
  price: number;
  original_price?: number | null;
  icon_url: string | null;
  images?: string[] | null;
  category_id: string | null;
  is_available?: boolean;
  is_approved?: boolean;
  tags: string[] | null;
  stock: number | null;
  sold_count: number | null;
  chat_allowed: boolean | null;
  seller_id: string;
  view_count?: number | null;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface FlashSale {
  id: string;
  product_id: string;
  discount_percentage: number;
  original_price: number;
  sale_price: number;
  starts_at: string;
  ends_at: string;
  max_quantity: number | null;
  sold_quantity: number;
  is_active: boolean;
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
  const { user, canMutate } = useAuthContext();
  const { openChat } = useFloatingChat();
  const isMobile = useIsMobile();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<SellerProduct | null>(null);
  const [miniViewProduct, setMiniViewProduct] = useState<SellerProduct | null>(null);
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

  // Marketplace search features state
  const [filterState, setFilterState] = useState<FilterState>({
    priceMin: undefined,
    priceMax: undefined,
    minRating: null,
    verifiedOnly: false,
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchInputFocused, setSearchInputFocused] = useState(false);

  // Voice search hook
  const handleVoiceResult = useCallback((text: string) => {
    setSearchQuery(text);
    setShowSuggestions(false);
  }, []);

  const {
    isListening,
    isSupported: voiceSupported,
    error: voiceError,
    startListening,
    stopListening,
  } = useVoiceSearch(handleVoiceResult);

  // Generate search suggestions from products
  const generateSuggestions = useCallback(() => {
    if (!products.length) {
      return {
        recent: [],
        trending: [],
        products: [],
        categories: [],
        tags: [],
        sellers: [],
      };
    }

    const query = searchQuery.toLowerCase().trim();
    const matchedProducts = query.length >= 2 
      ? products.filter(p => 
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.tags?.some(t => t.toLowerCase().includes(query))
        ).slice(0, 5).map(p => ({
          type: 'product' as const,
          id: p.id,
          text: p.name,
          subtitle: `$${p.price}`,
          icon_url: p.icon_url || undefined,
          price: p.price,
        }))
      : [];

    // Get trending products (by sold_count)
    const trendingProducts = products
      .filter(p => (p.sold_count || 0) > 0)
      .sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0))
      .slice(0, 3)
      .map(p => ({
        type: 'trending' as const,
        id: p.id,
        text: p.name,
        result_count: p.sold_count || 0,
        icon_url: p.icon_url || undefined,
      }));

    // Get unique tags
    const allTags = new Set<string>();
    products.forEach(p => p.tags?.forEach(t => allTags.add(t)));
    const matchedTags = query.length >= 2
      ? Array.from(allTags)
          .filter(t => t.toLowerCase().includes(query))
          .slice(0, 3)
          .map(t => ({ type: 'tag' as const, id: t, text: t }))
      : [];

    // Get matching categories
    const matchedCategories = query.length >= 2
      ? categories
          .filter(c => c.name.toLowerCase().includes(query))
          .slice(0, 3)
          .map(c => ({ type: 'category' as const, id: c.id, text: c.name }))
      : [];

    return {
      recent: [],
      trending: query.length < 2 ? trendingProducts : [],
      products: matchedProducts,
      categories: matchedCategories,
      tags: matchedTags,
      sellers: [],
    };
  }, [products, categories, searchQuery]);

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

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          if (isMobile) {
            setMobileSearchOpen(true);
          } else {
            searchInputRef.current?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobile]);

  const fetchStoreData = async () => {
    setLoading(true);
    
    try {
      // Use BFF for server-side data fetch - single request, all data
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bff-store-public?slug=${storeSlug}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('[Store] BFF error response:', { status: response.status, errorData });
        
        // Check for various not-found indicators
        if (response.status === 404 || errorData.notFound || errorData.code === 'NOT_FOUND') {
          console.log('[Store] Store not found via BFF, trying fallback');
          throw new Error('FALLBACK_NEEDED');
        }
        throw new Error(errorData.error || 'Failed to load store');
      }

      const data = await response.json();
      console.log('[Store] BFF response:', { seller: data.seller?.store_name, productCount: data.products?.length, flashSalesCount: data.flashSales?.length });
      
      setSeller(data.seller as SellerProfile);
      setProducts(data.products || []);
      setCategories(data.categories || []);
      setFlashSales(data.flashSales || []);
    } catch (error) {
      console.error('[Store] BFF fetch error:', error);
      // Fallback to direct query if BFF fails (during deployment)
      try {
        console.log('[Store] Falling back to direct Supabase query');
        const { data: sellerData } = await supabase
          .from('seller_profiles')
          .select('*')
          .eq('store_slug', storeSlug)
          .eq('is_active', true)
          .maybeSingle();

        if (!sellerData) {
          console.log('[Store] No seller found for slug:', storeSlug);
          setLoading(false);
          return;
        }

        setSeller(sellerData as SellerProfile);
        console.log('[Store] Seller found:', sellerData.store_name);

        const [productsResult, categoriesResult] = await Promise.all([
          supabase
            .from('seller_products')
            .select('*')
            .eq('seller_id', sellerData.id)
            .eq('is_available', true)
            .eq('is_approved', true)
            .order('sold_count', { ascending: false }),
          supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
        ]);

        console.log('[Store] Direct query products:', productsResult.data?.length || 0);
        if (productsResult.data) setProducts(productsResult.data);
        if (categoriesResult.data) setCategories(categoriesResult.data);
      } catch (fallbackError) {
        console.error('[Store] Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
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

    // MUTATION LOCK - Check canMutate before any write operation
    if (!canMutate) {
      toast.error('Please wait - verifying your session...');
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
      const commissionRate = 0.10; // 10% platform commission
      const sellerEarning = product.price * (1 - commissionRate);

      // Use atomic RPC for purchase - handles wallet deduction, transaction, order, and seller balance
      const { data: result, error } = await supabase.rpc('purchase_seller_product', {
        p_buyer_id: user.id,
        p_seller_id: product.seller_id,
        p_product_id: product.id,
        p_product_name: product.name,
        p_amount: product.price,
        p_seller_earning: sellerEarning
      });

      if (error) throw error;

      const purchaseResult = result as { success: boolean; error?: string; order_id?: string };
      if (!purchaseResult.success) {
        throw new Error(purchaseResult.error || 'Purchase failed');
      }

      // Update local wallet state with new balance
      setWallet(prev => prev ? { ...prev, balance: (prev.balance || 0) - product.price } : null);

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

  const handleSuggestionSelect = (suggestion: any) => {
    if (suggestion.type === 'product') {
      const product = products.find(p => p.id === suggestion.id);
      if (product) setSelectedProduct(product);
    } else if (suggestion.type === 'category') {
      setSelectedCategory(suggestion.id);
    } else if (suggestion.type === 'tag') {
      handleTagSelect(suggestion.text);
    } else if (suggestion.type === 'trending') {
      const product = products.find(p => p.id === suggestion.id);
      if (product) setSelectedProduct(product);
    } else {
      setSearchQuery(suggestion.text);
    }
    setShowSuggestions(false);
  };

  const handleImageSearchResult = (text: string) => {
    setSearchQuery(text);
    setShowSuggestions(false);
  };

  const handleSearch = () => {
    setShowSuggestions(false);
    setMobileSearchOpen(false);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    const matchesTags = selectedTags.length === 0 || product.tags?.some(tag => selectedTags.includes(tag));
    
    // Apply filter state
    const matchesMinPrice = filterState.priceMin === undefined || product.price >= filterState.priceMin;
    const matchesMaxPrice = filterState.priceMax === undefined || product.price <= filterState.priceMax;
    
    return matchesSearch && matchesCategory && matchesTags && matchesMinPrice && matchesMaxPrice;
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

  const suggestions = generateSuggestions();

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 overflow-x-hidden">
      {/* Mobile Sticky Header */}
      <MobileStoreHeader
        storeName={seller.store_name}
        storeLogoUrl={seller.store_logo_url}
        isVerified={seller.is_verified}
        onShare={() => setShowShareModal(true)}
      />

      {/* Store Banner - Dynamic Height (smaller on mobile) */}
      <div className="relative">
        {seller.store_video_url ? (
          <div className={`relative h-28 md:${bannerHeight} overflow-hidden`}>
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
          <div className={`relative h-28 md:${bannerHeight}`}>
            <img 
              src={seller.store_banner_url}
              alt={seller.store_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </div>
        ) : (
          <div className={`h-28 md:${bannerHeight} bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500`} />
        )}

        {/* Store Info Overlay - Hidden on mobile (shown in sticky header) */}
        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-end gap-3 md:gap-4">
            <Avatar className="w-12 h-12 md:w-24 md:h-24 border-2 md:border-4 border-white shadow-2xl hidden md:flex">
              <AvatarImage src={seller.store_logo_url || ''} />
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-lg md:text-2xl font-bold">
                {seller.store_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-white">
              <div className="hidden md:flex items-center gap-3 flex-wrap">
                <h1 className="text-xl md:text-3xl font-bold">{seller.store_name}</h1>
                {seller.is_verified && (
                  <Badge className="bg-emerald-500 text-white border-0">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              {seller.store_tagline && (
                <p className="hidden md:block text-sm md:text-base text-white/90 mt-1">{seller.store_tagline}</p>
              )}
              
              {/* Stats Row in Banner - Compact on mobile */}
              <div className="flex items-center gap-2 md:gap-4 mt-2 md:mt-3 flex-wrap">
                {showReviews && (
                  <div className="flex items-center gap-1 md:gap-1.5 bg-white/20 backdrop-blur-sm px-2 md:px-3 py-1 md:py-1.5 rounded-full">
                    <Star className="w-3 md:w-4 h-3 md:h-4 text-amber-400 fill-amber-400" />
                    <span className="text-xs md:text-sm font-semibold">{seller.averageRating || 4.9}</span>
                  </div>
                )}
                {showProductCount && (
                  <div className="flex items-center gap-1 md:gap-1.5 bg-white/20 backdrop-blur-sm px-2 md:px-3 py-1 md:py-1.5 rounded-full">
                    <Package className="w-3 md:w-4 h-3 md:h-4" />
                    <span className="text-xs md:text-sm font-semibold">{products.length}</span>
                  </div>
                )}
                {showOrderCount && (
                  <div className="flex items-center gap-1 md:gap-1.5 bg-white/20 backdrop-blur-sm px-2 md:px-3 py-1 md:py-1.5 rounded-full">
                    <Users className="w-3 md:w-4 h-3 md:h-4" />
                    <span className="text-xs md:text-sm font-semibold">{seller.total_orders || 0}</span>
                  </div>
                )}
              </div>
              
              {/* Social Links */}
              {showSocialLinks && seller.social_links && Object.keys(seller.social_links).length > 0 && !isMobile && (
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

      {/* Trust Badges - Mobile only */}
      <div className="md:hidden overflow-x-auto hide-scrollbar px-3 py-2.5 bg-white/80 backdrop-blur-sm border-b border-slate-100">
        <div className="flex gap-3 w-max">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-full text-xs font-medium text-emerald-700">
            <Shield size={12} />
            <span>Secure Checkout</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-full text-xs font-medium text-blue-700">
            <Zap size={12} />
            <span>Instant Delivery</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-full text-xs font-medium text-amber-700">
            <Clock size={12} />
            <span>24/7 Support</span>
          </div>
        </div>
      </div>

      {/* Main Content with Sidebar */}
      <main className="max-w-7xl mx-auto px-2 md:px-4 py-3 md:py-6">
        <div className="lg:flex lg:gap-6">
          {/* Sidebar - Desktop only */}
          <div className="hidden lg:block">
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

          {/* Main Content */}
          <div className="flex-1 min-w-0 w-full">
            {/* Search Bar - Amazon-style with marketplace features */}
            <div className="mb-3 md:mb-4">
              {/* Desktop Search Bar - Premium Design */}
              <div className="hidden md:block relative">
                <div className="flex items-stretch bg-white rounded-xl border-2 border-black/15 overflow-hidden focus-within:border-black/40 focus-within:ring-2 focus-within:ring-black/10 focus-within:shadow-lg transition-all">
                  {/* Category Selector */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-gray-100 border-r border-black/15 px-4 py-3.5 text-sm font-medium text-black/70 focus:outline-none cursor-pointer hover:bg-gray-200 transition-colors"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>

                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/40" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        setSearchInputFocused(true);
                        setShowSuggestions(true);
                      }}
                      onBlur={() => {
                        setSearchInputFocused(false);
                        // Delay closing to allow click on suggestions
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      placeholder="Search products in this store..."
                      className="w-full py-3.5 pl-12 pr-28 text-sm text-black placeholder-black/40 focus:outline-none"
                    />
                    
                    {/* Action buttons inside input */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <VoiceSearchButton
                        isListening={isListening}
                        isSupported={voiceSupported}
                        error={voiceError}
                        onStart={startListening}
                        onStop={stopListening}
                        className="h-9 w-9"
                      />
                      <ImageSearchButton
                        onSearchResult={handleImageSearchResult}
                        className="h-9 w-9"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="p-1.5 hover:bg-black/5 rounded-lg transition-colors"
                        >
                          <X size={16} className="text-black/40" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Search Button */}
                  <button
                    onClick={handleSearch}
                    className="bg-black hover:bg-black/90 text-white px-6 font-semibold text-sm transition-colors flex items-center gap-2"
                  >
                    <Search size={18} />
                    Search
                  </button>
                </div>

                {/* Search Suggestions Dropdown */}
                {showSuggestions && (searchQuery.length >= 2 || suggestions.trending.length > 0) && (
                  <SearchSuggestions
                    query={searchQuery}
                    suggestions={suggestions}
                    isLoading={false}
                    isOpen={showSuggestions}
                    onClose={() => setShowSuggestions(false)}
                    onSelect={handleSuggestionSelect}
                    className="mt-1"
                  />
                )}
              </div>

              {/* Mobile Search Row */}
              <div className="md:hidden grid grid-cols-[auto_1fr] gap-2">
                {/* Mobile Filter Button */}
                <StoreSidebar
                  products={products}
                  categories={categories}
                  selectedCategory={selectedCategory}
                  selectedTags={selectedTags}
                  onCategorySelect={setSelectedCategory}
                  onTagSelect={handleTagSelect}
                  onProductClick={(product) => setSelectedProduct(product)}
                />

                {/* Mobile Search Trigger */}
                <button
                  onClick={() => setMobileSearchOpen(true)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-left text-sm text-slate-400 shadow-sm flex items-center gap-3"
                >
                  <Search size={18} className="text-slate-400" />
                  <span className="flex-1">Search products...</span>
                  {voiceSupported && (
                    <span className="text-slate-300">🎤</span>
                  )}
                </button>
              </div>

              {/* Filter Bar - Desktop */}
              <div className="hidden md:block mt-3">
                <SearchFiltersBar
                  filters={filterState}
                  onFiltersChange={setFilterState}
                />
              </div>
            </div>

            {/* Mobile Category Chips */}
            <StoreCategoryChips
              products={products}
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
            />

            {/* Active Filters Pills - Compact on mobile */}
            {(selectedTags.length > 0 || (selectedCategory !== 'all' && !isMobile)) && (
              <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
                {selectedCategory !== 'all' && !isMobile && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white rounded-full text-[10px] md:text-xs font-medium">
                    {categories.find(c => c.id === selectedCategory)?.name || 'Category'}
                    <button onClick={() => setSelectedCategory('all')} className="hover:bg-white/20 rounded-full p-0.5 tap-feedback">
                      <X size={10} />
                    </button>
                  </span>
                )}
                {selectedTags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500 text-white rounded-full text-[10px] md:text-xs font-medium">
                    {tag}
                    <button onClick={() => handleTagSelect(tag)} className="hover:bg-white/20 rounded-full p-0.5 tap-feedback">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Store Description - Hidden on mobile */}
            {showDescription && seller.store_description && !isMobile && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  About this store
                </h3>
                <div className="space-y-2">
                  {seller.store_description.split('\n').filter(Boolean).map((line, i) => (
                    <p key={i} className="text-slate-600 flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{line}</span>
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Flash Sales Section */}
            {flashSales.length > 0 && (
              <div className="mb-4 md:mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                    <Zap className="h-3.5 w-3.5 text-white fill-white" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900">Flash Deals</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar snap-x snap-mandatory">
                  {flashSales.map((sale) => {
                    const saleProduct = products.find(p => p.id === sale.product_id);
                    if (!saleProduct) return null;
                    
                    return (
                      <div key={sale.id} className="flex-shrink-0 w-44 sm:w-52 snap-start">
                        <div 
                          onClick={() => setSelectedProduct(saleProduct)}
                          className="group bg-white rounded-xl overflow-hidden border-2 border-red-200 shadow-sm hover:shadow-lg hover:border-red-300 transition-all cursor-pointer"
                        >
                          {/* Flash Sale Banner */}
                          <div className="bg-gradient-to-r from-red-500 to-orange-500 py-1 px-2 flex items-center justify-between">
                            <span className="text-white text-[10px] font-bold">⚡ FLASH SALE</span>
                            <span className="text-white text-[10px] font-bold">{sale.discount_percentage}% OFF</span>
                          </div>
                          
                          {/* Image */}
                          <div className="relative aspect-square overflow-hidden bg-slate-50">
                            {saleProduct.icon_url ? (
                              <img 
                                src={saleProduct.icon_url} 
                                alt={saleProduct.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-10 w-10 text-slate-300" />
                              </div>
                            )}
                          </div>
                          
                          {/* Content */}
                          <div className="p-2.5">
                            <h3 className="font-semibold text-slate-900 text-xs leading-tight line-clamp-1 mb-1.5">
                              {saleProduct.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="text-sm font-bold text-red-600">${sale.sale_price.toFixed(2)}</span>
                              <span className="text-xs text-slate-400 line-through">${sale.original_price.toFixed(2)}</span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePurchase(saleProduct);
                              }}
                              className="w-full py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-lg text-xs hover:from-red-600 hover:to-orange-600 active:scale-[0.98] transition-all"
                            >
                              Buy Now
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Products Grid - 2 columns on mobile */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 md:p-16 text-center border border-slate-200 shadow-md">
                <div className="w-16 md:w-20 h-16 md:h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <Package className="w-8 md:w-10 h-8 md:h-10 text-slate-400" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">No Products Found</h3>
                <p className="text-slate-500 text-sm md:text-base mb-4">Try adjusting your search or filters</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTags([]);
                    setSelectedCategory('all');
                    setFilterState({
                      priceMin: undefined,
                      priceMax: undefined,
                      minRating: null,
                      verifiedOnly: false,
                    });
                  }}
                  className="text-emerald-600 font-medium hover:underline text-sm md:text-base tap-feedback"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 lg:gap-5">
                {filteredProducts.map(product => (
                  isMobile ? (
                    <StoreProductCardCompact
                      key={product.id}
                      product={product}
                      hasEnoughBalance={hasEnoughBalance(product.price)}
                      isLoggedIn={!!user}
                      purchasing={purchasing === product.id}
                      onView={() => setMiniViewProduct(product)}
                      onBuy={() => handlePurchase(product)}
                    />
                  ) : (
                    <StoreProductCard
                      key={product.id}
                      product={product}
                      storeName={seller.store_name}
                      hasEnoughBalance={hasEnoughBalance(product.price)}
                      isLoggedIn={!!user}
                      purchasing={purchasing === product.id}
                      onChat={() => handleChat(product)}
                      onView={() => setMiniViewProduct(product)}
                      onBuy={() => handlePurchase(product)}
                      sellerAvatar={seller.store_logo_url}
                      storeSlug={seller.store_slug}
                      isVerified={seller.is_verified}
                    />
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Search Overlay */}
      <MobileSearchOverlay
        isOpen={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
        query={searchQuery}
        setQuery={setSearchQuery}
        suggestions={suggestions}
        isLoading={false}
        onSelect={handleSuggestionSelect}
        onSearch={handleSearch}
        voiceSupported={voiceSupported}
        isListening={isListening}
        voiceError={voiceError}
        onVoiceStart={startListening}
        onVoiceStop={stopListening}
        onImageSearchResult={handleImageSearchResult}
      />

      {/* Mini View Modal - Quick preview when clicking View */}
      <MiniViewModal
        product={miniViewProduct ? {
          id: miniViewProduct.id,
          name: miniViewProduct.name,
          description: miniViewProduct.description,
          price: miniViewProduct.price,
          iconUrl: miniViewProduct.icon_url,
          sellerName: seller?.store_name || null,
          sellerAvatar: seller?.store_logo_url || null,
          storeSlug: seller?.store_slug || null,
          isVerified: seller?.is_verified || false,
          soldCount: miniViewProduct.sold_count || 0,
          tags: miniViewProduct.tags,
          chatAllowed: miniViewProduct.chat_allowed ?? true,
        } : null}
        isOpen={!!miniViewProduct}
        onClose={() => setMiniViewProduct(null)}
        onBuy={() => {
          if (miniViewProduct) {
            setMiniViewProduct(null);
            handlePurchase(miniViewProduct);
          }
        }}
        onChat={() => {
          if (miniViewProduct) {
            setMiniViewProduct(null);
            handleChat(miniViewProduct);
          }
        }}
        onViewFull={() => {
          if (miniViewProduct) {
            setMiniViewProduct(null);
            setSelectedProduct(miniViewProduct);
          }
        }}
        isAuthenticated={!!user}
      />

      {/* Product Details Modal - Full view */}
      <ProductDetailModal
        product={selectedProduct}
        seller={seller ? {
          id: seller.id,
          store_name: seller.store_name,
          store_logo_url: seller.store_logo_url,
          is_verified: seller.is_verified
        } : null}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onChat={selectedProduct ? () => handleChat(selectedProduct) : undefined}
        onBuy={selectedProduct ? () => handlePurchase(selectedProduct) : undefined}
        onViewFull={selectedProduct ? () => {
          setSelectedProduct(null);
          // Use clean slug from database, fallback to legacy format if not available
          const slug = (selectedProduct as any).slug || `${selectedProduct.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50)}-${selectedProduct.id.slice(0, 8)}`;
          navigate(`/store/${storeSlug}/product/${slug}`);
        } : undefined}
        isLoggedIn={!!user}
        walletBalance={wallet?.balance}
        purchasing={!!purchasing}
      />

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

// Main Store component wrapped with CurrencyProvider and FloatingChatProvider
const Store = () => {
  return (
    <CurrencyProvider>
      <FloatingChatProvider>
        <StoreContent />
      </FloatingChatProvider>
    </CurrencyProvider>
  );
};

export default Store;
