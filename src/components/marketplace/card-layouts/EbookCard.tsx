import { BookText, Star, Package } from 'lucide-react';
import { CardLayoutProps, getBorderRadiusClass } from '../card-types';
import { CARD_STYLE_PRESETS } from '../card-styles';
import { OptimizedImage } from '@/components/ui/optimized-image';

const EbookCard = ({ product, settings, sellerName, onClick, onBuy, purchasing }: CardLayoutProps) => {
  const style = CARD_STYLE_PRESETS[settings.style] || CARD_STYLE_PRESETS.classic;
  const br = getBorderRadiusClass(settings.borderRadius);

  return (
    <div onClick={onClick} className={`group overflow-hidden cursor-pointer transition-all duration-300 ${br} ${style.container} ${style.hoverEffect}`}>
      <div className="relative aspect-[3/4] overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 p-6">
        <div className="w-full h-full [perspective:600px]">
          <div className="w-full h-full transition-transform duration-500 group-hover:[transform:rotateY(-8deg)] shadow-xl rounded-md overflow-hidden">
            <OptimizedImage src={product.icon_url} alt={product.name} aspectRatio="3/2" className="w-full h-full object-cover" fallbackIcon={<BookText className="h-12 w-12 text-slate-300" />} />
          </div>
        </div>
        {style.imageOverlay && <div className={`absolute inset-0 ${style.imageOverlay}`} />}
        {settings.showBadge && product.page_count && (
          <div className={`absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-bold ${style.badge} ${br}`}>
            {product.page_count} pages
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className={`text-sm leading-tight line-clamp-2 mb-1.5 ${style.title}`}>{product.name}</h3>
        {settings.showSellerName && sellerName && <p className="text-xs text-slate-500 mb-2 truncate">by {sellerName}</p>}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-lg ${style.price}`} style={{ color: settings.accentColor }}>${product.price}</span>
          {settings.showRating && <div className="flex items-center gap-1"><Star size={11} className="text-amber-400 fill-amber-400" /><span className="text-xs text-slate-500">{product.rating?.toFixed(1) || '0'}</span></div>}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onBuy?.(); }} disabled={purchasing}
          className={`w-full py-2.5 ${br} text-sm font-semibold transition-all active:scale-95`}
          style={{ backgroundColor: settings.buttonColor, color: settings.buttonTextColor }}>
          {purchasing ? '...' : (settings.buttonText === 'Buy' ? 'Read Now' : settings.buttonText)}
        </button>
      </div>
    </div>
  );
};

export default EbookCard;
