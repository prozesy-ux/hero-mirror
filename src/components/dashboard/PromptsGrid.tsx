import { useState, useEffect } from 'react';
import { Heart, Lock, Unlock, Search, Filter } from 'lucide-react';
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
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch prompts with categories
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

    // Fetch categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    
    setCategories(categoriesData || []);

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

  // Filter by favorites if needed
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
        {/* Search */}
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

        {/* Filter Dropdowns */}
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
                className={`bg-gray-800 rounded-xl overflow-hidden border transition-all ${
                  isLocked ? 'border-gray-700 opacity-75' : 'border-gray-700 hover:border-purple-500'
                }`}
              >
                {/* Image */}
                <div className="relative h-40 bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                  {prompt.image_url && (
                    <img
                      src={prompt.image_url}
                      alt={prompt.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2 py-1 bg-gray-900/80 text-xs font-medium text-white rounded">
                      {prompt.tool}
                    </span>
                    {prompt.categories && (
                      <span className="px-2 py-1 bg-purple-600/80 text-xs font-medium text-white rounded">
                        {prompt.categories.icon} {prompt.categories.name}
                      </span>
                    )}
                  </div>

                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(prompt.id);
                    }}
                    className="absolute top-3 right-3 p-2 bg-gray-900/80 rounded-full hover:bg-gray-900 transition-colors"
                  >
                    <Heart
                      size={18}
                      className={isFavorite ? 'text-red-500 fill-red-500' : 'text-white'}
                    />
                  </button>

                  {/* Lock Overlay */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Lock size={32} className="text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-white font-semibold text-lg mb-2 line-clamp-1">
                    {prompt.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {prompt.description}
                  </p>

                  <button
                    onClick={() => handlePromptClick(prompt)}
                    className={`w-full py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                      isLocked
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="px-2 py-1 bg-purple-600 text-xs font-medium text-white rounded mb-2 inline-block">
                    {selectedPrompt.tool}
                  </span>
                  <h2 className="text-2xl font-bold text-white">{selectedPrompt.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedPrompt(null)}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-gray-400 mb-6">{selectedPrompt.description}</p>
              
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">Prompt Content:</h3>
                <pre className="text-gray-300 whitespace-pre-wrap text-sm">
                  {selectedPrompt.content || 'No content available'}
                </pre>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedPrompt.content || '');
                  toast.success('Prompt copied to clipboard!');
                }}
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Copy Prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptsGrid;
