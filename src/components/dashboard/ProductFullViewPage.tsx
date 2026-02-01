import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Star, 
  Users, 
  MessageCircle, 
  Loader2, 
  ShieldCheck, 
  Zap, 
  Clock,
  Heart,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Twitter,
  Facebook,
  Link as LinkIcon,
  Info,
  BadgeCheck,
  ShoppingCart,
  Filter,
  ThumbsUp,
  Edit3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFloatingChat } from '@/contexts/FloatingChatContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import ReviewForm from '@/components/reviews/ReviewForm';
import StarRating from '@/components/reviews/StarRating';
import { useIsMobile } from '@/hooks/use-mobile';

interface SellerProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  images: string[] | null;
  category_id: string | null;
  is_available: boolean;
  tags: string[] | null;
  stock: number | null;
  sold_count: number | null;
  seller_id: string;
  chat_allowed: boolean | null;
  requires_email: boolean | null;
  seller_profiles: {
    id: string;
    store_name: string;
    store_logo_url: string | null;
    is_verified: boolean;
    total_orders?: number;
  } | null;
}

interface AIAccount {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  category: string | null;
  category_id: string | null;
  is_available: boolean;
  is_trending: boolean;
  original_price: number | null;
  tags: string[] | null;
  stock: number | null;
  chat_allowed?: boolean | null;
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

const ProductFullViewPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { openChat } = useFloatingChat();
  const isMobile = useIsMobile();

  const [product, setProduct] = useState<SellerProduct | AIAccount | null>(null);
  const [isSellerProduct, setIsSellerProduct] = useState(false);
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful'>('recent');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [helpfulClicked, setHelpfulClicked] = useState<Set<string>>(new Set());
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  const fetchProduct = async () => {
    if (!productId) return;
    setLoading(true);

    // Try seller products first
    const { data: sellerProduct, error: sellerError } = await supabase
      .from('seller_products')
      .select(`
        *,
        seller_profiles (id, store_name, store_logo_url, is_verified)
      `)
      .eq('id', productId)
      .single();

    if (!sellerError && sellerProduct) {
      setProduct(sellerProduct as SellerProduct);
      setIsSellerProduct(true);
      await fetchReviews(productId);
      setLoading(false);
      return;
    }

    // Try AI accounts
    const { data: aiAccount, error: aiError } = await supabase
      .from('ai_accounts')
      .select('*')
      .eq('id', productId)
      .single();

    if (!aiError && aiAccount) {
      setProduct(aiAccount as AIAccount);
      setIsSellerProduct(false);
    }

    setLoading(false);
  };

  const fetchReviews = async (prodId: string) => {
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
      .eq('product_id', prodId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (reviewData && reviewData.length > 0) {
      const buyerIds = reviewData.map(r => r.buyer_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', buyerIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const avg = reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length;
      setAverageRating(avg);
      setReviewCount(reviewData.length);

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
  };

  const fetchWallet = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newWallet } = await supabase
        .from('user_wallets')
        .insert({ user_id: user.id, balance: 0 })
        .select('balance')
        .single();
      setWallet(newWallet);
    } else if (data) {
      setWallet(data);
    }
  };

  const handlePurchase = async () => {
    if (!user || !product) {
      toast.error('Please sign in to purchase');
      return;
    }

    const hasEnoughBalance = (wallet?.balance || 0) >= product.price;
    if (!hasEnoughBalance) {
      navigate('/dashboard/billing');
      toast.info('Please top up your wallet first');
      return;
    }

    setPurchasing(true);
    toast.success('Redirecting to purchase...');
    navigate('/dashboard/marketplace');
    setPurchasing(false);
  };

  const handleChat = () => {
    if (!product) return;

    if (isSellerProduct) {
      const sellerProduct = product as SellerProduct;
      openChat({
        sellerId: sellerProduct.seller_id,
        sellerName: sellerProduct.seller_profiles?.store_name || 'Seller',
        productId: sellerProduct.id,
        productName: sellerProduct.name,
        type: 'seller'
      });
    } else {
      openChat({
        sellerId: 'support',
        sellerName: 'Uptoza Support',
        productId: product.id,
        productName: product.name,
        type: 'support'
      });
    }
  };

  const handlePrevImage = () => {
    const images = getProductImages();
    setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
  };

  const handleNextImage = () => {
    const images = getProductImages();
    setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
  };

  const handleWishlist = () => {
    if (!user) {
      toast.info('Please sign in to add to wishlist');
      return;
    }
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const handleShare = (platform: 'twitter' | 'facebook' | 'copy') => {
    const url = window.location.href;
    const text = product ? `Check out ${product.name} on Uptoza!` : 'Check out this product!';

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

  const getProductImages = () => {
    if (!product) return [];
    const images: string[] = [];
    if (product.icon_url) images.push(product.icon_url);
    if (isSellerProduct && (product as SellerProduct).images) {
      images.push(...((product as SellerProduct).images || []));
    }
    return images;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 rounded-full border-4 border-black/10 border-t-black animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <Package className="w-16 h-16 text-black/20 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-black mb-2">Product Not Found</h2>
        <p className="text-black/50 mb-4">The product you're looking for doesn't exist.</p>
        <Button
          onClick={() => navigate('/dashboard/marketplace')}
          className="bg-black hover:bg-black/90 text-white"
        >
          Back to Marketplace
        </Button>
      </div>
    );
  }

  const hasEnoughBalance = (wallet?.balance || 0) >= product.price;
  const sellerProduct = isSellerProduct ? (product as SellerProduct) : null;
  const aiAccount = !isSellerProduct ? (product as AIAccount) : null;
  const productImages = getProductImages();
  const soldCount = isSellerProduct ? (sellerProduct?.sold_count || 0) : Math.floor(Math.random() * 500) + 100;
  const showChat = isSellerProduct ? sellerProduct?.chat_allowed !== false : aiAccount?.chat_allowed !== false;

  const ratingBreakdown = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  };

  const filteredReviews = reviews
    .filter(r => filterRating === null || r.rating === filterRating)
    .sort((a, b) => {
      if (sortBy === 'helpful') {
        return (b.helpfulCount || 0) - (a.helpfulCount || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Mobile Layout - Vertical stack with sticky actions
  if (isMobile) {
    return (
      <div className="min-h-screen bg-white">
        {/* Image Gallery - 280px height like store modal */}
        <div className="relative h-[280px]">
          {productImages.length > 0 ? (
            <img
              src={productImages[currentImageIndex]}
              alt={product.name}
              className="w-full h-full object-contain bg-gray-50"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black/5">
              <Package className="w-16 h-16 text-black/20" />
            </div>
          )}

          {/* Back button on image */}
          <button
            onClick={() => navigate('/dashboard/marketplace')}
            className="absolute top-3 left-3 p-2 bg-white/90 border border-black/10 rounded-full shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-black" />
          </button>

          {/* Navigation arrows */}
          {productImages.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white border border-black/20 rounded-full shadow-md"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white border border-black/20 rounded-full shadow-md"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Dot indicators */}
          {productImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {productImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={`w-2 h-2 rounded-full border border-black/20 ${
                    i === currentImageIndex ? 'bg-black' : 'bg-white'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 pb-24">
          {/* Seller Info - rounded bg-black/5 box like store modal */}
          <div className="flex items-center gap-2.5 p-2.5 bg-black/5 rounded-xl">
            <Avatar className="w-8 h-8 border border-black/10">
              {isSellerProduct && sellerProduct?.seller_profiles?.store_logo_url ? (
                <AvatarImage src={sellerProduct.seller_profiles.store_logo_url} />
              ) : null}
              <AvatarFallback className="bg-black text-white font-bold text-xs">
                {isSellerProduct && sellerProduct?.seller_profiles
                  ? sellerProduct.seller_profiles.store_name.charAt(0)
                  : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-black text-sm truncate">
                  {isSellerProduct && sellerProduct?.seller_profiles
                    ? sellerProduct.seller_profiles.store_name
                    : 'Uptoza'}
                </span>
                {((isSellerProduct && sellerProduct?.seller_profiles?.is_verified) || !isSellerProduct) && (
                  <BadgeCheck className="w-3.5 h-3.5 text-black flex-shrink-0" />
                )}
              </div>
              <p className="text-[10px] text-black/50">{soldCount} orders</p>
            </div>
          </div>

          {/* Product Title & Price */}
          <div>
            <h3 className="text-lg font-bold text-black leading-tight">{product.name}</h3>
            <div className="flex items-center gap-3 mt-1.5">
              {aiAccount?.original_price && aiAccount.original_price > aiAccount.price && (
                <span className="text-sm text-black/50 line-through">${aiAccount.original_price}</span>
              )}
              <span className="px-3 py-1 bg-black text-white text-lg font-bold rounded">
                ${product.price.toFixed(2)}
              </span>
              {reviewCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-black/60">
                  <StarRating rating={averageRating} size="sm" />
                  <span>({reviewCount})</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="rounded-full bg-black/5 text-black/70 text-[10px] px-2 py-0.5 border border-black/10">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-xs text-black/70 leading-relaxed whitespace-pre-line" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              {product.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 py-2 border-t border-b border-black/10">
            <div className="flex items-center gap-1.5 text-xs text-black/50">
              <Users className="w-3.5 h-3.5" />
              <span>{soldCount} sold</span>
            </div>
            {user && wallet && (
              <div className="flex items-center gap-1.5 text-xs text-black/50">
                <span>Balance: ${wallet.balance.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Trust Badges - Same as store modal */}
          <div className="flex flex-wrap gap-1.5">
            <div className="flex items-center gap-1 px-2 py-1 bg-black/5 rounded text-[10px] text-black/70">
              <ShieldCheck size={10} />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-black/5 rounded text-[10px] text-black/70">
              <Zap size={10} />
              <span>Instant</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-black/5 rounded text-[10px] text-black/70">
              <Clock size={10} />
              <span>24/7</span>
            </div>
          </div>

          {/* Reviews Section - Mobile */}
          {reviewCount > 0 && (
            <div className="pt-4 border-t border-black/10">
              <h3 className="text-sm font-bold text-black mb-3">Reviews ({reviewCount})</h3>
              <div className="space-y-3">
                {filteredReviews.slice(0, 3).map(review => (
                  <div key={review.id} className="border-b border-black/10 pb-3 last:border-b-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6 border border-black/10">
                        {review.buyerAvatar ? (
                          <AvatarImage src={review.buyerAvatar} alt={review.buyerName} />
                        ) : null}
                        <AvatarFallback className="bg-black/5 text-black text-[10px] font-semibold">
                          {review.buyerName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-black">{review.buyerName}</span>
                      {review.isVerifiedPurchase && (
                        <span className="text-[10px] text-black bg-black/5 px-1 py-0.5 rounded">Verified</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i <= review.rating ? 'fill-black text-black' : 'text-black/20'}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-black/70 line-clamp-2">{review.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed at bottom with safe-area-bottom */}
        <div className="fixed bottom-0 left-0 right-0 flex gap-2 px-4 pb-4 pt-2 bg-white border-t border-black/10 safe-area-bottom z-50">
          {showChat && (
            <Button
              variant="outline"
              onClick={handleChat}
              className="flex-1 rounded-xl border-2 border-black text-black hover:bg-black hover:text-white text-xs h-11"
            >
              <MessageCircle className="w-4 h-4 mr-1.5" />
              Chat
            </Button>
          )}
          <Button
            onClick={handlePurchase}
            disabled={purchasing}
            className="flex-1 rounded-xl bg-black hover:bg-black/90 text-white text-xs h-11"
          >
            {purchasing ? (
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4 mr-1.5" />
            )}
            {hasEnoughBalance ? 'Buy Now' : 'Top Up'}
          </Button>
        </div>
      </div>
    );
  }

  // Desktop Layout - 70/30 split
  return (
    <div className="min-h-screen bg-white">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-black/10 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-3">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/marketplace')}
            className="text-black hover:bg-black/5"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Marketplace
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-6">
        {/* 70/30 Image + Purchase Split */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          
          {/* LEFT: Image Gallery (70%) */}
          <div className="lg:w-[70%]">
            <div className="bg-white rounded-2xl overflow-hidden border border-black/10 shadow-sm">
              {/* Image container */}
              <div className="relative h-[350px] lg:h-[450px]">
                {productImages.length > 0 ? (
                  <img
                    src={productImages[currentImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-contain bg-gray-50"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black/5">
                    <Package className="w-24 h-24 text-black/20" />
                  </div>
                )}

                {/* Navigation Arrows */}
                {productImages.length > 1 && (
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
                {productImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {productImages.map((_, i) => (
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

              {/* Thumbnail strip for multiple images */}
              {productImages.length > 1 && (
                <div className="flex gap-2 p-3 border-t border-black/10 bg-white overflow-x-auto">
                  {productImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        i === currentImageIndex ? 'border-black' : 'border-black/10 hover:border-black/30'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Purchase Box (30%) */}
          <div className="lg:w-[30%]">
            <div className="lg:sticky lg:top-20 bg-white rounded-2xl p-5 border border-black/20 shadow-sm h-fit">
              {/* Price - Black Badge */}
              <div className="mb-4">
                {aiAccount?.original_price && aiAccount.original_price > aiAccount.price && (
                  <span className="text-sm text-black/50 line-through mr-2">
                    ${aiAccount.original_price}
                  </span>
                )}
                <div className="inline-flex items-center px-4 py-2 bg-black text-white text-xl font-bold rounded">
                  ${product.price.toFixed(2)}
                </div>
              </div>

              {/* Wallet Balance */}
              {user && wallet && (
                <div className="mb-4 p-3 bg-black/5 rounded-lg">
                  <span className="text-sm text-black/60">Your balance: </span>
                  <span className={`font-bold ${hasEnoughBalance ? 'text-black' : 'text-red-600'}`}>
                    ${wallet.balance.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Add to Cart Button - Black */}
              <Button
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full h-12 bg-black hover:bg-black/90 text-white font-semibold rounded-lg text-base mb-4"
              >
                {purchasing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4 mr-2" />
                )}
                {hasEnoughBalance ? 'Buy Now' : 'Top Up & Buy'}
              </Button>

              {/* Chat Button - Outlined Black */}
              {showChat && (
                <Button
                  onClick={handleChat}
                  variant="outline"
                  className="w-full h-10 rounded-lg border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors mb-4"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {isSellerProduct ? 'Chat with Seller' : 'Chat with Uptoza'}
                </Button>
              )}

              {/* Sales Count with Info Icon */}
              <div className="flex items-center gap-2 text-sm text-black/60 mb-4 pb-4 border-b border-black/20">
                <Info className="w-4 h-4 text-black/40" />
                <span>{soldCount.toLocaleString()} sales</span>
              </div>

              {/* Features Box - Same as store modal */}
              <div className="mb-4 pb-4 border-b border-black/20">
                <div className="flex flex-wrap gap-1.5">
                  <div className="flex items-center gap-1 px-2 py-1 bg-black/5 rounded text-[10px] text-black/70">
                    <ShieldCheck size={10} />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-black/5 rounded text-[10px] text-black/70">
                    <Zap size={10} />
                    <span>Instant</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-black/5 rounded text-[10px] text-black/70">
                    <Clock size={10} />
                    <span>24/7</span>
                  </div>
                </div>
              </div>

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

        {/* BELOW: Product Info Sections (Full Width) */}
        <div className="space-y-6">
          
          {/* Combined Title + Description Section */}
          <div className="bg-white rounded-2xl border border-black/20 p-6">
            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-black mb-4">
              {product.name}
            </h1>

            {/* Seller Info */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-black/10">
              {isSellerProduct && sellerProduct?.seller_profiles ? (
                <>
                  <Avatar className="h-10 w-10 border-2 border-black/20">
                    {sellerProduct.seller_profiles.store_logo_url ? (
                      <AvatarImage src={sellerProduct.seller_profiles.store_logo_url} alt={sellerProduct.seller_profiles.store_name} />
                    ) : null}
                    <AvatarFallback className="bg-black/10 text-black text-sm font-bold">
                      {sellerProduct.seller_profiles.store_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-black">
                      {sellerProduct.seller_profiles.store_name}
                    </span>
                    {sellerProduct.seller_profiles.is_verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-black rounded-full text-xs font-medium text-black">
                        <BadgeCheck className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Avatar className="h-10 w-10 border-2 border-black/20">
                    <AvatarFallback className="bg-black text-white text-sm font-bold">U</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-black">Uptoza</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-black rounded-full text-xs font-medium text-black">
                      <BadgeCheck className="w-3 h-3" />
                      Official
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Rating Summary */}
            {reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-black/10">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i <= Math.round(averageRating)
                          ? 'fill-black text-black'
                          : 'text-black/20'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-black">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-black/50">
                  ({reviewCount} ratings)
                </span>
              </div>
            )}

            {/* Description Header */}
            <h3 className="text-lg font-bold text-black pb-2 mb-3">
              Description
            </h3>
            
            {/* Description Text */}
            <p className="text-black/70 whitespace-pre-line leading-relaxed" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
              {product.description || 'Premium account with full access to all features. Get instant access to the most powerful tools available.'}
            </p>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
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

          {/* Ratings & Reviews Section */}
          <div className="bg-white rounded-2xl border border-black/20 p-6">
            <h3 className="text-lg font-bold text-black pb-3 mb-4 border-b border-black/20">
              Ratings & Reviews
            </h3>

            {/* Rating Breakdown */}
            <div className="flex items-start gap-8 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-black">
                  {averageRating.toFixed(1)}
                </div>
                <div className="flex items-center gap-0.5 mt-1 justify-center">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i <= Math.round(averageRating)
                          ? 'fill-black text-black'
                          : 'text-black/20'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm text-black/50 mt-1">
                  {reviewCount} ratings
                </div>
              </div>

              <div className="flex-1 space-y-1">
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = ratingBreakdown[stars as keyof typeof ratingBreakdown];
                  const percentage = reviewCount > 0 
                    ? (count / reviewCount) * 100 
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
                {/* Write Review Button - Always visible */}
                <Button
                  onClick={() => {
                    if (user) {
                      setShowReviewForm(!showReviewForm);
                    } else {
                      toast.info('Please sign in to write a review');
                    }
                  }}
                  className="bg-black hover:bg-black/90 text-white rounded-lg text-sm h-9"
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                  {showReviewForm && user ? 'Cancel' : 'Write a Review'}
                </Button>
                
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

            {/* Review Form */}
            {showReviewForm && user && productId && (
              <div className="mb-4">
                <ReviewForm
                  productId={productId}
                  orderId=""
                  onSuccess={() => {
                    setShowReviewForm(false);
                    fetchReviews(productId);
                  }}
                  onCancel={() => setShowReviewForm(false)}
                />
              </div>
            )}

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
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-black/20 mx-auto mb-3" />
                <h4 className="font-medium text-black mb-1">No reviews yet</h4>
                <p className="text-sm text-black/50">Be the first to review this product</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFullViewPage;
