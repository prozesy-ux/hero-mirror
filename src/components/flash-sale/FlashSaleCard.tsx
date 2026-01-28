import { Package, ShoppingBag } from 'lucide-react';
import FlashSaleBadge from './FlashSaleBadge';
import FlashSaleCountdown from './FlashSaleCountdown';
import { cn } from '@/lib/utils';

interface FlashSale {
  id: string;
  discount_percentage: number;
  original_price: number;
  sale_price: number;
  ends_at: string;
  max_quantity: number | null;
  sold_quantity: number;
}

interface Product {
  id: string;
  name: string;
  icon_url: string | null;
  seller_id: string;
}

interface FlashSaleCardProps {
  flashSale: FlashSale;
  product: Product;
  storeName?: string;
  onBuy?: () => void;
  onView?: () => void;
  className?: string;
}

const FlashSaleCard = ({
  flashSale,
  product,
  storeName,
  onBuy,
  onView,
  className,
}: FlashSaleCardProps) => {
  const stockLeft = flashSale.max_quantity 
    ? flashSale.max_quantity - flashSale.sold_quantity 
    : null;

  return (
    <div 
      onClick={onView}
      className={cn(
        'group relative bg-white rounded-2xl overflow-hidden border-2 border-red-200',
        'shadow-lg hover:shadow-xl hover:border-red-300 transition-all cursor-pointer',
        className
      )}
    >
      {/* Flash Sale Banner */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-500 to-orange-500 py-1.5 px-3 z-10">
        <div className="flex items-center justify-between">
          <span className="text-white text-xs font-bold flex items-center gap-1">
            ⚡ FLASH SALE
          </span>
          <FlashSaleCountdown endsAt={flashSale.ends_at} className="text-white" />
        </div>
      </div>

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-50 mt-8">
        {product.icon_url ? (
          <img 
            src={product.icon_url} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
            <Package className="h-16 w-16 text-slate-300" />
          </div>
        )}

        {/* Discount Badge */}
        <FlashSaleBadge 
          discountPercentage={flashSale.discount_percentage} 
          className="absolute top-2 right-2"
        />

        {/* Stock Left */}
        {stockLeft !== null && stockLeft <= 10 && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-full">
            Only {stockLeft} left!
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {storeName && (
          <p className="text-[10px] text-slate-500 mb-1">{storeName}</p>
        )}
        
        <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-2 mb-3">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-red-600">
            ${flashSale.sale_price.toFixed(2)}
          </span>
          <span className="text-sm text-slate-400 line-through">
            ${flashSale.original_price.toFixed(2)}
          </span>
          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">
            Save ${(flashSale.original_price - flashSale.sale_price).toFixed(2)}
          </span>
        </div>

        {/* Sold Progress */}
        {flashSale.max_quantity && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
              <span>{flashSale.sold_quantity} sold</span>
              <span>{stockLeft} remaining</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all"
                style={{ width: `${(flashSale.sold_quantity / flashSale.max_quantity) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Buy Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onBuy?.();
          }}
          className="w-full py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:from-red-600 hover:to-orange-600 active:scale-[0.98] transition-all"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Buy Now</span>
        </button>
      </div>
    </div>
  );
};

export default FlashSaleCard;
