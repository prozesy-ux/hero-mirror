import { Heart, Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface GigCardProps {
  id: string;
  title: string;
  imageUrl: string | null;
  sellerName: string;
  sellerAvatar?: string | null;
  sellerLevel?: string;
  rating: number;
  reviewCount: number;
  price: number;
  originalPrice?: number;
  currency?: string;
  onView?: () => void;
  onFavorite?: () => void;
  isFavorited?: boolean;
  badge?: string;
  className?: string;
}

const GigCard = ({
  id,
  title,
  imageUrl,
  sellerName,
  sellerAvatar,
  sellerLevel,
  rating,
  reviewCount,
  price,
  originalPrice,
  currency = '$',
  onView,
  onFavorite,
  isFavorited = false,
  badge,
  className,
}: GigCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatPrice = (amount: number) => {
    return `${currency}${amount.toLocaleString()}`;
  };

  const formatReviewCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div
      className={cn(
        "group bg-white rounded-lg overflow-hidden border border-slate-200",
        "hover:shadow-gig-hover hover:border-emerald-400 transition-all duration-300",
        "cursor-pointer",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onView}
    >
      {/* Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={title}
            className={cn(
              "w-full h-full object-cover transition-transform duration-500",
              isHovered && "scale-105"
            )}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <span className="text-slate-400 text-sm">No image</span>
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite?.();
          }}
          className={cn(
            "absolute top-3 right-3 w-8 h-8 rounded-full shadow-md",
            "flex items-center justify-center transition-all duration-200",
            "hover:scale-110",
            isFavorited
              ? "bg-rose-500 text-white"
              : "bg-white/90 backdrop-blur text-slate-600 hover:text-rose-500"
          )}
        >
          <Heart className={cn("w-4 h-4", isFavorited && "fill-current")} />
        </button>

        {/* Badge */}
        {badge && (
          <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-semibold bg-amber-400 text-slate-900">
            {badge}
          </div>
        )}
      </div>

      {/* Seller Info Row */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        {sellerAvatar ? (
          <img
            src={sellerAvatar}
            alt={sellerName}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <span className="text-white text-xs font-medium">
              {sellerName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="text-sm font-medium text-slate-700 truncate flex-1">
          {sellerName}
        </span>
        {sellerLevel && (
          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
            {sellerLevel}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-slate-900 line-clamp-2 leading-snug hover:text-emerald-600 transition-colors text-[15px]">
          {title}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mt-2.5">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="font-bold text-sm text-slate-900">{rating.toFixed(1)}</span>
          <span className="text-slate-400 text-sm">({formatReviewCount(reviewCount)})</span>
        </div>
      </div>

      {/* Footer - Price */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
        <span className="text-[11px] text-slate-500 uppercase tracking-wide font-medium">
          Starting at
        </span>
        <div className="flex items-center gap-2">
          {originalPrice && originalPrice > price && (
            <span className="text-sm text-slate-400 line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
          <span className="text-lg font-bold text-slate-900">
            {formatPrice(price)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GigCard;
