import { Star, Loader2, Package, Wallet } from 'lucide-react';

interface SellerProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  category_id: string | null;
  tags: string[] | null;
  sold_count: number | null;
  chat_allowed: boolean | null;
  seller_id: string;
}

interface StoreProductCardCompactProps {
  product: SellerProduct;
  hasEnoughBalance: boolean;
  isLoggedIn: boolean;
  purchasing: boolean;
  onView: () => void;
  onBuy: () => void;
}

const StoreProductCardCompact = ({
  product,
  hasEnoughBalance,
  isLoggedIn,
  purchasing,
  onView,
  onBuy,
}: StoreProductCardCompactProps) => {
  return (
    <div 
      onClick={onView}
      className="group bg-white rounded-xl overflow-hidden border border-slate-100 shadow-sm active:scale-[0.98] transition-all duration-150 cursor-pointer tap-feedback mobile-card-touch"
    >
      {/* Image - Square aspect for compact view */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        {product.icon_url ? (
          <img 
            src={product.icon_url} 
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className="w-full h-full flex items-center justify-center absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-50"
          style={{ display: product.icon_url ? 'none' : 'flex' }}
        >
          <Package className="h-10 w-10 text-slate-300" />
        </div>

        {/* Low Balance Overlay */}
        {isLoggedIn && !hasEnoughBalance && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
            <Wallet size={20} className="text-white mb-1" />
            <span className="text-white text-[10px] font-semibold">Low Balance</span>
          </div>
        )}
      </div>

      {/* Content - Ultra compact */}
      <div className="p-2.5">
        {/* Product Name - Single line */}
        <h3 className="font-semibold text-slate-900 text-xs leading-tight line-clamp-1 mb-1.5">
          {product.name}
        </h3>

        {/* Price & Rating Row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-emerald-600">${product.price}</span>
          <div className="flex items-center gap-0.5">
            <Star size={10} className="text-amber-400 fill-amber-400" />
            <span className="text-[10px] text-slate-500 font-medium">{product.sold_count || 0}</span>
          </div>
        </div>

        {/* Single Buy Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBuy();
          }}
          disabled={purchasing}
          className={`w-full font-bold py-2.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs min-h-[40px] ${
            purchasing
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
              : isLoggedIn && !hasEnoughBalance
              ? 'bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-amber-700 border border-amber-300'
              : 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white'
          }`}
        >
          {purchasing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isLoggedIn && !hasEnoughBalance ? (
            <>
              <Wallet className="w-3.5 h-3.5" />
              <span>Top Up</span>
            </>
          ) : (
            <span>Buy Now</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default StoreProductCardCompact;
