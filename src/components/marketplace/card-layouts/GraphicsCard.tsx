import { Image, Star, Package } from 'lucide-react';
import { CardLayoutProps, getBorderRadiusClass } from '../card-types';
import { CARD_STYLE_PRESETS } from '../card-styles';
import { OptimizedImage } from '@/components/ui/optimized-image';

const GraphicsCard = ({ product, settings, sellerName, onClick, onBuy, purchasing }: CardLayoutProps) => {
  const style = CARD_STYLE_PRESETS[settings.style] || CARD_STYLE_PRESETS.classic;
  const br = getBorderRadiusClass(settings.borderRadius);

  return (
    <div onClick={onClick} className={`group overflow-hidden cursor-pointer transition-all duration-300 ${br} ${style.container} ${style.hoverEffect}`}>
      <div className="relative aspect-square overflow-hidden">
        <OptimizedImage src={product.icon_url} alt={product.name} aspectRatio="square" className="w-full h-full transition-transform duration-500 group-hover:scale-105" fallbackIcon={<Package className="h-12 w-12 text-slate-300" />} />
        {style.imageOverlay && <div className={`absolute inset-0 ${style.imageOverlay}`} />}
        {/* Color palette strip */}
        <div className="absolute bottom-0 left-0 right-0 flex h-2">
          <div className="flex-1 bg-rose-400" />
          <div className="flex-1 bg-amber-400" />
          <div className="flex-1 bg-emerald-400" />
          <div className="flex-1 bg-blue-400" />
          <div className="flex-1 bg-violet-400" />
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
          {purchasing ? '...' : (settings.buttonText === 'Buy' ? 'Download' : settings.buttonText)}
        </button>
      </div>
    </div>
  );
};

export default GraphicsCard;
