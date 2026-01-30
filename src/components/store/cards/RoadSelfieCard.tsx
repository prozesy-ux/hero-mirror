import { Camera, MapPin, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RoadSelfieCardProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    icon_url: string | null;
    images?: string[] | null;
    type_metadata?: Record<string, any>;
    sold_count?: number | null;
  };
  onView: () => void;
  onBuy: () => void;
  purchasing?: boolean;
}

const RoadSelfieCard = ({ product, onView, onBuy, purchasing }: RoadSelfieCardProps) => {
  const metadata = product.type_metadata || {};
  const images = product.images?.length ? product.images : (product.icon_url ? [product.icon_url] : []);
  const locations = Array.isArray(metadata.locations) ? metadata.locations : [];
  
  return (
    <div 
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-pink-200 transition-all duration-300 cursor-pointer"
      onClick={onView}
    >
      {/* Photo Grid Preview */}
      <div className="relative aspect-square overflow-hidden bg-pink-50">
        {images.length >= 4 ? (
          <div className="grid grid-cols-2 gap-0.5 absolute inset-0">
            {images.slice(0, 4).map((img, i) => (
              <img 
                key={i} 
                src={img} 
                alt={`Preview ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ))}
          </div>
        ) : images.length > 0 ? (
          <img 
            src={images[0]} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-400 to-pink-600">
            <Camera className="w-16 h-16 text-white/80" />
          </div>
        )}
        
        {/* Pack size badge */}
        <div className="absolute top-3 right-3 px-3 py-1.5 bg-pink-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1.5">
          <Camera className="w-3 h-3" />
          {metadata.pack_size || '?'} Photos
        </div>
        
        {/* Location tags */}
        {locations.length > 0 && (
          <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
            {locations.slice(0, 2).map((loc: string) => (
              <span 
                key={loc} 
                className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium rounded-lg flex items-center gap-1 text-slate-700"
              >
                <MapPin className="w-3 h-3 text-pink-500" />
                {loc}
              </span>
            ))}
            {locations.length > 2 && (
              <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium rounded-lg text-slate-500">
                +{locations.length - 2}
              </span>
            )}
          </div>
        )}
        
        {/* Resolution badge */}
        {metadata.resolution && (
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/70 text-white text-[10px] font-bold rounded">
            {metadata.resolution}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-slate-900 line-clamp-1 mb-1 group-hover:text-pink-600 transition-colors">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-sm text-slate-500 line-clamp-1 mb-3">
            {product.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-pink-600">${product.price.toFixed(2)}</span>
          <Button 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onBuy();
            }}
            disabled={purchasing}
            className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl"
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            View Pack
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoadSelfieCard;
