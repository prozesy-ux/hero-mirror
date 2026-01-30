import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Star, 
  Heart, 
  MessageCircle,
  ShoppingCart,
  Info,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Twitter,
  Facebook,
  Link as LinkIcon,
  Package,
  ChevronDown,
  Copy,
  Filter,
  ThumbsUp,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import GumroadHeader from './GumroadHeader';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';

interface ProductFullViewProps {
  productId: string;
  productType: 'ai' | 'seller';
  onBack: () => void;
  onBuy: () => void;
  onChat: () => void;
  isAuthenticated: boolean;
}

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice?: number | null;
  iconUrl: string | null;
  images: string[];
  sellerName: string | null;
  sellerAvatar: string | null;
  storeSlug: string | null;
  isVerified: boolean;
  soldCount: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  features: string[];
  slug: string | null;
}

interface Review {
  id: string;
  buyerName: string;
  buyerAvatar: string | null;
  rating: number;
  content: string;
  title: string | null;
  createdAt: string;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  sellerResponse: string | null;
  sellerResponseAt: string | null;
}

// Category data for pills
const categories = [
  { id: 'all', name: 'All' },
  { id: 'drawing', name: 'Drawing & Painting' },
  { id: '3d', name: '3D' },
  { id: 'design', name: 'Design' },
  { id: 'music', name: 'Music & Sound' },
  { id: 'software', name: 'Software' },
  { id: 'gaming', name: 'Gaming' },
  { id: 'education', name: 'Education' },
  { id: 'business', name: 'Business' },
];

const MarketplaceProductFullView = ({
  productId,
  productType,
  onBack,
  onBuy,
  onChat,
  isAuthenticated,
}: ProductFullViewProps) => {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [buying, setBuying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'helpful'>('recent');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [helpfulClicked, setHelpfulClicked] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        if (productType === 'ai') {
          // Fetch AI account
          const { data: aiAccount, error } = await supabase
            .from('ai_accounts')
            .select('*')
            .eq('id', productId)
            .single();

          if (error) throw error;

          setProduct({
            id: aiAccount.id,
            name: aiAccount.name,
            description: aiAccount.description,
            price: aiAccount.price,
            originalPrice: aiAccount.original_price,
            iconUrl: aiAccount.icon_url,
            images: aiAccount.icon_url ? [aiAccount.icon_url] : [],
            sellerName: 'Uptoza',
            sellerAvatar: null,
            storeSlug: null,
            isVerified: true,
            soldCount: aiAccount.sold_count || 0,
            rating: 4.8,
            reviewCount: 0,
            tags: aiAccount.tags || [],
            features: ['Instant delivery', 'Premium quality', '24/7 support'],
            slug: aiAccount.slug || null,
          });
        } else {
          // Fetch seller product with separate queries to avoid type issues
          const { data: sellerProduct, error: productError } = await supabase
            .from('seller_products')
            .select('*')
            .eq('id', productId)
            .single();

          if (productError) throw productError;

          // Fetch seller profile separately
          const { data: sellerProfile } = await supabase
            .from('seller_profiles')
            .select('id, store_name, store_slug, store_logo_url, is_verified')
            .eq('id', sellerProduct.seller_id)
            .single();

          // Get review stats
          const { data: reviewStats } = await supabase
            .from('product_reviews')
            .select('rating')
            .eq('product_id', productId);

          const avgRating = reviewStats && reviewStats.length > 0
            ? reviewStats.reduce((sum, r) => sum + r.rating, 0) / reviewStats.length
            : 0;

          // Combine images
          const productImages: string[] = [];
          if (sellerProduct.icon_url) productImages.push(sellerProduct.icon_url);
          if (sellerProduct.images) productImages.push(...sellerProduct.images);

          setProduct({
            id: sellerProduct.id,
            name: sellerProduct.name,
            description: sellerProduct.description,
            price: sellerProduct.price,
            originalPrice: null,
            iconUrl: sellerProduct.icon_url,
            images: productImages,
            sellerName: sellerProfile?.store_name || 'Seller',
            sellerAvatar: sellerProfile?.store_logo_url || null,
            storeSlug: sellerProfile?.store_slug || null,
            isVerified: sellerProfile?.is_verified || false,
            soldCount: sellerProduct.sold_count || 0,
            rating: avgRating,
            reviewCount: reviewStats?.length || 0,
            tags: sellerProduct.tags || [],
            features: ['Digital product', 'Instant delivery'],
            slug: sellerProduct.slug || null,
          });

          // Fetch reviews with additional fields
          const { data: reviewData } = await supabase
            .from('product_reviews')
            .select(`
              id,
              rating,
              content,
              title,
              created_at,
              is_verified_purchase,
              helpful_count,
              seller_response,
              seller_responded_at,
              buyer_id
            `)
            .eq('product_id', productId)
            .order('created_at', { ascending: false })
            .limit(20);

          if (reviewData) {
            // Get buyer profiles
            const buyerIds = reviewData.map(r => r.buyer_id);
            const { data: profiles } = await supabase
              .from('profiles')
              .select('user_id, full_name, avatar_url')
              .in('user_id', buyerIds);

            const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

            setReviews(reviewData.map(r => ({
              id: r.id,
              buyerName: profileMap.get(r.buyer_id)?.full_name || 'Anonymous',
              buyerAvatar: profileMap.get(r.buyer_id)?.avatar_url || null,
              rating: r.rating,
              content: r.content || '',
              title: r.title || null,
              createdAt: r.created_at || '',
              isVerifiedPurchase: r.is_verified_purchase || false,
              helpfulCount: r.helpful_count || 0,
              sellerResponse: r.seller_response || null,
              sellerResponseAt: r.seller_responded_at || null,
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [productId, productType]);

  const handlePrevImage = () => {
    if (product) {
      setCurrentImageIndex(prev => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (product) {
      setCurrentImageIndex(prev => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to add to wishlist');
      return;
    }
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const handleShare = (platform: 'twitter' | 'facebook' | 'copy') => {
    const url = window.location.href;
    const text = product ? `Check out ${product.name} on Uptoza!` : 'Check out this product on Uptoza!';

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
        break;
    }
  };

  const handleBuyClick = () => {
    setBuying(true);
    onBuy();
    setTimeout(() => setBuying(false), 1000);
  };

  const handleSearch = () => {
    onBack();
  };

  const handleCopyProductUrl = () => {
    if (product?.slug) {
      const url = `${window.location.origin}/product/${product.slug}`;
      navigator.clipboard.writeText(url);
      toast.success('Product link copied!');
    }
  };

  const handleHelpful = async (reviewId: string) => {
    if (helpfulClicked.has(reviewId)) return;
    
    setHelpfulClicked(prev => new Set([...prev, reviewId]));
    
    try {
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;

      await supabase
        .from('product_reviews')
        .update({ helpful_count: (review.helpfulCount || 0) + 1 })
        .eq('id', reviewId);
    } catch (error) {
      console.error('Error updating helpful count:', error);
    }
  };

  // Rating breakdown calculation
  const ratingBreakdown = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter(r => filterRating === null || r.rating === filterRating)
    .sort((a, b) => {
      if (sortBy === 'helpful') {
        return (b.helpfulCount || 0) - (a.helpfulCount || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F4F0] flex items-center justify-center">
        <div className="animate-pulse text-black/50">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F4F4F0] flex flex-col items-center justify-center gap-4">
        <p className="text-black/50">Product not found</p>
        <Button onClick={onBack} variant="outline" className="rounded-full">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F0]">
      {/* Full Header with Search */}
      <GumroadHeader 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
      />

      {/* Category Pills */}
      <div className="bg-white border-b border-black/5">
        <div className="mx-auto max-w-screen-2xl px-4 lg:px-6">
          <div className="flex items-center gap-1 py-2 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={onBack}
                className="px-4 py-1.5 text-sm font-medium text-black/70 hover:text-black whitespace-nowrap transition-colors rounded-full hover:bg-black/5"
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-screen-xl px-4 lg:px-6 py-6">
        {/* Back Link - Subtle */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-black/50 hover:text-black mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Marketplace
        </button>

        {/* Image Carousel - Full Width */}
        <div className="relative bg-white rounded-2xl overflow-hidden mb-6 border border-black/20">
          <AspectRatio ratio={16 / 9}>
            {product.images.length > 0 ? (
              <img
                src={product.images[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-contain bg-gray-50"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black/5">
                <Package className="w-24 h-24 text-black/20" />
              </div>
            )}
          </AspectRatio>

          {/* Navigation Arrows */}
          {product.images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white border border-black/20 rounded-full shadow-md hover:bg-black hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white border border-black/20 rounded-full shadow-md hover:bg-black hover:text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Dot Indicators */}
          {product.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {product.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors border border-black/20 ${
                    i === currentImageIndex ? 'bg-black' : 'bg-white'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Product Info */}
          <div className="flex-1 lg:w-[60%] space-y-6">
            
            {/* Title/Price/Seller Section - Bordered Container */}
            <div className="bg-white rounded-2xl border border-black/20 p-6">
              {/* Title */}
              <h1 className="text-2xl lg:text-3xl font-bold text-black mb-4">
                {product.name}
              </h1>

              {/* Price Badge - Black Style */}
              <div className="inline-flex items-center px-4 py-2 bg-black text-white text-xl font-bold rounded mb-4">
                ${product.price}
              </div>

              {/* Seller Info */}
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-black/10">
                <Avatar className="h-10 w-10 border-2 border-black/20">
                  {product.sellerAvatar ? (
                    <AvatarImage src={product.sellerAvatar} alt={product.sellerName || ''} />
                  ) : null}
                  <AvatarFallback className="bg-black/10 text-black text-sm font-bold">
                    {product.sellerName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-black">
                    {product.sellerName || 'Uptoza'}
                  </span>
                  {product.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-black rounded-full text-xs font-medium text-black">
                      <BadgeCheck className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>
              </div>

              {/* Rating Summary */}
              {product.reviewCount > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i <= Math.round(product.rating)
                            ? 'fill-black text-black'
                            : 'text-black/20'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-black">
                    {product.rating.toFixed(1)}
                  </span>
                  <span className="text-sm text-black/50">
                    ({product.reviewCount} ratings)
                  </span>
                </div>
              )}

              {/* Product URL Display */}
              {product.slug && (
                <div className="flex items-center gap-2 bg-black/5 border border-black/20 rounded-xl p-3">
                  <LinkIcon className="w-4 h-4 text-black/50 flex-shrink-0" />
                  <span className="text-sm text-black/70 flex-1 truncate font-mono">
                    uptoza.com/product/{product.slug}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyProductUrl}
                    className="h-7 px-2 text-black/60 hover:text-black hover:bg-black/10"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    Copy
                  </Button>
                </div>
              )}
            </div>

            {/* Description Section - Bordered Container */}
            <div className="bg-white rounded-2xl border border-black/20 p-6">
              <h3 className="text-lg font-bold text-black pb-3 mb-4 border-b border-black/20">
                Description
              </h3>
              <p className="text-black/70 whitespace-pre-line leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {product.description || 'No description available.'}
              </p>

              {/* Tags inside description */}
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-black/10">
                  {product.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-black/5 text-black/70 text-sm rounded-full border border-black/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Ratings & Reviews Section - Enhanced */}
            <div className="bg-white rounded-2xl border border-black/20 p-6">
              <h3 className="text-lg font-bold text-black pb-3 mb-4 border-b border-black/20">
                Ratings & Reviews
              </h3>

              {/* Rating Breakdown */}
              <div className="flex items-start gap-8 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-black">
                    {product.rating.toFixed(1)}
                  </div>
                  <div className="flex items-center gap-0.5 mt-1 justify-center">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i <= Math.round(product.rating)
                            ? 'fill-black text-black'
                            : 'text-black/20'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-black/50 mt-1">
                    {product.reviewCount} ratings
                  </div>
                </div>

                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map(stars => {
                    const count = ratingBreakdown[stars as keyof typeof ratingBreakdown];
                    const percentage = product.reviewCount > 0 
                      ? (count / product.reviewCount) * 100 
                      : 0;
                    return (
                      <button
                        key={stars}
                        onClick={() => setFilterRating(filterRating === stars ? null : stars)}
                        className={`w-full flex items-center gap-2 p-1 rounded-lg transition-colors ${
                          filterRating === stars ? 'bg-black/10' : 'hover:bg-black/5'
                        }`}
                      >
                        <span className="text-xs text-black/50 w-12">{stars} stars</span>
                        <div className="flex-1 h-2 bg-black/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-black rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-black/50 w-8">
                          {percentage.toFixed(0)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-black/20 mb-4">
                <div className="flex items-center gap-2">
                  {/* Write Review Button */}
                  {isAuthenticated && (
                    <Button
                      onClick={() => toast.info('Review form coming soon!')}
                      className="bg-black hover:bg-black/90 text-white rounded-lg text-sm h-9"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                      Write a Review
                    </Button>
                  )}
                  
                  {/* Active Filter */}
                  {filterRating && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilterRating(null)}
                      className="rounded-lg text-xs border-black/20"
                    >
                      {filterRating} Stars × Clear
                    </Button>
                  )}
                </div>

                {/* Sort Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-lg text-xs border-black/20">
                      <Filter className="w-3.5 h-3.5 mr-1.5" />
                      {sortBy === 'recent' ? 'Most Recent' : 'Most Helpful'}
                      <ChevronDown className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => setSortBy('recent')} className="rounded-lg">
                      Most Recent
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('helpful')} className="rounded-lg">
                      Most Helpful
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Reviews List */}
              {filteredReviews.length > 0 ? (
                <div className="space-y-4">
                  {filteredReviews.map(review => (
                    <div key={review.id} className="border-t border-black/10 pt-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-9 w-9 border border-black/20">
                          {review.buyerAvatar ? (
                            <AvatarImage src={review.buyerAvatar} alt={review.buyerName} />
                          ) : null}
                          <AvatarFallback className="bg-black/5 text-black text-xs font-semibold">
                            {review.buyerName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-black">
                              {review.buyerName}
                            </span>
                            {review.isVerifiedPurchase && (
                              <span className="text-xs text-black bg-black/5 border border-black/20 px-1.5 py-0.5 rounded">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map(i => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i <= review.rating
                                      ? 'fill-black text-black'
                                      : 'text-black/20'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-black/40">
                              {review.createdAt ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }) : ''}
                            </span>
                          </div>
                          
                          {review.title && (
                            <h4 className="font-semibold text-sm text-black mt-2">{review.title}</h4>
                          )}
                          <p className="text-sm text-black/70 mt-1 leading-relaxed">
                            {review.content}
                          </p>

                          {/* Helpful Button */}
                          <div className="flex items-center gap-4 mt-3">
                            <button
                              onClick={() => handleHelpful(review.id)}
                              disabled={helpfulClicked.has(review.id)}
                              className={`text-xs flex items-center gap-1 transition-colors ${
                                helpfulClicked.has(review.id) 
                                  ? 'text-black' 
                                  : 'text-black/50 hover:text-black'
                              }`}
                            >
                              <ThumbsUp className={`w-3.5 h-3.5 ${helpfulClicked.has(review.id) ? 'fill-black' : ''}`} />
                              Helpful ({review.helpfulCount + (helpfulClicked.has(review.id) ? 1 : 0)})
                            </button>
                          </div>

                          {/* Seller Response */}
                          {review.sellerResponse && (
                            <div className="mt-3 p-3 bg-black/5 rounded-lg border border-black/10">
                              <p className="text-xs text-black/50 mb-1 font-medium">Seller Response</p>
                              <p className="text-sm text-black/70">{review.sellerResponse}</p>
                              {review.sellerResponseAt && (
                                <p className="text-xs text-black/40 mt-1">
                                  {formatDistanceToNow(new Date(review.sellerResponseAt), { addSuffix: true })}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-black/5 rounded-xl">
                  <Star className="w-10 h-10 text-black/20 mx-auto mb-2" />
                  <p className="text-black/50 font-medium">No reviews yet</p>
                  <p className="text-sm text-black/40">Be the first to review this product</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Purchase Box */}
          <div className="lg:w-[40%]">
            <div className="lg:sticky lg:top-20 bg-white rounded-2xl p-6 border border-black/20">
              {/* Price - Black Badge */}
              <div className="mb-4">
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-black/50 line-through mr-2">
                    ${product.originalPrice}
                  </span>
                )}
                <div className="inline-flex items-center px-4 py-2 bg-black text-white text-xl font-bold rounded">
                  ${product.price}
                </div>
              </div>

              {/* Add to Cart Button - Black */}
              <Button
                onClick={handleBuyClick}
                disabled={buying}
                className="w-full h-12 bg-black hover:bg-black/90 text-white font-semibold rounded-lg text-base mb-4"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {buying ? 'Processing...' : 'Add to cart'}
              </Button>

              {/* Chat Button - Outlined Black */}
              {product.storeSlug && (
                <Button
                  onClick={onChat}
                  variant="outline"
                  className="w-full h-10 rounded-lg border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors mb-4"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {isAuthenticated ? 'Chat with Seller' : 'Login to Chat'}
                </Button>
              )}

              {/* Sales Count with Info Icon */}
              <div className="flex items-center gap-2 text-sm text-black/60 mb-4 pb-4 border-b border-black/20">
                <Info className="w-4 h-4 text-black/40" />
                <span>{product.soldCount.toLocaleString()} sales</span>
              </div>

              {/* Features Box */}
              {product.features.length > 0 && (
                <div className="mb-4 pb-4 border-b border-black/20">
                  <p className="text-sm text-black/70 mb-3">
                    {product.features.join(', ')}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-black/50">Size</span>
                    <span className="text-black font-medium">Digital Download</span>
                  </div>
                </div>
              )}

              {/* Wishlist with Dropdown */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={handleWishlist}
                  className="flex items-center gap-2 text-sm text-black/60 hover:text-black py-2 transition-colors"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-black text-black' : ''}`} />
                  {isWishlisted ? 'Added to wishlist' : 'Add to wishlist'}
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* Share Icons */}
              <div className="flex items-center gap-3 pt-3 border-t border-black/20">
                <span className="text-sm text-black/50">Share:</span>
                <button
                  onClick={() => handleShare('twitter')}
                  className="p-2 text-black/40 hover:text-black transition-colors"
                  title="Share on Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="p-2 text-black/40 hover:text-black transition-colors"
                  title="Share on Facebook"
                >
                  <Facebook className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="p-2 text-black/40 hover:text-black transition-colors"
                  title="Copy link"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceProductFullView;
