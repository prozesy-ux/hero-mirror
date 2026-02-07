import { Code, Star, Download, Monitor, Apple, Globe } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ProductCardProps } from './ProductCardRenderer';
import { cn } from '@/lib/utils';

const platformIcons: Record<string, React.ReactNode> = {
  windows: <Monitor className="w-3 h-3" />,
  mac: <Apple className="w-3 h-3" />,
  web: <Globe className="w-3 h-3" />,
};

const SoftwareCard = ({
  product,
  onClick,
}: ProductCardProps) => {
  const version = product.version || '';
  const platforms = product.platforms || ['web'];

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-white rounded-xl overflow-hidden border border-blue-200/50 shadow-sm transition-all duration-200 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1"
    >
      {/* Product Image with code bracket accents */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
        <AspectRatio ratio={1}>
          {product.iconUrl ? (
            <img
              src={product.iconUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
              <Code className="w-16 h-16 text-blue-400" />
            </div>
          )}
        </AspectRatio>

        {/* Code bracket decoration */}
        <div className="absolute top-3 left-3 text-blue-500 font-mono text-2xl font-bold opacity-50 group-hover:opacity-80 transition-opacity">
          {'<'}
        </div>
        <div className="absolute bottom-3 right-3 text-blue-500 font-mono text-2xl font-bold opacity-50 group-hover:opacity-80 transition-opacity">
          {'/>'}
        </div>

        {/* Software badge */}
        <div className="absolute top-3 right-3 px-2 py-1 bg-blue-500 text-white rounded-full text-[10px] font-semibold flex items-center gap-1 shadow-md">
          <Code className="w-3 h-3" />
          Software
        </div>

        {/* Version badge */}
        {version && (
          <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/70 backdrop-blur-sm text-white rounded-full text-[10px] font-mono">
            v{version}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-blue-600/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-xl">
            <Download className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 border-t-2 border-blue-500">
        {/* Title */}
        <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 mb-1 min-h-[2.5rem] leading-tight group-hover:text-blue-700 transition-colors">
          {product.name}
        </h3>

        {/* Developer */}
        {product.sellerName && (
          <p className="text-xs text-slate-500 mb-2 truncate">by {product.sellerName}</p>
        )}

        {/* Platform icons */}
        {platforms.length > 0 && (
          <div className="flex items-center gap-2 mb-2">
            {platforms.map((platform) => (
              <div
                key={platform}
                className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600"
                title={platform.charAt(0).toUpperCase() + platform.slice(1)}
              >
                {platformIcons[platform.toLowerCase()] || <Globe className="w-3 h-3" />}
              </div>
            ))}
          </div>
        )}

        {/* Price & Rating */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-blue-600">${product.price.toFixed(0)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through">
                ${product.originalPrice.toFixed(0)}
              </span>
            )}
          </div>

          {product.rating && product.rating > 0 ? (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium text-slate-800">{product.rating.toFixed(1)}</span>
            </div>
          ) : (
            <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
              New
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default SoftwareCard;
