import { Crown, Star, Users, Infinity, Calendar, CheckCircle } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ProductCardProps } from './ProductCardRenderer';
import { cn } from '@/lib/utils';

const MembershipCard = ({
  product,
  onClick,
}: ProductCardProps) => {
  const accessType = product.accessType || 'lifetime';
  const memberCount = product.soldCount || 0;

  const accessLabels: Record<string, { label: string; icon: React.ReactNode }> = {
    lifetime: { label: 'Lifetime Access', icon: <Infinity className="w-3.5 h-3.5" /> },
    monthly: { label: 'Monthly', icon: <Calendar className="w-3.5 h-3.5" /> },
    yearly: { label: 'Yearly', icon: <Calendar className="w-3.5 h-3.5" /> },
  };

  const access = accessLabels[accessType] || accessLabels.lifetime;

  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
    >
      {/* Gradient border effect */}
      <div className="p-[2px] rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden">
          
          {/* Image with premium overlay */}
          <div className="relative overflow-hidden">
            <AspectRatio ratio={16/9}>
              {product.iconUrl ? (
                <img
                  src={product.iconUrl}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <Crown className="w-16 h-16 text-yellow-500/50" />
                </div>
              )}
            </AspectRatio>

            {/* Premium gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

            {/* Membership badge */}
            <div className="absolute top-3 left-3 px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
              <Crown className="w-3.5 h-3.5" />
              Membership
            </div>

            {/* Access type badge */}
            <div className="absolute top-3 right-3 px-2.5 py-1 bg-white/10 backdrop-blur-sm text-white rounded-full text-[10px] font-medium flex items-center gap-1.5 border border-white/20">
              {access.icon}
              {access.label}
            </div>

            {/* Member count */}
            {memberCount > 0 && (
              <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/50 backdrop-blur-sm text-white rounded-full text-[10px] font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {memberCount.toLocaleString()} members
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Title */}
            <h3 className="text-sm font-semibold text-white line-clamp-2 mb-2 min-h-[2.5rem] leading-tight group-hover:text-yellow-400 transition-colors">
              {product.name}
            </h3>

            {/* Seller */}
            {product.sellerName && (
              <div className="flex items-center gap-2 mb-3">
                {product.sellerAvatar ? (
                  <img 
                    src={product.sellerAvatar} 
                    alt={product.sellerName}
                    className="w-5 h-5 rounded-full object-cover ring-2 ring-yellow-500/50"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-slate-900">
                      {product.sellerName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <p className="text-xs text-slate-400 truncate">{product.sellerName}</p>
                {product.rating && (
                  <div className="flex items-center gap-1 ml-auto">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium text-white">{product.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Features preview */}
            <div className="flex items-center gap-2 mb-3 text-[10px] text-slate-400">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Exclusive content
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Community
              </div>
            </div>

            {/* Price & CTA */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">
                  {accessType === 'monthly' ? '/month' : accessType === 'yearly' ? '/year' : 'one-time'}
                </span>
                <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">
                  ${product.price.toFixed(0)}
                </span>
              </div>
              <div className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-900 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg">
                <Crown className="w-3.5 h-3.5" />
                Join Now
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};

export default MembershipCard;
