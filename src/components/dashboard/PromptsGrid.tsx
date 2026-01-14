import { useState, useEffect, useRef } from 'react';
import { Heart, Lock, Unlock, Search, Copy, X, Image as ImageIcon, TrendingUp, Layers, Filter, Eye, ChevronDown, FolderOpen, Sparkles, Bookmark, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import madeForNotion from '@/assets/made-for-notion.avif';
import chatgptLogo from '@/assets/chatgpt-logo.avif';
import checkIcon from '@/assets/check-icon.svg';
import btnArrow from '@/assets/btn-arrow.svg';
import starsIcon from '@/assets/stars.svg';
import midjourneyLogo from '@/assets/midjourney-logo.avif';
import geminiLogo from '@/assets/gemini-logo.avif';

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
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTool, setSelectedTool] = useState<string>('all');
  const [showLocked, setShowLocked] = useState<string>('all');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  
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

  const getToolLogo = (tool: string) => {
    const toolLower = tool.toLowerCase();
    if (toolLower.includes('chatgpt') || toolLower.includes('gpt')) return chatgptLogo;
    if (toolLower.includes('midjourney')) return midjourneyLogo;
    if (toolLower.includes('gemini')) return geminiLogo;
    return chatgptLogo;
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

  // Filter logic for All Prompts tab
  let filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prompt.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || prompt.category_id === selectedCategory;
    const matchesTool = selectedTool === 'all' || prompt.tool === selectedTool;
    const matchesLocked = showLocked === 'all' || 
                          (showLocked === 'free' && prompt.is_free) ||
                          (showLocked === 'premium' && !prompt.is_free);
    
    return matchesSearch && matchesCategory && matchesTool && matchesLocked;
  });

  const trendingPrompts = prompts.filter(p => p.is_featured);
  const favoritePrompts = prompts.filter(p => favorites.includes(p.id));
  const tools = [...new Set(prompts.map(p => p.tool))];

  const getCategoryPromptCount = (categoryId: string) => {
    return prompts.filter(p => p.category_id === categoryId).length;
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setActiveTab('all');
  };

  // Homepage style card component
  const HomepageStyleCard = ({ prompt }: { prompt: Prompt }) => {
    const isLocked = !canAccessPrompt(prompt);
    const isFavorite = favorites.includes(prompt.id);
    const toolLogo = getToolLogo(prompt.tool);

    // Parse title to get main title and bold part (category)
    const titleParts = prompt.title.split(' ');
    const lastWord = titleParts.pop() || '';
    const mainTitle = titleParts.join(' ');

    return (
      <div
        className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative flex flex-col flex-shrink-0 cursor-pointer"
        style={{ width: 'calc((100% - 60px) / 3.5)', minWidth: '280px' }}
        onClick={() => handlePromptClick(prompt)}
      >
        {/* Top Row: Logos + NEW badge + Made for Notion */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img src={toolLogo} alt="Logo" className="w-8 h-8 rounded-lg" />
            {prompt.image_url && (
              <img src={prompt.image_url} alt="Product" className="w-8 h-8 rounded-lg object-cover" />
            )}
            {prompt.is_featured && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                HOT!
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <img src={madeForNotion} alt="Made for Notion" className="h-6 w-auto" />
            <button
              onClick={(e) => toggleFavorite(prompt.id, e)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <Heart
                size={14}
                className={isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400'}
              />
            </button>
          </div>
        </div>

        {/* Title with black box on last word */}
        <h3 className="text-lg text-black mb-1 leading-tight">
          {mainTitle}{' '}
          <span className="bg-black text-white px-2 py-0.5 font-bold inline-block">
            {lastWord}
          </span>
        </h3>

        {/* Tool Name */}
        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-4">
          {prompt.tool}
        </p>

        {/* Description / Features */}
        <ul className="space-y-2 mb-4 flex-grow">
          {prompt.description ? (
            <li className="flex items-start gap-2 text-sm text-gray-600">
              <img src={checkIcon} alt="Check" className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="leading-tight line-clamp-2">{prompt.description}</span>
            </li>
          ) : (
            <>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <img src={checkIcon} alt="Check" className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">Premium AI Prompt</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-600">
                <img src={checkIcon} alt="Check" className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="leading-tight">Ready to use template</span>
              </li>
            </>
          )}
          {prompt.categories && (
            <li className="flex items-start gap-2 text-sm text-gray-600">
              <img src={checkIcon} alt="Check" className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="leading-tight">{prompt.categories.icon} {prompt.categories.name}</span>
            </li>
          )}
        </ul>

        {/* Access Badge */}
        <div className="mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            isLocked 
              ? 'bg-amber-500 text-white' 
              : 'bg-green-600 text-white'
          }`}>
            {isLocked ? 'Pro Access' : 'Lifetime Access'}
          </span>
        </div>

        {/* CTA Button */}
        <button 
          className={`w-full font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm ${
            isLocked 
              ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              : 'bg-yellow-400 hover:bg-yellow-500 text-black'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            handlePromptClick(prompt);
          }}
        >
          {isLocked ? (
            <>
              <Lock size={14} />
              Unlock Prompt
            </>
          ) : (
            <>
              View Prompt
              <img src={btnArrow} alt="Arrow" className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Rating */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-gray-100">
          <span className="text-sm font-medium text-gray-600">(4.9)</span>
          <img src={starsIcon} alt="Stars" className="h-4" />
          <span className="text-sm text-gray-400">(127)</span>
        </div>
      </div>
    );
  };

  // Horizontal scroll section component
  const HorizontalPromptSection = ({ 
    title, 
    icon, 
    prompts: sectionPrompts,
    emptyMessage 
  }: { 
    title: string; 
    icon: React.ReactNode; 
    prompts: Prompt[];
    emptyMessage?: string;
  }) => {
    const sectionScrollRef = useRef<HTMLDivElement>(null);

    if (sectionPrompts.length === 0 && emptyMessage) {
      return (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            {icon}
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {title} <span className="font-normal text-gray-500">&gt;</span>
            </h2>
          </div>
          <div className="w-full h-px bg-white/10 mb-6" />
          <div className="text-center py-12 bg-[#141418] rounded-2xl border border-white/10">
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-10">
        {/* Section Header - Homepage Style */}
        <div className="flex items-center gap-3 mb-2">
          {icon}
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {title} <span className="font-normal text-gray-500">&gt;</span>
          </h2>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-white/10 mb-6" />

        {/* Cards Container with horizontal scroll */}
        <div 
          ref={sectionScrollRef}
          className="flex gap-5 overflow-x-auto pb-4 scroll-smooth"
          style={{ 
            scrollbarWidth: 'thin',
            scrollbarColor: '#4b5563 #1f2937'
          }}
        >
          {sectionPrompts.map((prompt) => (
            <HomepageStyleCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 section-prompts animate-fade-up">
      {/* Tab Navigation */}
      <div className="bg-[#1a1a1f] rounded-2xl p-2 mb-8 border border-white/5 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 transform flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-white text-black shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95'
          }`}
        >
          <Layers size={16} />
          All Prompts
        </button>
        <button
          onClick={() => setActiveTab('trending')}
          className={`px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 transform flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'trending'
              ? 'bg-white text-black shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95'
          }`}
        >
          <TrendingUp size={16} />
          Trending
          {trendingPrompts.length > 0 && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'trending' ? 'bg-black text-white' : 'bg-white/10 text-white'
            }`}>
              {trendingPrompts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 transform flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'saved'
              ? 'bg-white text-black shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95'
          }`}
        >
          <Bookmark size={16} />
          Saved Prompts
          {favoritePrompts.length > 0 && (
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'saved' ? 'bg-black text-white' : 'bg-white/10 text-white'
            }`}>
              {favoritePrompts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 transform flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'categories'
              ? 'bg-white text-black shadow-lg'
              : 'text-gray-400 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95'
          }`}
        >
          <FolderOpen size={16} />
          Categories
        </button>
      </div>

      {/* All Prompts Tab */}
      {activeTab === 'all' && (
        <>
          {/* Filter Bar */}
          <div className="bg-[#141418] rounded-2xl p-6 border border-white/10 mb-8">
            {/* Search */}
            <div className="relative mb-5">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10 transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <Filter size={14} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-400">Filters:</span>
              </div>

              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none px-4 py-2 pr-8 bg-[#0a0a0c] border border-white/10 rounded-full text-white text-sm font-medium focus:outline-none focus:border-white/20 transition-all cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={selectedTool}
                  onChange={(e) => setSelectedTool(e.target.value)}
                  className="appearance-none px-4 py-2 pr-8 bg-[#0a0a0c] border border-white/10 rounded-full text-white text-sm font-medium focus:outline-none focus:border-white/20 transition-all cursor-pointer"
                >
                  <option value="all">All Tools</option>
                  {tools.map(tool => (
                    <option key={tool} value={tool}>{tool}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={showLocked}
                  onChange={(e) => setShowLocked(e.target.value)}
                  className="appearance-none px-4 py-2 pr-8 bg-[#0a0a0c] border border-white/10 rounded-full text-white text-sm font-medium focus:outline-none focus:border-white/20 transition-all cursor-pointer"
                >
                  <option value="all">All Access</option>
                  <option value="free">Free Only</option>
                  <option value="premium">Premium Only</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>

              {/* Clear Filters Button */}
              {(searchQuery || selectedCategory !== 'all' || selectedTool !== 'all' || showLocked !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedTool('all');
                    setShowLocked('all');
                  }}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-full text-red-400 text-sm font-medium transition-all flex items-center gap-2"
                >
                  <X size={14} />
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Prompts Horizontal Scroll */}
          <HorizontalPromptSection
            title="AI Prompts"
            icon={<Sparkles className="w-8 h-8 text-violet-500" />}
            prompts={filteredPrompts}
            emptyMessage="No prompts found. Try adjusting your filters."
          />
        </>
      )}

      {/* Trending Tab */}
      {activeTab === 'trending' && (
        <HorizontalPromptSection
          title="Trending Prompts"
          icon={<TrendingUp className="w-8 h-8 text-orange-500" />}
          prompts={trendingPrompts}
          emptyMessage="No trending prompts yet. Check back later!"
        />
      )}

      {/* Saved Prompts Tab */}
      {activeTab === 'saved' && (
        <>
          {favoritePrompts.length > 0 ? (
            <HorizontalPromptSection
              title="Saved Prompts"
              icon={<Bookmark className="w-8 h-8 text-pink-500" />}
              prompts={favoritePrompts}
            />
          ) : (
            <div className="text-center py-16 bg-[#141418] rounded-2xl border border-white/10">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Bookmark size={24} className="text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No saved prompts yet</h3>
              <p className="text-gray-500 mb-6">Start saving prompts for quick access</p>
              <button
                onClick={() => setActiveTab('all')}
                className="bg-white text-black font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-all"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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

      {/* Custom scrollbar styles for dark theme */}
      <style>{`
        .section-prompts div::-webkit-scrollbar {
          height: 8px;
        }
        .section-prompts div::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 4px;
        }
        .section-prompts div::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 4px;
        }
        .section-prompts div::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default PromptsGrid;
