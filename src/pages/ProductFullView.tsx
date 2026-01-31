import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { trackProductView } from '@/lib/analytics-tracker';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ArrowLeft,
  MessageCircle,
  ShoppingCart,
  Package,
  Loader2,
  Share2,
  Star,
  Heart,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Twitter,
  Facebook,
  Link as LinkIcon,
  Info,
  BadgeCheck,
  Filter,
  ThumbsUp,
  Edit3,
  ShieldCheck,
  Zap,
  Clock
} from 'lucide-react';
import { FloatingChatProvider, useFloatingChat } from '@/contexts/FloatingChatContext';
import FloatingChatWidget from '@/components/dashboard/FloatingChatWidget';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from 'date-fns';
import ReviewForm from '@/components/reviews/ReviewForm';
import { 
  generateProductUrl, 
  getProductShareUrl, 
  isFullUUID, 
  extractIdFromSlug, 
  normalizeProductName
} from '@/lib/url-utils';

interface Product {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  price: number;
  icon_url: string | null;
  images: string[] | null;
  tags: string[] | null;
  sold_count: number | null;
  chat_allowed: boolean | null;
  seller_id: string;
}

interface Seller {
  id: string;
  store_name: string;
  store_slug: string | null;
  store_logo_url: string | null;
  store_description: string | null;
  is_verified: boolean;
  total_orders: number;
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

const ProductFullViewContent = () => {
  const { storeSlug, productId } = useParams<{ storeSlug: string; productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { openChat } = useFloatingChat();

  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful'>('recent');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [helpfulClicked, setHelpfulClicked] = useState<Set<string>>(new Set());
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    if (storeSlug && productId) {
      fetchData();
    }
  }, [storeSlug, productId]);

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  // Track product view when product loads
  const viewTrackedRef = useRef<string | null>(null);
  useEffect(() => {
    if (product?.id && viewTrackedRef.current !== product.id) {
      viewTrackedRef.current = product.id;
      trackProductView(product.id);
    }
  }, [product?.id]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch seller first
    const { data: sellerData } = await supabase
      .from('seller_profiles')
      .select('*')
      .eq('store_slug', storeSlug)
      .single();

    if (!sellerData) {
      setLoading(false);
      return;
    }

    setSeller(sellerData);

    // Smart product lookup with tiered strategy
    let productData = null;

    // 1. Try exact slug match
    const { data: slugMatch } = await supabase
      .from('seller_products')
      .select('*')
      .eq('seller_id', sellerData.id)
      .eq('slug', productId)
      .maybeSingle();
    
    if (slugMatch) {
      productData = slugMatch;
    }

    // 2. Try ID prefix match
    if (!productData) {
      const idPrefix = extractIdFromSlug(productId!);
      if (idPrefix) {
        const { data } = await supabase
          .from('seller_products')
          .select('*')
          .eq('seller_id', sellerData.id)
          .ilike('id', `${idPrefix}%`)
          .maybeSingle();
        
        if (data) {
          if (data.slug) {
            navigate(`/store/${storeSlug}/product/${data.slug}`, { replace: true });
          }
          productData = data;
        }
      }
    }

    // 3. Try exact UUID match
    if (!productData && isFullUUID(productId!)) {
      const { data } = await supabase
        .from('seller_products')
        .select('*')
        .eq('id', productId)
        .eq('seller_id', sellerData.id)
        .maybeSingle();
      
      if (data) {
        if (data.slug) {
          navigate(`/store/${storeSlug}/product/${data.slug}`, { replace: true });
        }
        productData = data;
      }
    }

    // 4. Fallback: Try matching by normalized name
    if (!productData) {
      const nameFromSlug = productId!.replace(/-[a-f0-9]{8}$/i, '').replace(/-/g, ' ');
      const { data: products } = await supabase
        .from('seller_products')
        .select('*')
        .eq('seller_id', sellerData.id)
        .eq('is_available', true);
      
      const matchedProduct = products?.find(p => 
        normalizeProductName(p.name) === normalizeProductName(nameFromSlug)
      );
      
      if (matchedProduct) {
        if (matchedProduct.slug) {
          navigate(`/store/${storeSlug}/product/${matchedProduct.slug}`, { replace: true });
        }
        productData = matchedProduct;
      }
    }

    if (productData) {
      setProduct(productData);

      // Fetch related products
      const { data: relatedData } = await supabase
        .from('seller_products')
        .select('*')
        .eq('seller_id', sellerData.id)
        .eq('is_available', true)
        .eq('is_approved', true)
        .neq('id', productData.id)
        .limit(4);

      setRelatedProducts(relatedData || []);

      // Fetch reviews
      await fetchReviews(productData.id);
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
    const { data } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();
    if (data) setWallet(data);
  };

  const handlePurchase = async () => {
    if (!user || !product || !seller) {
      navigate('/signin');
      return;
    }

    const currentBalance = wallet?.balance || 0;
    if (currentBalance < product.price) {
      toast.error('Insufficient balance. Please top up your wallet.');
      navigate('/dashboard/billing');
      return;
    }

    setPurchasing(true);
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

      toast.success('Purchase successful!');
      fetchWallet();
    } catch (error: any) {
      toast.error(error.message || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const handleChat = () => {
    if (!user) {
      navigate('/signin');
      return;
    }
    if (seller && product) {
      openChat({
        sellerId: seller.id,
        sellerName: seller.store_name,
        productId: product.id,
        productName: product.name,
        type: 'seller'
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

  const handleShare = async (platform?: 'twitter' | 'facebook' | 'copy') => {
    const slug = product?.slug || productId || '';
    const url = seller?.store_slug 
      ? getProductShareUrl(seller.store_slug, slug)
      : window.location.href;
    const text = product ? `Check out ${product.name}!` : 'Check out this product!';

    if (!platform) {
      // Default share action
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied!');
      } catch {
        toast.error('Failed to copy link');
      }
      return;
    }

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(url);
          toast.success('Link copied!');
        } catch {
          toast.error('Failed to copy link');
        }
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
    if (product.images) images.push(...product.images);
    return images;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-screen-xl mx-auto px-4">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="flex flex-col lg:flex-row gap-6">
            <Skeleton className="lg:w-[70%] h-[450px] rounded-2xl" />
            <Skeleton className="lg:w-[30%] h-[400px] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product || !seller) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-black/20 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-black mb-2">Product not found</h1>
          <Button onClick={() => navigate(`/store/${storeSlug}`)} className="bg-black hover:bg-black/90 text-white">
            Back to Store
          </Button>
        </div>
      </div>
    );
  }

  const hasEnoughBalance = (wallet?.balance || 0) >= product.price;
  const showChat = product.chat_allowed !== false;
  const productImages = getProductImages();

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

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-black/10">
        <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/store/${storeSlug}`)}
              className="rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Link 
              to={`/store/${storeSlug}`}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Avatar className="w-8 h-8 border border-black/10">
                <AvatarImage src={seller.store_logo_url || ''} />
                <AvatarFallback className="bg-black text-white text-sm">
                  {seller.store_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-black">{seller.store_name}</span>
              {seller.is_verified && (
                <BadgeCheck className="w-4 h-4 text-black" />
              )}
            </Link>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleShare()} className="rounded-xl border-black/20">
            <Share2 className="w-4 h-4 mr-1.5" />
            Share
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto px-4 lg:px-6 py-6">
        {/* 70/30 Image + Purchase Split */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          
          {/* LEFT: Image Gallery (70%) */}
          <div className="lg:w-[70%]">
            <div className="bg-white rounded-2xl overflow-hidden border border-black/20">
              {/* Medium height image container */}
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

              {/* Thumbnail strip */}
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
            <div className="lg:sticky lg:top-20 bg-white rounded-2xl p-5 border border-black/20 h-fit">
              {/* Price - Black Badge */}
              <div className="mb-4">
                <div className="inline-flex items-center px-4 py-2 bg-black text-white text-xl font-bold rounded">
                  ${product.price}
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

              {/* Add to Cart Button */}
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
                {user && !hasEnoughBalance ? 'Top Up & Buy' : 'Buy Now'}
              </Button>

              {/* Chat Button */}
              {showChat && (
                <Button
                  onClick={handleChat}
                  variant="outline"
                  className="w-full h-10 rounded-lg border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors mb-4"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {user ? 'Chat with Seller' : 'Login to Chat'}
                </Button>
              )}

              {/* Sales Count */}
              <div className="flex items-center gap-2 text-sm text-black/60 mb-4 pb-4 border-b border-black/20">
                <Info className="w-4 h-4 text-black/40" />
                <span>{(product.sold_count || 0).toLocaleString()} sales</span>
              </div>

              {/* Features Box */}
              <div className="mb-4 pb-4 border-b border-black/20">
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-black/5 rounded text-xs text-black/70">
                    <ShieldCheck size={12} />
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-black/5 rounded text-xs text-black/70">
                    <Zap size={12} />
                    <span>Instant Delivery</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-black/5 rounded text-xs text-black/70">
                    <Clock size={12} />
                    <span>24/7 Support</span>
                  </div>
                </div>
              </div>

              {/* Wishlist */}
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
                >
                  <Twitter className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="p-2 text-black/40 hover:text-black transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShare('copy')}
                  className="p-2 text-black/40 hover:text-black transition-colors"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Info Section */}
        <div className="space-y-6">
          
          {/* Combined Title + Description Section */}
          <div className="bg-white rounded-2xl border border-black/20 p-6">
            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-black mb-4">
              {product.name}
            </h1>

            {/* Seller Info */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-black/10">
              <Avatar className="h-10 w-10 border-2 border-black/20">
                {seller.store_logo_url ? (
                  <AvatarImage src={seller.store_logo_url} alt={seller.store_name} />
                ) : null}
                <AvatarFallback className="bg-black text-white text-sm font-bold">
                  {seller.store_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <span className="font-medium text-black">{seller.store_name}</span>
                {seller.is_verified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-black rounded-full text-xs font-medium text-black">
                    <BadgeCheck className="w-3 h-3" />
                    Verified
                  </span>
                )}
              </div>
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

            {/* Description */}
            <h3 className="text-lg font-bold text-black pb-2 mb-3">Description</h3>
            <p className="text-black/70 whitespace-pre-line leading-relaxed">
              {product.description || 'No description available.'}
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
            {showReviewForm && user && product && (
              <div className="mb-4">
                <ReviewForm
                  productId={product.id}
                  orderId=""
                  onSuccess={() => {
                    setShowReviewForm(false);
                    fetchReviews(product.id);
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

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-black mb-6">More from this seller</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(related => (
                <Link
                  key={related.id}
                  to={generateProductUrl(storeSlug!, related.slug || related.id)}
                  className="bg-white rounded-2xl border border-black/20 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="aspect-square bg-gray-50">
                    {related.icon_url ? (
                      <img src={related.icon_url} alt={related.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-black/20" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-black text-sm truncate">{related.name}</p>
                    <p className="text-black font-bold">${related.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <FloatingChatWidget />
    </div>
  );
};

const ProductFullView = () => {
  return (
    <FloatingChatProvider>
      <ProductFullViewContent />
    </FloatingChatProvider>
  );
};

export default ProductFullView;
