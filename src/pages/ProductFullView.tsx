import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  ArrowLeft,
  MessageCircle,
  ShoppingCart,
  Users,
  Package,
  CheckCircle,
  Loader2,
  Share2,
  Store
} from 'lucide-react';
import ProductReviews from '@/components/reviews/ProductReviews';
import StarRating from '@/components/reviews/StarRating';
import ImageGallery from '@/components/ui/image-gallery';
import { FloatingChatProvider, useFloatingChat } from '@/contexts/FloatingChatContext';
import FloatingChatWidget from '@/components/dashboard/FloatingChatWidget';
import { extractIdFromSlug, isFullUUID, generateProductUrl, getProductShareUrl } from '@/lib/url-utils';

interface Product {
  id: string;
  name: string;
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
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

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

    // 1. Check if it's a full UUID (legacy URL)
    if (isFullUUID(productId!)) {
      const { data } = await supabase
        .from('seller_products')
        .select('*')
        .eq('id', productId)
        .eq('seller_id', sellerData.id)
        .single();
      productData = data;

      // Redirect legacy UUID URLs to SEO-friendly format
      if (productData) {
        const seoUrl = generateProductUrl(storeSlug!, productData.name, productData.id);
        navigate(seoUrl, { replace: true });
        return;
      }
    } else {
      // 2. Extract ID prefix from SEO slug
      const idPrefix = extractIdFromSlug(productId!);
      
      if (idPrefix) {
        const { data } = await supabase
          .from('seller_products')
          .select('*')
          .eq('seller_id', sellerData.id)
          .ilike('id', `${idPrefix}%`)
          .single();
        productData = data;
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

      // Fetch review stats
      const { data: reviewData } = await supabase
        .from('product_reviews')
        .select('rating')
        .eq('product_id', productData.id);

      if (reviewData && reviewData.length > 0) {
        const avg = reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length;
        setAverageRating(avg);
        setReviewCount(reviewData.length);
      }
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

  const handleShare = async () => {
    if (!product || !storeSlug) return;
    const url = getProductShareUrl(storeSlug, product.name, product.id);
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product || !seller) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Product not found</h1>
          <Button onClick={() => navigate(`/store/${storeSlug}`)}>Back to Store</Button>
        </div>
      </div>
    );
  }

  const hasEnoughBalance = (wallet?.balance || 0) >= product.price;
  const showChat = product.chat_allowed !== false;
  const productImages = product.images || [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
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
              <Avatar className="w-8 h-8 border border-slate-200">
                <AvatarImage src={seller.store_logo_url || ''} />
                <AvatarFallback className="bg-emerald-500 text-white text-sm">
                  {seller.store_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-slate-900">{seller.store_name}</span>
              {seller.is_verified && (
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              )}
            </Link>
          </div>
          <Button variant="outline" size="sm" onClick={handleShare} className="rounded-xl">
            <Share2 className="w-4 h-4 mr-1.5" />
            Share
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Image Gallery */}
          <ImageGallery
            images={productImages}
            mainImage={product.icon_url}
            alt={product.name}
            showThumbnails={true}
            enableZoom={true}
            aspectRatio="square"
          />

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">{product.name}</h1>
              <div className="flex items-center gap-4">
                {reviewCount > 0 ? (
                  <div className="flex items-center gap-2">
                    <StarRating rating={averageRating} size="sm" />
                    <span className="text-sm text-slate-600">({reviewCount} reviews)</span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">No reviews yet</span>
                )}
                <span className="text-sm text-slate-500">|</span>
                <span className="text-sm text-slate-500">{product.sold_count || 0} sold</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-emerald-600">${product.price}</span>
              {user && wallet && (
                <span className="text-sm text-slate-500">
                  Your balance: ${wallet.balance.toFixed(2)}
                </span>
              )}
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="rounded-full bg-violet-50 text-violet-700 border-violet-200">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="prose prose-slate prose-sm max-w-none">
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex gap-3">
              {showChat && (
                <Button
                  variant="outline"
                  onClick={handleChat}
                  className="flex-1 h-12 rounded-xl border-slate-200"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat with Seller
                </Button>
              )}
              <Button
                onClick={handlePurchase}
                disabled={purchasing}
                className={`flex-1 h-12 rounded-xl ${
                  user && !hasEnoughBalance
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                {purchasing ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <ShoppingCart className="w-5 h-5 mr-2" />
                )}
                {user && !hasEnoughBalance ? 'Top Up & Buy' : 'Buy Now'}
              </Button>
            </div>

            {/* Seller Card */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-slate-100">
                  <AvatarImage src={seller.store_logo_url || ''} />
                  <AvatarFallback className="bg-emerald-500 text-white font-bold">
                    {seller.store_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{seller.store_name}</span>
                    {seller.is_verified && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{seller.total_orders || 0} orders completed</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/store/${storeSlug}`)}
                  className="rounded-lg"
                >
                  <Store className="w-4 h-4 mr-1.5" />
                  Visit Store
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Customer Reviews</h2>
          <ProductReviews productId={product.id} />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-slate-900 mb-6">More from this seller</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(related => (
                <Link
                  key={related.id}
                  to={generateProductUrl(storeSlug!, related.name, related.id)}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="aspect-square bg-slate-50">
                    {related.icon_url ? (
                      <img src={related.icon_url} alt={related.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-slate-900 text-sm truncate">{related.name}</p>
                    <p className="text-emerald-600 font-bold">${related.price}</p>
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

const ProductFullView = () => (
  <FloatingChatProvider>
    <ProductFullViewContent />
  </FloatingChatProvider>
);

export default ProductFullView;
