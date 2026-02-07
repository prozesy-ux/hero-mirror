import { Calendar, Clock, Star, MessageCircle, Phone, DollarSign, Zap } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ProductCardProps } from './ProductCardRenderer';
import { cn } from '@/lib/utils';

interface ServiceCardProps extends ProductCardProps {
  serviceType?: 'service' | 'commission' | 'call';
}

const ServiceCard = ({
  product,
  onClick,
  serviceType = 'service',
}: ServiceCardProps) => {
  const responseTime = product.responseTime || '24h';
  const availability = product.availability || 'Available';
  
  const isCall = serviceType === 'call';
  const isCommission = serviceType === 'commission';

  const themeColors = {
    service: {
      bg: 'from-teal-50 to-cyan-50',
      border: 'border-teal-200/50 hover:border-teal-300',
      badge: 'bg-teal-500',
      accent: 'text-teal-600',
      cta: 'bg-teal-500 hover:bg-teal-600',
    },
    commission: {
      bg: 'from-amber-50 to-orange-50',
      border: 'border-amber-200/50 hover:border-amber-300',
      badge: 'bg-amber-500',
      accent: 'text-amber-600',
      cta: 'bg-amber-500 hover:bg-amber-600',
    },
    call: {
      bg: 'from-pink-50 to-rose-50',
      border: 'border-pink-200/50 hover:border-pink-300',
      badge: 'bg-pink-500',
      accent: 'text-pink-600',
      cta: 'bg-pink-500 hover:bg-pink-600',
    },
  };

  const theme = themeColors[serviceType];

  const ctaText = {
    service: 'Book Now',
    commission: 'Request Quote',
    call: 'Schedule Call',
  };

  const TypeIcon = {
    service: Calendar,
    commission: DollarSign,
    call: Phone,
  }[serviceType];

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-xl overflow-hidden border shadow-sm transition-all duration-200 hover:shadow-xl hover:-translate-y-1",
        `bg-gradient-to-br ${theme.bg}`,
        theme.border
      )}
    >
      {/* Image with calendar/booking overlay */}
      <div className="relative overflow-hidden">
        <AspectRatio ratio={4/3}>
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
              <TypeIcon className={cn("w-16 h-16 opacity-30", theme.accent)} />
            </div>
          )}
        </AspectRatio>

        {/* Type badge */}
        <div className={cn(
          "absolute top-3 left-3 px-2.5 py-1 text-white rounded-full text-[10px] font-semibold flex items-center gap-1.5 shadow-lg",
          theme.badge
        )}>
          <TypeIcon className="w-3.5 h-3.5" />
          {serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}
        </div>

        {/* Availability indicator */}
        <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-medium flex items-center gap-1 shadow">
          <span className={cn(
            "w-2 h-2 rounded-full",
            availability === 'Available' ? 'bg-green-500' : 'bg-yellow-500'
          )} />
          {availability}
        </div>

        {/* Commission 50/50 indicator */}
        {isCommission && (
          <div className="absolute bottom-3 left-3 right-3 px-3 py-2 bg-black/70 backdrop-blur-sm rounded-lg flex items-center justify-between text-white text-xs">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              50% Deposit
            </span>
            <span className="text-white/60">→</span>
            <span>50% on Delivery</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className={cn(
          "text-sm font-semibold text-slate-900 line-clamp-2 mb-1 min-h-[2.5rem] leading-tight transition-colors",
          `group-hover:${theme.accent}`
        )}>
          {product.name}
        </h3>

        {/* Seller */}
        {product.sellerName && (
          <div className="flex items-center gap-2 mb-3">
            {product.sellerAvatar ? (
              <img 
                src={product.sellerAvatar} 
                alt={product.sellerName}
                className="w-5 h-5 rounded-full object-cover"
              />
            ) : (
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center",
                theme.badge
              )}>
                <span className="text-[10px] font-semibold text-white">
                  {product.sellerName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <p className="text-xs text-slate-600 truncate">{product.sellerName}</p>
            {product.rating && (
              <div className="flex items-center gap-0.5 ml-auto">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}

        {/* Response time & stats */}
        <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            <span>Responds in {responseTime}</span>
          </div>
          {product.soldCount && product.soldCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{product.soldCount} orders</span>
            </div>
          )}
        </div>

        {/* Price & CTA */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">
              {isCommission ? 'Starting from' : isCall ? 'Per session' : 'From'}
            </span>
            <span className={cn("text-lg font-bold", theme.accent)}>
              ${product.price.toFixed(0)}
            </span>
          </div>
          <div className={cn(
            "px-4 py-2 text-white rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md",
            theme.cta
          )}>
            <TypeIcon className="w-3.5 h-3.5" />
            {ctaText[serviceType]}
          </div>
        </div>
      </div>
    </button>
  );
};

export default ServiceCard;
