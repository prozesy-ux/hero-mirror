import { User, TrendingUp, Award, Crown, Gem, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SellerLevel {
  id: string;
  name: string;
  badge_color: string;
  badge_icon: string;
  commission_rate: number;
  benefits: string[];
}

interface SellerLevelBadgeProps {
  level: SellerLevel | null;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

const iconMap: Record<string, LucideIcon> = {
  user: User,
  'trending-up': TrendingUp,
  award: Award,
  crown: Crown,
  gem: Gem,
};

const SellerLevelBadge = ({ 
  level, 
  size = 'md', 
  showName = true,
  className 
}: SellerLevelBadgeProps) => {
  if (!level) return null;

  const IconComponent = iconMap[level.badge_icon] || User;
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const textSizeClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  const paddingClasses = {
    sm: 'px-1.5 py-0.5 gap-1',
    md: 'px-2 py-1 gap-1.5',
    lg: 'px-3 py-1.5 gap-2',
  };

  return (
    <div 
      className={cn(
        'inline-flex items-center rounded-full font-semibold',
        paddingClasses[size],
        className
      )}
      style={{ 
        backgroundColor: `${level.badge_color}20`,
        color: level.badge_color,
        border: `1px solid ${level.badge_color}40`
      }}
    >
      <IconComponent className={sizeClasses[size]} />
      {showName && (
        <span className={textSizeClasses[size]}>{level.name}</span>
      )}
    </div>
  );
};

export default SellerLevelBadge;
