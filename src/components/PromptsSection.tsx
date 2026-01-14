import { useState } from 'react';
import { Heart, ShoppingCart, Check, SlidersHorizontal, X } from 'lucide-react';

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
  { name: 'Ideogram', count: 60 },
  { name: 'Leonardo AI', count: 90 },
];

const sortOptions = [
  { id: 'trending', label: 'Trending' },
  { id: 'featured', label: 'Featured' },
  { id: 'newest', label: 'Newest' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
];

const prompts = [
  {
    id: 1,
    title: 'Viral Faceless Scripts: YouTube Automation 2025',
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop',
    price: 13.50,
    author: 'kefpreneur',
    tool: 'Claude',
    verified: true,
    category: 'Writing & Education',
  },
  {
    id: 2,
    title: 'Cinematic Portrait Generator: Editorial Style',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop',
    price: 4.99,
    author: 'artmaster',
    tool: 'Midjourney',
    verified: true,
    category: 'Photography',
  },
  {
    id: 3,
    title: 'Surreal 3D Product Mockups: Floating Objects',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    price: 1.99,
    author: 'designpro',
    tool: 'DALL-E',
    verified: true,
    category: '3D & Game Dev',
  },
  {
    id: 4,
    title: 'Neon Cyberpunk City Backgrounds Pack',
    image: 'https://images.unsplash.com/photo-1515705576963-95cad62945b6?w=400&h=300&fit=crop',
    price: 7.99,
    author: 'neonwave',
    tool: 'Stable Diffusion',
    verified: false,
    category: 'Artworks',
  },
  {
    id: 5,
    title: 'Professional Logo Concepts Generator',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=300&fit=crop',
    price: 9.99,
    author: 'brandcraft',
    tool: 'Ideogram',
    verified: true,
    category: 'Logos & Icons',
  },
  {
    id: 6,
    title: 'AI Business Presentation Templates',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    price: 14.99,
    author: 'bizpro',
    tool: 'ChatGPT',
    verified: true,
    category: 'Business & Tech',
  },
  {
    id: 7,
    title: 'Fantasy Character Design Prompts',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=300&fit=crop',
    price: 5.99,
    author: 'fantasycreator',
    tool: 'Midjourney',
    verified: true,
    category: '3D & Game Dev',
  },
  {
    id: 8,
    title: 'Social Media Carousel Templates',
    image: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=300&fit=crop',
    price: 3.99,
    author: 'socialpro',
    tool: 'ChatGPT',
    verified: false,
    category: 'Design & Identity',
  },
  {
    id: 9,
    title: 'Minimalist Icon Set Generator',
    image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=300&fit=crop',
    price: 2.99,
    author: 'iconmaster',
    tool: 'DALL-E',
    verified: true,
    category: 'Logos & Icons',
  },
];

const PromptsSection = () => {
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('trending');
  const [showFilters, setShowFilters] = useState(false);
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

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-gray-900 to-black min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <span className="hover:text-white cursor-pointer">Home</span>
            <span>/</span>
            <span className="text-purple-400">Prompts</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">AI Prompts</h1>
          
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
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Sidebar */}
          <div className={`lg:w-72 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  Filter Prompts
                </h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Clear Filter
                </button>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Sort by</h4>
                <div className="space-y-2">
                  {sortOptions.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          sortBy === option.id
                            ? 'bg-purple-500 border-purple-500'
                            : 'border-gray-500 group-hover:border-gray-400'
                        }`}
                      >
                        {sortBy === option.id && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-gray-300 group-hover:text-white text-sm">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* AI Tool */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-3">AI Tool</h4>
                <div className="space-y-2">
                  {aiTools.map((tool) => (
                    <label
                      key={tool.name}
                      className="flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            selectedTools.includes(tool.name)
                              ? 'bg-purple-500 border-purple-500'
                              : 'border-gray-500 group-hover:border-gray-400'
                          }`}
                          onClick={() => toggleTool(tool.name)}
                        >
                          {selectedTools.includes(tool.name) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-gray-300 group-hover:text-white text-sm">
                          {tool.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{tool.count}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 bg-purple-500 rounded-full flex items-center justify-center shadow-lg"
          >
            {showFilters ? <X className="w-6 h-6 text-white" /> : <SlidersHorizontal className="w-6 h-6 text-white" />}
          </button>

          {/* Prompts Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {prompt.title}
                      </h3>
                      <span className="text-purple-400 font-bold text-lg flex-shrink-0">
                        ${prompt.price.toFixed(2)}
                      </span>
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-gray-400 text-sm">@{prompt.author}</span>
                      {prompt.verified && (
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Add to Cart Button */}
                    <button className="w-full py-2.5 bg-purple-500/20 hover:bg-purple-500 text-purple-400 hover:text-white font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border border-purple-500/30 hover:border-purple-500">
                      <ShoppingCart className="w-4 h-4" />
                      Add to cart
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
        </div>
      </div>
    </section>
  );
};

export default PromptsSection;
