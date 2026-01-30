import { Star, MessageCircle, Eye, Wallet, Loader2, GraduationCap, Clock, Users, Package } from 'lucide-react';
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

interface CourseProductCardProps {
  product: SellerProduct;
  storeName: string;
  hasEnoughBalance: boolean;
  isLoggedIn: boolean;
  purchasing: boolean;
  onChat: () => void;
  onView: () => void;
  onBuy: () => void;
}

const CourseProductCard = ({
  product,
  storeName,
  hasEnoughBalance,
  isLoggedIn,
  purchasing,
  onChat,
  onView,
  onBuy,
}: CourseProductCardProps) => {
  const showChat = product.chat_allowed !== false;
  const enrolledCount = product.sold_count || 0;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-blue-200 shadow-sm hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
      {/* Course Cover Image */}
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600">
        <OptimizedImage
          src={product.icon_url}
          alt={product.name}
          aspectRatio="video"
          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
          fallbackIcon={<GraduationCap className="h-16 w-16 text-white/50" />}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Lessons Badge */}
        <div className="absolute top-3 left-3 px-3 py-1.5 bg-blue-500/90 backdrop-blur-sm text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg">
          <GraduationCap size={14} />
          <span>Course</span>
        </div>

        {/* Duration Badge */}
        <div className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1">
          <Clock size={12} />
          <span>Lifetime</span>
        </div>

        {/* Bottom Stats Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-1.5">
            <Users size={14} />
            <span className="font-medium">{enrolledCount.toLocaleString()} enrolled</span>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />
            ))}
          </div>
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
      <div className="p-4">
        <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight line-clamp-2 mb-1.5 group-hover:text-blue-700 transition-colors">
          {product.name}
        </h3>
        
        <p className="text-xs text-slate-500 mb-3">by {storeName}</p>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Price & CTA */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xl font-bold text-blue-600">${product.price}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1.5">
          {showChat && (
            <button
              onClick={(e) => { e.stopPropagation(); onChat(); }}
              className="flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-medium min-h-[44px]"
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
            <span className="hidden sm:inline text-sm">Preview</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onBuy(); }}
            disabled={purchasing}
            className={`flex-[1.5] font-bold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-all min-h-[44px] ${
              purchasing
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : isLoggedIn && !hasEnoughBalance
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-300'
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm shadow-blue-200'
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
              <span className="text-sm">Enroll Now</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseProductCard;
