import { Star, Store, BadgeCheck } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

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
  onClick: () => void;
}

const GumroadProductCard = ({
  name,
  price,
  iconUrl,
  sellerName,
  sellerAvatar,
  isVerified,
  rating = 4.5,
  reviewCount = 0,
  soldCount = 0,
  onClick,
}: GumroadProductCardProps) => {
  // Format review count like "1.2k"
  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white rounded-xl border-2 border-black/5 hover:border-black/20 overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
    >
      {/* Product Image */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <AspectRatio ratio={16 / 10}>
          {iconUrl ? (
            <img
              src={iconUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
              <Store className="w-12 h-12 text-black/20" />
            </div>
          )}
        </AspectRatio>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Seller Row */}
        <div className="flex items-center gap-2 mb-2">
          {sellerAvatar ? (
            <img
              src={sellerAvatar}
              alt={sellerName || 'Seller'}
              className="w-6 h-6 rounded-full object-cover border border-black/10"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">
                {sellerName?.charAt(0) || 'S'}
              </span>
            </div>
          )}
          <span className="text-xs font-medium text-black/60 truncate">
            {sellerName || 'Uptoza'}
          </span>
          {isVerified && (
            <BadgeCheck className="w-3.5 h-3.5 text-pink-500 flex-shrink-0" />
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-black line-clamp-2 mb-2 min-h-[2.5rem]">
          {name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="ml-1 text-xs font-semibold text-black">
              {rating.toFixed(1)}
            </span>
          </div>
          {reviewCount > 0 && (
            <span className="text-xs text-black/40">
              ({formatCount(reviewCount)})
            </span>
          )}
          {soldCount > 0 && (
            <span className="text-xs text-black/40 ml-auto">
              {formatCount(soldCount)} sold
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-black/50">Starting at</span>
          <span className="text-lg font-bold text-black">${price.toFixed(0)}</span>
        </div>
      </div>
    </button>
  );
};

export default GumroadProductCard;
