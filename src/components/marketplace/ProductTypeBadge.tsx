import { getProductTypeById } from '@/components/icons/ProductTypeIcons';
import { cn } from '@/lib/utils';

interface ProductTypeBadgeProps {
  type: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const ProductTypeBadge = ({ type, size = 'sm', showIcon = false }: ProductTypeBadgeProps) => {
  const productType = getProductTypeById(type);
  const Icon = productType.Icon;
  
  const bgColors: Record<string, string> = {
    digital_product: 'bg-amber-50 text-amber-700',
    course: 'bg-teal-50 text-teal-700',
    ebook: 'bg-amber-50 text-amber-700',
    membership: 'bg-teal-50 text-teal-700',
    bundle: 'bg-pink-50 text-pink-700',
    software: 'bg-blue-50 text-blue-700',
    template: 'bg-purple-50 text-purple-700',
    graphics: 'bg-amber-50 text-amber-700',
    audio: 'bg-red-50 text-red-700',
    video: 'bg-green-50 text-green-700',
    service: 'bg-teal-50 text-teal-700',
    commission: 'bg-amber-50 text-amber-700',
    call: 'bg-pink-50 text-pink-700',
    coffee: 'bg-teal-50 text-teal-700',
  };

  const colorClass = bgColors[type] || bgColors.digital_product;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 font-medium rounded-full",
      size === 'sm' ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
      colorClass
    )}>
      {showIcon && <Icon className="w-3 h-3" />}
      {productType.name}
    </span>
  );
};

export default ProductTypeBadge;
