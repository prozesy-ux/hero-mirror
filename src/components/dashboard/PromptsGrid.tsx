import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Lock, Search, Copy, X, Image as ImageIcon, TrendingUp, Layers, FolderOpen, Star, Bookmark, Check, ChevronRight, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Prompt {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  image_url: string | null;
  tool: string;
  is_free: boolean;
  is_featured: boolean;
  category_id: string | null;
  categories?: {
    name: string;
    icon: string | null;
  } | null;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

type TabType = 'all' | 'trending' | 'saved' | 'categories';

const PromptsGrid = () => {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  
  const { user, isPro } = useAuthContext();

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('prompts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prompts'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    const { data: promptsData, error: promptsError } = await supabase
      .from('prompts')
      .select(`
        *,
        categories (
          name,
          icon
        )
      `)
      .order('created_at', { ascending: false });

    if (promptsError) {
      console.error('Error fetching prompts:', promptsError);
      toast.error('Failed to load prompts');
    } else {
      setPrompts(promptsData || []);
    }

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    setCategories(categoriesData || []);

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
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('prompt_id', promptId);

      if (!error) {
        setFavorites(favorites.filter(id => id !== promptId));
        toast.success('Removed from favorites');
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, prompt_id: promptId });

      if (!error) {
        setFavorites([...favorites, promptId]);
        toast.success('Added to favorites');
      }
    }
  };

  const canAccessPrompt = (prompt: Prompt) => {
    return prompt.is_free || isPro;
  };

  const handlePromptClick = (prompt: Prompt) => {
    if (canAccessPrompt(prompt)) {
      setSelectedPrompt(prompt);
    } else {
      toast.error('Upgrade to Pro to unlock this prompt!');
    }
  };

  const copyToClipboard = (content: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    navigator.clipboard.writeText(textContent);
    toast.success('Prompt copied to clipboard!');
  };

  const getToolBadgeClass = (tool: string) => {
    const toolLower = tool.toLowerCase();
    if (toolLower.includes('chatgpt')) return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    if (toolLower.includes('midjourney')) return 'bg-violet-100 text-violet-700 border border-violet-200';
    if (toolLower.includes('claude')) return 'bg-orange-100 text-orange-700 border border-orange-200';
    if (toolLower.includes('gemini')) return 'bg-blue-100 text-blue-700 border border-blue-200';
    if (toolLower.includes('dall')) return 'bg-pink-100 text-pink-700 border border-pink-200';
    return 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  const getToolDotColor = (tool: string) => {
    const toolLower = tool.toLowerCase();
    if (toolLower.includes('chatgpt')) return 'bg-emerald-500';
    if (toolLower.includes('midjourney')) return 'bg-violet-500';
    if (toolLower.includes('claude')) return 'bg-orange-500';
    if (toolLower.includes('gemini')) return 'bg-blue-500';
    if (toolLower.includes('dall')) return 'bg-pink-500';
    return 'bg-gray-500';
  };

  // Filter logic for All Prompts tab - Search and category filter
  let filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prompt.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || prompt.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const trendingPrompts = prompts.filter(p => p.is_featured);
  const favoritePrompts = prompts.filter(p => favorites.includes(p.id));
  const tools = [...new Set(prompts.map(p => p.tool))];

  // Stats
  const totalPrompts = prompts.length;
  const unlockedPrompts = prompts.filter(p => canAccessPrompt(p)).length;
  const totalFavorites = favorites.length;
  const totalCategories = categories.length;

  // Get prompts count per category
  const getCategoryPromptCount = (categoryId: string) => {
    return prompts.filter(p => p.category_id === categoryId).length;
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setActiveTab('all');
  };

  const PromptCard = ({ prompt }: { prompt: Prompt }) => {
    const isLocked = !canAccessPrompt(prompt);
    const isFavorite = favorites.includes(prompt.id);

    return (
      <div
        className="group bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-md hover:shadow-xl hover:border-gray-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
        onClick={() => handlePromptClick(prompt)}
      >
        {/* Image */}
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

          {/* Tool Badge */}
          <div className="absolute top-3 left-3 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-bold uppercase shadow-lg">
            {prompt.tool}
          </div>

          {/* Favorite Button */}
          <button
            onClick={(e) => toggleFavorite(prompt.id, e)}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
          >
            <Heart
              size={16}
              className={isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'}
            />
          </button>

          {/* Lock Overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center">
              <Lock size={28} className="text-white mb-2" />
              <span className="text-white text-sm font-semibold">Pro Only</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-bold text-gray-900 text-base leading-tight line-clamp-2 mb-2">
            {prompt.title}
          </h3>
          
          {/* Description */}
          {prompt.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
              {prompt.description}
            </p>
          )}

          {/* Access Badge */}
          <div className="mb-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              prompt.is_free 
                ? 'bg-emerald-100 text-emerald-700' 
                : isPro
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-gray-100 text-gray-600'
            }`}>
              {prompt.is_free ? (
                <>
                  <Check size={12} />
                  Free Access
                </>
              ) : isPro ? (
                <>
                  <Star size={12} className="fill-violet-500" />
                  Pro Version
                </>
              ) : (
                <>
                  <Lock size={12} />
                  Pro Access
                </>
              )}
            </span>
          </div>

          {/* Review Section */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <span className="text-sm text-gray-600 font-medium">4.9 (120+ reviews)</span>
          </div>

          {/* Yellow CTA Button */}
          <button
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handlePromptClick(prompt);
            }}
          >
            {isLocked ? 'Unlock Prompt' : 'View Prompt'}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 section-prompts animate-fade-up">
      {/* Tab Navigation - Premium Design with Unlock Pro */}
      <div className="bg-white rounded-2xl p-1.5 lg:p-2 mb-6 lg:mb-8 border border-gray-200 shadow-md">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Tab buttons */}
          <div className="flex gap-1.5 lg:gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 lg:px-6 py-2.5 lg:py-3.5 rounded-xl font-semibold text-xs lg:text-sm transition-all duration-200 transform flex items-center gap-1.5 lg:gap-2 whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95'
              }`}
            >
              <Layers size={14} className="lg:w-4 lg:h-4" />
              All
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`px-4 lg:px-6 py-2.5 lg:py-3.5 rounded-xl font-semibold text-xs lg:text-sm transition-all duration-200 transform flex items-center gap-1.5 lg:gap-2 whitespace-nowrap ${
                activeTab === 'trending'
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95'
              }`}
            >
              <TrendingUp size={14} className="lg:w-4 lg:h-4" />
              Trending
              {trendingPrompts.length > 0 && (
                <span className={`px-1.5 lg:px-2 py-0.5 text-[10px] lg:text-xs rounded-full ${
                  activeTab === 'trending' ? 'bg-white text-gray-900' : 'bg-gray-200 text-gray-700'
                }`}>
                  {trendingPrompts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 lg:px-6 py-2.5 lg:py-3.5 rounded-xl font-semibold text-xs lg:text-sm transition-all duration-200 transform flex items-center gap-1.5 lg:gap-2 whitespace-nowrap ${
                activeTab === 'saved'
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95'
              }`}
            >
              <Bookmark size={14} className="lg:w-4 lg:h-4" />
              Saved
              {favoritePrompts.length > 0 && (
                <span className={`px-1.5 lg:px-2 py-0.5 text-[10px] lg:text-xs rounded-full ${
                  activeTab === 'saved' ? 'bg-white text-gray-900' : 'bg-gray-200 text-gray-700'
                }`}>
                  {favoritePrompts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 lg:px-6 py-2.5 lg:py-3.5 rounded-xl font-semibold text-xs lg:text-sm transition-all duration-200 transform flex items-center gap-1.5 lg:gap-2 whitespace-nowrap ${
                activeTab === 'categories'
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95'
              }`}
            >
              <FolderOpen size={14} className="lg:w-4 lg:h-4" />
              Categories
            </button>
          </div>

          {/* Unlock Pro Section - Like AI Accounts wallet style */}
          {!isPro && (
            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-2 bg-amber-100 border border-amber-200 px-3 py-2 rounded-xl">
                <Lock size={14} className="text-amber-600" />
                <span className="text-amber-700 font-bold text-xs lg:text-sm whitespace-nowrap">Free Plan</span>
              </div>
              <button
                onClick={() => navigate('/dashboard/billing')}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black px-4 py-2 rounded-xl font-semibold text-xs lg:text-sm transition-all hover:scale-105 active:scale-95 shadow-lg whitespace-nowrap"
              >
                <Crown size={14} />
                Unlock Pro
              </button>
            </div>
          )}
        </div>
      </div>

      {/* All Prompts Tab */}
      {activeTab === 'all' && (
        <>
          {/* Clean Search Bar - Matching AI Accounts Style */}
          <div className="relative mb-6 lg:mb-8">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-gray-100 rounded-lg">
              <Search size={18} className="text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-2xl pl-14 pr-4 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition-all font-medium text-lg shadow-md"
            />
          </div>

          {/* Prompts Grid */}
          {filteredPrompts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
              {filteredPrompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-md">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No prompts found</h3>
              <p className="text-gray-500">Try adjusting your search</p>
            </div>
          )}
        </>
      )}

      {/* Trending Tab */}
      {activeTab === 'trending' && (
        <>
          {trendingPrompts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
              {trendingPrompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#141418] rounded-2xl border border-white/10">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={24} className="text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No trending prompts yet</h3>
              <p className="text-gray-500">Trending prompts will appear here</p>
            </div>
          )}
        </>
      )}

      {/* Saved Prompts Tab */}
      {activeTab === 'saved' && (
        <>
          {favoritePrompts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
              {favoritePrompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 lg:py-16 bg-[#141418] rounded-2xl border border-white/10">
              <div className="w-14 lg:w-16 h-14 lg:h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Bookmark size={20} className="text-gray-500 lg:w-6 lg:h-6" />
              </div>
              <h3 className="text-base lg:text-lg font-bold text-white mb-2">No saved prompts yet</h3>
              <p className="text-gray-500 mb-6 text-sm lg:text-base">Start saving prompts for quick access</p>
              <button
                onClick={() => setActiveTab('all')}
                className="bg-white text-black font-semibold px-5 lg:px-6 py-2.5 lg:py-3 rounded-xl hover:bg-gray-100 transition-all text-sm lg:text-base"
              >
                Browse Prompts
              </button>
            </div>
          )}
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <>
          {categories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className="bg-[#141418] hover:bg-[#1a1a1f] rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all group text-left"
                >
                  <div className="text-4xl mb-4">{category.icon || '📁'}</div>
                  <h3 className="font-bold text-white mb-1 group-hover:text-gray-200 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {getCategoryPromptCount(category.id)} prompts
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#141418] rounded-2xl border border-white/10">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <FolderOpen size={24} className="text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No categories yet</h3>
              <p className="text-gray-500">Categories will appear here</p>
            </div>
          )}
        </>
      )}

      {/* Prompt Detail Modal */}
      {selectedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="relative">
              {selectedPrompt.image_url ? (
                <img
                  src={selectedPrompt.image_url}
                  alt={selectedPrompt.title}
                  className="w-full h-56 object-cover"
                />
              ) : (
                <div className="w-full h-56 bg-gray-100 flex items-center justify-center">
                  <ImageIcon size={64} className="text-gray-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent" />
              
              <button
                onClick={() => setSelectedPrompt(null)}
                className="absolute top-4 right-4 p-2.5 bg-white text-gray-600 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
              >
                <X size={20} />
              </button>

              {/* Tool Badge */}
              <div className={`absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg ${getToolBadgeClass(selectedPrompt.tool)}`}>
                <span className={`w-2 h-2 rounded-full ${getToolDotColor(selectedPrompt.tool)}`} />
                {selectedPrompt.tool}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 flex-1 overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {selectedPrompt.title}
              </h2>
              
              {selectedPrompt.description && (
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {selectedPrompt.description}
                </p>
              )}

              {/* Prompt Content */}
              {selectedPrompt.content && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Prompt</span>
                    <button
                      onClick={() => copyToClipboard(selectedPrompt.content || '')}
                      className="flex items-center gap-2 px-3 py-1.5 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                  </div>
                  <div 
                    className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedPrompt.content }}
                  />
                </div>
              )}

              {/* Category */}
              {selectedPrompt.categories && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">Category:</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    {selectedPrompt.categories.icon} {selectedPrompt.categories.name}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex gap-3">
                <button
                  onClick={() => copyToClipboard(selectedPrompt.content || '')}
                  className="flex-1 bg-black hover:bg-gray-800 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Copy size={18} />
                  Copy Prompt
                </button>
                <button
                  onClick={() => setSelectedPrompt(null)}
                  className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptsGrid;
