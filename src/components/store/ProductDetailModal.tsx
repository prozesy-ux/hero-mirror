import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  ShoppingCart, 
  ExternalLink, 
  Users, 
  Package,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import StarRating from '@/components/reviews/StarRating';
import ImageGallery from '@/components/ui/image-gallery';
import { useIsMobile } from '@/hooks/use-mobile';
import { trackProductView } from '@/lib/analytics-tracker';

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
}

interface SellerProfile {
  id: string;
  store_name: string;
  store_logo_url: string | null;
  is_verified: boolean;
  total_orders?: number;
}

interface ProductDetailModalProps {
  product: SellerProduct | null;
  seller: SellerProfile | null;
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onChat?: () => void;
  onBuy?: () => void;
  onViewFull?: () => void;
  purchasing?: boolean;
  walletBalance?: number;
  userBalance?: number;
  isLoggedIn?: boolean;
}

const ProductDetailModal = ({
  product,
  seller,
  isOpen,
  open,
  onClose,
  onOpenChange,
  onChat,
  onBuy,
  onViewFull,
  purchasing = false,
  walletBalance,
  userBalance = 0,
  isLoggedIn = false
}: ProductDetailModalProps) => {
  const isDialogOpen = isOpen ?? open ?? false;
  const handleOpenChange = onOpenChange ?? ((open: boolean) => { if (!open && onClose) onClose(); });
  const balance = walletBalance ?? userBalance;
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const isMobile = useIsMobile();

  // Track product view when modal opens (using ref to prevent duplicate tracking)
  const viewTrackedRef = useRef<string | null>(null);
  useEffect(() => {
    if (isDialogOpen && product?.id && viewTrackedRef.current !== product.id) {
      viewTrackedRef.current = product.id;
      trackProductView(product.id);
    }
  }, [isDialogOpen, product?.id]);

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

  if (!product || !seller) return null;

  const hasEnoughBalance = balance >= product.price;
  const showChat = product.chat_allowed !== false;
  const productImages = product.images || [];

  // Mobile Bottom Sheet Content
  const ModalContent = () => (
    <>
      {/* Image Gallery Section */}
      <div className="relative">
        <ImageGallery
          images={productImages}
          mainImage={product.icon_url}
          alt={product.name}
          showThumbnails={productImages.length > 0}
          enableZoom={!isMobile}
          aspectRatio={isMobile ? "square" : "video"}
        />
        
        {/* View Full Button - Desktop only */}
        {onViewFull && !isMobile && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onViewFull}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm rounded-lg z-10"
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Full View
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 space-y-3 md:space-y-4">
        {/* Seller Info */}
        <div className="flex items-center gap-3 p-2.5 md:p-3 bg-slate-50 rounded-xl">
          <Avatar className="w-8 h-8 md:w-10 md:h-10 border-2 border-white shadow">
            <AvatarImage src={seller.store_logo_url || ''} />
            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold text-xs md:text-sm">
              {seller.store_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 text-sm truncate">{seller.store_name}</span>
              {seller.is_verified && (
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100 flex-shrink-0" />
              )}
            </div>
            <p className="text-[10px] md:text-xs text-slate-500">{seller.total_orders || 0} orders</p>
          </div>
        </div>

        {/* Product Title & Price */}
        <div>
          <h3 className="text-base md:text-xl font-bold text-slate-900 leading-tight">{product.name}</h3>
          <div className="flex items-center gap-3 md:gap-4 mt-1.5 md:mt-2">
            <span className="text-xl md:text-2xl font-bold text-emerald-600">${product.price}</span>
            <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-slate-500">
              {reviewCount > 0 ? (
                <>
                  <StarRating rating={averageRating} size="sm" />
                  <span>({reviewCount})</span>
                </>
              ) : (
                <span className="text-slate-400">No reviews</span>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {product.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="rounded-full bg-slate-100 text-slate-600 text-[10px] md:text-xs px-2 py-0.5">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Description */}
        {product.description && (
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed line-clamp-3 md:line-clamp-none">{product.description}</p>
        )}

        {/* Stats - Compact on mobile */}
        <div className="flex items-center gap-4 md:gap-6 py-2 md:py-3 border-t border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs md:text-sm text-slate-500">
            <Users className="w-3.5 md:w-4 h-3.5 md:h-4" />
            <span>{product.sold_count || 0} sold</span>
          </div>
          {isLoggedIn && (
            <div className="flex items-center gap-1.5 text-xs md:text-sm text-slate-500">
              <span>Balance: ${balance.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Fixed at bottom on mobile */}
      <div className={`flex gap-2 md:gap-3 px-4 md:px-6 pb-4 md:pb-6 ${isMobile ? 'sticky bottom-0 bg-white pt-2 border-t border-slate-100 safe-area-bottom' : ''}`}>
        {showChat && (
          <Button
            variant="outline"
            onClick={onChat}
            className="flex-1 rounded-xl border-slate-200 hover:bg-slate-50 text-xs md:text-sm h-11 md:h-auto"
          >
            <MessageCircle className="w-4 h-4 mr-1.5" />
            {isMobile ? 'Chat' : 'Chat with Seller'}
          </Button>
        )}
        <Button
          onClick={onBuy}
          disabled={purchasing}
          className={`flex-1 rounded-xl text-xs md:text-sm h-11 md:h-auto ${
            isLoggedIn && !hasEnoughBalance
              ? 'bg-amber-500 hover:bg-amber-600'
              : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
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

  // Mobile: Use Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[90vh] overflow-y-auto">
          <DrawerHeader className="sr-only">
            <DrawerTitle>{product.name}</DrawerTitle>
          </DrawerHeader>
          <ModalContent />
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>
        <ModalContent />
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
