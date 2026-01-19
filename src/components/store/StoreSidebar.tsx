import { useState, useRef, useEffect, useMemo } from 'react';
import { TrendingUp, Sparkles, Tag, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';

interface SellerProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  category_id: string | null;
  tags: string[] | null;
  sold_count: number | null;
  is_available?: boolean;
  is_approved?: boolean;
  stock?: number | null;
  chat_allowed?: boolean | null;
  seller_id?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface StoreSidebarProps {
  products: SellerProduct[];
  categories: Category[];
  selectedCategory: string;
  selectedTags: string[];
  onCategorySelect: (category: string) => void;
  onTagSelect: (tag: string) => void;
  onProductClick: (product: any) => void;
}

const getCategoryColorClass = (color: string | null) => {
  const colorMap: Record<string, string> = {
    violet: 'bg-violet-500',
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    cyan: 'bg-cyan-500',
    pink: 'bg-pink-500',
    indigo: 'bg-indigo-500',
    teal: 'bg-teal-500',
    orange: 'bg-orange-500',
  };
  return colorMap[color || 'violet'] || 'bg-violet-500';
};

const getCategoryBorderClass = (color: string | null) => {
  const colorMap: Record<string, string> = {
    violet: 'border-l-violet-500',
    emerald: 'border-l-emerald-500',
    blue: 'border-l-blue-500',
    rose: 'border-l-rose-500',
    amber: 'border-l-amber-500',
    cyan: 'border-l-cyan-500',
    pink: 'border-l-pink-500',
    indigo: 'border-l-indigo-500',
    teal: 'border-l-teal-500',
    orange: 'border-l-orange-500',
  };
  return colorMap[color || 'violet'] || 'border-l-violet-500';
};

const SidebarContent = ({
  products,
  categories,
  selectedCategory,
  selectedTags,
  onCategorySelect,
  onTagSelect,
  onProductClick,
}: StoreSidebarProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get trending products (top 5 by sold_count)
  const trendingProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0))
      .slice(0, 5);
  }, [products]);

  // Get unique tags from products
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    products.forEach(product => {
      product.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).slice(0, 10);
  }, [products]);

  // Get categories that have products
  const activeCategories = useMemo(() => {
    const categoryIds = new Set(products.map(p => p.category_id).filter(Boolean));
    return categories.filter(cat => categoryIds.has(cat.id));
  }, [products, categories]);

  // Auto-scroll for trending
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || trendingProducts.length <= 2) return;
    
    let scrollDirection = 1;
    const scrollInterval = setInterval(() => {
      if (!scrollContainer) return;
      
      if (scrollContainer.scrollTop >= scrollContainer.scrollHeight - scrollContainer.clientHeight) {
        scrollDirection = -1;
      } else if (scrollContainer.scrollTop <= 0) {
        scrollDirection = 1;
      }
      
      scrollContainer.scrollTop += scrollDirection * 1;
    }, 50);

    return () => clearInterval(scrollInterval);
  }, [trendingProducts.length]);

  const getCategoryCount = (categoryId: string) => {
    return products.filter(p => p.category_id === categoryId).length;
  };

  return (
    <div className="space-y-6">
      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Trending Now</span>
          </div>
          <div 
            ref={scrollRef}
            className="space-y-2.5 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent"
          >
            {trendingProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onProductClick(product)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group text-left"
              >
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {product.icon_url ? (
                    <img src={product.icon_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{product.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500">{product.sold_count || 0}+ sold</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {activeCategories.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Categories</span>
          </div>
          <div className="space-y-1.5">
            {/* All Products */}
            <button
              onClick={() => onCategorySelect('all')}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                selectedCategory === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'hover:bg-gray-50 text-gray-600'
              }`}
            >
              <span className="font-medium">All Products</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                selectedCategory === 'all' ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {products.length}
              </span>
            </button>

            {activeCategories.map(category => (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left border-l-4 ${
                  selectedCategory === category.id
                    ? `bg-gray-900 text-white border-l-gray-900`
                    : `hover:bg-gray-50 text-gray-600 ${getCategoryBorderClass(category.color)}`
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getCategoryColorClass(category.color)}`} />
                  <span className="font-medium">{category.name}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedCategory === category.id ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  {getCategoryCount(category.id)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Tags */}
      {allTags.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center">
              <Tag className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Popular Tags</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => onTagSelect(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedTags.includes(tag)
                    ? 'bg-violet-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const StoreSidebar = (props: StoreSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-24 h-fit">
        <SidebarContent {...props} />
      </aside>

      {/* Mobile Filter Button */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="h-12 rounded-xl border-gray-200 shadow-md">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-4">
            <SheetHeader className="pb-4">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <SidebarContent {...props} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default StoreSidebar;
