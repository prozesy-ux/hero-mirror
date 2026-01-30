import { Star, MessageCircle, Eye, Wallet, Loader2, Camera, Image as ImageIcon } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface SellerProduct {
  id: string;
  slug?: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  images?: string[] | null;
  category_id: string | null;
  tags: string[] | null;
  sold_count: number | null;
  chat_allowed: boolean | null;
  seller_id: string;
  product_type?: string | null;
}

interface GalleryProductCardProps {
  product: SellerProduct;
  storeName: string;
  hasEnoughBalance: boolean;
  isLoggedIn: boolean;
  purchasing: boolean;
  onChat: () => void;
  onView: () => void;
  onBuy: () => void;
}

const GalleryProductCard = ({
  product,
  storeName,
  hasEnoughBalance,
  isLoggedIn,
  purchasing,
  onChat,
  onView,
  onBuy,
}: GalleryProductCardProps) => {
  const showChat = product.chat_allowed !== false;
  const images = product.images || (product.icon_url ? [product.icon_url] : []);
  const displayImages = images.slice(0, 5);
  const remainingCount = images.length > 5 ? images.length - 5 : 0;
  const isPhoto = product.product_type === 'photo';
  const accentColor = isPhoto ? 'cyan' : 'indigo';

  return (
    <div className={`group bg-white rounded-2xl overflow-hidden border border-${accentColor}-200 shadow-sm hover:shadow-xl hover:border-${accentColor}-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer`}>
      {/* Photo Mosaic Grid */}
      <div className="relative">
        {displayImages.length >= 5 ? (
          <div className="grid grid-cols-3 grid-rows-2 gap-0.5 aspect-[4/3]">
            {/* Large main image */}
            <div className="col-span-2 row-span-2 relative overflow-hidden">
              <OptimizedImage
                src={displayImages[0]}
                alt={product.name}
                aspectRatio="square"
                className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                fallbackIcon={<Camera className="h-12 w-12 text-slate-300" />}
              />
            </div>
            {/* Small images */}
            {displayImages.slice(1, 5).map((img, idx) => (
              <div key={idx} className="relative overflow-hidden">
                <OptimizedImage
                  src={img}
                  alt={`${product.name} ${idx + 2}`}
                  aspectRatio="square"
                  className="w-full h-full object-cover"
                  fallbackIcon={<ImageIcon className="h-6 w-6 text-slate-300" />}
                />
                {/* +N overlay on last image */}
                {idx === 3 && remainingCount > 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">+{remainingCount}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : displayImages.length > 0 ? (
          <div className="aspect-[4/3] overflow-hidden">
            <OptimizedImage
              src={displayImages[0]}
              alt={product.name}
              aspectRatio="4/3"
              className="w-full h-full transition-transform duration-500 group-hover:scale-105"
              fallbackIcon={<Camera className="h-16 w-16 text-slate-300" />}
            />
          </div>
        ) : (
          <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
            <Camera className="h-16 w-16 text-slate-300" />
          </div>
        )}

        {/* Type Badge */}
        <div className={`absolute top-3 left-3 px-2.5 py-1 bg-${accentColor}-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-lg`}>
          {isPhoto ? <Camera size={14} /> : <ImageIcon size={14} />}
          <span>{isPhoto ? 'Photo Pack' : 'Art'}</span>
        </div>

        {/* Count Badge */}
        {images.length > 1 && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1">
            <ImageIcon size={12} />
            <span>{images.length} items</span>
          </div>
        )}

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
        <h3 className={`font-bold text-slate-900 text-sm leading-tight line-clamp-2 mb-1.5 group-hover:text-${accentColor}-700 transition-colors`}>
          {product.name}
        </h3>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.tags.slice(0, 2).map(tag => (
              <span key={tag} className={`px-2 py-0.5 bg-${accentColor}-100 text-${accentColor}-700 rounded text-[10px] font-medium`}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Price & Rating */}
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xl font-bold text-${accentColor}-600`}>${product.price}</span>
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
              className={`flex-1 py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all bg-${accentColor}-100 hover:bg-${accentColor}-200 active:scale-95 text-${accentColor}-700 font-medium min-h-[44px]`}
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
            className={`flex-[1.5] font-bold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-all min-h-[44px] ${
              purchasing
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : isLoggedIn && !hasEnoughBalance
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-300'
                : `bg-${accentColor}-500 hover:bg-${accentColor}-600 text-white shadow-sm shadow-${accentColor}-200`
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
              <span className="text-sm">Buy</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GalleryProductCard;
