import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import heroBackground from "@/assets/hero-background.webp";

interface SearchProduct {
  id: string;
  text: string;
  slug?: string;
  price?: number;
  type: string;
}

interface Category {
  id: string;
  name: string;
}

const HeroSection = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .eq("is_active", true)
        .order("display_order")
        .limit(8);
      setCategories(data || []);
    };
    fetchCategories();
  }, []);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for suggestions
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bff-marketplace-search?q=${encodeURIComponent(searchQuery)}&limit=5`,
          {
            headers: {
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );
        const data = await response.json();
        setSuggestions(data.products || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Search error:", error);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSuggestions(false);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bff-marketplace-search?q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const data = await response.json();

      // Find exact or close match
      const exactMatch = data.products?.find(
        (p: SearchProduct) =>
          p.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          searchQuery.toLowerCase().includes(p.text.toLowerCase().split(" ")[0])
      );

      if (exactMatch && exactMatch.slug) {
        // Navigate directly to product page
        navigate(`/marketplace/${exactMatch.slug}`);
      } else if (exactMatch) {
        // Create slug from product name if not available
        const slug = exactMatch.text
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-");
        navigate(`/marketplace/${slug}`);
      } else {
        // Navigate to marketplace with search query
        navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
      }
    } catch (error) {
      console.error("Search error:", error);
      // Fallback to search results page
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery)}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = (product: SearchProduct) => {
    setShowSuggestions(false);
    const slug =
      product.slug ||
      product.text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-");
    navigate(`/marketplace/${slug}`);
  };

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/marketplace?category=${categoryId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-black text-white">
      {/* Background Image - Priority loading */}
      <img
        src={heroBackground}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />

      {/* Gradient Overlay */}
      <div className="hero-gradient-overlay absolute inset-0" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-24 text-center md:py-32">
        {/* Title */}
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
          Uptoza
        </h1>

        {/* Subtitle */}
        <h2 className="mb-4 text-xl font-medium text-white/70 md:text-2xl">
          The Digital Commerce Platform
        </h2>

        {/* Description */}
        <p className="mb-10 max-w-2xl text-base leading-relaxed text-white/60 md:text-lg">
          Uptoza powers global digital commerce. Browse and purchase digital products, premium services, and AI-driven solutions from trusted creators and businesses worldwide.
        </p>

        {/* Search Bar */}
        <div className="mb-8 w-full max-w-xl" ref={searchRef}>
          <div className="relative">
            <div className="relative flex items-center overflow-hidden rounded-full bg-white shadow-2xl shadow-black/20">
              <Search className="ml-4 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for products, accounts, services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                className="flex-1 bg-transparent px-4 py-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="mr-1.5 flex items-center gap-2 rounded-full bg-gray-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Search"
                )}
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl bg-white shadow-2xl">
                {suggestions.map((product) => (
                  <button
                    key={product.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSuggestionClick(product);
                    }}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-gray-900 transition-colors hover:bg-gray-50"
                  >
                    <span className="font-medium">{product.text}</span>
                    {product.price && (
                      <span className="text-gray-500">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search by Category */}
        <div className="flex flex-col items-center gap-4">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
            Popular searches
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/20"
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
