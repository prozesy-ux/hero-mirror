import { useMemo } from 'react';
import { Sparkles } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface SellerProduct {
  id: string;
  category_id: string | null;
}

interface StoreCategoryChipsProps {
  products: SellerProduct[];
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

const StoreCategoryChips = ({
  products,
  categories,
  selectedCategory,
  onCategorySelect
}: StoreCategoryChipsProps) => {
  // Get categories that have products
  const activeCategories = useMemo(() => {
    const categoryIds = new Set(products.map(p => p.category_id).filter(Boolean));
    return categories.filter(cat => categoryIds.has(cat.id));
  }, [products, categories]);

  if (activeCategories.length === 0) return null;

  return (
    <div className="md:hidden overflow-x-auto hide-scrollbar mobile-scroll-snap pb-2 -mx-3 px-3">
      <div className="flex gap-2 w-max">
        {/* All Products Chip */}
        <button
          onClick={() => onCategorySelect('all')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all tap-feedback ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white shadow-lg'
              : 'bg-white text-slate-700 border border-slate-200 shadow-sm'
          }`}
        >
          <Sparkles size={12} className={selectedCategory === 'all' ? 'text-white' : 'text-emerald-500'} />
          All
        </button>

        {/* Category Chips */}
        {activeCategories.map((category) => {
          const isActive = selectedCategory === category.id;
          const productCount = products.filter(p => p.category_id === category.id).length;
          
          return (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all tap-feedback ${
                isActive
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'bg-white text-slate-700 border border-slate-200 shadow-sm'
              }`}
            >
              <span>{category.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isActive 
                  ? 'bg-white/20 text-white' 
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {productCount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StoreCategoryChips;
