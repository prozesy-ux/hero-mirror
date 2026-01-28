import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FlashSaleBadgeProps {
  discountPercentage: number;
  className?: string;
}

const FlashSaleBadge = ({ discountPercentage, className }: FlashSaleBadgeProps) => {
  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-full',
        'bg-gradient-to-r from-red-500 to-orange-500 text-white',
        'text-[10px] font-bold shadow-lg animate-pulse',
        className
      )}
    >
      <Zap className="h-3 w-3 fill-current" />
      <span>{discountPercentage}% OFF</span>
    </div>
  );
};

export default FlashSaleBadge;
