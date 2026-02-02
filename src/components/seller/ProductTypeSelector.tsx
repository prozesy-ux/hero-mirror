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
      <div className="grid grid-cols-3 gap-4" style={{ fontFamily: "'Inter', sans-serif" }}>
        {displayTypes.map((type) => {
          const isSelected = selectedType === type.id;
          const Icon = type.Icon;
          
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onTypeSelect(type.id)}
              className={cn(
                "flex flex-col gap-4 p-4 rounded-xl border-2 text-left transition-all bg-white h-full",
                isSelected
                  ? "border-black"
                  : "border-gray-200 hover:border-gray-400"
              )}
            >
              <div 
                className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: type.bgColor }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-gray-900">{type.name}</h3>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Products Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-4">Products</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {productTypes.map((type) => {
            const isSelected = selectedType === type.id;
            const Icon = type.Icon;
            
            return (
            <button
              key={type.id}
              type="button"
              onClick={() => onTypeSelect(type.id)}
              className={cn(
                "flex flex-col gap-4 p-4 rounded-xl border-2 text-left transition-all bg-white h-full",
                isSelected
                  ? "border-black"
                  : "border-gray-200 hover:border-gray-400"
              )}
            >
              <div 
                className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: type.bgColor }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">
                  {type.name}
                </h3>
                <p className="text-xs text-gray-600 leading-tight line-clamp-2">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {serviceTypes.map((type) => {
            const isSelected = selectedType === type.id;
            const Icon = type.Icon;
            
            return (
            <button
              key={type.id}
              type="button"
              onClick={() => onTypeSelect(type.id)}
              className={cn(
                "flex flex-col gap-4 p-4 rounded-xl border-2 text-left transition-all bg-white h-full",
                isSelected
                  ? "border-black"
                  : "border-gray-200 hover:border-gray-400"
              )}
            >
              <div 
                className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: type.bgColor }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">
                  {type.name}
                </h3>
                <p className="text-xs text-gray-600 leading-tight line-clamp-2">
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
