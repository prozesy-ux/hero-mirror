import { Store } from 'lucide-react';
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
  onClick,
}: GumroadProductCardProps) => {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md"
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
      </div>

      {/* Content - Minimal Gumroad style */}
      <div className="p-3">
        {/* Title */}
        <h3 className="text-sm font-medium text-black line-clamp-2 mb-1 min-h-[2.5rem] leading-tight">
          {name}
        </h3>

        {/* Price - Simple */}
        <span className="text-sm font-semibold text-black">${price.toFixed(0)}</span>
      </div>
    </button>
  );
};

export default GumroadProductCard;
