import { useState } from 'react';
import { ChevronDown, Star, X } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  icon?: string | null;
  productCount?: number;
}

interface GumroadFilterSidebarProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  availableTags: string[];
  priceMin?: number;
  priceMax?: number;
  onPriceChange: (min?: number, max?: number) => void;
  minRating: number | null;
  onRatingChange: (rating: number | null) => void;
  onClearFilters: () => void;
}

const GumroadFilterSidebar = ({
  categories,
  selectedCategory,
  onCategoryChange,
  selectedTags,
  onTagToggle,
  availableTags,
  priceMin,
  priceMax,
  onPriceChange,
  minRating,
  onRatingChange,
  onClearFilters,
}: GumroadFilterSidebarProps) => {
  const [showAllTags, setShowAllTags] = useState(false);
  const [localPriceMin, setLocalPriceMin] = useState<string>(priceMin?.toString() || '');
  const [localPriceMax, setLocalPriceMax] = useState<string>(priceMax?.toString() || '');
  const [openSections, setOpenSections] = useState({
    categories: true,
    tags: true,
    price: true,
    rating: true,
  });

  const visibleTags = showAllTags ? availableTags : availableTags.slice(0, 8);
  
  const hasActiveFilters = selectedCategory !== 'all' || 
    selectedTags.length > 0 || 
    priceMin !== undefined || 
    priceMax !== undefined || 
    minRating !== null;

  const handlePriceApply = () => {
    onPriceChange(
      localPriceMin ? parseFloat(localPriceMin) : undefined,
      localPriceMax ? parseFloat(localPriceMax) : undefined
    );
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <aside className="w-full lg:w-56 flex-shrink-0 border border-black/10 rounded-xl p-4 bg-white h-fit sticky top-4 space-y-4">
      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1.5 text-sm text-black/50 hover:text-black transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Clear all filters
        </button>
      )}

      {/* Categories */}
      <Collapsible open={openSections.categories} onOpenChange={() => toggleSection('categories')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left">
          <span className="text-sm font-semibold text-black uppercase tracking-wide">Categories</span>
          <ChevronDown className={cn(
            "w-4 h-4 text-black/40 transition-transform duration-200",
            openSections.categories && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-1 space-y-0.5">
          <button
            onClick={() => onCategoryChange('all')}
            className={cn(
              "w-full text-left px-2 py-1.5 rounded text-sm transition-colors",
              selectedCategory === 'all'
                ? 'text-black font-medium'
                : 'text-black/60 hover:text-black'
            )}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded text-sm flex items-center justify-between transition-colors",
                selectedCategory === cat.id
                  ? 'text-black font-medium'
                  : 'text-black/60 hover:text-black'
              )}
            >
              <span>{cat.name}</span>
              {cat.productCount !== undefined && (
                <span className="text-xs text-black/40">{cat.productCount}</span>
              )}
            </button>
          ))}
        </CollapsibleContent>
      </Collapsible>

      <div className="h-6" />

      {/* Tags */}
      {availableTags.length > 0 && (
        <>
          <Collapsible open={openSections.tags} onOpenChange={() => toggleSection('tags')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left">
              <span className="text-sm font-semibold text-black uppercase tracking-wide">Tags</span>
              <ChevronDown className={cn(
                "w-4 h-4 text-black/40 transition-transform duration-200",
                openSections.tags && "rotate-180"
              )} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-1">
              <div className="flex flex-wrap gap-1.5">
                {visibleTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => onTagToggle(tag)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                      selectedTags.includes(tag)
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black/60 border-black/10 hover:border-black/30'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {availableTags.length > 8 && (
                <button
                  onClick={() => setShowAllTags(!showAllTags)}
                  className="mt-2 text-xs text-black/50 hover:text-black"
                >
                  {showAllTags ? 'Show less' : `+${availableTags.length - 8} more`}
                </button>
              )}
            </CollapsibleContent>
          </Collapsible>
          <div className="h-6" />
        </>
      )}

      {/* Price */}
      <Collapsible open={openSections.price} onOpenChange={() => toggleSection('price')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left">
          <span className="text-sm font-semibold text-black uppercase tracking-wide">Price</span>
          <ChevronDown className={cn(
            "w-4 h-4 text-black/40 transition-transform duration-200",
            openSections.price && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-black/40">$</span>
              <input
                type="number"
                placeholder="Min"
                value={localPriceMin}
                onChange={(e) => setLocalPriceMin(e.target.value)}
                className="w-full pl-5 pr-2 py-1.5 border border-black/10 rounded text-sm focus:border-black/30 focus:outline-none"
              />
            </div>
            <span className="text-black/30 text-sm">–</span>
            <div className="flex-1 relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-black/40">$</span>
              <input
                type="number"
                placeholder="Max"
                value={localPriceMax}
                onChange={(e) => setLocalPriceMax(e.target.value)}
                className="w-full pl-5 pr-2 py-1.5 border border-black/10 rounded text-sm focus:border-black/30 focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={handlePriceApply}
            className="w-full py-1.5 bg-black text-white text-xs font-medium rounded hover:bg-black/80 transition-colors"
          >
            Apply
          </button>
        </CollapsibleContent>
      </Collapsible>

      <div className="h-6" />

      {/* Rating */}
      <Collapsible open={openSections.rating} onOpenChange={() => toggleSection('rating')}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-left">
          <span className="text-sm font-semibold text-black uppercase tracking-wide">Rating</span>
          <ChevronDown className={cn(
            "w-4 h-4 text-black/40 transition-transform duration-200",
            openSections.rating && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-1 space-y-1">
          {[4, 3, 2].map((rating) => (
            <button
              key={rating}
              onClick={() => onRatingChange(minRating === rating ? null : rating)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors",
                minRating === rating
                  ? 'text-black font-medium'
                  : 'text-black/60 hover:text-black'
              )}
            >
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3 h-3",
                      i < rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-black/20'
                    )}
                  />
                ))}
              </div>
              <span>& up</span>
            </button>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </aside>
  );
};

export default GumroadFilterSidebar;
