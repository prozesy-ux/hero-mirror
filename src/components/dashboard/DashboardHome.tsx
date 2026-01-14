import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Bot, ArrowRight, Heart, Lock, Eye, Star, Check, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Import logos and assets
import chatgptLogo from '@/assets/chatgpt-logo.avif';
import midjourneyLogo from '@/assets/midjourney-logo.avif';
import geminiLogo from '@/assets/gemini-logo.avif';
import checkIcon from '@/assets/check-icon.svg';
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
  const [trendingPrompts, setTrendingPrompts] = useState<Prompt[]>([]);
  const [aiAccounts, setAiAccounts] = useState<AIAccount[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const promptsScrollRef = useRef<HTMLDivElement>(null);
  const accountsScrollRef = useRef<HTMLDivElement>(null);
  
  const { user, isPro, profile } = useAuthContext();

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch trending/featured prompts (limit to 8 for scrollable)
    const { data: promptsData } = await supabase
      .from('prompts')
      .select('id, title, image_url, tool, is_free, is_featured, description')
      .eq('is_featured', true)
      .limit(8);
    
    setTrendingPrompts(promptsData || []);

    // Fetch AI accounts (limit to 8 for scrollable)
    const { data: accountsData } = await supabase
      .from('ai_accounts')
      .select('id, name, description, price, icon_url, category')
      .eq('is_available', true)
      .limit(8);
    
    setAiAccounts(accountsData || []);

    // Fetch user favorites
    if (user) {
      const { data: favoritesData } = await supabase
        .from('favorites')
        .select('prompt_id')
        .eq('user_id', user.id);
      
      setFavorites(favoritesData?.map(f => f.prompt_id) || []);
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

  const canAccessPrompt = (prompt: Prompt) => prompt.is_free || isPro;

  const getProductImage = (category: string | null) => {
    switch (category) {
      case 'chatgpt': return chatgptLogo;
      case 'midjourney': return midjourneyLogo;
      case 'gemini': return geminiLogo;
      default: return chatgptLogo;
    }
  };

  // Account features
  const accountFeatures = ['Premium Features', 'Cheap Price', 'Instant Delivery'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-up">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-[#1a1a1f] to-[#141418] rounded-2xl p-8 border border-white/10">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
            <Star size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}! 👋
            </h1>
            <p className="text-gray-400">
              {isPro ? 'You have full access to all premium content' : 'Upgrade to Pro to unlock all prompts'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
            <TrendingUp size={16} className="text-violet-400" />
            <span className="text-gray-300 text-sm font-medium">{trendingPrompts.length} Trending Prompts</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
            <Heart size={16} className="text-red-400" />
            <span className="text-gray-300 text-sm font-medium">{favorites.length} Favorites</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/10">
            <Bot size={16} className="text-emerald-400" />
            <span className="text-gray-300 text-sm font-medium">{aiAccounts.length} AI Accounts</span>
          </div>
        </div>
      </div>

      {/* Trending Prompts Section - Horizontal Scroll */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-black border border-white/10 rounded-xl">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Trending Prompts</h2>
              <p className="text-gray-500 text-sm">Most popular this week</p>
            </div>
          </div>
          <Link 
            to="/dashboard/prompts" 
            className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            View All
            <ArrowRight size={16} />
          </Link>
        </div>

        {trendingPrompts.length > 0 ? (
          <div 
            ref={promptsScrollRef}
            className="flex gap-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600"
            style={{ scrollbarWidth: 'thin' }}
          >
            {trendingPrompts.map((prompt) => {
              const isLocked = !canAccessPrompt(prompt);
              const isFavorite = favorites.includes(prompt.id);

              return (
                <div
                  key={prompt.id}
                  className="group flex-shrink-0 w-[280px] bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
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
          <div className="bg-[#141418] rounded-2xl p-12 text-center border border-white/10">
            <TrendingUp size={40} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">No trending prompts available</p>
          </div>
        )}
      </div>

      {/* AI Accounts Section - Horizontal Scroll */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-black border border-white/10 rounded-xl">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Popular AI Accounts</h2>
              <p className="text-gray-500 text-sm">Cheap premium accounts</p>
            </div>
          </div>
          <Link 
            to="/dashboard/ai-accounts" 
            className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            View All
            <ArrowRight size={16} />
          </Link>
        </div>

        {aiAccounts.length > 0 ? (
          <div 
            ref={accountsScrollRef}
            className="flex gap-5 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600"
            style={{ scrollbarWidth: 'thin' }}
          >
            {aiAccounts.map((account) => (
              <div
                key={account.id}
                className="flex-shrink-0 w-[280px] bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Header with logo */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <img 
                        src={account.icon_url || getProductImage(account.category)} 
                        alt={account.name}
                        className="w-10 h-10 object-contain"
                      />
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded uppercase">
                      {account.category || 'Premium'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-1 mb-1">
                    {account.name}
                  </h3>
                  {account.description && (
                    <p className="text-xs text-gray-500 line-clamp-1">{account.description}</p>
                  )}
                </div>

                {/* Features */}
                <div className="p-4 space-y-2">
                  {accountFeatures.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <img src={checkIcon} alt="check" className="w-4 h-4" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Best Seller Badge */}
                <div className="px-4 pb-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                    <Star size={12} className="fill-yellow-500 text-yellow-500" />
                    Best Seller
                  </span>
                </div>

                {/* Price & CTA */}
                <div className="px-4 pb-4 flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">${account.price}</span>
                  <Link
                    to={`/dashboard/ai-accounts`}
                    className="bg-black hover:bg-gray-900 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <Eye size={16} />
                    View Details
                  </Link>
                </div>

                {/* Rating */}
                <div className="px-4 pb-4 flex items-center gap-2">
                  <img src={starsIcon} alt="rating" className="h-4" />
                  <span className="text-sm text-gray-600 font-medium">4.8 (300+ reviews)</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#141418] rounded-2xl p-12 text-center border border-white/10">
            <Bot size={40} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">No AI accounts available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
