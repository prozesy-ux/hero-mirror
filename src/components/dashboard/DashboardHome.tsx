import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, Bot, ArrowRight, Heart, Lock, Star, Check, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { bffApi, handleUnauthorized } from '@/lib/api-fetch';

// Import logos and assets
import chatgptLogo from '@/assets/chatgpt-logo.avif';
import midjourneyLogo from '@/assets/midjourney-logo.avif';
import geminiLogo from '@/assets/gemini-logo.avif';
import starsIcon from '@/assets/stars.svg';
import btnArrow from '@/assets/btn-arrow.svg';

interface Prompt {
  id: string;
  title: string;
  image_url: string | null;
  tool: string;
  is_free: boolean;
  is_featured: boolean;
  description: string | null;
}

interface AIAccount {
  id: string;
  name: string;
  description: string | null;
  price: number;
  icon_url: string | null;
  category: string | null;
}

const DashboardHome = () => {
  const navigate = useNavigate();
  const [trendingPrompts, setTrendingPrompts] = useState<Prompt[]>([]);
  const [aiAccounts, setAiAccounts] = useState<AIAccount[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [accountFavorites, setAccountFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPromptsPaused, setIsPromptsPaused] = useState(false);
  const [isAccountsPaused, setIsAccountsPaused] = useState(false);
  const [serverIsPro, setServerIsPro] = useState(false);
  
  const promptsScrollRef = useRef<HTMLDivElement>(null);
  const accountsScrollRef = useRef<HTMLDivElement>(null);
  
  const { user, isPro, profile } = useAuthContext();

  useEffect(() => {
    fetchData();
  }, [user]);

  // Auto-slide for Trending Prompts
  useEffect(() => {
    if (isPromptsPaused || trendingPrompts.length === 0) return;
    
    const interval = setInterval(() => {
      if (promptsScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = promptsScrollRef.current;
        const maxScroll = scrollWidth - clientWidth;
        
        if (scrollLeft >= maxScroll - 10) {
          promptsScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          promptsScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 3500);
    
    return () => clearInterval(interval);
  }, [isPromptsPaused, trendingPrompts]);

  // Auto-slide for AI Accounts
  useEffect(() => {
    if (isAccountsPaused || aiAccounts.length === 0) return;
    
    const interval = setInterval(() => {
      if (accountsScrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = accountsScrollRef.current;
        const maxScroll = scrollWidth - clientWidth;
        
        if (scrollLeft >= maxScroll - 10) {
          accountsScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          accountsScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
      }
    }, 3500);
    
    return () => clearInterval(interval);
  }, [isAccountsPaused, aiAccounts]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch from BFF - all data in one request
    const { data, error, isUnauthorized } = await bffApi.getPromptsData();
    
    if (isUnauthorized) {
      handleUnauthorized();
      return;
    }
    
    if (error || !data) {
      console.error('[DashboardHome] BFF error:', error);
      toast.error('Failed to load data');
      setLoading(false);
      return;
    }
    
    // Set featured prompts (limit to 8)
    const featured = data.featuredPrompts?.slice(0, 8) || [];
    setTrendingPrompts(featured);
    
    // Set favorites
    setFavorites(data.favorites || []);
    
    // Set isPro from server
    setServerIsPro(data.isPro || false);
    
    // Fetch AI accounts from marketplace BFF
    const { data: marketData } = await bffApi.getMarketplace();
    if (marketData) {
      setAiAccounts((marketData.aiAccounts || []).slice(0, 8));
    }

    setLoading(false);
  };

  const toggleFavorite = async (promptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to add favorites');
      return;
    }

    const isFavorite = favorites.includes(promptId);

    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('prompt_id', promptId);
      setFavorites(favorites.filter(id => id !== promptId));
      toast.success('Removed from favorites');
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: user.id, prompt_id: promptId });
      setFavorites([...favorites, promptId]);
      toast.success('Added to favorites');
    }
  };

  const toggleAccountFavorite = (accountId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (accountFavorites.includes(accountId)) {
      setAccountFavorites(accountFavorites.filter(id => id !== accountId));
      toast.success('Removed from favorites');
    } else {
      setAccountFavorites([...accountFavorites, accountId]);
      toast.success('Added to favorites');
    }
  };

  const canAccessPrompt = (prompt: Prompt) => prompt.is_free || isPro || serverIsPro;

  const getProductImage = (category: string | null) => {
    switch (category) {
      case 'chatgpt': return chatgptLogo;
      case 'midjourney': return midjourneyLogo;
      case 'gemini': return geminiLogo;
      default: return chatgptLogo;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 lg:space-y-10 animate-fade-up">
      <div>
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
            <div className="p-2 lg:p-2.5 bg-gray-900 rounded-xl">
              <TrendingUp size={18} className="text-white lg:w-5 lg:h-5" />
            </div>
            <h2 className="text-lg lg:text-xl font-bold text-gray-900">Trending Prompts</h2>
            <span className="px-2 lg:px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] lg:text-xs font-bold">Popular</span>
          </div>
          <Link 
            to="/dashboard/prompts" 
            className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            View All
            <ArrowRight size={14} className="lg:w-4 lg:h-4" />
          </Link>
        </div>

        {trendingPrompts.length > 0 ? (
          <div 
            ref={promptsScrollRef}
            onMouseEnter={() => setIsPromptsPaused(true)}
            onMouseLeave={() => setIsPromptsPaused(false)}
            onTouchStart={() => setIsPromptsPaused(true)}
            onTouchEnd={() => setIsPromptsPaused(false)}
            className="flex gap-3 lg:gap-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 -mx-4 px-4 lg:mx-0 lg:px-0"
            style={{ scrollbarWidth: 'thin' }}
          >
            {trendingPrompts.map((prompt) => {
              const isLocked = !canAccessPrompt(prompt);
              const isFavorite = favorites.includes(prompt.id);

              return (
                <div
                  key={prompt.id}
                  className="group flex-shrink-0 w-[240px] lg:w-[280px] bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-md hover:shadow-xl hover:border-gray-300 hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Large Image Section */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {prompt.image_url ? (
                      <img
                        src={prompt.image_url}
                        alt={prompt.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <ImageIcon size={40} className="text-gray-300" />
                      </div>
                    )}

                    {/* Tool Badge - overlaid on image */}
                    <div className="absolute top-3 left-3 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-bold uppercase shadow-lg">
                      {prompt.tool}
                    </div>

                    {/* Favorite Button - overlaid on image */}
                    <button
                      onClick={(e) => toggleFavorite(prompt.id, e)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                    >
                      <Heart
                        size={16}
                        className={isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'}
                      />
                    </button>

                    {/* Lock Overlay for locked prompts */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center">
                        <Lock size={28} className="text-white mb-2" />
                        <span className="text-white text-sm font-semibold">Pro Only</span>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="p-5">
                    {/* Title */}
                    <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2 mb-2">
                      {prompt.title}
                    </h3>
                    
                    {/* Description - more visible */}
                    {prompt.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{prompt.description}</p>
                    )}

                    {/* Pro Access Badge */}
                    <div className="mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        prompt.is_free 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-violet-100 text-violet-700'
                      }`}>
                        {prompt.is_free ? (
                          <>
                            <Check size={12} />
                            Free Access
                          </>
                        ) : (
                          <>
                            <Star size={12} className="fill-violet-500" />
                            Pro Access
                          </>
                        )}
                      </span>
                    </div>

                    {/* Review Section */}
                    <div className="flex items-center gap-2 mb-4">
                      <img src={starsIcon} alt="rating" className="h-4" />
                      <span className="text-sm text-gray-600 font-medium">4.9 (120+ reviews)</span>
                    </div>

                    {/* CTA Button */}
                    <Link
                      to="/dashboard/prompts"
                      className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      {isLocked ? 'Unlock Prompt' : 'View Prompt'}
                      <img src={btnArrow} alt="arrow" className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-md">
            <TrendingUp size={40} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No trending prompts available</p>
          </div>
        )}
      </div>

      {/* AI Accounts Section - Horizontal Scroll */}
      <div>
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <div className="flex items-center gap-2 lg:gap-3 flex-wrap">
            <div className="p-2 lg:p-2.5 bg-gray-900 rounded-xl">
              <Bot size={18} className="text-white lg:w-5 lg:h-5" />
            </div>
            <h2 className="text-lg lg:text-xl font-bold text-gray-900">Popular AI Accounts</h2>
            <span className="px-2 lg:px-3 py-1 bg-yellow-500 text-black rounded-full text-[10px] lg:text-xs font-bold">Cheap</span>
          </div>
          <Link 
            to="/dashboard/ai-accounts" 
            className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            View All
            <ArrowRight size={14} className="lg:w-4 lg:h-4" />
          </Link>
        </div>

        {aiAccounts.length > 0 ? (
          <div 
            ref={accountsScrollRef}
            onMouseEnter={() => setIsAccountsPaused(true)}
            onMouseLeave={() => setIsAccountsPaused(false)}
            onTouchStart={() => setIsAccountsPaused(true)}
            onTouchEnd={() => setIsAccountsPaused(false)}
            className="flex gap-3 lg:gap-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 -mx-4 px-4 lg:mx-0 lg:px-0"
            style={{ scrollbarWidth: 'thin' }}
          >
            {aiAccounts.map((account) => {
              const isFavorite = accountFavorites.includes(account.id);

              return (
                <div
                  key={account.id}
                  className="group flex-shrink-0 w-[240px] lg:w-[280px] bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-md hover:shadow-xl hover:border-gray-300 hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Large Image Section */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {account.icon_url ? (
                      <img
                        src={account.icon_url}
                        alt={account.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Bot size={40} className="text-gray-400" />
                      </div>
                    )}

                    {/* Category Badge - overlaid on image */}
                    <div className="absolute top-3 left-3 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-bold uppercase shadow-lg">
                      {account.category || 'Premium'}
                    </div>

                    {/* Favorite Button - overlaid on image */}
                    <button
                      onClick={(e) => toggleAccountFavorite(account.id, e)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                    >
                      <Heart
                        size={16}
                        className={isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'}
                      />
                    </button>
                  </div>

                  {/* Content Section */}
                  <div className="p-5">
                    {/* Title */}
                    <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2 mb-2">
                      {account.name}
                    </h3>
                    
                    {/* Description */}
                    {account.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{account.description}</p>
                    )}

                    {/* Pro Access Badge + Price */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                        <Star size={12} className="fill-violet-500" />
                        Pro Access
                      </span>
                      <span className="text-lg font-bold text-gray-900">${account.price}</span>
                    </div>

                    {/* Review Section */}
                    <div className="flex items-center gap-2 mb-4">
                      <img src={starsIcon} alt="rating" className="h-4" />
                      <span className="text-sm text-gray-600 font-medium">4.8 (300+ reviews)</span>
                    </div>

                    {/* CTA Button */}
                    <Link
                      to="/dashboard/ai-accounts"
                      className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      Get Account
                      <img src={btnArrow} alt="arrow" className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
            <Bot size={40} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No AI accounts available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
