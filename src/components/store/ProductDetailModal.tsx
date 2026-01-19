import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* Image Gallery Section */}
        <div className="relative">
          <ImageGallery
            images={productImages}
            mainImage={product.icon_url}
            alt={product.name}
            showThumbnails={productImages.length > 0}
            enableZoom={true}
            aspectRatio="video"
          />
          
          {/* View Full Button */}
          {onViewFull && (
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
        <div className="p-6 space-y-4">
          {/* Seller Info */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <Avatar className="w-10 h-10 border-2 border-white shadow">
              <AvatarImage src={seller.store_logo_url || ''} />
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold">
                {seller.store_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{seller.store_name}</span>
                {seller.is_verified && (
                  <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                )}
              </div>
              <p className="text-xs text-slate-500">{seller.total_orders || 0} orders completed</p>
            </div>
          </div>

          {/* Product Title & Price */}
          <div>
            <DialogHeader className="text-left p-0">
              <DialogTitle className="text-xl font-bold text-slate-900">{product.name}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-2xl font-bold text-emerald-600">${product.price}</span>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                {reviewCount > 0 ? (
                  <>
                    <StarRating rating={averageRating} size="sm" />
                    <span>({reviewCount})</span>
                  </>
                ) : (
                  <span className="text-slate-400">No reviews yet</span>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="rounded-full bg-slate-100 text-slate-600 text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 py-3 border-t border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users className="w-4 h-4" />
              <span>{product.sold_count || 0} sold</span>
            </div>
            {isLoggedIn && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Your Balance: ${balance.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {showChat && (
              <Button
                variant="outline"
                onClick={onChat}
                className="flex-1 rounded-xl border-slate-200 hover:bg-slate-50"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat with Seller
              </Button>
            )}
            <Button
              onClick={onBuy}
              disabled={purchasing}
              className={`flex-1 rounded-xl ${
                isLoggedIn && !hasEnoughBalance
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              {purchasing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4 mr-2" />
              )}
              {isLoggedIn && !hasEnoughBalance ? 'Top Up & Buy' : 'Buy Now'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
