import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface MarketplaceSectionProps {
  children: ReactNode;
  variant?: 'default' | 'accent' | 'featured';
  className?: string;
}

const MarketplaceSection = ({ 
  children, 
  variant = 'default', 
  className 
}: MarketplaceSectionProps) => {
  const variants = {
    default: 'bg-white',
    accent: 'bg-gradient-to-r from-gray-50 to-white',
    featured: 'bg-gradient-to-br from-purple-50/30 via-pink-50/20 to-white',
  };

  return (
    <section
      className={cn(
        'rounded-2xl border border-black/5 p-6',
        variants[variant],
        className
      )}
    >
      {children}
    </section>
  );
};

export default MarketplaceSection;
