import { Coffee, Heart, Star, Package } from 'lucide-react';
import { CardLayoutProps, getBorderRadiusClass } from '../card-types';
import { CARD_STYLE_PRESETS } from '../card-styles';
import { OptimizedImage } from '@/components/ui/optimized-image';

const CoffeeCard = ({ product, settings, sellerName, onClick, onBuy, purchasing }: CardLayoutProps) => {
  const style = CARD_STYLE_PRESETS[settings.style] || CARD_STYLE_PRESETS.classic;
  const br = getBorderRadiusClass(settings.borderRadius);

  return (
    <div onClick={onClick} className={`group overflow-hidden cursor-pointer transition-all duration-300 ${br} ${style.container} ${style.hoverEffect}`}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <OptimizedImage src={product.icon_url} alt={product.name} aspectRatio="4/3" className="w-full h-full transition-transform duration-500 group-hover:scale-105" fallbackIcon={<Coffee className="h-12 w-12 text-amber-300" />} />
        {style.imageOverlay && <div className={`absolute inset-0 ${style.imageOverlay}`} />}
        <div className={`absolute top-2 left-2 px-2 py-1 text-[10px] font-bold ${style.badge} ${br} flex items-center gap-1`}>
          <Coffee size={10} /> Tip Jar
        </div>
      </div>
      <div className="p-3">
        <h3 className={`text-sm leading-tight line-clamp-2 mb-1.5 ${style.title}`}>{product.name}</h3>
        {settings.showSellerName && sellerName && <p className="text-xs text-slate-500 mb-2 truncate">by {sellerName}</p>}
        {/* Suggested amounts */}
        <div className="flex gap-1.5 mb-3">
          {[3, 5, 10].map(amt => (
            <button key={amt} onClick={(e) => e.stopPropagation()} className={`flex-1 py-1.5 text-xs font-medium border border-slate-200 ${br} hover:bg-slate-50 transition-colors`}>
              ${amt}
            </button>
          ))}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onBuy?.(); }} disabled={purchasing}
          className={`w-full py-2.5 ${br} text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5`}
          style={{ backgroundColor: settings.buttonColor, color: settings.buttonTextColor }}>
          <Heart size={14} />
          {purchasing ? '...' : (settings.buttonText === 'Buy' ? 'Support' : settings.buttonText)}
        </button>
      </div>
    </div>
  );
};

export default CoffeeCard;
