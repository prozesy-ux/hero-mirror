import { Video, Play, Clock, Monitor, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface VideoCardProps {
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

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const VideoCard = ({ product, onView, onBuy, purchasing }: VideoCardProps) => {
  const metadata = product.type_metadata || {};
  
  return (
    <div 
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-red-200 transition-all duration-300 cursor-pointer"
      onClick={onView}
    >
      {/* Video thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-slate-900">
        {product.icon_url ? (
          <img 
            src={product.icon_url} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-red-700">
            <Video className="w-16 h-16 text-white/80" />
          </div>
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-xl">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
        
        {/* Duration badge */}
        {metadata.duration_seconds && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 text-white text-xs font-bold rounded flex items-center gap-1">
            {formatDuration(metadata.duration_seconds)}
          </div>
        )}
        
        {/* Resolution badge */}
        {metadata.resolution && (
          <Badge className="absolute top-3 left-3 bg-red-600 text-white border-0 text-[10px]">
            <Monitor className="w-3 h-3 mr-1" />
            {metadata.resolution}
          </Badge>
        )}
        
        {/* FPS badge */}
        {metadata.fps && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/70 text-white text-[10px] font-bold rounded">
            {metadata.fps} FPS
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-slate-900 line-clamp-1 mb-2 group-hover:text-red-600 transition-colors">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-sm text-slate-500 line-clamp-1 mb-3">
            {product.description}
          </p>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xl font-bold text-red-600">${product.price.toFixed(2)}</span>
          <Button 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onBuy();
            }}
            disabled={purchasing}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Get Video
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
