import { Music, Star, Package } from 'lucide-react';
import { CardLayoutProps, getBorderRadiusClass } from '../card-types';
import { CARD_STYLE_PRESETS } from '../card-styles';
import { OptimizedImage } from '@/components/ui/optimized-image';

const AudioCard = ({ product, settings, sellerName, onClick, onBuy, purchasing }: CardLayoutProps) => {
  const style = CARD_STYLE_PRESETS[settings.style] || CARD_STYLE_PRESETS.classic;
  const br = getBorderRadiusClass(settings.borderRadius);

  return (
    <div onClick={onClick} className={`group overflow-hidden cursor-pointer transition-all duration-300 ${br} ${style.container} ${style.hoverEffect}`}>
      <div className="relative aspect-square overflow-hidden">
        <OptimizedImage src={product.icon_url} alt={product.name} aspectRatio="square" className="w-full h-full transition-transform duration-500 group-hover:scale-105" fallbackIcon={<Package className="h-12 w-12 text-slate-300" />} />
        {style.imageOverlay && <div className={`absolute inset-0 ${style.imageOverlay}`} />}
        {/* Waveform bars */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-center gap-[2px] h-10 px-3 pb-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex-1 bg-white/80 rounded-t-sm" style={{ height: `${Math.random() * 70 + 30}%` }} />
          ))}
        </div>
        {product.duration && (
          <div className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold ${style.badge} ${br}`}>
            {product.duration}
          </div>
        )}
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
          {purchasing ? '...' : (settings.buttonText === 'Buy' ? 'Listen' : settings.buttonText)}
        </button>
      </div>
    </div>
  );
};

export default AudioCard;
