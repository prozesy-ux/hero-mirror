import { useState, useEffect, useRef, useMemo } from 'react';
import { TrendingUp, Flame, Tag, ChevronRight, Sparkles, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PriceFilterSidebar } from '@/components/marketplace/PriceFilterSidebar';
import { RatingFilter } from '@/components/marketplace/RatingFilter';

interface AIAccount {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  category: string | null;
  category_id: string | null;
  is_available: boolean;
  is_trending: boolean;
  is_featured: boolean;
  original_price: number | null;
  tags: string[] | null;
  stock: number | null;
  chat_allowed?: boolean | null;
}

interface DynamicCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_active: boolean;
}

interface MarketplaceSidebarProps {
  trendingAccounts: AIAccount[];
  categories: DynamicCategory[];
  accounts: AIAccount[];
  selectedCategory: string;
  selectedTags: string[];
  onCategorySelect: (categoryId: string) => void;
  onTagSelect: (tag: string) => void;
  onAccountClick: (account: AIAccount) => void;
  getCategoryCount: (categoryId: string) => number;
  // New filter props
  priceRange?: { min?: number; max?: number };
  onPriceChange?: (min: number | undefined, max: number | undefined) => void;
  minRating?: number | null;
  onRatingChange?: (rating: number | null) => void;
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
  trendingAccounts,
  categories,
  accounts,
  selectedCategory,
  selectedTags,
  onCategorySelect,
  onTagSelect,
  onAccountClick,
  getCategoryCount,
  priceRange,
  onPriceChange,
  minRating,
  onRatingChange,
}: MarketplaceSidebarProps) => {
  const [isPaused, setIsPaused] = useState(false);
  const trendingRef = useRef<HTMLDivElement>(null);

  // Collect all unique tags from accounts
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    accounts.forEach(account => {
      account.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).slice(0, 15);
  }, [accounts]);

  // Auto-scroll trending section
  useEffect(() => {
    if (isPaused || !trendingRef.current || trendingAccounts.length <= 2) return;

    const interval = setInterval(() => {
      const container = trendingRef.current;
      if (container) {
        const maxScroll = container.scrollHeight - container.clientHeight;
        if (container.scrollTop >= maxScroll - 1) {
          container.scrollTop = 0;
        } else {
          container.scrollTop += 1;
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPaused, trendingAccounts.length]);

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Price Filter */}
      {onPriceChange && (
        <PriceFilterSidebar
          minPrice={priceRange?.min || 0}
          maxPrice={priceRange?.max || 100}
          onPriceChange={onPriceChange}
        />
      )}

      {/* Rating Filter */}
      {onRatingChange && (
        <RatingFilter
          value={minRating ?? null}
          onChange={onRatingChange}
        />
      )}

      {/* Trending Section */}
      {trendingAccounts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-shrink-0">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
            <Flame className="w-4 h-4 text-gray-700" />
            <h3 className="font-semibold text-gray-900 text-sm">Trending Now</h3>
          </div>
          <div
            ref={trendingRef}
            className="max-h-48 overflow-y-auto scrollbar-hide"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {trendingAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0"
                onClick={() => onAccountClick(account)}
              >
                {account.icon_url ? (
                  <img
                    src={account.icon_url}
                    alt={account.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-gray-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{account.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-bold text-sm">${account.price}</span>
                    {account.original_price && account.original_price > account.price && (
                      <span className="text-xs text-gray-400 line-through">${account.original_price}</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
          <Sparkles className="w-4 h-4 text-gray-700" />
          <h3 className="font-semibold text-gray-900 text-sm">Categories</h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* All Category */}
          <button
            onClick={() => onCategorySelect('all')}
            className={`w-full px-3 py-2.5 text-left transition-all border-l-3 ${
              selectedCategory === 'all'
                ? 'bg-gray-100 border-l-gray-900 font-semibold'
                : 'border-l-transparent hover:bg-gray-50'
            }`}
          >
            <span className="text-sm text-gray-900">All Products</span>
          </button>

          {/* Dynamic Categories - Names Only */}
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              className={`w-full px-3 py-2.5 text-left transition-all border-l-3 ${
                selectedCategory === category.id
                  ? `bg-gray-100 border-l-gray-900 font-semibold`
                  : 'border-l-transparent hover:bg-gray-50'
              }`}
            >
              <span className="text-sm text-gray-900">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tags Section */}
      {allTags.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-shrink-0">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
            <Tag className="w-4 h-4 text-gray-700" />
            <h3 className="font-semibold text-gray-900 text-sm">Popular Tags</h3>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagSelect(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    selectedTags.includes(tag)
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-900'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MarketplaceSidebar = (props: MarketplaceSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0 h-fit max-h-[calc(100vh-200px)] overflow-y-auto">
        <SidebarContent {...props} />
      </aside>

      {/* Mobile Filter Button & Sheet */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all font-medium text-sm text-gray-700">
              <Menu size={18} />
              Filters
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Filters</h2>
            </div>
            <div className="h-[calc(100vh-100px)] overflow-y-auto">
              <SidebarContent {...props} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default MarketplaceSidebar;
