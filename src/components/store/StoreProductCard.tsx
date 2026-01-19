import { Star, MessageCircle, Eye, Wallet, Loader2, Package, TrendingUp, Store } from 'lucide-react';

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

interface StoreProductCardProps {
  product: SellerProduct;
  storeName: string;
  hasEnoughBalance: boolean;
  isLoggedIn: boolean;
  purchasing: boolean;
  onChat: () => void;
  onView: () => void;
  onBuy: () => void;
}

const StoreProductCard = ({
  product,
  storeName,
  hasEnoughBalance,
  isLoggedIn,
  purchasing,
  onChat,
  onView,
  onBuy,
}: StoreProductCardProps) => {
  const showChat = product.chat_allowed !== false;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
        {product.icon_url ? (
          <img 
            src={product.icon_url} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
          <Package className="h-16 w-16 text-slate-300" />
        </div>

        {/* Store Badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur-sm text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm border border-slate-100">
          <Store size={11} className="text-emerald-600" />
          <span className="truncate max-w-[80px]">{storeName}</span>
        </div>

        {/* Hot Badge */}
        {product.sold_count && product.sold_count > 10 && (
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg">
            <TrendingUp size={14} className="text-white" />
          </div>
        )}

        {/* Low Balance Overlay - Only show for logged-in users with insufficient balance */}
        {isLoggedIn && !hasEnoughBalance && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
            <Wallet size={28} className="text-white mb-2" />
            <span className="text-white text-sm font-semibold">Low Balance</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-slate-900 text-base leading-tight line-clamp-2 mb-2 group-hover:text-emerald-700 transition-colors">
          {product.name}
        </h3>

        {/* Tags - compact */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                {tag}
              </span>
            ))}
            {product.tags.length > 2 && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium">
                +{product.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Price & Rating Row */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xl font-bold text-emerald-600">${product.price}</span>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-xs text-slate-500 font-medium">{product.sold_count || 0}</span>
          </div>
        </div>

        {/* Action Buttons - Clean design */}
        <div className="flex gap-2">
          {/* Chat Button */}
          {showChat && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChat();
              }}
              className="flex-1 min-w-0 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium"
            >
              <MessageCircle size={14} className="flex-shrink-0" />
              <span className="hidden sm:inline">Chat</span>
            </button>
          )}
          {/* View Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="flex-1 min-w-0 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium"
          >
            <Eye size={14} className="flex-shrink-0" />
            <span className="hidden sm:inline">View</span>
          </button>
          {/* Buy Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBuy();
            }}
            disabled={purchasing}
            className={`flex-[1.5] min-w-0 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all text-sm ${
              purchasing
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : isLoggedIn && !hasEnoughBalance
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-300'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-200'
            }`}
          >
            {purchasing ? (
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            ) : isLoggedIn && !hasEnoughBalance ? (
              <>
                <Wallet className="w-4 h-4 flex-shrink-0" />
                <span>Top Up</span>
              </>
            ) : (
              <span>Buy Now</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreProductCard;