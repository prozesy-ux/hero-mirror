import { Check, Star, MessageCircle, Eye, Wallet, Loader2, Package, TrendingUp, Store } from 'lucide-react';

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
  purchasing: boolean;
  onChat: () => void;
  onView: () => void;
  onBuy: () => void;
}

const StoreProductCard = ({
  product,
  storeName,
  hasEnoughBalance,
  purchasing,
  onChat,
  onView,
  onBuy,
}: StoreProductCardProps) => {
  // Determine how many buttons are shown
  const showChat = product.chat_allowed !== false;
  const buttonCount = showChat ? 3 : 2;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border-2 border-emerald-200 shadow-md hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
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
          className="w-full h-full flex items-center justify-center absolute inset-0"
          style={{ display: product.icon_url ? 'none' : 'flex' }}
        >
          <Package className="h-16 w-16 text-gray-300" />
        </div>

        {/* Store Badge */}
        <div className="absolute top-3 left-3 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
          <Store size={12} />
          {storeName}
        </div>

        {/* Hot Badge */}
        {product.sold_count && product.sold_count > 10 && (
          <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg">
            <TrendingUp size={16} className="text-white" />
          </div>
        )}

        {/* Low Balance Overlay - Always show when balance is insufficient */}
        {!hasEnoughBalance && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
            <Wallet size={28} className="text-white mb-2" />
            <span className="text-white text-sm font-semibold">Low Balance</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2 mb-2">
          {product.name}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description || 'Premium product from verified seller'}
        </p>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {product.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Price Badge */}
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            <Check size={12} />
            ${product.price}
          </span>
        </div>

        {/* Review Section */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <span className="text-sm text-gray-600 font-medium">{product.sold_count || 0}+ sold</span>
        </div>

        {/* Action Buttons - Fixed sizing */}
        <div className="flex gap-2">
          {/* Chat Button - Only show if chat is allowed */}
          {showChat && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChat();
              }}
              className="flex-1 min-w-0 font-semibold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-colors bg-violet-100 hover:bg-violet-200 text-violet-700 text-sm"
            >
              <MessageCircle size={14} className="flex-shrink-0" />
              <span className="truncate">Chat</span>
            </button>
          )}
          {/* Full View Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="flex-1 min-w-0 font-semibold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
          >
            <Eye size={14} className="flex-shrink-0" />
            <span className="truncate">View</span>
          </button>
          {/* Buy Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBuy();
            }}
            disabled={purchasing}
            className={`flex-1 min-w-0 font-bold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-colors text-sm ${
              purchasing
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : hasEnoughBalance
                ? 'bg-yellow-400 hover:bg-yellow-500 text-black'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-300'
            }`}
          >
            {purchasing ? (
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            ) : !hasEnoughBalance ? (
              <>
                <Wallet className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Top Up</span>
              </>
            ) : (
              <span>Buy</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreProductCard;