import { Star, Store } from 'lucide-react';

interface FeaturedBannerCardProps {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  iconUrl: string | null;
  sellerName: string | null;
  sellerAvatar?: string | null;
  isVerified: boolean;
  rating?: number;
  reviewCount?: number;
  onClick: () => void;
}

const FeaturedBannerCard = ({
  name,
  description,
  price,
  iconUrl,
  sellerName,
  sellerAvatar,
  rating = 4.8,
  reviewCount = 0,
  onClick,
}: FeaturedBannerCardProps) => {
  // Format review count like "17.5K"
  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex bg-white rounded-lg overflow-hidden transition-all duration-200 hover:shadow-lg text-left"
    >
      {/* Left - Image (~40% width) */}
      <div className="w-[40%] flex-shrink-0 relative overflow-hidden bg-gray-100">
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
            <Store className="w-16 h-16 text-black/10" />
          </div>
        )}
      </div>

      {/* Right - Content (~60% width) */}
      <div className="flex-1 p-5 flex flex-col justify-between min-h-[180px]">
        {/* Top content */}
        <div>
          {/* Title */}
          <h3 className="text-lg font-bold text-black line-clamp-2 mb-2">
            {name}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-sm text-black/60 line-clamp-2 mb-3">
              {description}
            </p>
          )}

          {/* Seller */}
          <div className="flex items-center gap-2">
            {sellerAvatar ? (
              <img
                src={sellerAvatar}
                alt={sellerName || 'Seller'}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">
                  {sellerName?.charAt(0) || 'S'}
                </span>
              </div>
            )}
            <span className="text-sm text-black/70">{sellerName || 'Uptoza'}</span>
          </div>
        </div>

        {/* Bottom - Price and Rating badges */}
        <div className="flex items-center justify-between mt-4">
          {/* Price badge */}
          <span className="px-3 py-1.5 bg-white border border-black/10 rounded-full text-sm font-semibold text-black">
            ${price.toFixed(0)}+
          </span>

          {/* Rating badge */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-white border border-black/10 rounded-full">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-black">{rating.toFixed(1)}</span>
              <span className="text-sm text-black/50">({formatCount(reviewCount)})</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

export default FeaturedBannerCard;
