import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  X, 
  ShoppingCart, 
  MessageCircle, 
  Eye, 
  Store, 
  BadgeCheck,
  Package,
  ChevronLeft,
  ChevronRight,
  Heart,
  Twitter,
  Facebook,
  Link as LinkIcon,
  ShieldCheck,
  Zap,
  Clock,
  Info,
  Loader2,
  Users
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import StarRating from '@/components/reviews/StarRating';
import { supabase } from '@/integrations/supabase/client';
import { trackProductView } from '@/lib/analytics-tracker';

interface QuickViewProduct {
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

interface GumroadQuickViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: QuickViewProduct | null;
  onBuy: () => void;
  onChat: () => void;
  onViewFull: () => void;
  isAuthenticated: boolean;
  walletBalance?: number;
  purchasing?: boolean;
}

const GumroadQuickViewModal = ({
  open,
  onOpenChange,
  product,
  onBuy,
  onChat,
  onViewFull,
  isAuthenticated,
  walletBalance = 0,
  purchasing = false,
}: GumroadQuickViewModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const isMobile = useIsMobile();

  // Track product view when modal opens
  const viewTrackedRef = useRef<string | null>(null);
  useEffect(() => {
    if (open && product?.id && viewTrackedRef.current !== product.id) {
      viewTrackedRef.current = product.id;
      trackProductView(product.id);
    }
  }, [open, product?.id]);

  useEffect(() => {
    if (product?.id) {
      fetchReviewStats();
      setCurrentImageIndex(0);
    }
  }, [product?.id]);

  const fetchReviewStats = async () => {
    if (!product?.id || product.type === 'ai') return;
    
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

  const getProductImages = () => {
    const images: string[] = [];
    if (product.iconUrl) images.push(product.iconUrl);
    if (product.images) images.push(...product.images);
    return images;
  };

  const productImages = getProductImages();

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => prev === 0 ? productImages.length - 1 : prev - 1);
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => prev === productImages.length - 1 ? 0 : prev + 1);
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
    const text = `Check out ${product.name}!`;

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

  // Mobile Drawer Content (vertical stack)
  const MobileContent = () => (
    <>
      {/* Image Gallery */}
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
      <div className="p-4 space-y-3">
        {/* Seller Info */}
        <div className="flex items-center gap-2.5 p-2.5 bg-black/5 rounded-xl">
          {product.sellerAvatar ? (
            <Avatar className="w-8 h-8 border border-black/10">
              <AvatarImage src={product.sellerAvatar} />
              <AvatarFallback className="bg-black text-white font-bold text-xs">
                {product.sellerName?.charAt(0) || 'S'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {product.sellerName?.charAt(0) || 'S'}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-black text-sm truncate">{product.sellerName || 'Uptoza'}</span>
              {product.isVerified && (
                <BadgeCheck className="w-3.5 h-3.5 text-black flex-shrink-0" />
              )}
            </div>
            <p className="text-[10px] text-black/50">{product.soldCount || 0} orders</p>
          </div>
        </div>

        {/* Product Title & Price */}
        <div>
          <h3 className="text-lg font-bold text-black leading-tight">{product.name}</h3>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="px-3 py-1 bg-black text-white text-lg font-bold rounded">${product.price}</span>
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
          <p className="text-xs text-black/70 leading-relaxed line-clamp-3">{product.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 py-2 border-t border-b border-black/10">
          <div className="flex items-center gap-1.5 text-xs text-black/50">
            <Users className="w-3.5 h-3.5" />
            <span>{product.soldCount || 0} sold</span>
          </div>
          {isAuthenticated && (
            <div className="flex items-center gap-1.5 text-xs text-black/50">
              <span>Balance: ${walletBalance.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Fixed at bottom */}
      <div className="flex gap-2 px-4 pb-4 sticky bottom-0 bg-white pt-2 border-t border-black/10 safe-area-bottom">
        <Button
          variant="outline"
          onClick={onChat}
          className="flex-1 rounded-xl border-2 border-black text-black hover:bg-black hover:text-white text-xs h-11"
        >
          <MessageCircle className="w-4 h-4 mr-1.5" />
          {isAuthenticated ? 'Chat' : 'Login to Chat'}
        </Button>
        <Button
          onClick={onBuy}
          disabled={purchasing}
          className="flex-1 rounded-xl bg-black hover:bg-black/90 text-white text-xs h-11"
        >
          {purchasing ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <ShoppingCart className="w-4 h-4 mr-1.5" />
          )}
          {isAuthenticated && !hasEnoughBalance ? 'Top Up' : 'Buy Now'}
        </Button>
      </div>
    </>
  );

  // Desktop Dialog Content (65/35 horizontal split)
  const DesktopContent = () => (
    <div className="flex flex-col lg:flex-row gap-4 max-h-[80vh] overflow-y-auto">
      {/* LEFT: Image Gallery (65%) */}
      <div className="lg:w-[65%]">
        <div className="bg-white rounded-xl overflow-hidden border border-black/10">
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
                <Package className="w-20 h-20 text-black/20" />
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
                    onClick={() => setCurrentImageIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full border border-black/20 ${
                      i === currentImageIndex ? 'bg-black' : 'bg-white'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {productImages.length > 1 && (
            <div className="flex gap-2 p-2.5 border-t border-black/10 overflow-x-auto">
              {productImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIndex(i)}
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
        <div className="mt-4 space-y-3">
          {/* Title */}
          <h2 className="text-xl font-bold text-black">{product.name}</h2>

          {/* Seller Info */}
          <div className="flex items-center gap-2.5">
            {product.sellerAvatar ? (
              <Avatar className="w-8 h-8 border border-black/10">
                <AvatarImage src={product.sellerAvatar} />
                <AvatarFallback className="bg-black text-white font-bold text-xs">
                  {product.sellerName?.charAt(0) || 'S'}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {product.sellerName?.charAt(0) || 'S'}
                </span>
              </div>
            )}
            <span className="font-medium text-black text-sm">{product.sellerName || 'Uptoza'}</span>
            {product.isVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 border border-black rounded-full text-xs font-medium text-black">
                <BadgeCheck className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>

          {/* Rating */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={averageRating} size="sm" />
              <span className="text-sm text-black/60">({reviewCount} reviews)</span>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-sm text-black/70 leading-relaxed">{product.description}</p>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-black/5 text-black/70 text-xs rounded-full border border-black/10">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Purchase Box (35%) */}
      <div className="lg:w-[35%]">
        <div className="bg-white rounded-xl p-4 border border-black/20 sticky top-0">
          {/* Price */}
          <div className="mb-3">
            <div className="inline-flex items-center px-4 py-2 bg-black text-white text-xl font-bold rounded">
              ${product.price}
            </div>
          </div>

          {/* Wallet Balance */}
          {isAuthenticated && (
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
            className="w-full h-11 bg-black hover:bg-black/90 text-white font-semibold rounded-lg mb-3"
          >
            {purchasing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4 mr-2" />
            )}
            {isAuthenticated && !hasEnoughBalance ? 'Top Up & Buy' : 'Buy Now'}
          </Button>

          {/* Chat Button */}
          <Button
            onClick={onChat}
            variant="outline"
            className="w-full h-10 rounded-lg border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors mb-3"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            {isAuthenticated ? 'Chat with Seller' : 'Login to Chat'}
          </Button>

          {/* View Full Button */}
          <Button
            onClick={onViewFull}
            variant="outline"
            className="w-full h-10 rounded-lg border border-black/20 text-black/70 hover:bg-black/5 mb-3"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Full Details
          </Button>

          {/* Sales Count */}
          <div className="flex items-center gap-2 text-xs text-black/60 mb-3 pb-3 border-b border-black/20">
            <Info className="w-3.5 h-3.5 text-black/40" />
            <span>{(product.soldCount || 0).toLocaleString()} sales</span>
          </div>

          {/* Features */}
          <div className="mb-3 pb-3 border-b border-black/20">
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-black/5 rounded text-[10px] text-black/70">
                <ShieldCheck className="w-3 h-3" />
                Secure
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-black/5 rounded text-[10px] text-black/70">
                <Zap className="w-3 h-3" />
                Instant
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-black/5 rounded text-[10px] text-black/70">
                <Clock className="w-3 h-3" />
                24/7
              </span>
            </div>
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className="flex items-center gap-1.5 text-xs text-black/60 hover:text-black mb-3"
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            {isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          </button>

          {/* Share */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-black/50">Share:</span>
            <button
              onClick={() => handleShare('twitter')}
              className="p-1.5 text-black/40 hover:text-black rounded transition-colors"
            >
              <Twitter className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleShare('facebook')}
              className="p-1.5 text-black/40 hover:text-black rounded transition-colors"
            >
              <Facebook className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleShare('copy')}
              className="p-1.5 text-black/40 hover:text-black rounded transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Store Link */}
          {product.storeSlug && (
            <a
              href={`/store/${product.storeSlug}`}
              className="mt-4 text-xs text-black/60 hover:text-black flex items-center gap-1 justify-center border-t border-black/10 pt-3"
            >
              <Store className="w-3.5 h-3.5" />
              Visit store
            </a>
          )}
        </div>
      </div>
    </div>
  );

  // Mobile: use Drawer, Desktop: use Dialog
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] bg-white">
          <MobileContent />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-white border-0 shadow-2xl rounded-2xl p-4 overflow-hidden">
        <DesktopContent />
      </DialogContent>
    </Dialog>
  );
};

export default GumroadQuickViewModal;
