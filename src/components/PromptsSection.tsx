import { useState } from 'react';
import { Heart, Unlock, Lock, Check, SlidersHorizontal, X, ChevronDown } from 'lucide-react';

const categories = [
  'Artworks',
  'Photography', 
  '3D & Game Dev',
  'Design & Identity',
  'Logos & Icons',
  'Business & Tech',
  'Tools',
  'Writing & Education',
  'Unique Styles',
];

const aiTools = [
  { name: 'ChatGPT', count: 150 },
  { name: 'Midjourney', count: 200 },
  { name: 'DALL-E', count: 120 },
  { name: 'Gemini', count: 80 },
  { name: 'Claude', count: 100 },
  { name: 'Stable Diffusion', count: 180 },
  { name: 'Nano Banana', count: 95 },
  { name: 'Ideogram', count: 60 },
  { name: 'Leonardo AI', count: 90 },
  { name: 'Sora', count: 45 },
];

const sortOptions = [
  { id: 'trending', label: 'Trending' },
  { id: 'featured', label: 'Featured' },
  { id: 'newest', label: 'Newest' },
  { id: 'popular', label: 'Most Popular' },
];

const prompts = [
  {
    id: 1,
    title: 'Viral Faceless Scripts: Done-for-you viral scripts for YouTube 2026',
    image: 'https://promptbazaar.ai/assets/images/prompt/thumb_695d1bb5c47ee1767709621.jpg',
    tool: 'Claude',
    category: 'Writing & Education',
    unlocked: false,
  },
  {
    id: 2,
    title: 'Nurturing Focus: A Gentle Listening-Themed Illustration Prompt',
    image: 'https://promptbazaar.ai/assets/images/prompt/thumb_6937dcc9b76f01765268681.jpg',
    tool: 'Gemini',
    category: 'Artworks',
    unlocked: true,
  },
  {
    id: 3,
    title: 'Surreal Editorial Portrait Generator: The "Miniature Clones" Concept',
    image: 'https://promptbazaar.ai/assets/images/prompt/thumb_6936b76a083731765193578.jpg',
    tool: 'Nano Banana',
    category: 'Photography',
    unlocked: false,
  },
  {
    id: 4,
    title: '3D Blind Box Diorama: Product-Shaped Miniature Brand Stores',
    image: 'https://promptbazaar.ai/assets/images/prompt/thumb_6936b610e489f1765193232.jpg',
    tool: 'Nano Banana',
    category: '3D & Game Dev',
    unlocked: false,
  },
  {
    id: 5,
    title: 'Typographic Logo Generator: Text Shaped as Objects',
    image: 'https://promptbazaar.ai/assets/images/prompt/thumb_6936b5162349b1765192982.jpg',
    tool: 'Nano Banana',
    category: 'Logos & Icons',
    unlocked: true,
  },
  {
    id: 6,
    title: 'Photorealistic Miniature City held in Hand (8k Macro Render)',
    image: 'https://promptbazaar.ai/assets/images/prompt/thumb_6936b459ee99c1765192793.jpg',
    tool: 'Nano Banana',
    category: '3D & Game Dev',
    unlocked: false,
  },
  {
    id: 7,
    title: 'Masterful Biro Sketch Portraits on Graph Paper (Hyper-Realistic Ink)',
    image: 'https://promptbazaar.ai/assets/images/prompt/thumb_6936b31271f0d1765192466.jpg',
    tool: 'Nano Banana',
    category: 'Artworks',
    unlocked: false,
  },
  {
    id: 8,
    title: 'Premium Gashapon Capsule Generator: Miniature Character Dioramas',
    image: 'https://promptbazaar.ai/assets/images/prompt/thumb_6936b12ee01de1765191982.jpg',
    tool: 'Nano Banana',
    category: '3D & Game Dev',
    unlocked: true,
  },
  {
    id: 9,
    title: 'Ultra-Realistic Character Sticker Pack Generator (Sheet View)',
    image: 'https://promptbazaar.ai/assets/images/prompt/thumb_6936aed93d08e1765191385.jpg',
    tool: 'Nano Banana',
    category: 'Design & Identity',
    unlocked: false,
  },
  {
    id: 10,
    title: 'Annotated Cyborg Split-Figure: Macro Toy Photography Prompt',
    image: 'https://promptbazaar.ai/assets/images/prompt/thumb_6936ad39728ef1765190969.jpg',
    tool: 'Nano Banana',
    category: 'Photography',
    unlocked: false,
  },
  {
    id: 11,
    title: 'Sci-Fi Hologram Generator: Futuristic 3D Blueprint Visualizations',
    image: 'https://promptbazaar.ai/assets/images/prompt/thumb_6936ac40736291765190720.jpg',
    tool: 'Nano Banana',
    category: 'Business & Tech',
    unlocked: false,
  },
  {
    id: 12,
    title: 'Magical Miniature Worlds: Cities Rising from Vintage Books',
    image: 'https://promptbazaar.ai/assets/images/prompt/thumb_6936ab594d87d1765190489.jpg',
    tool: 'Nano Banana',
    category: 'Artworks',
    unlocked: true,
  },
  {
    id: 13,
    title: 'Viral 3D Anamorphic Billboard Generator (Hyper-Realistic CGI)',
    image: 'https://promptbazaar.ai/assets/images/prompt/thumb_6936a9dd4929c1765190109.jpg',
    tool: 'Nano Banana',
    category: 'Business & Tech',
    unlocked: false,
  },
  {
    id: 14,
    title: 'Dynamic Educational Scene Generator – Character, Color, Action & Learning-Themed',
    image: 'https://promptbazaar.ai/assets/images/prompt/thumb_6934f5843be621765078404.jpg',
    tool: 'Gemini',
    category: 'Writing & Education',
    unlocked: false,
  },
  {
    id: 15,
    title: 'Advanced UI/UX Website Design System Prompt – Modern Interface Blueprint',
    image: 'https://promptbazaar.ai/assets/images/prompt/thumb_693421866284f1765024134.jpg',
    tool: 'Gemini',
    category: 'Business & Tech',
    unlocked: false,
  },
];

const PromptsSection = () => {
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('trending');
  const [showFilters, setShowFilters] = useState(false);
  const [showToolDropdown, setShowToolDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  const toggleTool = (tool: string) => {
    setSelectedTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  };

  const toggleFavorite = (id: number) => {
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setSelectedTools([]);
    setSelectedCategory(null);
    setSortBy('trending');
  };

  const filteredPrompts = prompts.filter(prompt => {
    if (selectedTools.length > 0 && !selectedTools.includes(prompt.tool)) return false;
    if (selectedCategory && prompt.category !== selectedCategory) return false;
    return true;
  });

  const activeFiltersCount = selectedTools.length + (selectedCategory ? 1 : 0);

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-gray-900 to-black min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Premium AI Prompts</h2>
          
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Top Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-white/10">
            {/* Filter Icon & Title */}
            <div className="flex items-center gap-2 text-white font-medium">
              <SlidersHorizontal className="w-5 h-5 text-purple-400" />
              <span>Filter Prompts</span>
            </div>

            <div className="w-px h-6 bg-white/20 hidden sm:block" />

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSortDropdown(!showSortDropdown);
                  setShowToolDropdown(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-gray-300 text-sm transition-colors"
              >
                <span>Sort: {sortOptions.find(o => o.id === sortBy)?.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showSortDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                  {sortOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setSortBy(option.id);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                        sortBy === option.id
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          sortBy === option.id ? 'border-purple-500 bg-purple-500' : 'border-gray-500'
                        }`}
                      >
                        {sortBy === option.id && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* AI Tool Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowToolDropdown(!showToolDropdown);
                  setShowSortDropdown(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-gray-300 text-sm transition-colors"
              >
                <span>AI Tool {selectedTools.length > 0 && `(${selectedTools.length})`}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showToolDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showToolDropdown && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-gray-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
                  {aiTools.map((tool) => (
                    <button
                      key={tool.name}
                      onClick={() => toggleTool(tool.name)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                        selectedTools.includes(tool.name)
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            selectedTools.includes(tool.name) ? 'border-purple-500 bg-purple-500' : 'border-gray-500'
                          }`}
                        >
                          {selectedTools.includes(tool.name) && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        {tool.name}
                      </div>
                      <span className="text-xs text-gray-500">{tool.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Tools Pills */}
            {selectedTools.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedTools.map((tool) => (
                  <span
                    key={tool}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full"
                  >
                    {tool}
                    <button
                      onClick={() => toggleTool(tool)}
                      className="hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="ml-auto text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Clear All ({activeFiltersCount})
              </button>
            )}
          </div>
        </div>

        {/* Prompts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className="group bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={prompt.image}
                  alt={prompt.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Tool Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full">
                  <span className="w-2 h-2 bg-purple-400 rounded-full" />
                  <span className="text-white text-xs font-medium">{prompt.tool}</span>
                </div>

                {/* Favorite Button */}
                <button
                  onClick={() => toggleFavorite(prompt.id)}
                  className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    favorites.includes(prompt.id)
                      ? 'bg-red-500 text-white'
                      : 'bg-black/60 backdrop-blur-sm text-gray-300 hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${favorites.includes(prompt.id) ? 'fill-current' : ''}`} />
                </button>

                {/* Lock/Unlock Indicator */}
                {prompt.unlocked && (
                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-green-500/80 backdrop-blur-sm rounded-full flex items-center gap-1">
                    <Unlock className="w-3 h-3 text-white" />
                    <span className="text-white text-xs font-medium">Unlocked</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 group-hover:text-purple-300 transition-colors mb-4">
                  {prompt.title}
                </h3>

                {/* Action Button - Always shows Unlock */}
                <button className="w-full py-2.5 bg-purple-500/20 hover:bg-purple-500 text-purple-400 hover:text-white font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border border-purple-500/30 hover:border-purple-500">
                  <Lock className="w-4 h-4" />
                  Unlock Prompt
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-10">
          <button className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-full transition-colors">
            Load More Prompts
          </button>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showSortDropdown || showToolDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowSortDropdown(false);
            setShowToolDropdown(false);
          }}
        />
      )}
    </section>
  );
};

export default PromptsSection;
