import { useRef, useEffect, useState, useCallback } from 'react';
import { Search, Clock, TrendingUp, Package, Tag, Store, FolderOpen, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchSuggestion } from '@/hooks/useSearchSuggestions';

interface SearchSuggestionsProps {
  query: string;
  suggestions: {
    recent: SearchSuggestion[];
    trending: SearchSuggestion[];
    products: SearchSuggestion[];
    categories: SearchSuggestion[];
    tags: SearchSuggestion[];
    sellers: SearchSuggestion[];
  };
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (suggestion: SearchSuggestion) => void;
  onClearRecent?: () => void;
  className?: string;
}

export function SearchSuggestions({
  query,
  suggestions,
  isLoading,
  isOpen,
  onClose,
  onSelect,
  onClearRecent,
  className,
}: SearchSuggestionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  // Flatten all suggestions for keyboard navigation
  const allSuggestions = [
    ...suggestions.recent,
    ...suggestions.trending,
    ...suggestions.products,
    ...suggestions.categories,
    ...suggestions.tags,
    ...suggestions.sellers,
  ];

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlightIndex(-1);
  }, [suggestions]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen || allSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(prev => 
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && allSuggestions[highlightIndex]) {
          onSelect(allSuggestions[highlightIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, allSuggestions, highlightIndex, onSelect, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  const hasResults = allSuggestions.length > 0;

  // Helper to highlight matching text
  const highlightMatch = (text: string) => {
    if (!query || query.length < 2) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <span key={i} className="text-primary font-semibold">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const getIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'trending':
        return <TrendingUp className="h-4 w-4 text-primary" />;
      case 'product':
        return <Package className="h-4 w-4 text-primary" />;
      case 'category':
        return <FolderOpen className="h-4 w-4 text-primary" />;
      case 'tag':
        return <Tag className="h-4 w-4 text-primary" />;
      case 'seller':
        return <Store className="h-4 w-4 text-primary" />;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const renderSection = (
    title: string,
    items: SearchSuggestion[],
    startIndex: number,
    showClear?: boolean
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="py-2">
        <div className="flex items-center justify-between px-3 pb-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          {showClear && onClearRecent && (
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClearRecent();
              }}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-0.5">
          {items.map((item, idx) => {
            const globalIndex = startIndex + idx;
            const isHighlighted = globalIndex === highlightIndex;

            return (
              <button
                key={`${item.type}-${item.id}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(item);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                  isHighlighted 
                    ? "bg-accent text-accent-foreground" 
                    : "hover:bg-accent/50"
                )}
              >
                {item.icon_url ? (
                  <img 
                    src={item.icon_url} 
                    alt="" 
                    className="h-6 w-6 rounded object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  getIcon(item.type)
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {highlightMatch(item.text)}
                  </div>
                  {item.subtitle && (
                    <div className="text-xs text-muted-foreground truncate">
                      {item.subtitle}
                    </div>
                  )}
                </div>
                {item.price !== undefined && (
                  <span className="text-sm font-semibold text-primary">
                    ${item.price.toFixed(2)}
                  </span>
                )}
                {item.result_count !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {item.result_count} searches
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Calculate start indices for each section
  let currentIndex = 0;
  const recentStart = currentIndex;
  currentIndex += suggestions.recent.length;
  const trendingStart = currentIndex;
  currentIndex += suggestions.trending.length;
  const productsStart = currentIndex;
  currentIndex += suggestions.products.length;
  const categoriesStart = currentIndex;
  currentIndex += suggestions.categories.length;
  const tagsStart = currentIndex;
  currentIndex += suggestions.tags.length;
  const sellersStart = currentIndex;

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute top-full left-0 right-0 z-50 mt-1",
        "bg-popover border border-border rounded-lg shadow-lg",
        "max-h-[60vh] overflow-y-auto",
        "animate-in fade-in-0 zoom-in-95 duration-150",
        className
      )}
    >
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && !hasResults && query.length >= 2 && (
        <div className="py-6 text-center">
          <Search className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            No results for "{query}"
          </p>
        </div>
      )}

      {!isLoading && hasResults && (
        <div className="divide-y divide-border">
          {renderSection('Recent Searches', suggestions.recent, recentStart, true)}
          {renderSection('Trending Now', suggestions.trending, trendingStart)}
          {renderSection('Products', suggestions.products, productsStart)}
          {renderSection('Categories', suggestions.categories, categoriesStart)}
          {renderSection('Tags', suggestions.tags, tagsStart)}
          {renderSection('Sellers', suggestions.sellers, sellersStart)}
        </div>
      )}

      {!isLoading && !hasResults && query.length < 2 && (
        <div className="py-6 text-center">
          <Search className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Type to search products, categories, sellers...
          </p>
        </div>
      )}
    </div>
  );
}
