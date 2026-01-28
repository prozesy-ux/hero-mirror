import { useRef, useEffect, useCallback } from 'react';
import { X, Search, ArrowLeft, Clock, TrendingUp, Package, Tag, Store, FolderOpen, Loader2, Eye, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchSuggestion } from '@/hooks/useSearchSuggestions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  setQuery: (query: string) => void;
  suggestions: {
    recent: SearchSuggestion[];
    trending: SearchSuggestion[];
    products: SearchSuggestion[];
    categories: SearchSuggestion[];
    tags: SearchSuggestion[];
    sellers: SearchSuggestion[];
    recentlyViewed?: SearchSuggestion[];
  };
  isLoading: boolean;
  onSelect: (suggestion: SearchSuggestion) => void;
  onClearRecent?: () => void;
  onSearch: () => void;
}

export function MobileSearchOverlay({
  isOpen,
  onClose,
  query,
  setQuery,
  suggestions,
  isLoading,
  onSelect,
  onClearRecent,
  onSearch,
}: MobileSearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { formatAmount } = useCurrency();

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle back button/escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch();
      onClose();
    }
  };

  // Helper to highlight matching text
  const highlightMatch = useCallback((text: string) => {
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
  }, [query]);

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
    icon?: React.ReactNode,
    showClear?: boolean
  ) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="py-3">
        <div className="flex items-center justify-between px-4 pb-2">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {title}
            </span>
          </div>
          {showClear && onClearRecent && (
            <button
              onClick={onClearRecent}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-0.5">
          {items.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => {
                onSelect(item);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/50 active:bg-accent transition-colors"
            >
              {item.icon_url ? (
                <img 
                  src={item.icon_url} 
                  alt="" 
                  className="h-10 w-10 rounded-lg object-cover bg-muted"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  {getIcon(item.type)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {highlightMatch(item.text)}
                  </span>
                  {/* Verified badge for sellers */}
                  {item.type === 'seller' && item.subtitle === 'Verified Seller' && (
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>
                {item.subtitle && (
                  <div className="text-xs text-muted-foreground truncate">
                    {item.subtitle}
                  </div>
                )}
              </div>
              {item.price !== undefined && (
                <span className="text-sm font-semibold text-primary">
                  {formatAmount(item.price)}
                </span>
              )}
              {item.result_count !== undefined && item.type === 'trending' && (
                <Badge variant="secondary" className="text-xs">
                  {item.result_count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const allSuggestions = [
    ...suggestions.recent,
    ...suggestions.trending,
    ...(suggestions.recentlyViewed || []),
    ...suggestions.products,
    ...suggestions.categories,
    ...suggestions.tags,
    ...suggestions.sellers,
  ];

  const hasResults = allSuggestions.length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in fade-in-0 slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-border bg-background sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-10 w-10 flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <form onSubmit={handleSubmit} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search products, sellers, categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-10 h-11 text-base"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
      </div>

      {/* Suggestions */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && !hasResults && query.length >= 2 && (
          <div className="py-12 text-center px-4">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              No results for "{query}"
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Try different keywords or browse categories
            </p>
          </div>
        )}

        {!isLoading && hasResults && (
          <div className="divide-y divide-border">
            {renderSection(
              'Recent Searches', 
              suggestions.recent, 
              <Clock className="h-4 w-4 text-muted-foreground" />,
              true
            )}
            {renderSection(
              'Trending Now', 
              suggestions.trending,
              <TrendingUp className="h-4 w-4 text-primary" />
            )}
            {suggestions.recentlyViewed && suggestions.recentlyViewed.length > 0 && 
              renderSection(
                'Recently Viewed', 
                suggestions.recentlyViewed,
                <Eye className="h-4 w-4 text-primary" />
              )
            }
            {renderSection('Products', suggestions.products)}
            {renderSection('Categories', suggestions.categories)}
            {renderSection('Tags', suggestions.tags)}
            {renderSection('Sellers', suggestions.sellers)}
          </div>
        )}

        {!isLoading && !hasResults && query.length < 2 && (
          <div className="py-12 text-center px-4">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              Search products, categories, sellers...
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Type at least 2 characters to see suggestions
            </p>
          </div>
        )}
      </div>

      {/* Quick tip footer */}
      <div className="p-3 border-t border-border bg-muted/30 text-center">
        <p className="text-xs text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd> to search or tap a suggestion
        </p>
      </div>
    </div>
  );
}
