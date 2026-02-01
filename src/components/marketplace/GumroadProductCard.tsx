import { Store, Star } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import ProductTypeBadge from './ProductTypeBadge';

interface GumroadProductCardProps {
  id: string;
  name: string;
  price: number;
  iconUrl: string | null;
  sellerName: string | null;
  sellerAvatar?: string | null;
  storeSlug: string | null;
  isVerified: boolean;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  type: 'ai' | 'seller';
  productType?: string;
  onClick: () => void;
}

const GumroadProductCard = ({
  name,
  price,
  iconUrl,
  sellerName,
  rating,
  reviewCount,
  productType,
  onClick,
}: GumroadProductCardProps) => {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white rounded-xl overflow-hidden border border-black/10 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-black/20 hover:-translate-y-0.5"
    >
      {/* Product Image - Square-ish aspect ratio */}
      <div className="relative overflow-hidden bg-gray-100">
        <AspectRatio ratio={1}>
          {iconUrl ? (
            <img
              src={iconUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
              <Store className="w-12 h-12 text-black/10" />
            </div>
          )}
        </AspectRatio>
        
        {/* Product Type Badge */}
        {productType && productType !== 'digital_product' && (
          <div className="absolute top-2 left-2">
            <ProductTypeBadge type={productType} size="sm" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <h3 className="text-sm font-medium text-black line-clamp-2 mb-1 min-h-[2.5rem] leading-tight">
          {name}
        </h3>

        {/* Store Name */}
        {sellerName && (
          <p className="text-xs text-black/50 mb-2 truncate">by {sellerName}</p>
        )}

        {/* Price + Rating Row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-black">${price.toFixed(0)}</span>
          
          {/* Rating or New badge */}
          {rating && rating > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium text-black">{rating.toFixed(1)}</span>
              {reviewCount && reviewCount > 0 && (
                <span className="text-xs text-black/40">({reviewCount})</span>
              )}
            </div>
          ) : (
            <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium">
              New
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default GumroadProductCard;
