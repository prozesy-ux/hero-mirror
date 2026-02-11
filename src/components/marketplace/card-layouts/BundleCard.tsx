import { Layers, Star, Package } from 'lucide-react';
import { CardLayoutProps, getBorderRadiusClass } from '../card-types';
import { CARD_STYLE_PRESETS } from '../card-styles';
import { OptimizedImage } from '@/components/ui/optimized-image';

const BundleCard = ({ product, settings, sellerName, onClick, onBuy, purchasing }: CardLayoutProps) => {
  const style = CARD_STYLE_PRESETS[settings.style] || CARD_STYLE_PRESETS.classic;
  const br = getBorderRadiusClass(settings.borderRadius);

  return (
    <div onClick={onClick} className={`group overflow-hidden cursor-pointer transition-all duration-300 ${br} ${style.container} ${style.hoverEffect}`}>
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* Stacked effect */}
        <div className="absolute inset-0 top-1 left-1 right-1 bottom-1 bg-slate-200 rounded opacity-60 translate-x-1 translate-y-1" />
        <div className="absolute inset-0 top-0.5 left-0.5 right-0.5 bottom-0.5 bg-slate-100 rounded opacity-80 translate-x-0.5 translate-y-0.5" />
        <div className="relative w-full h-full">
          <OptimizedImage src={product.icon_url} alt={product.name} aspectRatio="4/3" className="w-full h-full transition-transform duration-500 group-hover:scale-105" fallbackIcon={<Package className="h-12 w-12 text-slate-300" />} />
        </div>
        {style.imageOverlay && <div className={`absolute inset-0 ${style.imageOverlay}`} />}
        <div className={`absolute top-2 left-2 px-2 py-1 text-[10px] font-bold ${style.badge} ${br} flex items-center gap-1`}>
          <Layers size={10} /> {product.bundle_items || 0} items
        </div>
      </div>
      <div className="p-3">
        <h3 className={`text-sm leading-tight line-clamp-2 mb-1.5 ${style.title}`}>{product.name}</h3>
        {settings.showSellerName && sellerName && <p className="text-xs text-slate-500 mb-2 truncate">by {sellerName}</p>}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-lg ${style.price}`} style={{ color: settings.accentColor }}>${product.price}</span>
          {settings.showRating && <div className="flex items-center gap-1"><Star size={11} className="text-amber-400 fill-amber-400" /><span className="text-xs text-slate-500">{product.sold_count || 0}</span></div>}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onBuy?.(); }} disabled={purchasing}
          className={`w-full py-2.5 ${br} text-sm font-semibold transition-all active:scale-95`}
          style={{ backgroundColor: settings.buttonColor, color: settings.buttonTextColor }}>
          {purchasing ? '...' : (settings.buttonText === 'Buy' ? 'Get Bundle' : settings.buttonText)}
        </button>
      </div>
    </div>
  );
};

export default BundleCard;
