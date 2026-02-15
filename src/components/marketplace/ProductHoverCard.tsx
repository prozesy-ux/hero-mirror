import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CenteredHoverPreview from '@/components/ui/CenteredHoverPreview';
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
  Users,
  Eye
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import StarRating from '@/components/reviews/StarRating';
import { supabase } from '@/integrations/supabase/client';
import { slugify } from '@/lib/url-utils';

interface HoverProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  iconUrl: string | null;
  images?: string[] | null;
  sellerName: string | null;
  sellerAvatar?: string | null;
  storeSlug: string | null;
  isVerified: boolean;
  soldCount?: number;
  tags?: string[] | null;
  type: 'ai' | 'seller';
}

interface ProductHoverCardProps {
  product: HoverProduct;
  children: React.ReactNode;
  onBuy: () => void;
  onChat: () => void;
  isAuthenticated: boolean;
  walletBalance?: number;
  purchasing?: boolean;
  navigateOnClick?: boolean;
  basePath?: string;
}

const ProductHoverCard = ({
  product,
  children,
  onBuy,
  onChat,
  isAuthenticated,
  walletBalance = 0,
  purchasing = false,
  navigateOnClick = true,
  basePath = '/marketplace',
}: ProductHoverCardProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    if (product?.id && product.type === 'seller') {
      fetchReviewStats();
    }
  }, [product?.id, product.type]);

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

  const getProductImages = () => {
    const images: string[] = [];
    if (product.iconUrl) images.push(product.iconUrl);
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
    if (!navigateOnClick) return;
    const slug = slugify(product.name);
    navigate(`${basePath}/${slug}`);
  };

  // On mobile, don't use hover - just navigate on click
  if (isMobile) {
    return (
      <div onClick={handleNavigate} className="cursor-pointer">
        {children}
      </div>
    );
  }

  // Hover card content - matches QuickView design exactly
  const HoverContent = () => (
    <div className="flex gap-4 p-4">
      {/* LEFT: Image Gallery (65%) */}
      <div className="w-[65%]">
        <div className="bg-white rounded-lg overflow-hidden border border-black/10">
          {/* Image container */}
          <div className="relative h-[350px]">
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

            {productImages.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white border border-black/20 rounded-full shadow-md hover:bg-black hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white border border-black/20 rounded-full shadow-md hover:bg-black hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {productImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {productImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                    className={`w-2 h-2 rounded-full border border-black/20 ${
                      i === currentImageIndex ? 'bg-black' : 'bg-white'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {productImages.length > 1 && (
            <div className="flex gap-2 p-3 border-t border-black/10 overflow-x-auto">
              {productImages.slice(0, 5).map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                  className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
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
        <div className="mt-3 space-y-2">
          {/* Title */}
          <h3 className="text-base font-bold text-black line-clamp-2">{product.name}</h3>

          {/* Seller Info */}
          <div className="flex items-center gap-2">
            {product.sellerAvatar ? (
              <Avatar className="w-6 h-6 border border-black/10">
                <AvatarImage src={product.sellerAvatar} />
                <AvatarFallback className="bg-black text-white font-bold text-[10px]">
                  {product.sellerName?.charAt(0) || 'S'}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">
                  {product.sellerName?.charAt(0) || 'S'}
                </span>
              </div>
            )}
            <span className="font-medium text-black text-sm truncate">{product.sellerName || 'Uptoza'}</span>
            {product.isVerified && (
              <BadgeCheck className="w-4 h-4 text-black flex-shrink-0" />
            )}
          </div>

          {/* Rating */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={averageRating} size="sm" />
              <span className="text-xs text-black/60">({reviewCount})</span>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-xs text-black/70 leading-relaxed line-clamp-2">{product.description}</p>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.slice(0, 4).map(tag => (
                <span key={tag} className="px-2 py-1 bg-black/5 text-black/70 text-[10px] rounded-full border border-black/10">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Purchase Box (35%) */}
      <div className="w-[35%] flex flex-col">
        <div className="bg-white rounded-lg p-4 border border-black/20 flex-1 flex flex-col">
          {/* Price */}
          <div className="mb-3">
            <div className="inline-flex items-center px-4 py-2 bg-black text-white text-lg font-bold rounded">
              ${product.price}
            </div>
          </div>

          {/* Wallet Balance */}
          {isAuthenticated && (
            <div className="mb-3 p-3 bg-black/5 rounded-lg">
              <span className="text-xs text-black/60">Your balance: </span>
              <span className={`font-bold text-sm ${hasEnoughBalance ? 'text-black' : 'text-red-600'}`}>
                ${walletBalance.toFixed(2)}
              </span>
            </div>
          )}

          {/* Buy Button */}
          <Button
            onClick={(e) => { e.stopPropagation(); onBuy(); }}
            disabled={purchasing}
            className="w-full h-11 bg-black hover:bg-black/90 text-white font-semibold rounded-lg mb-3 text-sm"
          >
            {purchasing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4 mr-2" />
            )}
            BUY NOW
          </Button>

          {/* Full View Button */}
          <Button
            onClick={(e) => { 
              e.stopPropagation(); 
              navigate(`${basePath}/${slugify(product.name)}`);
            }}
            variant="outline"
            className="w-full h-10 rounded-lg border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors mb-3 text-sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            Full View
          </Button>

          {/* Chat Button */}
          <Button
            onClick={(e) => { e.stopPropagation(); onChat(); }}
            variant="outline"
            className="w-full h-10 rounded-lg border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors mb-3 text-sm"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {isAuthenticated ? 'Chat' : 'Login to Chat'}
          </Button>

          {/* Sales Count */}
          <div className="flex items-center gap-2 text-xs text-black/60 mb-3 pb-3 border-b border-black/20">
            <Users className="w-4 h-4 text-black/40" />
            <span>{(product.soldCount || 0).toLocaleString()} sales</span>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-1.5 mt-auto">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/5 rounded text-[10px] font-medium text-black/70 border border-black/10">
              <ShieldCheck className="w-3 h-3" />
              Secure
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/5 rounded text-[10px] font-medium text-black/70 border border-black/10">
              <Zap className="w-3 h-3" />
              Instant
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-black/5 rounded text-[10px] font-medium text-black/70 border border-black/10">
              <Clock className="w-3 h-3" />
              24/7
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <CenteredHoverPreview
      content={<HoverContent />}
      openDelay={400}
      disabled={isMobile}
    >
      <div onClick={handleNavigate} className="cursor-pointer">
        {children}
      </div>
    </CenteredHoverPreview>
  );
};

export default ProductHoverCard;
