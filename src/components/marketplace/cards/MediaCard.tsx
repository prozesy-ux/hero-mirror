import { Play, Volume2, Clock, Star, Download, Pause } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ProductCardData } from './ProductCardRenderer';
import { cn } from '@/lib/utils';

interface MediaCardProps {
  product: ProductCardData;
  onClick: () => void;
  variant: 'video' | 'audio';
}

const MediaCard = ({
  product,
  onClick,
  variant,
}: MediaCardProps) => {
  const isVideo = variant === 'video';
  const duration = product.duration || '';

  const theme = {
    video: {
      bg: 'from-green-50 to-emerald-50',
      border: 'border-green-200/50 hover:border-green-300',
      badge: 'bg-green-500',
      accent: 'text-green-600',
      gradient: 'from-green-400 to-emerald-500',
    },
    audio: {
      bg: 'from-red-50 to-rose-50',
      border: 'border-red-200/50 hover:border-red-300',
      badge: 'bg-red-500',
      accent: 'text-red-600',
      gradient: 'from-red-400 to-rose-500',
    },
  }[variant];

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full text-left bg-white rounded-xl overflow-hidden border shadow-sm transition-all duration-200 hover:shadow-xl hover:-translate-y-1",
        theme.border
      )}
    >
      {/* Media thumbnail */}
      <div className="relative overflow-hidden">
        <AspectRatio ratio={isVideo ? 16/9 : 1}>
          {product.iconUrl ? (
            <img
              src={product.iconUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className={cn(
              "w-full h-full flex items-center justify-center",
              `bg-gradient-to-br ${theme.bg}`
            )}>
              {isVideo ? (
                <Play className={cn("w-16 h-16 opacity-30", theme.accent)} />
              ) : (
                /* Audio waveform visualization */
                <div className="flex items-center justify-center gap-1 h-full px-8">
                  {[40, 70, 50, 90, 60, 80, 45, 75, 55, 85, 40].map((h, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-2 rounded-full",
                        `bg-gradient-to-t ${theme.gradient}`
                      )}
                      style={{ 
                        height: `${h}%`,
                        opacity: 0.4 + (i % 3) * 0.2,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </AspectRatio>

        {/* Play/Pause button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            "w-14 h-14 rounded-full bg-white/95 shadow-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
            isVideo ? "group-hover:bg-green-500" : "group-hover:bg-red-500"
          )}>
            {isVideo ? (
              <Play className={cn(
                "w-6 h-6 ml-1 transition-colors",
                theme.accent,
                "group-hover:text-white"
              )} fill="currentColor" />
            ) : (
              <Volume2 className={cn(
                "w-6 h-6 transition-colors",
                theme.accent,
                "group-hover:text-white"
              )} />
            )}
          </div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Type badge */}
        <div className={cn(
          "absolute top-3 left-3 px-2.5 py-1 text-white rounded-full text-[10px] font-semibold flex items-center gap-1.5 shadow-lg",
          theme.badge
        )}>
          {isVideo ? <Play className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          {isVideo ? 'Video' : 'Audio'}
        </div>

        {/* Duration badge */}
        {duration && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm text-white rounded-full text-[11px] font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {duration}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <h3 className={cn(
          "text-sm font-semibold text-slate-900 line-clamp-2 mb-1 min-h-[2.5rem] leading-tight transition-colors",
          `group-hover:${theme.accent}`
        )}>
          {product.name}
        </h3>

        {/* Creator */}
        {product.sellerName && (
          <p className="text-xs text-slate-500 mb-2 truncate">by {product.sellerName}</p>
        )}

        {/* Price & Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("text-lg font-bold", theme.accent)}>
              ${product.price.toFixed(0)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">
                ${product.originalPrice.toFixed(0)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {product.rating && product.rating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium text-slate-800">{product.rating.toFixed(1)}</span>
              </div>
            )}
            <div className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1",
              theme.badge,
              "text-white"
            )}>
              <Download className="w-3 h-3" />
              {isVideo ? 'Watch' : 'Listen'}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default MediaCard;
