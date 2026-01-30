import { Star, MessageCircle, Eye, Wallet, Loader2, BookOpen, User } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface SellerProduct {
  id: string;
  slug?: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  category_id: string | null;
  tags: string[] | null;
  sold_count: number | null;
  chat_allowed: boolean | null;
  seller_id: string;
  product_type?: string | null;
}

interface EbookProductCardProps {
  product: SellerProduct;
  storeName: string;
  hasEnoughBalance: boolean;
  isLoggedIn: boolean;
  purchasing: boolean;
  onChat: () => void;
  onView: () => void;
  onBuy: () => void;
}

const EbookProductCard = ({
  product,
  storeName,
  hasEnoughBalance,
  isLoggedIn,
  purchasing,
  onChat,
  onView,
  onBuy,
}: EbookProductCardProps) => {
  const showChat = product.chat_allowed !== false;

  return (
    <div className="group bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl overflow-hidden border border-amber-200 shadow-sm hover:shadow-xl hover:border-amber-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
      {/* 3D Book Cover Effect */}
      <div className="relative p-6 flex justify-center items-center min-h-[200px]">
        {/* Book Shadow */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[70%] h-4 bg-black/10 blur-md rounded-full" />
        
        {/* 3D Book */}
        <div 
          className="relative w-32 h-44 transition-transform duration-500 group-hover:scale-105"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'perspective(1000px) rotateY(-15deg)',
          }}
        >
          {/* Book Cover */}
          <div className="absolute inset-0 rounded-r-lg overflow-hidden shadow-xl border-r-4 border-amber-900/20">
            <OptimizedImage
              src={product.icon_url}
              alt={product.name}
              aspectRatio="3/2"
              className="w-full h-full object-cover"
              fallbackIcon={<BookOpen className="h-12 w-12 text-amber-400" />}
            />
          </div>
          
          {/* Book Spine Effect */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-amber-800 to-amber-600 rounded-l-sm"
            style={{ transform: 'translateX(-100%) rotateY(-90deg)' }}
          />
          
          {/* Book Pages Effect */}
          <div 
            className="absolute right-0 top-1 bottom-1 w-2 bg-gradient-to-b from-amber-100 via-amber-50 to-amber-100"
            style={{ 
              background: 'repeating-linear-gradient(90deg, #fef3c7, #fef3c7 1px, #fefbf0 1px, #fefbf0 2px)'
            }}
          />
        </div>

        {/* PDF Badge */}
        <div className="absolute top-3 right-3 px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-lg shadow-sm">
          PDF
        </div>

        {/* Low Balance Overlay */}
        {isLoggedIn && !hasEnoughBalance && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
            <Wallet size={28} className="text-white mb-2" />
            <span className="text-white text-sm font-semibold">Low Balance</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 bg-white/80 backdrop-blur-sm">
        {/* Book Icon & Title */}
        <div className="flex items-start gap-2 mb-2">
          <BookOpen size={16} className="text-amber-600 flex-shrink-0 mt-1" />
          <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2 group-hover:text-amber-700 transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Author */}
        <div className="flex items-center gap-1.5 mb-3 text-slate-500 text-xs">
          <User size={12} />
          <span>by {storeName}</span>
        </div>

        {/* Rating & Price */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xl font-bold text-amber-600">${product.price}</span>
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-xs text-slate-500 font-medium">({product.sold_count || 0})</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1.5">
          {showChat && (
            <button
              onClick={(e) => { e.stopPropagation(); onChat(); }}
              className="flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all bg-amber-100 hover:bg-amber-200 active:scale-95 text-amber-700 font-medium min-h-[44px]"
            >
              <MessageCircle size={16} />
              <span className="hidden sm:inline text-sm">Chat</span>
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onView(); }}
            className="flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-medium min-h-[44px]"
          >
            <Eye size={16} />
            <span className="hidden sm:inline text-sm">View</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onBuy(); }}
            disabled={purchasing}
            className={`flex-[1.5] font-bold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-all min-h-[44px] ${
              purchasing
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : isLoggedIn && !hasEnoughBalance
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-300'
                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200'
            }`}
          >
            {purchasing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isLoggedIn && !hasEnoughBalance ? (
              <>
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Top Up</span>
              </>
            ) : (
              <span className="text-sm">Buy Now</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EbookProductCard;
