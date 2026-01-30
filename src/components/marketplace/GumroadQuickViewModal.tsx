import { X, ShoppingCart, MessageCircle, Eye, Store, BadgeCheck, Star, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface QuickViewProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  iconUrl: string | null;
  sellerName: string | null;
  sellerAvatar?: string | null;
  storeSlug: string | null;
  isVerified: boolean;
  soldCount?: number;
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
}

const GumroadQuickViewModal = ({
  open,
  onOpenChange,
  product,
  onBuy,
  onChat,
  onViewFull,
  isAuthenticated,
}: GumroadQuickViewModalProps) => {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white border-0 shadow-2xl rounded-2xl p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="md:w-1/2 bg-gradient-to-br from-gray-100 to-gray-200">
            <AspectRatio ratio={1}>
              {product.iconUrl ? (
                <img
                  src={product.iconUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Store className="w-16 h-16 text-black/20" />
                </div>
              )}
            </AspectRatio>
          </div>

          {/* Content */}
          <div className="md:w-1/2 p-6 flex flex-col">
            {/* Close button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors"
            >
              <X className="w-4 h-4 text-black" />
            </button>

            {/* Seller */}
            <div className="flex items-center gap-2 mb-4">
              {product.sellerAvatar ? (
                <img
                  src={product.sellerAvatar}
                  alt={product.sellerName || 'Seller'}
                  className="w-8 h-8 rounded-full object-cover border border-black/10"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {product.sellerName?.charAt(0) || 'S'}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium text-black/70">
                {product.sellerName || 'Uptoza'}
              </span>
              {product.isVerified && (
                <BadgeCheck className="w-4 h-4 text-pink-500" />
              )}
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-black mb-2">{product.name}</h2>

            {/* Rating & Sales */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-black">4.8</span>
              </div>
              {product.soldCount && product.soldCount > 0 && (
                <span className="text-sm text-black/50">
                  {product.soldCount.toLocaleString()} sold
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-black/60 line-clamp-3 mb-6">
                {product.description}
              </p>
            )}

            {/* Price */}
            <div className="mb-6">
              <span className="text-3xl font-bold text-black">${product.price}</span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={onBuy}
                className="w-full py-3 bg-pink-500 text-white font-semibold rounded-xl hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Buy Now
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={onChat}
                  className="flex-1 py-2.5 border-2 border-black/10 text-black font-medium rounded-xl hover:border-black/30 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  {isAuthenticated ? 'Chat' : 'Login to Chat'}
                </button>
                <button
                  onClick={onViewFull}
                  className="flex-1 py-2.5 border-2 border-black/10 text-black font-medium rounded-xl hover:border-black/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Full
                </button>
              </div>
            </div>

            {/* Store Link */}
            {product.storeSlug && (
              <a
                href={`/store/${product.storeSlug}`}
                className="mt-4 text-sm text-pink-500 hover:text-pink-600 flex items-center gap-1 justify-center"
              >
                Visit store
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GumroadQuickViewModal;
