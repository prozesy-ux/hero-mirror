import { Package, Star, Layers, Gift, Sparkles } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ProductCardProps } from './ProductCardRenderer';
import { cn } from '@/lib/utils';

const BundleCard = ({
  product,
  onClick,
}: ProductCardProps) => {
  const itemCount = product.itemCount || 3;
  const includedItems = product.includedItems || [];
  const savings = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-gradient-to-br from-pink-50 via-fuchsia-50 to-purple-50 rounded-xl overflow-hidden border border-pink-200/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-pink-300 hover:-translate-y-1"
    >
      {/* Stacked cards effect */}
      <div className="relative p-4 pb-2">
        {/* Background stacked cards */}
        <div className="relative mx-auto w-full max-w-[180px]">
          {/* Third card (back) */}
          <div className="absolute top-4 left-4 right-4 h-28 bg-purple-200/50 rounded-lg transform rotate-3 shadow-sm" />
          
          {/* Second card (middle) */}
          <div className="absolute top-2 left-2 right-2 h-28 bg-fuchsia-200/70 rounded-lg transform -rotate-2 shadow-sm" />
          
          {/* Main card (front) */}
          <div className="relative rounded-xl overflow-hidden shadow-lg border border-pink-200/50 bg-white">
            <AspectRatio ratio={4/3}>
              {product.iconUrl ? (
                <img
                  src={product.iconUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-100 to-fuchsia-200">
                  <Package className="w-12 h-12 text-pink-400" />
                </div>
              )}
            </AspectRatio>
          </div>

          {/* Item count badge */}
          <div className="absolute -top-1 -right-1 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 z-10">
            <Layers className="w-3.5 h-3.5" />
            {itemCount} Items
          </div>

          {/* Savings badge */}
          {savings > 0 && (
            <div className="absolute -bottom-1 -left-1 px-2.5 py-1 bg-green-500 text-white rounded-full text-[10px] font-bold shadow-lg flex items-center gap-1 z-10">
              <Sparkles className="w-3 h-3" />
              Save {savings}%
            </div>
          )}
        </div>

        {/* Bundle badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-full text-[10px] font-semibold flex items-center gap-1.5 shadow-lg">
          <Gift className="w-3.5 h-3.5" />
          Bundle
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        {/* Title */}
        <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 mb-1 min-h-[2.5rem] leading-tight group-hover:text-pink-700 transition-colors text-center">
          {product.name}
        </h3>

        {/* Seller */}
        {product.sellerName && (
          <p className="text-xs text-pink-600/60 mb-2 truncate text-center">
            by {product.sellerName}
          </p>
        )}

        {/* Included items preview */}
        {includedItems.length > 0 && (
          <div className="mb-3 p-2 bg-white/80 rounded-lg border border-pink-100">
            <p className="text-[10px] font-medium text-pink-600 mb-1">Includes:</p>
            <div className="flex flex-wrap gap-1">
              {includedItems.slice(0, 3).map((item, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded">
                  {item}
                </span>
              ))}
              {includedItems.length > 3 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-pink-200 text-pink-800 rounded font-medium">
                  +{includedItems.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Rating */}
        {product.rating && product.rating > 0 && (
          <div className="flex items-center justify-center gap-1 mb-3">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium text-slate-800">{product.rating.toFixed(1)}</span>
            {product.reviewCount && (
              <span className="text-xs text-slate-400">({product.reviewCount})</span>
            )}
          </div>
        )}

        {/* Price & CTA */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">
                ${product.originalPrice.toFixed(0)}
              </span>
            )}
            <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-fuchsia-600 bg-clip-text text-transparent">
              ${product.price.toFixed(0)}
            </span>
          </div>
          <div className="px-4 py-2 bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg">
            <Gift className="w-3.5 h-3.5" />
            Get Bundle
          </div>
        </div>
      </div>
    </button>
  );
};

export default BundleCard;
