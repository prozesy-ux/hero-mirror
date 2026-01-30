import { Music, Play, Clock, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AudioCardProps {
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

const AudioCard = ({ product, onView, onBuy, purchasing }: AudioCardProps) => {
  const metadata = product.type_metadata || {};
  
  return (
    <div 
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300 cursor-pointer"
      onClick={onView}
    >
      {/* Audio visualization header */}
      <div className="relative h-32 bg-gradient-to-br from-purple-500 to-purple-700 p-4 flex items-center">
        {product.icon_url ? (
          <img 
            src={product.icon_url} 
            alt={product.name}
            className="w-20 h-20 rounded-xl object-cover shadow-lg border-2 border-white/20"
          />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-white/20 flex items-center justify-center">
            <Music className="w-10 h-10 text-white" />
          </div>
        )}
        
        {/* Waveform visualization */}
        <div className="flex-1 ml-4 flex items-center gap-0.5 h-12">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="flex-1 bg-white/40 rounded-full"
              style={{ 
                height: `${Math.random() * 100}%`,
                minHeight: '10%'
              }}
            />
          ))}
        </div>
        
        {/* Play button */}
        <div className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
          <Play className="w-5 h-5 text-purple-600 ml-0.5" />
        </div>
        
        {/* Duration */}
        {metadata.duration_seconds && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 text-white text-[10px] font-bold rounded flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(metadata.duration_seconds)}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-slate-900 line-clamp-1 mb-2 group-hover:text-purple-600 transition-colors">
          {product.name}
        </h3>
        
        {/* Audio details */}
        <div className="flex flex-wrap gap-2 mb-3">
          {metadata.format && (
            <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
              {metadata.format}
            </Badge>
          )}
          {metadata.bpm && (
            <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 border-slate-200">
              {metadata.bpm} BPM
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xl font-bold text-purple-600">${product.price.toFixed(2)}</span>
          <Button 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onBuy();
            }}
            disabled={purchasing}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            Get Audio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AudioCard;
