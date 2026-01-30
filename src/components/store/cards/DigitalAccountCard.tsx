import { Key, Shield, Clock, Zap, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DigitalAccountCardProps {
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

const DigitalAccountCard = ({ product, onView, onBuy, purchasing }: DigitalAccountCardProps) => {
  const metadata = product.type_metadata || {};
  
  return (
    <div 
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all duration-300 cursor-pointer"
      onClick={onView}
    >
      {/* Header with icon */}
      <div className="relative h-32 bg-gradient-to-br from-emerald-500 to-emerald-700 p-4 flex items-center justify-center">
        {product.icon_url ? (
          <img 
            src={product.icon_url} 
            alt={product.name}
            className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white/20"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
            <Key className="w-8 h-8 text-white" />
          </div>
        )}
        
        {/* Instant delivery badge */}
        <div className="absolute top-3 right-3 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold text-white flex items-center gap-1">
          <Zap className="w-3 h-3" />
          Instant
        </div>
        
        {/* Sold count */}
        {(product.sold_count || 0) > 0 && (
          <div className="absolute bottom-3 left-3 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold text-white">
            {product.sold_count}+ delivered
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-slate-900 line-clamp-1 mb-2 group-hover:text-emerald-600 transition-colors">
          {product.name}
        </h3>
        
        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-3">
          {metadata.subscription_type && (
            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
              {metadata.subscription_type}
            </Badge>
          )}
          {metadata.validity && (
            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {metadata.validity}
            </Badge>
          )}
          {metadata.warranty_days && metadata.warranty_days > 0 && (
            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {metadata.warranty_days}d warranty
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xl font-bold text-emerald-600">${product.price.toFixed(2)}</span>
          <Button 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onBuy();
            }}
            disabled={purchasing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Get Access
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DigitalAccountCard;
