import { BookOpen, ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EbookProductCardProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    icon_url: string | null;
    type_metadata?: Record<string, any>;
    sold_count?: number | null;
  };
  onView: () => void;
  onBuy: () => void;
  purchasing?: boolean;
}

const EbookProductCard = ({ product, onView, onBuy, purchasing }: EbookProductCardProps) => {
  const metadata = product.type_metadata || {};
  
  return (
    <div 
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-violet-200 transition-all duration-300 cursor-pointer"
      onClick={onView}
    >
      {/* Book Cover with 3D effect */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-violet-100 to-violet-50 p-3">
        <div className="absolute inset-3 shadow-[5px_5px_20px_rgba(0,0,0,0.15)] rounded-lg overflow-hidden transform group-hover:scale-[1.02] transition-transform duration-300">
          {product.icon_url ? (
            <img 
              src={product.icon_url} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-white/80" />
            </div>
          )}
        </div>
        
        {/* Format badge */}
        <div className="absolute bottom-4 right-4 px-2.5 py-1 bg-violet-600 text-white text-xs font-semibold rounded-lg shadow-lg">
          {metadata.format || 'PDF'}
        </div>
        
        {/* Sold badge */}
        {(product.sold_count || 0) > 0 && (
          <div className="absolute top-4 left-4 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-slate-700">
            {product.sold_count}+ sold
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-slate-900 line-clamp-2 mb-2 group-hover:text-violet-700 transition-colors">
          {product.name}
        </h3>
        
        {/* Page count */}
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
          <BookOpen className="w-4 h-4 text-violet-500" />
          <span>{metadata.page_count || '?'} pages</span>
          {metadata.language && (
            <>
              <span className="text-slate-300">•</span>
              <span>{metadata.language}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-violet-600">${product.price.toFixed(2)}</span>
          <Button 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onBuy();
            }}
            disabled={purchasing}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Get eBook
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EbookProductCard;
