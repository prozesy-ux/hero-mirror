import { useState, useRef, useEffect } from 'react';
import { Search, TrendingUp, Clock, X } from 'lucide-react';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import { useSearchContext } from '@/contexts/SearchContext';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { VoiceSearchButton } from '@/components/marketplace/VoiceSearchButton';
import { ImageSearchButton } from '@/components/marketplace/ImageSearchButton';
import { cn } from '@/lib/utils';

interface DashboardSearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export function DashboardSearchBar({
  placeholder = "Search products, orders...",
  onSearch,
  className,
}: DashboardSearchBarProps) {
  const { searchQuery, setSearchQuery } = useSearchContext();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    suggestions,
    isLoading,
    open: openSuggestions,
    close: closeSuggestions,
  } = useSearchSuggestions();

  const {
    isListening,
    isSupported: voiceSupported,
    error: voiceError,
    startListening,
    stopListening,
  } = useVoiceSearch((text) => {
    setLocalQuery(text);
    setSearchQuery(text);
    onSearch?.(text);
  });

  // Sync local query with context
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        closeSuggestions();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeSuggestions]);

  const handleFocus = () => {
    setIsOpen(true);
    openSuggestions();
  };

  const handleSearch = () => {
    setSearchQuery(localQuery);
    onSearch?.(localQuery);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (text: string) => {
    setLocalQuery(text);
    setSearchQuery(text);
    onSearch?.(text);
    setIsOpen(false);
  };

  const handleImageSearchResult = (text: string) => {
    setLocalQuery(text);
    setSearchQuery(text);
    onSearch?.(text);
  };

  const clearSearch = () => {
    setLocalQuery('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  // Combine trending and recent for display
  const trendingItems = suggestions.trending.slice(0, 6);
  const recentItems = suggestions.recent.slice(0, 4);
  const hasContent = trendingItems.length > 0 || recentItems.length > 0;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Bar Container - Pill shaped */}
      <div
        className={cn(
          "relative flex items-center bg-white rounded-full border transition-all duration-200",
          isOpen 
            ? "border-black/40 shadow-lg" 
            : "border-black/15 hover:border-black/25"
        )}
      >
        {/* Search Icon */}
        <Search className="absolute left-4 h-4 w-4 text-slate-400 pointer-events-none" />

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent py-2.5 pl-11 pr-36 text-sm text-slate-900 placeholder-slate-500 focus:outline-none"
        />

        {/* Clear button */}
        {localQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-[120px] p-1 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-slate-400" />
          </button>
        )}

        {/* Voice & Image Search Buttons */}
        <div className="absolute right-[72px] flex items-center gap-1">
          <VoiceSearchButton
            isListening={isListening}
            isSupported={voiceSupported}
            error={voiceError}
            onStart={startListening}
            onStop={stopListening}
            className="h-8 w-8"
          />
          <ImageSearchButton
            onSearchResult={handleImageSearchResult}
            className="h-8 w-8"
          />
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="absolute right-1 top-1 bottom-1 px-4 bg-[#151515] hover:bg-[#222] text-white rounded-full flex items-center gap-2 transition-all text-sm font-medium"
        >
          <Search className="h-3.5 w-3.5" />
          Search
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && hasContent && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/10 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Trending Section */}
          {trendingItems.length > 0 && (
            <div className="p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-2">
                <TrendingUp className="h-3.5 w-3.5" />
                Popular Searches
              </div>
              <div className="space-y-0.5">
                {trendingItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSuggestionClick(item.text)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-[#FF90E8]/20">
                      <TrendingUp className="h-4 w-4 text-slate-400 group-hover:text-[#FF90E8]" />
                    </div>
                    <span className="text-sm text-slate-700 group-hover:text-slate-900 truncate">
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches Section */}
          {recentItems.length > 0 && (
            <div className="p-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-2">
                <Clock className="h-3.5 w-3.5" />
                Recent Searches
              </div>
              <div className="space-y-0.5">
                {recentItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSuggestionClick(item.text)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-200">
                      <Clock className="h-4 w-4 text-slate-400" />
                    </div>
                    <span className="text-sm text-slate-700 group-hover:text-slate-900 truncate">
                      {item.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {isOpen && isLoading && !hasContent && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-black/10 rounded-xl shadow-lg z-50 p-6 text-center">
          <div className="w-6 h-6 border-2 border-[#FF90E8] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 mt-2">Loading suggestions...</p>
        </div>
      )}
    </div>
  );
}

export default DashboardSearchBar;
