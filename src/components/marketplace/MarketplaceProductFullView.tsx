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
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

interface Review {
  id: string;
  buyerName: string;
  buyerAvatar: string | null;
  rating: number;
  content: string;
  createdAt: string;
  isVerifiedPurchase: boolean;
}

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
          });

          // Fetch reviews
          const { data: reviewData } = await supabase
            .from('product_reviews')
            .select(`
              id,
              rating,
              content,
              created_at,
              is_verified_purchase,
              buyer_id
            `)
            .eq('product_id', productId)
            .order('created_at', { ascending: false })
            .limit(10);

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
              createdAt: r.created_at || '',
              isVerifiedPurchase: r.is_verified_purchase || false,
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

  // Rating breakdown calculation
  const ratingBreakdown = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

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
      {/* Back Button Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-black/5">
        <div className="mx-auto max-w-screen-xl px-4 lg:px-6 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium text-black/70 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-screen-xl px-4 lg:px-6 py-6">
        {/* Image Carousel - Full Width */}
        <div className="relative bg-white rounded-2xl overflow-hidden mb-6">
          <AspectRatio ratio={16 / 9}>
            {product.images.length > 0 ? (
              <img
                src={product.images[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-contain bg-gray-50"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Package className="w-24 h-24 text-gray-300" />
              </div>
            )}
          </AspectRatio>

          {/* Navigation Arrows */}
          {product.images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-black" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-black" />
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
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentImageIndex ? 'bg-black' : 'bg-black/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Product Info */}
          <div className="flex-1 lg:w-[60%]">
            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-black mb-4">
              {product.name}
            </h1>

            {/* Seller Info */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10 border border-black/10">
                {product.sellerAvatar ? (
                  <AvatarImage src={product.sellerAvatar} alt={product.sellerName || ''} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-400 text-white text-sm font-bold">
                  {product.sellerName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <span className="font-medium text-black">
                  {product.sellerName || 'Uptoza'}
                </span>
                {product.isVerified && (
                  <BadgeCheck className="w-4 h-4 text-pink-500" />
                )}
              </div>
            </div>

            {/* Rating Summary */}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i <= Math.round(product.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
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

            {/* Description */}
            <div className="prose prose-sm max-w-none mb-8">
              <p className="text-black/70 whitespace-pre-line leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                {product.description || 'No description available.'}
              </p>
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {product.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-black/5 text-black/70 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Ratings & Reviews Section */}
            {(product.reviewCount > 0 || reviews.length > 0) && (
              <div className="bg-white rounded-2xl p-6 mt-6">
                <h3 className="text-lg font-bold text-black mb-4">
                  Ratings & Reviews
                </h3>

                {/* Rating Breakdown */}
                <div className="flex items-start gap-8 mb-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-black">
                      {product.rating.toFixed(1)}
                    </div>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i <= Math.round(product.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
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
                        <div key={stars} className="flex items-center gap-2">
                          <span className="text-xs text-black/50 w-12">{stars} stars</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-black/50 w-8">
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="border-t border-black/5 pt-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          {review.buyerAvatar ? (
                            <AvatarImage src={review.buyerAvatar} alt={review.buyerName} />
                          ) : null}
                          <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                            {review.buyerName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-black">
                              {review.buyerName}
                            </span>
                            {review.isVerifiedPurchase && (
                              <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i <= review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-black/70 mt-2">
                            {review.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Purchase Box */}
          <div className="lg:w-[40%]">
            <div className="lg:sticky lg:top-20 bg-white rounded-2xl p-6 border border-black/5">
              {/* Price */}
              <div className="mb-4">
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-sm text-black/50 line-through mr-2">
                    ${product.originalPrice}
                  </span>
                )}
                <span className="text-3xl font-bold text-black">
                  ${product.price}
                </span>
              </div>

              {/* Add to Cart Button */}
              <Button
                onClick={handleBuyClick}
                disabled={buying}
                className="w-full h-12 bg-pink-400 hover:bg-pink-500 text-black font-semibold rounded-lg text-base mb-4"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {buying ? 'Processing...' : 'Add to cart'}
              </Button>

              {/* Chat Button */}
              {product.storeSlug && (
                <Button
                  onClick={onChat}
                  variant="outline"
                  className="w-full h-10 rounded-lg border-black/20 text-black mb-4"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {isAuthenticated ? 'Chat with Seller' : 'Login to Chat'}
                </Button>
              )}

              {/* Sales Count */}
              <div className="flex items-center gap-2 text-sm text-black/60 mb-4 pb-4 border-b border-black/10">
                <Info className="w-4 h-4" />
                <span>{product.soldCount.toLocaleString()} sales</span>
              </div>

              {/* Features */}
              {product.features.length > 0 && (
                <div className="mb-4 pb-4 border-b border-black/10">
                  <h4 className="text-sm font-medium text-black mb-2">Includes:</h4>
                  <ul className="space-y-1">
                    {product.features.map((feature, i) => (
                      <li key={i} className="text-sm text-black/60 flex items-start gap-2">
                        <span className="text-black/30">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Wishlist */}
              <button
                onClick={handleWishlist}
                className="flex items-center gap-2 text-sm text-black/60 hover:text-black w-full py-2 transition-colors"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-pink-500 text-pink-500' : ''}`} />
                {isWishlisted ? 'Added to wishlist' : 'Add to wishlist'}
              </button>

              {/* Share */}
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-black/10">
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
