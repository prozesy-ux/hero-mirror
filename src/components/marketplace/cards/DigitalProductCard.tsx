import { Store, Star, Download, Layers, Palette } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ProductCardData } from './ProductCardRenderer';
import { cn } from '@/lib/utils';

interface DigitalProductCardProps {
  product: ProductCardData;
  onClick: () => void;
  variant?: 'default' | 'template';
}

const DigitalProductCard = ({
  product,
  onClick,
  variant = 'default',
}: DigitalProductCardProps) => {
  const isTemplate = variant === 'template';
  const themeColor = isTemplate ? 'purple' : 'emerald';

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white rounded-xl overflow-hidden border border-black/10 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-black/20 hover:-translate-y-0.5"
    >
      {/* Product Image */}
      <div className="relative overflow-hidden bg-slate-100">
        <AspectRatio ratio={1}>
          {product.iconUrl ? (
            <img
              src={product.iconUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className={cn(
              "w-full h-full flex items-center justify-center",
              isTemplate ? "bg-gradient-to-br from-purple-50 to-violet-100" : "bg-gradient-to-br from-amber-50 to-yellow-100"
            )}>
              {isTemplate ? (
                <Palette className="w-12 h-12 text-purple-300" />
              ) : (
                <Store className="w-12 h-12 text-amber-300" />
              )}
            </div>
          )}
        </AspectRatio>

        {/* Hover overlay with download icon */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm",
            isTemplate ? "bg-purple-500/90" : "bg-emerald-500/90"
          )}>
            <Download className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Instant Download Badge */}
        <div className={cn(
          "absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1",
          isTemplate 
            ? "bg-purple-100 text-purple-700" 
            : "bg-amber-100 text-amber-700"
        )}>
          {isTemplate ? (
            <>
              <Layers className="w-3 h-3" />
              Template
            </>
          ) : (
            <>
              <Download className="w-3 h-3" />
              Instant
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <h3 className="text-sm font-medium text-black line-clamp-2 mb-1 min-h-[2.5rem] leading-tight group-hover:text-black/80">
          {product.name}
        </h3>

        {/* Store Name */}
        {product.sellerName && (
          <p className="text-xs text-black/50 mb-2 truncate">by {product.sellerName}</p>
        )}

        {/* Price + Rating Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-bold",
              isTemplate ? "text-purple-600" : "text-emerald-600"
            )}>
              ${product.price.toFixed(0)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-black/40 line-through">
                ${product.originalPrice.toFixed(0)}
              </span>
            )}
          </div>

          {/* Rating or New badge */}
          {product.rating && product.rating > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium text-black">{product.rating.toFixed(1)}</span>
              {product.reviewCount && product.reviewCount > 0 && (
                <span className="text-xs text-black/40">({product.reviewCount})</span>
              )}
            </div>
          ) : (
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-medium",
              isTemplate 
                ? "bg-purple-50 text-purple-600" 
                : "bg-emerald-50 text-emerald-600"
            )}>
              New
            </span>
          )}
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
};

export default DigitalProductCard;
