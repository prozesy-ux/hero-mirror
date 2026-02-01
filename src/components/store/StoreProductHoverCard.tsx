import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ShoppingCart, 
  MessageCircle, 
  Package,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  ShieldCheck,
  Zap,
  Clock,
  Loader2,
  Users
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import StarRating from '@/components/reviews/StarRating';
import { supabase } from '@/integrations/supabase/client';
import { slugify } from '@/lib/url-utils';

interface SellerProduct {
  id: string;
  name: string;
  slug?: string | null;
  description: string | null;
  price: number;
  icon_url: string | null;
  images?: string[] | null;
  tags: string[] | null;
  sold_count: number | null;
  chat_allowed: boolean | null;
  seller_id: string;
}

interface SellerProfile {
  id: string;
  store_name: string;
  store_slug: string | null;
  store_logo_url: string | null;
  is_verified: boolean;
  total_orders?: number;
}

interface StoreProductHoverCardProps {
  product: SellerProduct;
  seller: SellerProfile;
  children: React.ReactNode;
  onBuy: () => void;
  onChat: () => void;
  isLoggedIn: boolean;
  walletBalance?: number;
  purchasing?: boolean;
}

const StoreProductHoverCard = ({
  product,
  seller,
  children,
  onBuy,
  onChat,
  isLoggedIn,
  walletBalance = 0,
  purchasing = false,
}: StoreProductHoverCardProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (product?.id) {
      fetchReviewStats();
    }
  }, [product?.id]);

  const fetchReviewStats = async () => {
    if (!product?.id) return;
    
    const { data } = await supabase
      .from('product_reviews')
      .select('rating')
      .eq('product_id', product.id);

    if (data && data.length > 0) {
      const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
      setAverageRating(avg);
      setReviewCount(data.length);
    }
  };

  const hasEnoughBalance = walletBalance >= product.price;
  const showChat = product.chat_allowed !== false;

  const getProductImages = () => {
    const images: string[] = [];
    if (product.icon_url) images.push(product.icon_url);
    if (product.images) images.push(...product.images);
    return images;
  };

  const productImages = getProductImages();

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => prev === 0 ? productImages.length - 1 : prev - 1);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => prev === productImages.length - 1 ? 0 : prev + 1);
  };

  const handleNavigate = () => {
    const slug = product.slug || `${slugify(product.name)}-${product.id.slice(0, 8)}`;
    navigate(`/store/${seller.store_slug}/product/${slug}`);
  };

  // On mobile, don't use hover - just navigate on click
  if (isMobile) {
    return (
      <div onClick={handleNavigate} className="cursor-pointer">
        {children}
      </div>
    );
  }

  // Hover card content - matches ProductDetailModal design exactly
  const HoverContent = () => (
    <div className="flex gap-3 p-3">
      {/* LEFT: Image Gallery (60%) */}
      <div className="w-[60%]">
        <div className="bg-white rounded-lg overflow-hidden border border-black/10">
          {/* Image container */}
          <div className="relative h-[220px]">
            {productImages.length > 0 ? (
              <img
                src={productImages[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-contain bg-gray-50"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black/5">
                <Package className="w-12 h-12 text-black/20" />
              </div>
            )}

            {productImages.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white border border-black/20 rounded-full shadow-md hover:bg-black hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white border border-black/20 rounded-full shadow-md hover:bg-black hover:text-white transition-colors"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </>
            )}

            {productImages.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {productImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                    className={`w-1.5 h-1.5 rounded-full border border-black/20 ${
                      i === currentImageIndex ? 'bg-black' : 'bg-white'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {productImages.length > 1 && (
            <div className="flex gap-1.5 p-2 border-t border-black/10 overflow-x-auto">
              {productImages.slice(0, 4).map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                  className={`flex-shrink-0 w-10 h-10 rounded overflow-hidden border transition-colors ${
                    i === currentImageIndex ? 'border-black' : 'border-black/10 hover:border-black/30'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info below image */}
        <div className="mt-2 space-y-1.5">
          {/* Title */}
          <h3 className="text-sm font-bold text-black line-clamp-2">{product.name}</h3>

          {/* Seller Info */}
          <div className="flex items-center gap-2">
            <Avatar className="w-5 h-5 border border-black/10">
              <AvatarImage src={seller.store_logo_url || ''} />
              <AvatarFallback className="bg-black text-white font-bold text-[8px]">
                {seller.store_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-black text-xs truncate">{seller.store_name}</span>
            {seller.is_verified && (
              <BadgeCheck className="w-3 h-3 text-black flex-shrink-0" />
            )}
          </div>

          {/* Rating */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-1.5">
              <StarRating rating={averageRating} size="sm" />
              <span className="text-[10px] text-black/60">({reviewCount})</span>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-[10px] text-black/70 leading-relaxed line-clamp-2">{product.description}</p>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {product.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-1.5 py-0.5 bg-black/5 text-black/70 text-[9px] rounded-full border border-black/10">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Purchase Box (40%) */}
      <div className="w-[40%] flex flex-col">
        <div className="bg-white rounded-lg p-3 border border-black/20 flex-1 flex flex-col">
          {/* Price */}
          <div className="mb-2">
            <div className="inline-flex items-center px-3 py-1.5 bg-black text-white text-base font-bold rounded">
              ${product.price}
            </div>
          </div>

          {/* Wallet Balance */}
          {isLoggedIn && (
            <div className="mb-2 p-2 bg-black/5 rounded-lg">
              <span className="text-[10px] text-black/60">Your balance: </span>
              <span className={`font-bold text-xs ${hasEnoughBalance ? 'text-black' : 'text-red-600'}`}>
                ${walletBalance.toFixed(2)}
              </span>
            </div>
          )}

          {/* Buy Button */}
          <Button
            onClick={(e) => { e.stopPropagation(); onBuy(); }}
            disabled={purchasing}
            className="w-full h-9 bg-black hover:bg-black/90 text-white font-semibold rounded-lg mb-2 text-xs"
          >
            {purchasing ? (
              <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
            ) : (
              <ShoppingCart className="w-3 h-3 mr-1.5" />
            )}
            {isLoggedIn && !hasEnoughBalance ? 'Top Up & Buy' : 'Buy Now'}
          </Button>

          {/* Chat Button */}
          {showChat && (
            <Button
              onClick={(e) => { e.stopPropagation(); onChat(); }}
              variant="outline"
              className="w-full h-8 rounded-lg border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors mb-2 text-xs"
            >
              <MessageCircle className="w-3 h-3 mr-1.5" />
              {isLoggedIn ? 'Chat' : 'Login to Chat'}
            </Button>
          )}

          {/* Sales Count */}
          <div className="flex items-center gap-1.5 text-[10px] text-black/60 mb-2 pb-2 border-b border-black/20">
            <Users className="w-3 h-3 text-black/40" />
            <span>{(product.sold_count || 0).toLocaleString()} sales</span>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-1 mt-auto">
            <div className="flex items-center gap-1 px-2 py-1 bg-black/5 rounded text-[9px] font-medium text-black/70 border border-black/10">
              <ShieldCheck className="w-2.5 h-2.5" />
              Secure
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-black/5 rounded text-[9px] font-medium text-black/70 border border-black/10">
              <Zap className="w-2.5 h-2.5" />
              Instant
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-black/5 rounded text-[9px] font-medium text-black/70 border border-black/10">
              <Clock className="w-2.5 h-2.5" />
              24/7
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <HoverCard openDelay={400} closeDelay={150}>
      <HoverCardTrigger asChild>
        <div onClick={handleNavigate} className="cursor-pointer">
          {children}
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        side="right" 
        align="start"
        sideOffset={8}
        className="w-[500px] p-0 border border-black/10 shadow-xl bg-white z-50"
      >
        <HoverContent />
      </HoverCardContent>
    </HoverCard>
  );
};

export default StoreProductHoverCard;
