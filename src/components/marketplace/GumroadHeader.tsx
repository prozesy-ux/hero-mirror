import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VoiceSearchButton } from './VoiceSearchButton';
import { ImageSearchButton } from './ImageSearchButton';
import { useVoiceSearch } from '@/hooks/useVoiceSearch';

interface GumroadHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
}

const GumroadHeader = ({ searchQuery, onSearchChange, onSearch }: GumroadHeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    onSearch();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-black/5">
      <div className="mx-auto max-w-screen-2xl px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo - Uptoza */}
          <Link to="/" className="flex-shrink-0">
            <img 
              src="/src/assets/uptoza-logo.png" 
              alt="Uptoza" 
              className="h-8 w-auto"
            />
          </Link>

          {/* Search Bar - Desktop - Pill style */}
          <form 
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-xl items-center"
          >
            <div className="relative flex-1 flex items-center bg-white border border-black/10 rounded-full overflow-hidden focus-within:border-black/30 focus-within:ring-1 focus-within:ring-black/10 transition-all">
              <Search className="w-4 h-4 text-black/40 ml-4" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search products"
                className="flex-1 px-3 py-3 text-sm text-black placeholder-black/40 bg-transparent outline-none"
              />
              
              {/* Voice Search */}
              <VoiceSearchButton
                isListening={isListening}
                isSupported={voiceSupported}
                error={null}
                onStart={startListening}
                onStop={stopListening}
                className="mr-1 opacity-60 hover:opacity-100"
              />
              
              {/* Image Search */}
              <ImageSearchButton
                onSearchResult={(result) => onSearchChange(result)}
                className="mr-3 opacity-60 hover:opacity-100"
              />
            </div>
          </form>

          {/* Right Actions - Gumroad style */}
          <div className="hidden md:flex items-center gap-2">
            <Link 
              to="/signin" 
              className="px-4 py-2 text-sm font-medium text-black border border-black/20 rounded-full hover:border-black/40 transition-colors"
            >
              Log in
            </Link>
            <Link 
              to="/seller" 
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-full hover:bg-black/80 transition-colors"
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

        {/* Mobile Search - Pill style */}
        <form 
          onSubmit={handleSearchSubmit}
          className="md:hidden pb-3"
        >
          <div className="flex items-center bg-white border border-black/10 rounded-full overflow-hidden">
            <Search className="w-4 h-4 text-black/40 ml-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products"
              className="flex-1 px-3 py-2.5 text-sm text-black placeholder-black/40 bg-transparent outline-none"
            />
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
