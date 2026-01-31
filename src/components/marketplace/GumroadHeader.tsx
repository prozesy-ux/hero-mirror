import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Menu, X, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import uptozaLogo from '@/assets/uptoza-logo-new.png';
import { VoiceSearchButton } from './VoiceSearchButton';
import { ImageSearchButton } from './ImageSearchButton';
import { SearchScopeSelector, SearchScope } from './SearchScopeSelector';
import { MarketplaceSearchSuggestions } from './MarketplaceSearchSuggestions';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';
import { useSearchSuggestions, SearchSuggestion } from '@/hooks/useSearchSuggestions';
import { CurrencySelector } from '@/components/ui/currency-selector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';

interface GumroadHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
}

const GumroadHeader = ({ searchQuery, onSearchChange, onSearch }: GumroadHeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchScope, setSearchScope] = useState<SearchScope>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLFormElement>(null);

  // Search suggestions hook
  const {
    suggestions,
    isLoading: suggestionsLoading,
    isOpen: suggestionsOpen,
    open: openSuggestions,
    close: closeSuggestions,
    setQuery: setSuggestionsQuery,
    setScope: setSuggestionsScope,
    clearRecentSearches,
  } = useSearchSuggestions();

  // Sync query to suggestions hook
  useEffect(() => {
    setSuggestionsQuery(searchQuery);
  }, [searchQuery, setSuggestionsQuery]);

  // Sync scope to suggestions hook
  useEffect(() => {
    setSuggestionsScope(searchScope);
  }, [searchScope, setSuggestionsScope]);

  // Voice search integration
  const handleVoiceResult = useCallback((text: string) => {
    onSearchChange(text);
  }, [onSearchChange]);

  const {
    isListening,
    isSupported: voiceSupported,
    startListening,
    stopListening,
  } = useVoiceSearch(handleVoiceResult);

  // Handle keyboard shortcut "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) &&
        !(e.target as HTMLElement).isContentEditable
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    closeSuggestions();
    onSearch();
  };

  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    onSearchChange(suggestion.text);
    closeSuggestions();
    onSearch();
  }, [onSearchChange, closeSuggestions, onSearch]);

  const handleInputFocus = useCallback(() => {
    openSuggestions();
  }, [openSuggestions]);

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-black/10">
      <div className="mx-auto max-w-screen-2xl px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo - Bigger */}
          <Link to="/" className="flex-shrink-0">
            <img 
              src={uptozaLogo} 
              alt="Uptoza" 
              className="h-12 w-auto"
            />
          </Link>

          {/* Search Bar - Desktop - Full Width Premium Design */}
          <form 
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-4xl items-stretch relative"
            ref={searchContainerRef}
          >
            <div className="flex-1 flex items-stretch bg-white rounded-xl border-2 border-black/15 overflow-hidden focus-within:border-black/40 focus-within:ring-2 focus-within:ring-black/10 focus-within:shadow-lg transition-all">
              {/* Scope Selector - Left side with gray bg */}
              <div className="border-r border-black/15">
                <SearchScopeSelector 
                  value={searchScope} 
                  onChange={setSearchScope}
                  className="rounded-none"
                />
              </div>
              
              {/* Search Input - Center */}
              <div className="relative flex-1 flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-black/40" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={handleInputFocus}
                  placeholder="Search products, sellers..."
                  className="w-full pl-12 pr-24 py-3.5 text-sm text-black placeholder-black/40 bg-white outline-none"
                />
                
                {/* Voice + Image Search - Inside input, right side */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <VoiceSearchButton
                    isListening={isListening}
                    isSupported={voiceSupported}
                    error={null}
                    onStart={startListening}
                    onStop={stopListening}
                    className="h-9 w-9"
                  />
                  <ImageSearchButton
                    onSearchResult={(result) => onSearchChange(result)}
                    className="h-9 w-9"
                  />
                </div>
              </div>
              
              {/* Search Button - Right side with black bg */}
              <button 
                type="submit"
                className="px-6 py-3.5 bg-black text-white font-semibold hover:bg-black/90 transition-colors flex items-center gap-2"
              >
                <Search size={18} />
                <span className="hidden lg:inline">Search</span>
              </button>
            </div>

            {/* Search Suggestions Dropdown */}
            <MarketplaceSearchSuggestions
              query={searchQuery}
              suggestions={suggestions}
              isLoading={suggestionsLoading}
              isOpen={suggestionsOpen}
              onClose={closeSuggestions}
              onSelect={handleSuggestionSelect}
              onClearRecent={clearRecentSearches}
            />
          </form>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 px-2 text-black/70 hover:text-black hover:bg-black/5 rounded-lg">
                  <Globe className="w-4 h-4 mr-1" />
                  <span className="text-sm">EN</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white min-w-[140px]">
                <DropdownMenuItem className="cursor-pointer rounded-lg">
                  <span className="mr-2">🇺🇸</span> English
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg">
                  <span className="mr-2">🇧🇩</span> বাংলা
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg">
                  <span className="mr-2">🇮🇳</span> हिंदी
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg">
                  <span className="mr-2">🇪🇸</span> Español
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Currency Selector */}
            <CurrencySelector variant="minimal" />

            <Link 
              to="/signin" 
              className="px-4 py-2 text-sm font-medium text-black border border-black/20 rounded-full hover:border-black/40 transition-colors"
            >
              Log in
            </Link>
            <Link 
              to="/seller" 
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-full hover:bg-black/90 transition-colors"
            >
              Start selling
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-black"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Search - Updated style */}
        <form 
          onSubmit={handleSearchSubmit}
          className="md:hidden pb-3"
        >
          <div className="flex items-stretch bg-white border border-black/20 rounded-lg overflow-hidden">
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-black/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 text-sm text-black placeholder-black/40 bg-white outline-none"
              />
            </div>
            <button 
              type="submit"
              className="px-4 py-2.5 bg-black text-white"
            >
              <Search size={16} />
            </button>
          </div>
        </form>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-black/5 pt-3 flex flex-col gap-2">
            <Link 
              to="/signin" 
              className="px-4 py-2.5 text-sm font-medium text-black border border-black/20 rounded-full text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Log in
            </Link>
            <Link 
              to="/seller" 
              className="px-4 py-2.5 text-sm font-medium text-white bg-black rounded-full text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Start selling
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default GumroadHeader;
