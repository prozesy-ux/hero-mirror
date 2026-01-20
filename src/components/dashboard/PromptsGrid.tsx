import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Lock, Search, Copy, X, Image as ImageIcon, TrendingUp, Layers, FolderOpen, Star, Bookmark, Check, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSearchContext } from '@/contexts/SearchContext';
import { toast } from 'sonner';
import { PromptsSidebar } from './PromptsSidebar';
import { fetchWithRecovery } from '@/lib/backend-recovery';
interface Prompt {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  image_url: string | null;
  tool: string;
  is_free: boolean;
  is_featured?: boolean;
  is_trending?: boolean;
  category_id: string | null;
  categories?: {
    id?: string;
    name: string;
    icon?: string | null;
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
  const { searchQuery } = useSearchContext();
  const [localSearch, setLocalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const { user, isPro } = useAuthContext();

  // Tag toggle handler
  const handleTagSelect = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const fetchWallet = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // No wallet exists, create one
      const { data: newWallet } = await supabase
        .from('user_wallets')
        .insert({ user_id: user.id, balance: 0 })
        .select('balance')
        .single();
      
      setWallet(newWallet);
    } else if (data) {
      setWallet(data);
    }
  };

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

  useEffect(() => {
    if (user) {
      fetchWallet();
      
      // Subscribe to wallet updates
      const walletChannel = supabase
        .channel('prompts-wallet-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_wallets',
            filter: `user_id=eq.${user.id}`
          },
          () => fetchWallet()
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(walletChannel);
      };
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    try {
      // Fetch ALL data in parallel with timeout protection
      const [promptsRes, categoriesRes, favoritesRes] = await Promise.allSettled([
        fetchWithRecovery(
          async () => await supabase.from('prompts').select(`*, categories (name, icon)`).order('created_at', { ascending: false }),
          { timeout: 10000, context: 'Prompts' }
        ),
        fetchWithRecovery(
          async () => await supabase.from('categories').select('*').order('name'),
          { timeout: 10000, context: 'Categories' }
        ),
        user 
          ? fetchWithRecovery(
              async () => await supabase.from('favorites').select('prompt_id').eq('user_id', user.id),
              { timeout: 10000, context: 'Favorites' }
            )
          : Promise.resolve({ data: [] })
      ]);

      // Set data from successful responses immediately
      if (promptsRes.status === 'fulfilled' && (promptsRes.value as any)?.data) {
        setPrompts((promptsRes.value as any).data);
      }
      
      if (categoriesRes.status === 'fulfilled' && (categoriesRes.value as any)?.data) {
        setCategories((categoriesRes.value as any).data);
      }
      
      if (favoritesRes.status === 'fulfilled') {
        const favData = (favoritesRes.value as any)?.data;
        setFavorites(favData?.map((f: any) => f.prompt_id) || []);
      }
    } catch (error) {
      console.error('PromptsGrid fetchData error:', error);
      toast.error('Some prompts failed to load');
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

  // Combined search from header and local search
  const combinedSearch = searchQuery || localSearch;

  // Filter logic for All Prompts tab - Search, category, and tag filter
  let filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(combinedSearch.toLowerCase()) ||
                          prompt.description?.toLowerCase().includes(combinedSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || prompt.category_id === selectedCategory;
    const matchesTags = selectedTags.length === 0 || selectedTags.includes(prompt.tool);
    return matchesSearch && matchesCategory && matchesTags;
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
        className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200 shadow-md hover:shadow-xl hover:border-gray-300 lg:hover:-translate-y-1 transition-all duration-300 cursor-pointer"
        onClick={() => handlePromptClick(prompt)}
      >
        {/* Image - Shorter on mobile */}
        <div className="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden">
          {prompt.image_url ? (
            <img
              src={prompt.image_url}
              alt={prompt.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <ImageIcon size={32} className="text-gray-300 sm:w-10 sm:h-10" />
            </div>
          )}

          {/* Tool Badge - Smaller on mobile */}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-500 text-white rounded-full text-[10px] sm:text-xs font-bold uppercase shadow-lg">
            {prompt.tool}
          </div>

          {/* Favorite Button */}
          <button
            onClick={(e) => toggleFavorite(prompt.id, e)}
            className="absolute top-2 sm:top-3 right-2 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm"
          >
            <Heart
              size={14}
              className={`sm:w-4 sm:h-4 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
            />
          </button>

          {/* Lock Overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center">
              <Lock size={24} className="text-white mb-1 sm:mb-2 sm:w-7 sm:h-7" />
              <span className="text-white text-xs sm:text-sm font-semibold">Pro Only</span>
            </div>
          )}
        </div>

        {/* Content - Compact on mobile */}
        <div className="p-3 sm:p-5">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight line-clamp-2 mb-1.5 sm:mb-2">
            {prompt.title}
          </h3>
          
          {/* Description - 2 lines on mobile, 3 on desktop */}
          {prompt.description && (
            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-3">
              {prompt.description}
            </p>
          )}

          {/* Access Badge */}
          <div className="mb-2 sm:mb-3">
            <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold ${
              prompt.is_free 
                ? 'bg-emerald-100 text-emerald-700' 
                : isPro
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-gray-100 text-gray-600'
            }`}>
              {prompt.is_free ? (
                <>
                  <Check size={10} className="sm:w-3 sm:h-3" />
                  Free
                </>
              ) : isPro ? (
                <>
                  <Star size={10} className="fill-violet-500 sm:w-3 sm:h-3" />
                  Pro
                </>
              ) : (
                <>
                  <Lock size={10} className="sm:w-3 sm:h-3" />
                  Pro
                </>
              )}
            </span>
          </div>

          {/* Review Section - Hidden on mobile for space */}
          <div className="hidden sm:flex items-center gap-2 mb-4">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <span className="text-sm text-gray-600 font-medium">4.9 (120+ reviews)</span>
          </div>

          {/* Yellow CTA Button - Smaller on mobile */}
          <button
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-colors text-xs sm:text-sm"
            onClick={(e) => {
              e.stopPropagation();
              handlePromptClick(prompt);
            }}
          >
            {isLocked ? 'Unlock' : 'View'}
            <ChevronRight size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Skeleton loading - shows layout immediately
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Tab skeleton */}
        <div className="bg-white rounded-2xl p-2 border border-gray-200">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 w-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
        {/* Grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-200">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-8 bg-gray-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 section-prompts animate-fade-up">
      {/* Tab Navigation with Integrated Search */}
      <div className="bg-white rounded-2xl p-1.5 lg:p-2 mb-4 lg:mb-8 border border-gray-200 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
          {/* Tab buttons - Horizontal scroll on mobile */}
          <div className="flex gap-1 lg:gap-2 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 lg:px-6 py-2 lg:py-3.5 rounded-xl font-semibold text-xs lg:text-sm transition-all duration-200 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'all'
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95'
              }`}
            >
              <Layers size={14} />
              <span className="hidden sm:inline">Browse</span> Prompts
            </button>
            <button
              onClick={() => setActiveTab('trending')}
              className={`px-3 lg:px-6 py-2 lg:py-3.5 rounded-xl font-semibold text-xs lg:text-sm transition-all duration-200 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'trending'
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95'
              }`}
            >
              <TrendingUp size={14} />
              Trending
              {trendingPrompts.length > 0 && (
                <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                  activeTab === 'trending' ? 'bg-white text-gray-900' : 'bg-gray-200 text-gray-700'
                }`}>
                  {trendingPrompts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-3 lg:px-6 py-2 lg:py-3.5 rounded-xl font-semibold text-xs lg:text-sm transition-all duration-200 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'saved'
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95'
              }`}
            >
              <Bookmark size={14} />
              Saved
              {favoritePrompts.length > 0 && (
                <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                  activeTab === 'saved' ? 'bg-white text-gray-900' : 'bg-gray-200 text-gray-700'
                }`}>
                  {favoritePrompts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 lg:px-6 py-2 lg:py-3.5 rounded-xl font-semibold text-xs lg:text-sm transition-all duration-200 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === 'categories'
                  ? 'bg-gray-900 text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:scale-95'
              }`}
            >
              <FolderOpen size={14} />
              Categories
            </button>
          </div>

          {/* Search Box - Integrated into Tab Bar */}
          <div className="relative w-full lg:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-300 transition-all"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X size={12} className="text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* All Prompts Tab - Marketplace Layout with Sidebar */}
      {activeTab === 'all' && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <PromptsSidebar
            trendingPrompts={trendingPrompts}
            categories={categories}
            prompts={prompts}
            selectedCategory={selectedCategory}
            selectedTags={selectedTags}
            onCategorySelect={handleCategoryClick}
            onTagSelect={handleTagSelect}
            onPromptClick={handlePromptClick}
            getCategoryCount={getCategoryPromptCount}
          />

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Active Filter Pills */}
            {(selectedCategory !== 'all' || selectedTags.length > 0) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-sm font-medium hover:bg-violet-200 transition-colors"
                  >
                    {categories.find(c => c.id === selectedCategory)?.name || 'Category'}
                    <X size={14} />
                  </button>
                )}
                {selectedTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagSelect(tag)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
                  >
                    {tag}
                    <X size={14} />
                  </button>
                ))}
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedTags([]);
                  }}
                  className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Prompts Grid */}
            {filteredPrompts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5">
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
                <p className="text-gray-500">Try adjusting your filters or search</p>
              </div>
            )}
          </div>
        </div>
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
