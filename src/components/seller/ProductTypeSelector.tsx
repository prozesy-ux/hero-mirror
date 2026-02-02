import { PRODUCT_TYPES, ProductTypeId } from '@/components/icons/ProductTypeIcons';
import { cn } from '@/lib/utils';

interface ProductTypeSelectorProps {
  selectedType: ProductTypeId;
  onTypeSelect: (type: ProductTypeId) => void;
  compact?: boolean;
}

// Separate product types into categories
const PRODUCT_CATEGORY_TYPES = ['digital_product', 'course', 'ebook', 'membership', 'bundle', 'software', 'template', 'graphics', 'audio', 'video'];
const SERVICE_CATEGORY_TYPES = ['service', 'commission', 'call', 'coffee'];

const ProductTypeSelector = ({ 
  selectedType, 
  onTypeSelect,
  compact = false 
}: ProductTypeSelectorProps) => {
  const productTypes = PRODUCT_TYPES.filter(t => PRODUCT_CATEGORY_TYPES.includes(t.id));
  const serviceTypes = PRODUCT_TYPES.filter(t => SERVICE_CATEGORY_TYPES.includes(t.id));
  
  if (compact) {
    const displayTypes = PRODUCT_TYPES.slice(0, 9);
    return (
      <div className="grid grid-cols-3 gap-3">
        {displayTypes.map((type) => {
          const isSelected = selectedType === type.id;
          const Icon = type.Icon;
          
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onTypeSelect(type.id)}
              className={cn(
                "flex items-start gap-3 p-3 rounded-md border text-left transition-all bg-white",
                isSelected
                  ? "border-pink-500 border-2"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex-shrink-0">
                <Icon className="w-8 h-8" />
              </div>
              <span className="font-medium text-sm text-gray-900">{type.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Products Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-4">Products</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {productTypes.map((type) => {
            const isSelected = selectedType === type.id;
            const Icon = type.Icon;
            
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => onTypeSelect(type.id)}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-md border text-left transition-all bg-white min-h-[80px]",
                  isSelected
                    ? "border-pink-500 border-2"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex-shrink-0">
                  <Icon className="w-10 h-10" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm leading-tight">
                    {type.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {type.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Services Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-4">Services</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {serviceTypes.map((type) => {
            const isSelected = selectedType === type.id;
            const Icon = type.Icon;
            
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => onTypeSelect(type.id)}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-md border text-left transition-all bg-white min-h-[80px]",
                  isSelected
                    ? "border-pink-500 border-2"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex-shrink-0">
                  <Icon className="w-10 h-10" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm leading-tight">
                    {type.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {type.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductTypeSelector;
