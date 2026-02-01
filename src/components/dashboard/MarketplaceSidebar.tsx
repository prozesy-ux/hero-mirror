import { useState, useEffect, useRef } from 'react';
import { TrendingUp, ChevronRight, ChevronDown, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { PriceFilterSidebar } from '@/components/marketplace/PriceFilterSidebar';
import { RatingFilter } from '@/components/marketplace/RatingFilter';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

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

const SidebarContent = ({
  trendingAccounts,
  categories,
  selectedCategory,
  onCategorySelect,
  onAccountClick,
  priceRange,
  onPriceChange,
  minRating,
  onRatingChange,
}: MarketplaceSidebarProps) => {
  const [isPaused, setIsPaused] = useState(false);
  const trendingRef = useRef<HTMLDivElement>(null);
  
  // Collapsible states - all open by default
  const [trendingOpen, setTrendingOpen] = useState(true);
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [ratingOpen, setRatingOpen] = useState(true);

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
    <div className="bg-white border border-black/10 rounded-xl p-4 space-y-1">
      {/* Trending Section */}
      {trendingAccounts.length > 0 && (
        <Collapsible open={trendingOpen} onOpenChange={setTrendingOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-black/5 rounded-lg px-2 -mx-2 transition-colors">
            <h3 className="text-xs font-semibold text-black/50 uppercase tracking-wide">Trending Now</h3>
            <ChevronDown className={`w-4 h-4 text-black/40 transition-transform ${trendingOpen ? '' : '-rotate-90'}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div
              ref={trendingRef}
              className="max-h-48 overflow-y-auto scrollbar-hide space-y-1 mt-2"
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
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Categories Section */}
      <Collapsible open={categoriesOpen} onOpenChange={setCategoriesOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-black/5 rounded-lg px-2 -mx-2 transition-colors">
          <h3 className="text-xs font-semibold text-black/50 uppercase tracking-wide">Categories</h3>
          <ChevronDown className={`w-4 h-4 text-black/40 transition-transform ${categoriesOpen ? '' : '-rotate-90'}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-1 mt-2">
            {/* All Category */}
            <button
              onClick={() => onCategorySelect('all')}
              className={`w-full py-2 px-2 text-left text-sm transition-colors rounded-lg ${
                selectedCategory === 'all'
                  ? 'text-black font-medium bg-black/5'
                  : 'text-black/60 hover:text-black hover:bg-black/5'
              }`}
            >
              All Products
            </button>

            {/* Dynamic Categories */}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className={`w-full py-2 px-2 text-left text-sm transition-colors rounded-lg ${
                  selectedCategory === category.id
                    ? 'text-black font-medium bg-black/5'
                    : 'text-black/60 hover:text-black hover:bg-black/5'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Price Filter */}
      {onPriceChange && (
        <Collapsible open={priceOpen} onOpenChange={setPriceOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-black/5 rounded-lg px-2 -mx-2 transition-colors">
            <h3 className="text-xs font-semibold text-black/50 uppercase tracking-wide">Price Range</h3>
            <ChevronDown className={`w-4 h-4 text-black/40 transition-transform ${priceOpen ? '' : '-rotate-90'}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2">
              <PriceFilterSidebar
                minPrice={priceRange?.min || 0}
                maxPrice={priceRange?.max || 100}
                onPriceChange={onPriceChange}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Rating Filter */}
      {onRatingChange && (
        <Collapsible open={ratingOpen} onOpenChange={setRatingOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-black/5 rounded-lg px-2 -mx-2 transition-colors">
            <h3 className="text-xs font-semibold text-black/50 uppercase tracking-wide">Rating</h3>
            <ChevronDown className={`w-4 h-4 text-black/40 transition-transform ${ratingOpen ? '' : '-rotate-90'}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2">
              <RatingFilter
                value={minRating ?? null}
                onChange={onRatingChange}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
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
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-black/10 rounded-xl shadow-md hover:shadow-lg transition-all font-medium text-sm text-gray-700">
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
