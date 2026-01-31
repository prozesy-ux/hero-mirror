import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '@/contexts/AuthContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';
import GumroadHeader from '@/components/marketplace/GumroadHeader';
import GumroadProductCard from '@/components/marketplace/GumroadProductCard';
import FeaturedCarousel from '@/components/marketplace/FeaturedCarousel';
import GumroadFilterSidebar from '@/components/marketplace/GumroadFilterSidebar';
import GumroadQuickViewModal from '@/components/marketplace/GumroadQuickViewModal';
import GuestPaymentModal from '@/components/marketplace/GuestPaymentModal';
import MarketplaceProductFullView from '@/components/marketplace/MarketplaceProductFullView';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { slugify } from '@/lib/url-utils';

// Types
interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  iconUrl: string | null;
  sellerName: string | null;
  sellerAvatar?: string | null;
  storeSlug: string | null;
  isVerified: boolean;
  soldCount?: number;
  rating?: number;
  reviewCount?: number;
  type: 'ai' | 'seller';
  tags?: string[];
  categoryId?: string | null;
}

type SortOption = 'trending' | 'best_sellers' | 'new';

const Marketplace = () => {
  const navigate = useNavigate();
  const { productSlug } = useParams<{ productSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthContext();
  
  // Data from BFF
  const {
    categories,
    hotProducts,
    topRated,
    newArrivals,
    loading,
  } = useMarketplaceData();

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<number | undefined>();
  const [priceMax, setPriceMax] = useState<number | undefined>();
  const [minRating, setMinRating] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('trending');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Modal state
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [guestCheckoutProduct, setGuestCheckoutProduct] = useState<Product | null>(null);
  
  // URL-based full view state
  const [urlProduct, setUrlProduct] = useState<{ id: string; type: 'ai' | 'seller' } | null>(null);
  const [urlProductLoading, setUrlProductLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Handle payment success from Stripe redirect
  useEffect(() => {
    const purchaseStatus = searchParams.get('purchase');
    const sessionId = searchParams.get('session_id');

    if (purchaseStatus === 'success' && sessionId && !verifyingPayment) {
      verifyGuestPurchase(sessionId);
    } else if (purchaseStatus === 'cancelled') {
      toast.error('Payment was cancelled');
      // Clear the URL params
      setSearchParams({});
    }
  }, [searchParams]);

  const verifyGuestPurchase = async (sessionId: string) => {
    setVerifyingPayment(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-guest-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ session_id: sessionId }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // If new user with session, auto sign in
        if (data.isNewUser && data.session) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
          toast.success('Account created! Check your email for your password.');
        } else {
          toast.success('Purchase complete! Check your email for order details.');
        }

        // Navigate to dashboard purchases
        navigate('/dashboard/marketplace?tab=purchases');
      } else if (data.alreadyProcessed) {
        toast.info('This order was already processed.');
        navigate('/dashboard/marketplace?tab=purchases');
      } else {
        toast.error(data.error || 'Failed to verify payment');
        setSearchParams({});
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment. Please contact support.');
      setSearchParams({});
    } finally {
      setVerifyingPayment(false);
    }
  };

  // Find product by slug when URL has productSlug
  useEffect(() => {
    if (!productSlug) {
      setUrlProduct(null);
      return;
    }

    const findProductBySlug = async () => {
      setUrlProductLoading(true);
      try {
        // Try seller_products first (by slug or name match)
        const { data: sellerProduct } = await supabase
          .from('seller_products')
          .select('id, name, slug')
          .or(`slug.eq.${productSlug}`)
          .eq('is_approved', true)
          .limit(1)
          .maybeSingle();

        if (sellerProduct) {
          setUrlProduct({ id: sellerProduct.id, type: 'seller' });
          setUrlProductLoading(false);
          return;
        }

        // Try matching by slugified name for seller products
        const { data: sellerProducts } = await supabase
          .from('seller_products')
          .select('id, name')
          .eq('is_approved', true);

        const matchedSeller = sellerProducts?.find(p => slugify(p.name) === productSlug);
        if (matchedSeller) {
          setUrlProduct({ id: matchedSeller.id, type: 'seller' });
          setUrlProductLoading(false);
          return;
        }

        // Try ai_accounts by slug
        const { data: aiAccount } = await supabase
          .from('ai_accounts')
          .select('id, name, slug')
          .or(`slug.eq.${productSlug}`)
          .eq('is_available', true)
          .limit(1)
          .maybeSingle();

        if (aiAccount) {
          setUrlProduct({ id: aiAccount.id, type: 'ai' });
          setUrlProductLoading(false);
          return;
        }

        // Try matching by slugified name for AI accounts
        const { data: aiAccounts } = await supabase
          .from('ai_accounts')
          .select('id, name')
          .eq('is_available', true);

        const matchedAI = aiAccounts?.find(p => slugify(p.name) === productSlug);
        if (matchedAI) {
          setUrlProduct({ id: matchedAI.id, type: 'ai' });
          setUrlProductLoading(false);
          return;
        }

        // No product found
        setUrlProduct(null);
        toast.error('Product not found');
        navigate('/marketplace');
      } catch (error) {
        console.error('Error finding product by slug:', error);
        setUrlProduct(null);
      } finally {
        setUrlProductLoading(false);
      }
    };

    findProductBySlug();
  }, [productSlug, navigate]);

  // Combine all products for grid display
  const allProducts = useMemo(() => {
    const products: Product[] = [
      ...hotProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        iconUrl: p.iconUrl,
        sellerName: p.sellerName,
        storeSlug: p.storeSlug,
        isVerified: p.isVerified,
        soldCount: p.soldCount,
        type: p.type,
      })),
      ...topRated.filter(p => !hotProducts.find(h => h.id === p.id)).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        iconUrl: p.iconUrl,
        sellerName: p.sellerName,
        storeSlug: p.storeSlug,
        isVerified: p.isVerified,
        soldCount: p.soldCount,
        type: p.type,
      })),
      ...newArrivals.filter(p => 
        !hotProducts.find(h => h.id === p.id) && 
        !topRated.find(t => t.id === p.id)
      ).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        iconUrl: p.iconUrl,
        sellerName: p.sellerName,
        storeSlug: p.storeSlug,
        isVerified: p.isVerified,
        soldCount: p.soldCount,
        type: p.type,
      })),
    ];
    return products;
  }, [hotProducts, topRated, newArrivals]);

  // Extract all available tags
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    ['AI', 'Productivity', 'Design', 'Marketing', 'Business', 'Education', 'Social Media', 'Video'].forEach(t => tagSet.add(t));
    return Array.from(tagSet);
  }, []);

  // Apply filters and search
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.sellerName?.toLowerCase().includes(query)
      );
    }

    // Price filter
    if (priceMin !== undefined) {
      result = result.filter(p => p.price >= priceMin);
    }
    if (priceMax !== undefined) {
      result = result.filter(p => p.price <= priceMax);
    }

    // Sort
    switch (sortOption) {
      case 'trending':
      case 'best_sellers':
        result.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
        break;
      case 'new':
        // Already sorted by newest from newArrivals
        break;
    }

    return result;
  }, [allProducts, searchQuery, priceMin, priceMax, sortOption]);

  // Featured products for carousel
  const featuredProducts = useMemo(() => {
    return hotProducts.slice(0, 8).map(p => ({
      id: p.id,
      name: p.name,
      description: null as string | null,
      price: p.price,
      iconUrl: p.iconUrl,
      sellerName: p.sellerName,
      storeSlug: p.storeSlug,
      isVerified: p.isVerified,
      soldCount: p.soldCount,
      type: p.type,
    }));
  }, [hotProducts]);

  // Handlers
  const handleSearch = useCallback(() => {
    // Search is already reactive via filteredProducts
  }, []);

  const handleProductClick = useCallback((product: Product) => {
    setQuickViewProduct(product);
  }, []);

  const handleBuy = useCallback(() => {
    if (!quickViewProduct) return;

    if (user) {
      if (quickViewProduct.storeSlug) {
        navigate(`/store/${quickViewProduct.storeSlug}`);
      } else {
        navigate('/dashboard');
      }
    } else {
      setGuestCheckoutProduct(quickViewProduct);
    }
    setQuickViewProduct(null);
  }, [quickViewProduct, user, navigate]);

  const handleChat = useCallback(() => {
    if (!quickViewProduct) return;

    if (user) {
      if (quickViewProduct.storeSlug) {
        navigate(`/store/${quickViewProduct.storeSlug}?chat=${quickViewProduct.id}`);
      }
    } else {
      toast.info('Please sign in to chat with sellers');
      navigate('/signin');
    }
    setQuickViewProduct(null);
  }, [quickViewProduct, user, navigate]);

  const handleViewFull = useCallback(() => {
    if (!quickViewProduct) return;

    // Navigate to URL-based product view
    const slug = slugify(quickViewProduct.name);
    navigate(`/marketplace/${slug}`);
    setQuickViewProduct(null);
  }, [quickViewProduct, navigate]);

  const handleFullViewBuy = useCallback(() => {
    if (!urlProduct) return;

    // Find the product data to open guest checkout or redirect
    const product = allProducts.find(p => p.id === urlProduct.id);
    if (product) {
      if (user) {
        if (product.storeSlug) {
          navigate(`/store/${product.storeSlug}`);
        } else {
          navigate('/dashboard');
        }
      } else {
        setGuestCheckoutProduct(product);
        navigate('/marketplace');
      }
    } else {
      navigate('/marketplace');
    }
  }, [urlProduct, allProducts, user, navigate]);

  const handleFullViewChat = useCallback(() => {
    if (!urlProduct) return;

    const product = allProducts.find(p => p.id === urlProduct.id);
    if (user) {
      if (product?.storeSlug) {
        navigate(`/store/${product.storeSlug}?chat=${product.id}`);
      }
    } else {
      toast.info('Please sign in to chat with sellers');
      navigate('/signin');
    }
  }, [urlProduct, allProducts, user, navigate]);

  // Guest checkout now handled by GuestPaymentModal component

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const handlePriceChange = useCallback((min?: number, max?: number) => {
    setPriceMin(min);
    setPriceMax(max);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedCategory('all');
    setSelectedTags([]);
    setPriceMin(undefined);
    setPriceMax(undefined);
    setMinRating(null);
    setSearchQuery('');
  }, []);

  // Show loading state while finding product by URL slug
  if (urlProductLoading) {
    return (
      <CurrencyProvider>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-pulse text-black/50">Loading product...</div>
        </div>
      </CurrencyProvider>
    );
  }

  // If URL has productSlug and we found the product, show full view
  if (productSlug && urlProduct) {
    return (
      <CurrencyProvider>
        <MarketplaceProductFullView
          productId={urlProduct.id}
          productType={urlProduct.type}
          onBack={() => navigate('/marketplace')}
          onBuy={handleFullViewBuy}
          onChat={handleFullViewChat}
          isAuthenticated={!!user}
        />
      </CurrencyProvider>
    );
  }

  return (
    <CurrencyProvider>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <GumroadHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearch={handleSearch}
        />

      {/* Category Pills - Gumroad style: outlined active, plain text inactive */}
      <div className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-screen-2xl px-4 lg:px-6">
          <div className="flex items-center gap-1 py-2.5 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'border border-black text-black'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'border border-black text-black'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-screen-2xl px-4 lg:px-6 py-6">
        {/* Featured Carousel - Banner style */}
        {featuredProducts.length > 0 && !searchQuery && selectedCategory === 'all' && (
          <FeaturedCarousel
            products={featuredProducts}
            onProductClick={handleProductClick}
            title="Featured products"
          />
        )}

        {/* Section Header with Sort Tabs - Bordered Container */}
        <div className="border border-black/10 rounded-xl p-4 bg-white mt-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-black">
              {searchQuery ? `Results for "${searchQuery}"` : 'Curated for you'}
            </h2>

            {/* Sort Tabs - Bordered pills */}
            <div className="flex items-center gap-1">
              {[
                { value: 'trending' as SortOption, label: 'Trending' },
                { value: 'best_sellers' as SortOption, label: 'Best Sellers' },
                { value: 'new' as SortOption, label: 'Hot & New' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSortOption(value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    sortOption === value
                      ? 'bg-black text-white'
                      : 'text-black/50 hover:text-black border border-black/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content with Sidebar */}
        <div className="flex gap-8">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden fixed bottom-6 right-6 z-40 p-3 bg-black text-white rounded-full shadow-lg"
          >
            <Filter className="w-5 h-5" />
          </button>

          {/* Mobile Filter Overlay */}
          {showMobileFilters && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50">
              <div className="absolute right-0 top-0 bottom-0 w-72 bg-white p-5 overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-bold text-black">Filters</h3>
                  <button onClick={() => setShowMobileFilters(false)}>
                    <X className="w-5 h-5 text-black" />
                  </button>
                </div>
                <GumroadFilterSidebar
                  categories={categories.map(c => ({ id: c.id, name: c.name, productCount: c.productCount }))}
                  selectedCategory={selectedCategory}
                  onCategoryChange={(id) => { setSelectedCategory(id); setShowMobileFilters(false); }}
                  selectedTags={selectedTags}
                  onTagToggle={handleTagToggle}
                  availableTags={availableTags}
                  priceMin={priceMin}
                  priceMax={priceMax}
                  onPriceChange={handlePriceChange}
                  minRating={minRating}
                  onRatingChange={setMinRating}
                  onClearFilters={handleClearFilters}
                />
              </div>
            </div>
          )}

          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <GumroadFilterSidebar
              categories={categories.map(c => ({ id: c.id, name: c.name, productCount: c.productCount }))}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
              availableTags={availableTags}
              priceMin={priceMin}
              priceMax={priceMax}
              onPriceChange={handlePriceChange}
              minRating={minRating}
              onRatingChange={setMinRating}
              onClearFilters={handleClearFilters}
            />
          </div>

          {/* Product Grid - Gumroad style minimal cards */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg overflow-hidden">
                    <Skeleton className="aspect-square" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-base text-black/50">No products found</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-3 text-sm font-medium text-black/70 hover:text-black"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map((product) => (
                  <GumroadProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    iconUrl={product.iconUrl}
                    sellerName={product.sellerName}
                    sellerAvatar={product.sellerAvatar}
                    storeSlug={product.storeSlug}
                    isVerified={product.isVerified}
                    soldCount={product.soldCount}
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                    type={product.type}
                    description={product.description}
                    tags={product.tags}
                    onClick={() => handleProductClick(product)}
                    onBuy={() => {
                      if (user) {
                        if (product.storeSlug) {
                          navigate(`/store/${product.storeSlug}`);
                        } else {
                          navigate('/dashboard');
                        }
                      } else {
                        setGuestCheckoutProduct(product);
                      }
                    }}
                    onChat={() => {
                      if (user) {
                        if (product.storeSlug) {
                          navigate(`/store/${product.storeSlug}?chat=${product.id}`);
                        }
                      } else {
                        toast.info('Please sign in to chat with sellers');
                        navigate('/signin');
                      }
                    }}
                    onViewFull={() => {
                      const slug = slugify(product.name);
                      navigate(`/marketplace/${slug}`);
                    }}
                    isAuthenticated={!!user}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Quick View Modal */}
      <GumroadQuickViewModal
        open={!!quickViewProduct}
        onOpenChange={(open) => !open && setQuickViewProduct(null)}
        product={quickViewProduct}
        onBuy={handleBuy}
        onChat={handleChat}
        onViewFull={handleViewFull}
        isAuthenticated={!!user}
      />

      {/* Guest Payment Modal */}
      <GuestPaymentModal
        open={!!guestCheckoutProduct}
        onOpenChange={(open) => !open && setGuestCheckoutProduct(null)}
        product={guestCheckoutProduct ? {
          id: guestCheckoutProduct.id,
          name: guestCheckoutProduct.name,
          price: guestCheckoutProduct.price,
          iconUrl: guestCheckoutProduct.iconUrl,
          sellerName: guestCheckoutProduct.sellerName,
          type: guestCheckoutProduct.type,
        } : null}
      />
      </div>
    </CurrencyProvider>
  );
};

export default Marketplace;
