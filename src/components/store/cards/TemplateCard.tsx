import { Layout, ExternalLink, Check, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TemplateCardProps {
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

const TemplateCard = ({ product, onView, onBuy, purchasing }: TemplateCardProps) => {
  const metadata = product.type_metadata || {};
  
  return (
    <div 
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-cyan-200 transition-all duration-300 cursor-pointer"
      onClick={onView}
    >
      {/* Template preview */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-cyan-50 to-cyan-100">
        {product.icon_url ? (
          <img 
            src={product.icon_url} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-cyan-700">
            <Layout className="w-16 h-16 text-white/80" />
          </div>
        )}
        
        {/* Demo button overlay */}
        {metadata.demo_url && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <a 
              href={metadata.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-2 bg-white rounded-lg font-semibold text-sm text-cyan-700 flex items-center gap-2 hover:bg-cyan-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Live Preview
            </a>
          </div>
        )}
        
        {/* Format badge */}
        {metadata.format && (
          <Badge className="absolute top-3 left-3 bg-cyan-600 text-white border-0 text-[10px]">
            {metadata.format}
          </Badge>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-slate-900 line-clamp-1 mb-2 group-hover:text-cyan-600 transition-colors">
          {product.name}
        </h3>
        
        {/* Compatibility */}
        {metadata.compatibility && (
          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
            <Check className="w-3 h-3 text-cyan-500" />
            {metadata.compatibility}
          </p>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xl font-bold text-cyan-600">${product.price.toFixed(2)}</span>
          <Button 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onBuy();
            }}
            disabled={purchasing}
            className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl"
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Get Template
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
