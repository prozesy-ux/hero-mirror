import { Image, Maximize, FileType, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface GraphicsCardProps {
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

const GraphicsCard = ({ product, onView, onBuy, purchasing }: GraphicsCardProps) => {
  const metadata = product.type_metadata || {};
  const images = product.images?.length ? product.images : (product.icon_url ? [product.icon_url] : []);
  const fileTypes = Array.isArray(metadata.file_types) ? metadata.file_types : 
    (typeof metadata.file_types === 'string' ? metadata.file_types.split(',').map((t: string) => t.trim()) : []);
  
  return (
    <div 
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-rose-200 transition-all duration-300 cursor-pointer"
      onClick={onView}
    >
      {/* Graphics preview - masonry style for multiple images */}
      <div className="relative aspect-square overflow-hidden bg-rose-50">
        {images.length >= 3 ? (
          <div className="grid grid-cols-2 gap-0.5 h-full">
            <img 
              src={images[0]} 
              alt="Preview 1"
              className="w-full h-full object-cover col-span-1 row-span-2 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="flex flex-col gap-0.5">
              <img 
                src={images[1]} 
                alt="Preview 2"
                className="w-full flex-1 object-cover"
              />
              <img 
                src={images[2]} 
                alt="Preview 3"
                className="w-full flex-1 object-cover"
              />
            </div>
          </div>
        ) : images.length > 0 ? (
          <img 
            src={images[0]} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-400 to-rose-600">
            <Image className="w-16 h-16 text-white/80" />
          </div>
        )}
        
        {/* Dimensions badge */}
        {metadata.dimensions && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 text-white text-[10px] font-bold rounded flex items-center gap-1">
            <Maximize className="w-3 h-3" />
            {metadata.dimensions}
          </div>
        )}
        
        {/* License badge */}
        {metadata.license && (
          <Badge className="absolute top-3 left-3 bg-rose-600 text-white border-0 text-[10px]">
            {metadata.license}
          </Badge>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-slate-900 line-clamp-1 mb-2 group-hover:text-rose-600 transition-colors">
          {product.name}
        </h3>
        
        {/* File types */}
        {fileTypes.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
            <FileType className="w-3.5 h-3.5 text-rose-500" />
            {fileTypes.slice(0, 3).join(', ')}
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xl font-bold text-rose-600">${product.price.toFixed(2)}</span>
          <Button 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onBuy();
            }}
            disabled={purchasing}
            className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl"
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GraphicsCard;
