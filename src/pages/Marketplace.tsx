import { useState, useMemo, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Sparkles, Clock, Filter, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';
import GumroadHeader from '@/components/marketplace/GumroadHeader';
import GumroadProductCard from '@/components/marketplace/GumroadProductCard';
import FeaturedCarousel from '@/components/marketplace/FeaturedCarousel';
import GumroadFilterSidebar from '@/components/marketplace/GumroadFilterSidebar';
import GumroadQuickViewModal from '@/components/marketplace/GumroadQuickViewModal';
import GuestCheckoutModal from '@/components/marketplace/GuestCheckoutModal';
import { Skeleton } from '@/components/ui/skeleton';

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
  type: 'ai' | 'seller';
  tags?: string[];
  categoryId?: string | null;
}

type SortOption = 'curated' | 'trending' | 'best_sellers' | 'new';

const Marketplace = () => {
  const navigate = useNavigate();
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
  const [sortOption, setSortOption] = useState<SortOption>('curated');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Modal state
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [guestCheckoutProduct, setGuestCheckoutProduct] = useState<Product | null>(null);

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
    // Tags from data would go here - for now return common ones
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

    // Category filter
    if (selectedCategory !== 'all') {
      // Would need categoryId in data - for now skip
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
      case 'curated':
      default:
        // Default order
        break;
    }

    return result;
  }, [allProducts, searchQuery, selectedCategory, priceMin, priceMax, sortOption]);

  // Featured products for carousel
  const featuredProducts = useMemo(() => {
    return hotProducts.slice(0, 8).map(p => ({
      id: p.id,
      name: p.name,
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
      // Logged in - redirect to store page for wallet-based checkout
      if (quickViewProduct.storeSlug) {
        navigate(`/store/${quickViewProduct.storeSlug}`);
      } else {
        // AI account - go to dashboard
        navigate('/dashboard');
      }
    } else {
      // Guest checkout
      setGuestCheckoutProduct(quickViewProduct);
    }
    setQuickViewProduct(null);
  }, [quickViewProduct, user, navigate]);

  const handleChat = useCallback(() => {
    if (!quickViewProduct) return;

    if (user) {
      // Logged in - navigate to store with chat
      if (quickViewProduct.storeSlug) {
        navigate(`/store/${quickViewProduct.storeSlug}?chat=${quickViewProduct.id}`);
      }
    } else {
      // Prompt to sign in
      toast.info('Please sign in to chat with sellers');
      navigate('/signin');
    }
    setQuickViewProduct(null);
  }, [quickViewProduct, user, navigate]);

  const handleViewFull = useCallback(() => {
    if (!quickViewProduct) return;

    if (quickViewProduct.storeSlug) {
      navigate(`/store/${quickViewProduct.storeSlug}/product/${quickViewProduct.id}`);
    }
    setQuickViewProduct(null);
  }, [quickViewProduct, navigate]);

  const handleGuestCheckout = useCallback(async (email: string) => {
    if (!guestCheckoutProduct) return;

    // For guest checkout, we'll use Stripe directly
    // Create a Stripe checkout session
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-guest-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            productId: guestCheckoutProduct.id,
            productName: guestCheckoutProduct.name,
            price: guestCheckoutProduct.price,
            guestEmail: email,
            productType: guestCheckoutProduct.type,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe
      window.location.href = url;
    } catch (error) {
      console.error('Guest checkout error:', error);
      toast.error('Unable to process checkout. Please try signing in.');
      navigate('/signin');
    }

    setGuestCheckoutProduct(null);
  }, [guestCheckoutProduct, navigate]);

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

  return (
    <div className="min-h-screen bg-[#F4F4F0]">
      {/* Header */}
      <GumroadHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
      />

      {/* Category Pills */}
      <div className="border-b border-black/10 bg-[#F4F4F0]">
        <div className="mx-auto max-w-screen-2xl px-4">
          <div className="flex items-center gap-2 py-3 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-black text-white'
                  : 'bg-white text-black/70 border border-black/10 hover:border-black/30'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-black text-white'
                    : 'bg-white text-black/70 border border-black/10 hover:border-black/30'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-screen-2xl px-4 py-8">
        {/* Featured Carousel */}
        {featuredProducts.length > 0 && !searchQuery && selectedCategory === 'all' && (
          <FeaturedCarousel
            products={featuredProducts}
            onProductClick={handleProductClick}
            title="Featured products"
          />
        )}

        {/* Curated Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 mt-8">
          <h2 className="text-2xl font-bold text-black">
            {searchQuery ? `Results for "${searchQuery}"` : 'Curated for you'}
          </h2>

          {/* Sort Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            {[
              { value: 'curated' as SortOption, label: 'Curated', icon: Sparkles },
              { value: 'trending' as SortOption, label: 'Trending', icon: TrendingUp },
              { value: 'best_sellers' as SortOption, label: 'Best Sellers', icon: TrendingUp },
              { value: 'new' as SortOption, label: 'Hot & New', icon: Clock },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setSortOption(value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  sortOption === value
                    ? 'bg-black text-white'
                    : 'text-black/60 hover:text-black'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content with Sidebar */}
        <div className="flex gap-8">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="lg:hidden fixed bottom-6 right-6 z-40 p-4 bg-black text-white rounded-full shadow-lg"
          >
            <Filter className="w-5 h-5" />
          </button>

          {/* Mobile Filter Overlay */}
          {showMobileFilters && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50">
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#F4F4F0] p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-black">Filters</h3>
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

          {/* Product Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden">
                    <Skeleton className="aspect-[16/10]" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg text-black/50">No products found</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-4 text-sm font-medium text-pink-500 hover:text-pink-600"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <GumroadProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    iconUrl={product.iconUrl}
                    sellerName={product.sellerName}
                    storeSlug={product.storeSlug}
                    isVerified={product.isVerified}
                    soldCount={product.soldCount}
                    type={product.type}
                    onClick={() => handleProductClick(product)}
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

      {/* Guest Checkout Modal */}
      <GuestCheckoutModal
        open={!!guestCheckoutProduct}
        onOpenChange={(open) => !open && setGuestCheckoutProduct(null)}
        product={guestCheckoutProduct ? {
          id: guestCheckoutProduct.id,
          name: guestCheckoutProduct.name,
          price: guestCheckoutProduct.price,
          iconUrl: guestCheckoutProduct.iconUrl,
          sellerId: '', // Not needed for display
          sellerName: guestCheckoutProduct.sellerName,
        } : null}
        onCheckout={handleGuestCheckout}
      />
    </div>
  );
};

export default Marketplace;
