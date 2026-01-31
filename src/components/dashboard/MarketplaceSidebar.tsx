import { useState, useEffect, useRef, useMemo } from 'react';
import { TrendingUp, ChevronRight, Menu } from 'lucide-react';
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
    <div className="h-full flex flex-col gap-6 overflow-hidden">
      {/* Price Filter */}
      {onPriceChange && (
        <div className="flex-shrink-0">
          <h3 className="text-xs font-semibold text-black/50 uppercase tracking-wide mb-3">Price Range</h3>
          <PriceFilterSidebar
            minPrice={priceRange?.min || 0}
            maxPrice={priceRange?.max || 100}
            onPriceChange={onPriceChange}
          />
        </div>
      )}

      {/* Rating Filter */}
      {onRatingChange && (
        <div className="flex-shrink-0">
          <h3 className="text-xs font-semibold text-black/50 uppercase tracking-wide mb-3">Rating</h3>
          <RatingFilter
            value={minRating ?? null}
            onChange={onRatingChange}
          />
        </div>
      )}

      {/* Trending Section */}
      {trendingAccounts.length > 0 && (
        <div className="flex-shrink-0">
          <h3 className="text-xs font-semibold text-black/50 uppercase tracking-wide mb-3">Trending Now</h3>
          <div
            ref={trendingRef}
            className="max-h-48 overflow-y-auto scrollbar-hide space-y-1"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {trendingAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-3 p-2 hover:bg-black/5 cursor-pointer transition-colors rounded-lg"
                onClick={() => onAccountClick(account)}
              >
                {account.icon_url ? (
                  <img
                    src={account.icon_url}
                    alt={account.name}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-black/5 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-black/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">{account.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-black font-semibold text-sm">${account.price}</span>
                    {account.original_price && account.original_price > account.price && (
                      <span className="text-xs text-black/40 line-through">${account.original_price}</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-black/30 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Section */}
      <div className="flex-1 min-h-0 flex flex-col">
        <h3 className="text-xs font-semibold text-black/50 uppercase tracking-wide mb-3">Categories</h3>
        <div className="flex-1 overflow-y-auto space-y-1">
          {/* All Category */}
          <button
            onClick={() => onCategorySelect('all')}
            className={`w-full py-2 text-left text-sm transition-colors ${
              selectedCategory === 'all'
                ? 'text-black font-medium'
                : 'text-black/60 hover:text-black'
            }`}
          >
            All Products
          </button>

          {/* Dynamic Categories - Names Only */}
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              className={`w-full py-2 text-left text-sm transition-colors ${
                selectedCategory === category.id
                  ? 'text-black font-medium'
                  : 'text-black/60 hover:text-black'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tags Section */}
      {allTags.length > 0 && (
        <div className="flex-shrink-0">
          <h3 className="text-xs font-semibold text-black/50 uppercase tracking-wide mb-3">Popular Tags</h3>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagSelect(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedTags.includes(tag)
                    ? 'bg-black text-white'
                    : 'bg-black/5 text-black/70 hover:bg-black/10'
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
