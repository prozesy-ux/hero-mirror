import { Coffee, Heart, Sparkles, Star } from 'lucide-react';
import { ProductCardProps } from './ProductCardRenderer';
import { cn } from '@/lib/utils';

const TipCard = ({
  product,
  onClick,
}: ProductCardProps) => {
  const supporterCount = product.soldCount || 0;

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 rounded-2xl overflow-hidden border border-teal-200/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-teal-300 hover:-translate-y-1"
    >
      {/* Compact tip jar design */}
      <div className="p-6">
        {/* Avatar/Icon area */}
        <div className="flex flex-col items-center mb-4">
          {/* Seller avatar with heart decoration */}
          <div className="relative mb-3">
            {product.sellerAvatar ? (
              <img 
                src={product.sellerAvatar} 
                alt={product.sellerName || 'Creator'}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-teal-200 group-hover:ring-teal-300 transition-all"
              />
            ) : product.iconUrl ? (
              <img 
                src={product.iconUrl} 
                alt={product.name}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-teal-200 group-hover:ring-teal-300 transition-all"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center ring-4 ring-teal-200">
                <Coffee className="w-10 h-10 text-white" />
              </div>
            )}
            
            {/* Heart decoration */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-lg">
              <Heart className="w-4 h-4 text-white" fill="white" />
            </div>
          </div>

          {/* Coffee badge */}
          <div className="px-3 py-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-md">
            <Coffee className="w-3.5 h-3.5" />
            Buy me a coffee
          </div>
        </div>

        {/* Creator name */}
        {product.sellerName && (
          <h3 className="text-base font-bold text-slate-800 text-center mb-1 group-hover:text-teal-700 transition-colors">
            {product.sellerName}
          </h3>
        )}

        {/* Title/Message */}
        <p className="text-sm text-slate-600 text-center mb-4 line-clamp-2">
          {product.name}
        </p>

        {/* Supporter count */}
        {supporterCount > 0 && (
          <div className="flex items-center justify-center gap-1.5 mb-4 text-sm text-teal-700">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">{supporterCount}</span>
            <span className="text-teal-600">supporters</span>
          </div>
        )}

        {/* Coffee amount options */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 3, 5].map((amount) => (
            <div
              key={amount}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                amount === 1 
                  ? "bg-teal-500 text-white shadow-lg scale-110" 
                  : "bg-teal-100 text-teal-700 hover:bg-teal-200"
              )}
            >
              {amount}
            </div>
          ))}
          <span className="text-xl">☕</span>
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between bg-white/80 rounded-xl p-3 border border-teal-100">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-teal-600">
              ${product.price.toFixed(0)}
            </span>
            <span className="text-xs text-slate-400">per coffee</span>
          </div>
          <div className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg">
            <Heart className="w-4 h-4" />
            Support
          </div>
        </div>
      </div>
    </button>
  );
};

export default TipCard;
