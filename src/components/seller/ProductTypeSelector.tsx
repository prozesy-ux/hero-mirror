import { PRODUCT_TYPES, ProductTypeId } from '@/components/icons/ProductTypeIcons';
import { cn } from '@/lib/utils';

interface ProductTypeSelectorProps {
  selectedType: ProductTypeId;
  onTypeSelect: (type: ProductTypeId) => void;
  compact?: boolean;
}

const ProductTypeSelector = ({ 
  selectedType, 
  onTypeSelect,
  compact = false 
}: ProductTypeSelectorProps) => {
  const displayTypes = compact ? PRODUCT_TYPES.slice(0, 9) : PRODUCT_TYPES;

  return (
    <div className={cn(
      "grid gap-3",
      compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
    )}>
      {displayTypes.map((type) => {
        const isSelected = selectedType === type.id;
        const Icon = type.Icon;
        
        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onTypeSelect(type.id)}
            className={cn(
              "relative flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-200 text-center group bg-white",
              isSelected
                ? "border-black"
                : "border-black/10 hover:border-black/30"
            )}
          >
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
            
            <div className="mb-3">
              <Icon className={cn(
                "transition-transform duration-200",
                isSelected ? "scale-110" : "group-hover:scale-105"
              )} />
            </div>
            
            <span className={cn(
              "text-sm font-bold",
              isSelected ? "text-black" : "text-gray-700"
            )}>
              {type.name}
            </span>
            
            {!compact && (
              <span className="text-xs text-gray-500 mt-1 line-clamp-2">
                {type.description}
              </span>
            )}
            
            {/* Underline indicator for selected */}
            {isSelected && (
              <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-black rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ProductTypeSelector;
