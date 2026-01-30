import { PRODUCT_TYPES, getProductType } from '@/lib/product-types';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ProductTypeFilterProps {
  value: string | undefined;
  onChange: (type: string | undefined) => void;
  className?: string;
}

export function ProductTypeFilter({ value, onChange, className }: ProductTypeFilterProps) {
  // Show most popular types first, then allow expansion
  const primaryTypes = ['digital', 'ebook', 'course', 'template', 'software'];
  const displayedTypes = PRODUCT_TYPES.filter(t => primaryTypes.includes(t.id));
  const moreTypesCount = PRODUCT_TYPES.length - displayedTypes.length;

  return (
    <div className={cn("flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide", className)}>
      {/* All Types Button */}
      <button
        onClick={() => onChange(undefined)}
        className={cn(
          "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
          !value
            ? "bg-gray-900 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        )}
      >
        All Types
      </button>

      {/* Type Pills */}
      {displayedTypes.map((type) => {
        const Icon = type.icon;
        const isSelected = value === type.id;

        return (
          <button
            key={type.id}
            onClick={() => onChange(isSelected ? undefined : type.id)}
            className={cn(
              "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              isSelected
                ? `${type.bgColor} ${type.color} ring-2 ring-offset-1 ring-gray-300`
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{type.label}</span>
            {isSelected && (
              <X className="w-3 h-3 ml-0.5" />
            )}
          </button>
        );
      })}

      {/* More Types Indicator */}
      {moreTypesCount > 0 && (
        <span className="flex-shrink-0 px-2 py-1 text-xs text-gray-500 font-medium">
          +{moreTypesCount} more
        </span>
      )}
    </div>
  );
}

export default ProductTypeFilter;
