import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface HelpSearchProps {
  value: string;
  onChange: (value: string) => void;
  variant?: 'hero' | 'compact';
}

const HelpSearch: React.FC<HelpSearchProps> = ({ value, onChange, variant = 'compact' }) => {
  const [localValue, setLocalValue] = useState(value);
  const isFirstRender = useRef(true);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      onChange(localValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  if (variant === 'hero') {
    return (
      <div className="relative w-full">
        <input
          id="help-search-input"
          type="search"
          placeholder="Search articles"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="w-full h-14 px-6 pr-16 rounded-full text-[#001e00] text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#14A800]/30 shadow-lg"
        />
        <button
          onClick={() => onChange(localValue)}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#14A800] rounded-full flex items-center justify-center hover:bg-[#108a00] transition shadow-md"
        >
          <Search className="h-5 w-5 text-white" />
        </button>
        {localValue && (
          <button
            onClick={() => { setLocalValue(''); onChange(''); }}
            className="absolute right-16 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-xl">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5e6d55]" />
      <input
        type="text"
        placeholder="Search documentation..."
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="w-full h-11 pl-10 pr-10 rounded-full border border-[#d5e0d5] bg-white text-[#001e00] text-sm placeholder:text-[#5e6d55] focus:outline-none focus:ring-2 focus:ring-[#14A800]/30 focus:border-[#14A800]"
      />
      {localValue && (
        <button
          onClick={() => { setLocalValue(''); onChange(''); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5e6d55] hover:text-[#001e00]"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default HelpSearch;
