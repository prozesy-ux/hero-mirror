import { Download, Monitor, Apple, Smartphone, ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SoftwareCardProps {
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

const platformIcons: Record<string, React.ReactNode> = {
  Windows: <Monitor className="w-3 h-3" />,
  Mac: <Apple className="w-3 h-3" />,
  Linux: <Monitor className="w-3 h-3" />,
  iOS: <Smartphone className="w-3 h-3" />,
  Android: <Smartphone className="w-3 h-3" />,
};

const SoftwareCard = ({ product, onView, onBuy, purchasing }: SoftwareCardProps) => {
  const metadata = product.type_metadata || {};
  const platforms = Array.isArray(metadata.platforms) ? metadata.platforms : 
    (typeof metadata.platforms === 'string' ? metadata.platforms.split(',').map((p: string) => p.trim()) : []);
  
  return (
    <div 
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer"
      onClick={onView}
    >
      {/* Software header */}
      <div className="relative h-36 bg-gradient-to-br from-blue-500 to-blue-700 p-4">
        <div className="flex items-start justify-between">
          {product.icon_url ? (
            <img 
              src={product.icon_url} 
              alt={product.name}
              className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white/20"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <Download className="w-8 h-8 text-white" />
            </div>
          )}
          
          {/* Version badge */}
          {metadata.version && (
            <Badge className="bg-white/20 text-white border-0 text-[10px]">
              v{metadata.version}
            </Badge>
          )}
        </div>
        
        {/* Platform icons */}
        {platforms.length > 0 && (
          <div className="absolute bottom-3 left-4 flex gap-1.5">
            {platforms.slice(0, 4).map((platform: string) => (
              <div 
                key={platform} 
                className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white"
                title={platform}
              >
                {platformIcons[platform] || <Monitor className="w-3 h-3" />}
              </div>
            ))}
          </div>
        )}
        
        {/* Downloads count */}
        {(product.sold_count || 0) > 0 && (
          <div className="absolute bottom-3 right-4 px-2 py-1 bg-white/20 backdrop-blur-sm rounded text-[10px] font-bold text-white flex items-center gap-1">
            <Download className="w-3 h-3" />
            {product.sold_count}+
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-slate-900 line-clamp-1 mb-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        
        {/* Requirements */}
        {metadata.requirements && (
          <p className="text-xs text-slate-500 line-clamp-1 mb-3 flex items-center gap-1">
            <Check className="w-3 h-3 text-blue-500" />
            {metadata.requirements}
          </p>
        )}
        
        {/* Features */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
            Instant Download
          </Badge>
          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
            Lifetime License
          </Badge>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xl font-bold text-blue-600">${product.price.toFixed(2)}</span>
          <Button 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onBuy();
            }}
            disabled={purchasing}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
          >
            <Download className="w-4 h-4 mr-1" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SoftwareCard;
