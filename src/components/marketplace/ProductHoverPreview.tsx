import { Store, Users, MessageCircle, ShoppingCart, BadgeCheck, ExternalLink, Package } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StarRating from '@/components/reviews/StarRating';

interface ProductHoverPreviewProps {
  product: {
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
    rating?: number;
    reviewCount?: number;
    tags?: string[] | null;
    chatAllowed?: boolean;
  };
  onBuy: () => void;
  onChat: () => void;
  onViewFull: () => void;
  isAuthenticated: boolean;
}

const ProductHoverPreview = ({
  product,
  onBuy,
  onChat,
  onViewFull,
  isAuthenticated
}: ProductHoverPreviewProps) => {
  const showChat = product.chatAllowed !== false;

  return (
    <div className="w-[380px] bg-white rounded-xl overflow-hidden">
      {/* Horizontal 50/50 layout */}
      <div className="flex">
        {/* Left: Image */}
        <div className="w-1/2 aspect-square bg-gray-50 relative overflow-hidden">
          {product.iconUrl ? (
            <img
              src={product.iconUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-black/10" />
            </div>
          )}
        </div>

        {/* Right: Content */}
        <div className="w-1/2 p-3 flex flex-col">
          {/* Seller Info */}
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="w-6 h-6 border border-black/10">
              <AvatarImage src={product.sellerAvatar || ''} />
              <AvatarFallback className="bg-black text-white text-[10px] font-bold">
                {product.sellerName?.charAt(0) || 'S'}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-xs font-medium text-black truncate">
                {product.sellerName || 'Store'}
              </span>
              {product.isVerified && (
                <BadgeCheck className="w-3 h-3 text-black flex-shrink-0" />
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-bold text-black line-clamp-2 mb-1.5 leading-tight">
            {product.name}
          </h3>

          {/* Price Badge */}
          <div className="mb-2">
            <span className="inline-block px-2.5 py-1 bg-black text-white text-sm font-bold rounded">
              ${product.price}
            </span>
          </div>

          {/* Rating & Stats */}
          <div className="flex items-center gap-2 mb-2 text-xs text-black/50">
            {(product.rating || 0) > 0 && (
              <div className="flex items-center gap-1">
                <StarRating rating={product.rating || 0} size="sm" />
                {product.reviewCount && <span>({product.reviewCount})</span>}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{product.soldCount || 0} sold</span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-[11px] text-black/60 line-clamp-2 mb-2 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {product.tags.slice(0, 2).map(tag => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="px-1.5 py-0 text-[9px] bg-black/5 text-black/60 border-black/10"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action Buttons */}
          <div className="space-y-1.5 mt-auto">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onBuy();
              }}
              className="w-full h-8 bg-black hover:bg-black/90 text-white text-xs font-semibold rounded-lg"
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              Buy Now
            </Button>

            <div className="flex gap-1.5">
              {showChat && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onChat();
                  }}
                  variant="outline"
                  className="flex-1 h-7 text-xs rounded-lg border-black/20 hover:bg-black hover:text-white"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Chat
                </Button>
              )}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewFull();
                }}
                variant="outline"
                className="flex-1 h-7 text-xs rounded-lg border-black/20 hover:bg-black hover:text-white"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Full View
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductHoverPreview;
