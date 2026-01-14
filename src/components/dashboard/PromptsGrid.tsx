import { useState, useEffect } from 'react';
import { Heart, Lock, Unlock, Search, Copy, X, Image as ImageIcon, TrendingUp, Layers, Filter, Eye, ChevronDown } from 'lucide-react';
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

interface PromptsGridProps {
  showFavoritesOnly?: boolean;
}

const PromptsGrid = ({ showFavoritesOnly = false }: PromptsGridProps) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTool, setSelectedTool] = useState<string>('all');
  const [showLocked, setShowLocked] = useState<string>('all');
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  
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

  if (showFavoritesOnly) {
    filteredPrompts = filteredPrompts.filter(prompt => favorites.includes(prompt.id));
  }

  const trendingPrompts = filteredPrompts.filter(p => p.is_featured);
  const regularPrompts = filteredPrompts.filter(p => !p.is_featured);

  const tools = [...new Set(prompts.map(p => p.tool))];

  const PromptCard = ({ prompt }: { prompt: Prompt }) => {
    const isLocked = !canAccessPrompt(prompt);
    const isFavorite = favorites.includes(prompt.id);

    return (
      <div
        className="group bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
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
          <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getToolBadgeClass(prompt.tool)}`}>
            <span className={`w-2 h-2 rounded-full ${getToolDotColor(prompt.tool)}`} />
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

          {/* Unlocked Badge */}
          {!isLocked && (
            <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-emerald-500 rounded-full flex items-center gap-1 shadow-sm">
              <Unlock size={12} className="text-white" />
              <span className="text-white text-xs font-semibold">Unlocked</span>
            </div>
          )}

          {/* Lock Overlay */}
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

        {/* Content */}
        <div className="p-5">
          <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-gray-700 transition-colors mb-4">
            {prompt.title}
          </h3>

          {/* Button */}
          <button
            className={`w-full py-3 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              isLocked
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200'
                : 'bg-black hover:bg-gray-800 text-white'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handlePromptClick(prompt);
            }}
          >
            {isLocked ? (
              <>
                <Lock size={16} />
                Unlock Prompt
              </>
            ) : (
              <>
                <Eye size={16} />
                View Prompt
              </>
            )}
          </button>
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
      {/* Filter Bar */}
      <div className="bg-[#141418] rounded-2xl p-6 border border-white/10">
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
        </div>
      </div>

      {/* Trending Section */}
      {trendingPrompts.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-black border border-white/10 rounded-xl">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Trending Prompts</h2>
              <p className="text-gray-500 text-sm">Most popular this week</p>
            </div>
            <span className="ml-auto px-3 py-1.5 bg-white/5 border border-white/10 text-gray-400 rounded-full text-xs font-medium">
              {trendingPrompts.length} prompts
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {trendingPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        </div>
      )}

      {/* All Prompts Section */}
      {regularPrompts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-black border border-white/10 rounded-xl">
                <Layers size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {trendingPrompts.length > 0 ? 'All Prompts' : 'Prompts'}
                </h2>
                <p className="text-gray-500 text-sm">{regularPrompts.length} prompts found</p>
              </div>
            </div>
            {!isPro && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <Lock size={14} className="text-gray-400" />
                <span className="text-gray-400 text-sm font-medium">Upgrade to unlock all</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {regularPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredPrompts.length === 0 && (
        <div className="text-center py-16 bg-[#141418] rounded-2xl border border-white/10">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-gray-500" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {showFavoritesOnly ? 'No favorite prompts yet' : 'No prompts found'}
          </h3>
          <p className="text-gray-500">
            {showFavoritesOnly ? 'Start adding prompts to your favorites' : 'Try adjusting your search or filters'}
          </p>
        </div>
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

              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getToolBadgeClass(selectedPrompt.tool)}`}>
                    {selectedPrompt.tool}
                  </span>
                  {selectedPrompt.categories && (
                    <span className="px-3 py-1 bg-gray-100 text-xs font-medium text-gray-600 rounded-full">
                      {selectedPrompt.categories.icon} {selectedPrompt.categories.name}
                    </span>
                  )}
                  {selectedPrompt.is_free && (
                    <span className="px-3 py-1 bg-emerald-100 text-xs font-semibold text-emerald-700 rounded-full">
                      Free
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedPrompt.title}</h2>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-gray-600 mb-6">{selectedPrompt.description}</p>
              
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900 font-semibold flex items-center gap-2">
                    <Layers size={18} className="text-gray-700" />
                    Prompt Content
                  </h3>
                  <button
                    onClick={() => copyToClipboard(selectedPrompt.content || '')}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 text-sm font-semibold transition-colors px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <Copy size={14} />
                    Copy
                  </button>
                </div>
                <div 
                  className="text-gray-700 prose prose-sm max-w-none
                    [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:text-gray-900
                    [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:text-gray-900
                    [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:text-gray-900
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
                    [&_li]:text-gray-700 [&_li]:my-1
                    [&_p]:my-2 [&_p]:text-gray-700
                    [&_strong]:font-semibold [&_strong]:text-gray-900
                    [&_em]:italic
                    [&_code]:bg-gray-200 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:text-gray-800"
                  dangerouslySetInnerHTML={{ __html: selectedPrompt.content || '' }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => copyToClipboard(selectedPrompt.content || '')}
                className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all"
              >
                <Copy size={18} />
                Copy Prompt to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptsGrid;
