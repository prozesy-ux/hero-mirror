import { useRef, useEffect } from 'react';
import { Search, Clock, TrendingUp, Package, Store, Tag, X } from 'lucide-react';
import { SearchSuggestions as SuggestionData, SearchSuggestion } from '@/hooks/useSearchSuggestions';

interface MarketplaceSearchSuggestionsProps {
  query: string;
  suggestions: SuggestionData;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (suggestion: SearchSuggestion) => void;
  onClearRecent?: () => void;
}

export function MarketplaceSearchSuggestions({
  query,
  suggestions,
  isLoading,
  isOpen,
  onClose,
  onSelect,
  onClearRecent,
}: MarketplaceSearchSuggestionsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const hasContent =
    suggestions.recent.length > 0 ||
    suggestions.trending.length > 0 ||
    suggestions.products.length > 0 ||
    suggestions.sellers.length > 0 ||
    suggestions.categories.length > 0;

  const getIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <Clock className="w-4 h-4 text-black/40" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-black/40" />;
      case 'product':
        return <Package className="w-4 h-4 text-black/40" />;
      case 'seller':
        return <Store className="w-4 h-4 text-black/40" />;
      case 'category':
      case 'tag':
        return <Tag className="w-4 h-4 text-black/40" />;
      default:
        return <Search className="w-4 h-4 text-black/40" />;
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-black/20 shadow-lg z-50 max-h-[400px] overflow-y-auto"
    >
      {isLoading && !hasContent && (
        <div className="p-4 text-center text-black/50 text-sm">Searching...</div>
      )}

      {!isLoading && !hasContent && query.length >= 2 && (
        <div className="p-4 text-center text-black/50 text-sm">No results found</div>
      )}

      {/* Did you mean */}
      {suggestions.didYouMean && (
        <div className="px-4 py-2 border-b border-black/10">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect({ type: 'trending', id: 'didyoumean', text: suggestions.didYouMean! });
            }}
            className="text-sm text-black/60 hover:text-black"
          >
            Did you mean: <span className="font-medium text-black">{suggestions.didYouMean}</span>?
          </button>
        </div>
      )}

      {/* Recent searches */}
      {suggestions.recent.length > 0 && (
        <div className="border-b border-black/10">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-xs font-medium text-black/50 uppercase tracking-wide">Recent</span>
            {onClearRecent && (
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  onClearRecent();
                }}
                className="text-xs text-black/40 hover:text-black flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
          {suggestions.recent.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 transition-colors text-left"
            >
              {getIcon(item.type)}
              <span className="text-sm text-black truncate">{item.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Trending */}
      {suggestions.trending.length > 0 && (
        <div className="border-b border-black/10">
          <div className="px-4 py-2">
            <span className="text-xs font-medium text-black/50 uppercase tracking-wide">Trending</span>
          </div>
          {suggestions.trending.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 transition-colors text-left"
            >
              {getIcon(item.type)}
              <span className="text-sm text-black truncate">{item.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Products */}
      {suggestions.products.length > 0 && (
        <div className="border-b border-black/10">
          <div className="px-4 py-2">
            <span className="text-xs font-medium text-black/50 uppercase tracking-wide">Products</span>
          </div>
          {suggestions.products.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 transition-colors text-left"
            >
              {item.icon_url ? (
                <img src={item.icon_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                getIcon(item.type)
              )}
              <div className="flex-1 min-w-0">
                <span className="text-sm text-black block truncate">{item.text}</span>
                {item.subtitle && (
                  <span className="text-xs text-black/50 truncate">{item.subtitle}</span>
                )}
              </div>
              {item.price !== undefined && (
                <span className="text-sm font-medium text-black">₹{item.price}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Sellers */}
      {suggestions.sellers.length > 0 && (
        <div className="border-b border-black/10">
          <div className="px-4 py-2">
            <span className="text-xs font-medium text-black/50 uppercase tracking-wide">Sellers</span>
          </div>
          {suggestions.sellers.slice(0, 3).map((item) => (
            <button
              key={item.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 transition-colors text-left"
            >
              {item.icon_url ? (
                <img src={item.icon_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                getIcon(item.type)
              )}
              <div className="flex-1 min-w-0">
                <span className="text-sm text-black block truncate">{item.text}</span>
                {item.subtitle && (
                  <span className="text-xs text-black/50 truncate">{item.subtitle}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Categories */}
      {suggestions.categories.length > 0 && (
        <div>
          <div className="px-4 py-2">
            <span className="text-xs font-medium text-black/50 uppercase tracking-wide">Categories</span>
          </div>
          {suggestions.categories.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(item);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 transition-colors text-left"
            >
              {getIcon(item.type)}
              <span className="text-sm text-black truncate">{item.text}</span>
              {item.result_count !== undefined && (
                <span className="text-xs text-black/40 ml-auto">{item.result_count} items</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
