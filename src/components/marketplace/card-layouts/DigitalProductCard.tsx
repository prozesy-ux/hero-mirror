import { Download, Star, Package } from 'lucide-react';
import { CardLayoutProps, getBorderRadiusClass } from '../card-types';
import { CARD_STYLE_PRESETS } from '../card-styles';
import { OptimizedImage } from '@/components/ui/optimized-image';

const DigitalProductCard = ({ product, settings, sellerName, onClick, onBuy, purchasing }: CardLayoutProps) => {
  const style = CARD_STYLE_PRESETS[settings.style] || CARD_STYLE_PRESETS.classic;
  const br = getBorderRadiusClass(settings.borderRadius);

  return (
    <div onClick={onClick} className={`group overflow-hidden cursor-pointer transition-all duration-300 ${br} ${style.container} ${style.hoverEffect}`}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <OptimizedImage src={product.icon_url} alt={product.name} aspectRatio="4/3" className="w-full h-full transition-transform duration-500 group-hover:scale-105" fallbackIcon={<Package className="h-12 w-12 text-slate-300" />} />
        {style.imageOverlay && <div className={`absolute inset-0 ${style.imageOverlay}`} />}
        {settings.showBadge && product.file_type && (
          <div className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold uppercase ${style.badge} ${br}`}>
            {product.file_type}
          </div>
        )}
        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow">
          <Download size={13} className="text-slate-600" />
        </div>
      </div>
      <div className="p-3">
        <h3 className={`text-sm leading-tight line-clamp-2 mb-1.5 ${style.title}`}>{product.name}</h3>
        {settings.showSellerName && sellerName && <p className="text-xs text-slate-500 mb-2 truncate">by {sellerName}</p>}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-lg ${style.price}`} style={{ color: settings.accentColor }}>${product.price}</span>
          {settings.showRating && (
            <div className="flex items-center gap-1">
              <Star size={11} className="text-amber-400 fill-amber-400" />
              <span className="text-xs text-slate-500">{product.sold_count || 0}</span>
            </div>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onBuy?.(); }}
          disabled={purchasing}
          className={`w-full py-2.5 ${br} text-sm font-semibold transition-all active:scale-95`}
          style={{ backgroundColor: settings.buttonColor, color: settings.buttonTextColor }}
        >
          {purchasing ? '...' : settings.buttonText}
        </button>
      </div>
    </div>
  );
};

export default DigitalProductCard;
