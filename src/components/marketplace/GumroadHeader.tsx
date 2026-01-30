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
    <header className="sticky top-0 z-50 w-full bg-[#F4F4F0] border-b border-black/10">
      <div className="mx-auto max-w-screen-2xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <span className="text-xl font-bold text-black tracking-tight">Uptoza</span>
          </Link>

          {/* Search Bar - Desktop */}
          <form 
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-2xl items-center"
          >
            <div className="relative flex-1 flex items-center bg-white border-2 border-black/10 rounded-lg overflow-hidden focus-within:border-black/30 transition-colors">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search products..."
                className="flex-1 px-4 py-2.5 text-sm text-black placeholder-black/40 bg-transparent outline-none"
              />
              
              {/* Voice Search */}
              <VoiceSearchButton
                isListening={isListening}
                isSupported={voiceSupported}
                error={null}
                onStart={startListening}
                onStop={stopListening}
                className="mr-1"
              />
              
              {/* Image Search */}
              <ImageSearchButton
                onSearchResult={(result) => onSearchChange(result)}
                className="mr-1"
              />
              
              {/* Search Button */}
              <button
                type="submit"
                className="px-4 py-2.5 bg-black text-white hover:bg-black/80 transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link 
              to="/signin" 
              className="px-4 py-2 text-sm font-medium text-black hover:text-black/70 transition-colors"
            >
              Log in
            </Link>
            <Link 
              to="/seller" 
              className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-black/80 transition-colors"
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

        {/* Mobile Search */}
        <form 
          onSubmit={handleSearchSubmit}
          className="md:hidden mt-3"
        >
          <div className="flex items-center bg-white border-2 border-black/10 rounded-lg overflow-hidden">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products..."
              className="flex-1 px-4 py-2.5 text-sm text-black placeholder-black/40 bg-transparent outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-black text-white"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-2 border-t border-black/10 pt-4 flex flex-col gap-2">
            <Link 
              to="/signin" 
              className="px-4 py-2.5 text-sm font-medium text-black hover:bg-black/5 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Log in
            </Link>
            <Link 
              to="/seller" 
              className="px-4 py-2.5 text-sm font-medium text-white bg-black rounded-lg text-center"
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
