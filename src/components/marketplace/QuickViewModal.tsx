import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  ShoppingCart, 
  Users, 
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  ShieldCheck,
  Zap,
  Clock,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import StarRating from '@/components/reviews/StarRating';
import { useIsMobile } from '@/hooks/use-mobile';

interface SellerProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  images?: string[] | null;
  tags: string[] | null;
  sold_count: number | null;
  chat_allowed: boolean | null;
  seller_id: string;
  seller_profiles?: {
    id: string;
    store_name: string;
    store_slug: string | null;
    store_logo_url: string | null;
    is_verified: boolean;
  } | null;
}

interface AIAccount {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  tags: string[] | null;
  chat_allowed?: boolean | null;
}

interface QuickViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productType: 'account' | 'seller';
  product: AIAccount | SellerProduct | null;
  onChat?: () => void;
  onBuy?: () => void;
  onViewFull?: () => void;
  purchasing?: boolean;
  walletBalance?: number;
  isLoggedIn?: boolean;
}

const QuickViewModal = ({
  open,
  onOpenChange,
  productType,
  product,
  onChat,
  onBuy,
  onViewFull,
  purchasing = false,
  walletBalance = 0,
  isLoggedIn = false
}: QuickViewModalProps) => {
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (product?.id && productType === 'seller') {
      fetchReviewStats();
      setCurrentImageIndex(0);
    }
  }, [product?.id, productType]);

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
    } else {
      setAverageRating(0);
      setReviewCount(0);
    }
  };

  if (!product) return null;

  const hasEnoughBalance = walletBalance >= product.price;
  const showChat = product.chat_allowed !== false;
  
  // Get seller info if it's a seller product
  const sellerProduct = productType === 'seller' ? product as SellerProduct : null;
  const seller = sellerProduct?.seller_profiles;
  const sellerName = seller?.store_name || 'Uptoza';
  const sellerLogo = seller?.store_logo_url;
  const isVerified = seller?.is_verified ?? false;

  const getProductImages = () => {
    const images: string[] = [];
    if (product.icon_url) images.push(product.icon_url);
    if (sellerProduct?.images) images.push(...sellerProduct.images);
    return images;
  };

  const productImages = getProductImages();

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => prev === 0 ? productImages.length - 1 : prev - 1);
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => prev === productImages.length - 1 ? 0 : prev + 1);
  };

  // Shared content for both mobile and desktop
  const ImageGallery = ({ height = 'h-[280px]' }: { height?: string }) => (
    <div className={`relative ${height}`}>
      {productImages.length > 0 ? (
        <img
          src={productImages[currentImageIndex]}
          alt={product.name}
          className="w-full h-full object-contain bg-black/5"
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
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white border border-black/20 rounded-full shadow-md hover:bg-black hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white border border-black/20 rounded-full shadow-md hover:bg-black hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

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
  );

  const TrustBadges = () => (
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
  );

  // Mobile Drawer Content
  const MobileContent = () => (
    <>
      <ImageGallery height="h-[280px]" />

      <div className="p-4 space-y-3">
        {/* Seller Info */}
        <div className="flex items-center gap-2.5 p-2.5 bg-black/5 rounded-xl">
          <Avatar className="w-8 h-8 border border-black/10">
            <AvatarImage src={sellerLogo || ''} />
            <AvatarFallback className="bg-black text-white font-bold text-xs">
              {sellerName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-black text-sm truncate">{sellerName}</span>
              {isVerified && (
                <BadgeCheck className="w-3.5 h-3.5 text-black flex-shrink-0" />
              )}
            </div>
            <p className="text-[10px] text-black/50">
              {sellerProduct?.sold_count || 0} orders
            </p>
          </div>
        </div>

        {/* Product Title & Price */}
        <div>
          <h3 className="text-lg font-bold text-black leading-tight">{product.name}</h3>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="px-3 py-1 bg-black text-white text-lg font-bold rounded">
              ${product.price}
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
              <Badge 
                key={tag} 
                variant="secondary" 
                className="rounded-full bg-black/5 text-black/70 text-[10px] px-2 py-0.5 border border-black/10"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Description */}
        {product.description && (
          <p className="text-xs text-black/70 leading-relaxed line-clamp-3">
            {product.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 py-2 border-t border-b border-black/10">
          <div className="flex items-center gap-1.5 text-xs text-black/50">
            <Users className="w-3.5 h-3.5" />
            <span>{sellerProduct?.sold_count || 0} sold</span>
          </div>
          {isLoggedIn && (
            <div className="flex items-center gap-1.5 text-xs text-black/50">
              <span>Balance: ${walletBalance.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Trust Badges */}
        <TrustBadges />
      </div>

      {/* Sticky Action Buttons */}
      <div className="flex gap-2 px-4 pb-4 sticky bottom-0 bg-white pt-2 border-t border-black/10 safe-area-bottom">
        {showChat && (
          <Button
            variant="outline"
            onClick={onChat}
            className="flex-1 rounded border border-black bg-white text-black font-medium text-xs h-11 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <MessageCircle className="w-4 h-4 mr-1.5" />
            Chat
          </Button>
        )}
        <Button
          onClick={onBuy}
          disabled={purchasing}
          className="flex-1 rounded bg-[#FF90E8] border border-black text-black font-medium text-xs h-11 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          {purchasing ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <ShoppingCart className="w-4 h-4 mr-1.5" />
          )}
          {isLoggedIn && !hasEnoughBalance ? 'Top Up' : 'Buy Now'}
        </Button>
      </div>
    </>
  );

  // Desktop Dialog Content (65/35 split)
  const DesktopContent = () => (
    <div className="flex gap-4 max-h-[80vh] overflow-y-auto">
      {/* LEFT: Image Gallery (65%) */}
      <div className="w-[65%]">
        <div className="bg-white rounded-xl overflow-hidden border border-black/10">
          <ImageGallery height="h-[320px]" />

          {/* Thumbnails */}
          {productImages.length > 1 && (
            <div className="flex gap-2 p-2.5 border-t border-black/10 overflow-x-auto">
              {productImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
                  className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === currentImageIndex ? 'border-black' : 'border-black/10 hover:border-black/30'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="mt-4 space-y-3">
          <h2 className="text-lg font-bold text-black">{product.name}</h2>

          {/* Seller Info */}
          <div className="flex items-center gap-2.5">
            <Avatar className="w-7 h-7 border border-black/10">
              <AvatarImage src={sellerLogo || ''} />
              <AvatarFallback className="bg-black text-white font-bold text-[10px]">
                {sellerName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-black text-sm">{sellerName}</span>
            {isVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-black rounded-full text-[10px] font-medium text-black">
                <BadgeCheck className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>

          {/* Rating */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={averageRating} size="sm" />
              <span className="text-xs text-black/60">({reviewCount} reviews)</span>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-sm text-black/70 leading-relaxed line-clamp-4">
              {product.description}
            </p>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map(tag => (
                <span 
                  key={tag} 
                  className="px-2 py-0.5 bg-black/5 text-black/70 text-[10px] rounded-full border border-black/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Purchase Box (35%) */}
      <div className="w-[35%]">
        <div className="bg-white rounded-xl p-4 border border-black/20 sticky top-0">
          {/* Price */}
          <div className="mb-3">
            <div className="inline-flex items-center px-4 py-2 bg-black text-white text-xl font-bold rounded">
              ${product.price}
            </div>
          </div>

          {/* Wallet Balance */}
          {isLoggedIn && (
            <div className="mb-3 p-2.5 bg-black/5 rounded-lg">
              <span className="text-xs text-black/60">Your balance: </span>
              <span className={`font-bold text-sm ${hasEnoughBalance ? 'text-black' : 'text-red-600'}`}>
                ${walletBalance.toFixed(2)}
              </span>
            </div>
          )}

          {/* Buy Button */}
          <Button
            onClick={onBuy}
            disabled={purchasing}
            className="w-full h-11 bg-[#FF90E8] border border-black text-black font-semibold rounded mb-3 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            {purchasing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4 mr-2" />
            )}
            {isLoggedIn && !hasEnoughBalance ? 'Top Up & Buy' : 'Buy Now'}
          </Button>

          {/* Chat Button */}
          {showChat && (
            <Button
              onClick={onChat}
              variant="outline"
              className="w-full h-10 rounded border border-black bg-white text-black font-medium mb-3 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat with Seller
            </Button>
          )}

          {/* View Full Button */}
          {onViewFull && (
            <Button
              onClick={onViewFull}
              variant="outline"
              className="w-full h-10 rounded-lg border border-black/20 text-black/70 hover:bg-black/5 mb-3"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Full Details
            </Button>
          )}

          {/* Sales Count */}
          <div className="flex items-center gap-2 text-xs text-black/60 mb-3 pb-3 border-b border-black/20">
            <Users className="w-3.5 h-3.5 text-black/40" />
            <span>{(sellerProduct?.sold_count || 0).toLocaleString()} sales</span>
          </div>

          {/* Trust Badges */}
          <TrustBadges />
        </div>
      </div>
    </div>
  );

  // Render mobile drawer or desktop dialog
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] overflow-y-auto">
          <MobileContent />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-4 overflow-hidden bg-white border border-black rounded">
        <DesktopContent />
      </DialogContent>
    </Dialog>
  );
};

export default QuickViewModal;
