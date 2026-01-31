import { Store } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { useIsMobile } from '@/hooks/use-mobile';
import ProductHoverPreview from './ProductHoverPreview';

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
  // Hover preview props
  description?: string | null;
  tags?: string[] | null;
  chatAllowed?: boolean;
  onBuy?: () => void;
  onChat?: () => void;
  onViewFull?: () => void;
  isAuthenticated?: boolean;
}

const GumroadProductCard = ({
  id,
  name,
  price,
  iconUrl,
  sellerName,
  sellerAvatar,
  storeSlug,
  isVerified,
  rating,
  reviewCount,
  soldCount,
  type,
  onClick,
  description,
  tags,
  chatAllowed,
  onBuy,
  onChat,
  onViewFull,
  isAuthenticated = false,
}: GumroadProductCardProps) => {
  const isMobile = useIsMobile();

  const CardContent = () => (
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

  // On mobile, just render the card without hover
  if (isMobile) {
    return <CardContent />;
  }

  // On desktop, wrap with HoverCard
  return (
    <HoverCard openDelay={300} closeDelay={150}>
      <HoverCardTrigger asChild>
        <div>
          <CardContent />
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-auto p-0 border border-black/10 shadow-xl rounded-xl"
      >
        <ProductHoverPreview
          product={{
            id,
            name,
            description,
            price,
            iconUrl,
            sellerName,
            sellerAvatar,
            storeSlug,
            isVerified,
            soldCount,
            rating,
            reviewCount,
            tags,
            chatAllowed,
          }}
          onBuy={onBuy || (() => {})}
          onChat={onChat || (() => {})}
          onViewFull={onViewFull || onClick}
          isAuthenticated={isAuthenticated}
        />
      </HoverCardContent>
    </HoverCard>
  );
};

export default GumroadProductCard;
