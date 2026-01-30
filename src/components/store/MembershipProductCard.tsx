import { Star, MessageCircle, Eye, Wallet, Loader2, Users, Check, Crown } from 'lucide-react';
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

interface MembershipProductCardProps {
  product: SellerProduct;
  storeName: string;
  hasEnoughBalance: boolean;
  isLoggedIn: boolean;
  purchasing: boolean;
  onChat: () => void;
  onView: () => void;
  onBuy: () => void;
}

const MembershipProductCard = ({
  product,
  storeName,
  hasEnoughBalance,
  isLoggedIn,
  purchasing,
  onChat,
  onView,
  onBuy,
}: MembershipProductCardProps) => {
  const showChat = product.chat_allowed !== false;
  const memberCount = product.sold_count || 0;

  // Extract benefits from description or use defaults
  const defaultBenefits = [
    'Exclusive Content Access',
    'Community Membership',
    'Regular Updates',
  ];

  return (
    <div className="group bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 rounded-2xl overflow-hidden border border-purple-200 shadow-sm hover:shadow-xl hover:border-purple-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer relative">
      {/* Premium Badge */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 py-2 flex items-center justify-center gap-2 text-white text-xs font-bold">
        <Crown size={14} className="text-yellow-300" />
        <span>PREMIUM MEMBERSHIP</span>
        <Crown size={14} className="text-yellow-300" />
      </div>

      {/* Logo/Avatar */}
      <div className="pt-14 pb-4 flex justify-center">
        <div className="w-20 h-20 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
          <OptimizedImage
            src={product.icon_url}
            alt={product.name}
            aspectRatio="square"
            className="w-full h-full"
            fallbackIcon={<Users className="h-10 w-10 text-purple-400" />}
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <h3 className="font-bold text-slate-900 text-center text-base leading-tight mb-2 group-hover:text-purple-700 transition-colors">
          {product.name}
        </h3>

        {/* Member Count */}
        <div className="text-center text-xs text-slate-500 mb-4">
          <span className="font-semibold text-purple-600">{memberCount.toLocaleString()}</span> members
        </div>

        {/* Benefits List */}
        <div className="space-y-2 mb-4">
          {defaultBenefits.map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-slate-700">
              <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Check size={12} className="text-purple-600" />
              </div>
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Price */}
        <div className="text-center mb-4">
          <span className="text-2xl font-bold text-purple-600">${product.price}</span>
          <span className="text-sm text-slate-500">/lifetime</span>
        </div>

        {/* Low Balance Overlay */}
        {isLoggedIn && !hasEnoughBalance && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 rounded-2xl">
            <Wallet size={28} className="text-white mb-2" />
            <span className="text-white text-sm font-semibold">Low Balance</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-1.5">
          {showChat && (
            <button
              onClick={(e) => { e.stopPropagation(); onChat(); }}
              className="flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all bg-purple-100 hover:bg-purple-200 active:scale-95 text-purple-700 font-medium min-h-[44px]"
            >
              <MessageCircle size={16} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onView(); }}
            className="flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-medium min-h-[44px]"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onBuy(); }}
            disabled={purchasing}
            className={`flex-[2] font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
              purchasing
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : isLoggedIn && !hasEnoughBalance
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-300'
                : 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white shadow-lg shadow-purple-200'
            }`}
          >
            {purchasing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isLoggedIn && !hasEnoughBalance ? (
              <>
                <Wallet className="w-4 h-4" />
                <span className="text-sm">Top Up</span>
              </>
            ) : (
              <span className="text-sm">Join Now</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MembershipProductCard;
