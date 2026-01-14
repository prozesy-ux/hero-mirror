import { useState, useEffect } from 'react';
import { Heart, Lock, Unlock, Search, Copy, X, Image as ImageIcon, Sparkles } from 'lucide-react';
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

    // Subscribe to realtime updates for prompts
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
          // Refetch data when prompts change
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

  const toggleFavorite = async (promptId: string) => {
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
    // Strip HTML tags for clipboard
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    navigator.clipboard.writeText(textContent);
    toast.success('Prompt copied to clipboard!');
  };

  // Filter prompts
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

  const tools = [...new Set(prompts.map(p => p.tool))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>

          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Tools</option>
            {tools.map(tool => (
              <option key={tool} value={tool}>{tool}</option>
            ))}
          </select>

          <select
            value={showLocked}
            onChange={(e) => setShowLocked(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Prompts</option>
            <option value="free">Free Only</option>
            <option value="premium">Premium Only</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-400">
          {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''} found
        </p>
        {!isPro && (
          <p className="text-purple-400 text-sm">
            <Lock size={14} className="inline mr-1" />
            Upgrade to Pro to unlock all prompts
          </p>
        )}
      </div>

      {/* Prompts Grid */}
      {filteredPrompts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">
            {showFavoritesOnly ? 'No favorite prompts yet' : 'No prompts found'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrompts.map((prompt) => {
            const isLocked = !canAccessPrompt(prompt);
            const isFavorite = favorites.includes(prompt.id);

            return (
              <div
                key={prompt.id}
                className={`group bg-gray-800 rounded-xl overflow-hidden border transition-all duration-300 ${
                  isLocked 
                    ? 'border-gray-700 opacity-80' 
                    : 'border-gray-700 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10'
                }`}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  {prompt.image_url ? (
                    <img
                      src={prompt.image_url}
                      alt={prompt.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-pink-900/50 flex items-center justify-center">
                      <ImageIcon size={40} className="text-gray-600" />
                    </div>
                  )}
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2.5 py-1 bg-gray-900/90 backdrop-blur-sm text-xs font-medium text-white rounded-full">
                      {prompt.tool}
                    </span>
                    {prompt.is_featured && (
                      <span className="px-2.5 py-1 bg-purple-600/90 backdrop-blur-sm text-xs font-medium text-white rounded-full flex items-center gap-1">
                        <Sparkles size={12} />
                        Featured
                      </span>
                    )}
                  </div>

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(prompt.id);
                    }}
                    className="absolute top-3 right-3 p-2 bg-gray-900/80 backdrop-blur-sm rounded-full hover:bg-gray-900 transition-colors"
                  >
                    <Heart
                      size={18}
                      className={isFavorite ? 'text-red-500 fill-red-500' : 'text-white'}
                    />
                  </button>

                  {/* Lock Overlay */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                      <div className="text-center">
                        <Lock size={32} className="text-gray-400 mx-auto mb-2" />
                        <span className="text-gray-400 text-sm">Pro Only</span>
                      </div>
                    </div>
                  )}

                  {/* Free Badge */}
                  {prompt.is_free && (
                    <span className="absolute bottom-3 left-3 px-2.5 py-1 bg-green-600/90 backdrop-blur-sm text-xs font-medium text-white rounded-full">
                      Free
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  {prompt.categories && (
                    <span className="text-purple-400 text-xs font-medium mb-1.5 block">
                      {prompt.categories.icon} {prompt.categories.name}
                    </span>
                  )}
                  <h3 className="text-white font-semibold text-lg mb-2 line-clamp-1 group-hover:text-purple-300 transition-colors">
                    {prompt.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {prompt.description}
                  </p>

                  <button
                    onClick={() => handlePromptClick(prompt)}
                    className={`w-full py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                      isLocked
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-500 text-white hover:shadow-md hover:shadow-purple-500/25'
                    }`}
                    disabled={isLocked}
                  >
                    {isLocked ? (
                      <>
                        <Lock size={16} />
                        Upgrade to Unlock
                      </>
                    ) : (
                      <>
                        <Unlock size={16} />
                        View Prompt
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Prompt Detail Modal */}
      {selectedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header with Image */}
            <div className="relative">
              {selectedPrompt.image_url ? (
                <img
                  src={selectedPrompt.image_url}
                  alt={selectedPrompt.title}
                  className="w-full h-56 object-cover"
                />
              ) : (
                <div className="w-full h-56 bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center">
                  <ImageIcon size={64} className="text-gray-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-800 via-gray-800/50 to-transparent" />
              
              <button
                onClick={() => setSelectedPrompt(null)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
              >
                <X size={20} />
              </button>

              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-purple-600 text-xs font-medium text-white rounded-full">
                    {selectedPrompt.tool}
                  </span>
                  {selectedPrompt.categories && (
                    <span className="px-3 py-1 bg-gray-700/80 text-xs font-medium text-gray-300 rounded-full backdrop-blur-sm">
                      {selectedPrompt.categories.icon} {selectedPrompt.categories.name}
                    </span>
                  )}
                  {selectedPrompt.is_free && (
                    <span className="px-3 py-1 bg-green-600 text-xs font-medium text-white rounded-full">
                      Free
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white">{selectedPrompt.title}</h2>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <p className="text-gray-400 mb-6">{selectedPrompt.description}</p>
              
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <Sparkles size={18} className="text-purple-400" />
                    Prompt Content
                  </h3>
                  <button
                    onClick={() => copyToClipboard(selectedPrompt.content || '')}
                    className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                  >
                    <Copy size={16} />
                    Copy
                  </button>
                </div>
                <div 
                  className="text-gray-300 prose prose-invert prose-sm max-w-none
                    [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:text-white
                    [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:text-white
                    [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:text-white
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
                    [&_li]:text-gray-300 [&_li]:my-1
                    [&_a]:text-purple-400 [&_a]:underline
                    [&_blockquote]:border-l-4 [&_blockquote]:border-purple-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-400
                    [&_code]:bg-gray-700 [&_code]:px-1 [&_code]:rounded [&_code]:text-purple-400
                    [&_strong]:font-bold [&_strong]:text-white
                    [&_em]:italic
                    [&_u]:underline"
                  dangerouslySetInnerHTML={{ __html: selectedPrompt.content || 'No content available' }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-700 bg-gray-800">
              <button
                onClick={() => copyToClipboard(selectedPrompt.content || '')}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/25"
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