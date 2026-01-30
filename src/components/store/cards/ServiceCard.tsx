import { Briefcase, Clock, RefreshCw, Check, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ServiceCardProps {
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

const ServiceCard = ({ product, onView, onBuy, purchasing }: ServiceCardProps) => {
  const metadata = product.type_metadata || {};
  const includes = typeof metadata.includes === 'string' 
    ? metadata.includes.split(',').map((s: string) => s.trim()).filter(Boolean) 
    : [];
  
  return (
    <div 
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 cursor-pointer"
      onClick={onView}
    >
      {/* Service header */}
      <div className="relative h-28 bg-gradient-to-br from-indigo-500 to-indigo-700 p-4 flex items-center gap-4">
        {product.icon_url ? (
          <img 
            src={product.icon_url} 
            alt={product.name}
            className="w-14 h-14 rounded-xl object-cover shadow-lg border-2 border-white/20"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
            <Briefcase className="w-7 h-7 text-white" />
          </div>
        )}
        
        <div className="flex-1">
          <h3 className="font-bold text-white text-lg line-clamp-1">
            {product.name}
          </h3>
          {(product.sold_count || 0) > 0 && (
            <p className="text-white/80 text-xs mt-1">
              {product.sold_count}+ orders completed
            </p>
          )}
        </div>
      </div>
      
      <div className="p-4">
        {/* Delivery info */}
        <div className="flex items-center gap-4 mb-3">
          {metadata.delivery_days && (
            <div className="flex items-center gap-1.5 text-sm">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span className="text-slate-700 font-medium">{metadata.delivery_days} day delivery</span>
            </div>
          )}
          {metadata.revisions && (
            <div className="flex items-center gap-1.5 text-sm">
              <RefreshCw className="w-4 h-4 text-indigo-500" />
              <span className="text-slate-700 font-medium">{metadata.revisions} revisions</span>
            </div>
          )}
        </div>
        
        {/* What's included */}
        {includes.length > 0 && (
          <div className="space-y-1.5 mb-3 p-3 bg-indigo-50 rounded-xl">
            {includes.slice(0, 3).map((item: string) => (
              <div key={item} className="flex items-center gap-2 text-xs text-slate-700">
                <Check className="w-3.5 h-3.5 text-indigo-600" />
                {item}
              </div>
            ))}
            {includes.length > 3 && (
              <span className="text-xs text-indigo-600 font-medium">
                +{includes.length - 3} more
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div>
            <span className="text-xs text-slate-500">Starting at</span>
            <p className="text-xl font-bold text-indigo-600">${product.price.toFixed(2)}</p>
          </div>
          <Button 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onBuy();
            }}
            disabled={purchasing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Order Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
