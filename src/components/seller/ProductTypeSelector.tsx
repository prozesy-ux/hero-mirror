import { PRODUCT_TYPES, type ProductType } from '@/lib/product-types';
import { cn } from '@/lib/utils';

interface ProductTypeSelectorProps {
  value: string;
  onChange: (type: string) => void;
  className?: string;
}

export function ProductTypeSelector({ value, onChange, className }: ProductTypeSelectorProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">What are you selling?</label>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {PRODUCT_TYPES.map((type) => {
          const Icon = type.icon;
          const isSelected = value === type.id;
          
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onChange(type.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200",
                "hover:scale-[1.02] active:scale-[0.98]",
                isSelected
                  ? `${type.bgColor} ${type.borderColor} ring-2 ring-offset-2 ring-slate-200`
                  : "bg-white border-slate-200 hover:border-slate-300"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                isSelected ? type.bgColor : "bg-slate-100"
              )}>
                <Icon className={cn(
                  "w-5 h-5 transition-colors",
                  isSelected ? type.color : "text-slate-500"
                )} />
              </div>
              <span className={cn(
                "text-xs font-medium text-center leading-tight",
                isSelected ? "text-slate-900" : "text-slate-600"
              )}>
                {type.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ProductTypeSelector;
