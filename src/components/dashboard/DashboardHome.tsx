import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Bot, Wrench, ArrowRight, Heart, Lock, Unlock, Eye, Image as ImageIcon, ShoppingCart, BadgeCheck, Sparkles, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Import logos
import chatgptLogo from '@/assets/chatgpt-logo.avif';
import midjourneyLogo from '@/assets/midjourney-logo.avif';
import geminiLogo from '@/assets/gemini-logo.avif';

interface Prompt {
  id: string;
  title: string;
  image_url: string | null;
  tool: string;
  is_free: boolean;
  is_featured: boolean;
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
  
  const { user, isPro, profile } = useAuthContext();

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch trending/featured prompts (limit to 4)
    const { data: promptsData } = await supabase
      .from('prompts')
      .select('id, title, image_url, tool, is_free, is_featured')
      .eq('is_featured', true)
      .limit(4);
    
    setTrendingPrompts(promptsData || []);

    // Fetch AI accounts (limit to 4)
    const { data: accountsData } = await supabase
      .from('ai_accounts')
      .select('id, name, description, price, icon_url, category')
      .eq('is_available', true)
      .limit(4);
    
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

  const getToolBadgeClass = (tool: string) => {
    const toolLower = tool.toLowerCase();
    if (toolLower.includes('chatgpt')) return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    if (toolLower.includes('midjourney')) return 'bg-violet-100 text-violet-700 border border-violet-200';
    if (toolLower.includes('claude')) return 'bg-orange-100 text-orange-700 border border-orange-200';
    if (toolLower.includes('gemini')) return 'bg-blue-100 text-blue-700 border border-blue-200';
    return 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  const getToolDotColor = (tool: string) => {
    const toolLower = tool.toLowerCase();
    if (toolLower.includes('chatgpt')) return 'bg-emerald-500';
    if (toolLower.includes('midjourney')) return 'bg-violet-500';
    if (toolLower.includes('claude')) return 'bg-orange-500';
    if (toolLower.includes('gemini')) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const getProductImage = (category: string | null) => {
    switch (category) {
      case 'chatgpt': return chatgptLogo;
      case 'midjourney': return midjourneyLogo;
      case 'gemini': return geminiLogo;
      default: return chatgptLogo;
    }
  };

  // AI Tools preview data
  const quickTools = [
    { name: 'ChatGPT', icon: '🤖', color: 'from-emerald-500 to-green-600' },
    { name: 'Midjourney', icon: '🎨', color: 'from-violet-500 to-purple-600' },
    { name: 'Claude', icon: '🧠', color: 'from-orange-500 to-amber-600' },
    { name: 'Gemini', icon: '✨', color: 'from-blue-500 to-cyan-600' },
  ];

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
            <Crown size={24} className="text-white" />
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
            <Sparkles size={16} className="text-violet-400" />
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

      {/* Trending Prompts Section */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trendingPrompts.map((prompt) => {
              const isLocked = !canAccessPrompt(prompt);
              const isFavorite = favorites.includes(prompt.id);

              return (
                <div
                  key={prompt.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
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

                    <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getToolBadgeClass(prompt.tool)}`}>
                      <span className={`w-2 h-2 rounded-full ${getToolDotColor(prompt.tool)}`} />
                      {prompt.tool}
                    </div>

                    <button
                      onClick={(e) => toggleFavorite(prompt.id, e)}
                      className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                    >
                      <Heart
                        size={16}
                        className={isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'}
                      />
                    </button>

                    {!isLocked && (
                      <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-emerald-500 rounded-full flex items-center gap-1 shadow-sm">
                        <Unlock size={12} className="text-white" />
                        <span className="text-white text-xs font-semibold">Unlocked</span>
                      </div>
                    )}

                    {isLocked && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-2">
                            <Lock size={20} className="text-white" />
                          </div>
                          <span className="text-white text-sm font-medium">Pro Only</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">
                      {prompt.title}
                    </h3>
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

      {/* AI Accounts Section */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {aiAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-24 bg-gray-50 p-4 flex items-center justify-center">
                  <img 
                    src={getProductImage(account.category)} 
                    alt={account.name}
                    className="h-12 w-12 object-contain"
                  />
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-base font-bold text-gray-900 tracking-tight line-clamp-1">
                      {account.name}
                    </h3>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md">
                      <BadgeCheck size={12} className="text-gray-600" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-gray-900">${account.price}</span>
                    <button className="bg-black hover:bg-gray-900 text-white font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 text-sm">
                      <ShoppingCart size={14} />
                      Buy
                    </button>
                  </div>
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

      {/* Quick AI Tools Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-black border border-white/10 rounded-xl">
              <Wrench size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Quick AI Tools</h2>
              <p className="text-gray-500 text-sm">Access your favorite tools</p>
            </div>
          </div>
          <Link 
            to="/dashboard/tools" 
            className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            View All
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickTools.map((tool, index) => (
            <Link
              key={index}
              to="/dashboard/tools"
              className="group bg-[#141418] rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <span className="text-2xl">{tool.icon}</span>
              </div>
              <h3 className="font-semibold text-white">{tool.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
