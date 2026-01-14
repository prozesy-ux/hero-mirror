import { useState } from 'react';

const categories = [
  { name: 'Explore all tools', active: true },
  { name: 'Art', active: false },
  { name: 'Business', active: false },
  { name: 'Fun', active: false },
  { name: 'Generators', active: false },
  { name: 'Images', active: false },
  { name: 'Marketing', active: false },
  { name: 'Planning', active: false },
  { name: 'Text', active: false },
];

const sortOptions = ['Newest', 'A-Z', 'Z-A', 'FREE first'];

const prompts = [
  {
    id: 1,
    title: 'Princess Name Generator',
    description: 'Princess Name Generator',
    image: 'https://promptsideas.b-cdn.net/generators/69/abQW_ebYFqqY_Lk3Sbty.png',
    category: 'TEXT',
    subcategory: 'GENERATORS',
    version: '1',
    rating: 0,
    unlocked: false,
  },
  {
    id: 2,
    title: 'AI Image Generator',
    description: 'Create stunning images in just a few clicks',
    image: 'https://promptsideas.b-cdn.net/generators/68/H43wkJwwepEQCDzG2XSE.png',
    category: 'IMAGES',
    subcategory: 'GENERATORS',
    version: '1.0',
    rating: 0,
    unlocked: true,
  },
  {
    id: 3,
    title: 'Leonardo AI Image Generator',
    description: 'Create stunning visuals with just a few clicks',
    image: 'https://promptsideas.b-cdn.net/generators/67/kEh53xxqgmDlpt59sj7I.png',
    category: 'IMAGES',
    subcategory: 'GENERATORS',
    version: '1.32',
    rating: 4,
    unlocked: false,
  },
  {
    id: 4,
    title: 'Logo & Slogan Generator',
    description: 'Customized slogans and logos for your company.',
    image: 'https://promptsideas.b-cdn.net/generators/66/vgkSFLCYSXj7rjfkqLze.png',
    category: 'IMAGES',
    subcategory: 'BUSINESS',
    version: '1.1',
    rating: 4,
    unlocked: true,
  },
  {
    id: 5,
    title: 'Free ChatGPT',
    description: 'Ask anything and get the best results in seconds.',
    image: 'https://promptsideas.b-cdn.net/generators/65/NrJKtcT9hQ_YOSq0jG1u.png',
    category: 'TEXT',
    subcategory: 'GENERATORS',
    version: '1.21',
    rating: 4,
    unlocked: false,
  },
  {
    id: 6,
    title: 'Album Cover Generator',
    description: 'Create unique album covers for your music',
    image: 'https://promptsideas.b-cdn.net/generators/64/jd8_HxKCkK9C5mB_OQQM.png',
    category: 'IMAGES',
    subcategory: 'ART',
    version: '1.0',
    rating: 5,
    unlocked: true,
  },
  {
    id: 7,
    title: 'AI Story Generator',
    description: 'Generate creative stories with AI assistance',
    image: 'https://promptsideas.b-cdn.net/generators/63/XYZabc123def456.png',
    category: 'TEXT',
    subcategory: 'GENERATORS',
    version: '2.0',
    rating: 5,
    unlocked: false,
  },
  {
    id: 8,
    title: 'Business Plan Creator',
    description: 'Create professional business plans instantly',
    image: 'https://promptsideas.b-cdn.net/generators/62/business_plan_gen.png',
    category: 'TEXT',
    subcategory: 'BUSINESS',
    version: '1.5',
    rating: 4,
    unlocked: true,
  },
  {
    id: 9,
    title: 'Social Media Post Generator',
    description: 'Generate engaging social media content',
    image: 'https://promptsideas.b-cdn.net/generators/61/social_media_gen.png',
    category: 'TEXT',
    subcategory: 'MARKETING',
    version: '1.3',
    rating: 5,
    unlocked: false,
  },
  {
    id: 10,
    title: 'AI Avatar Creator',
    description: 'Create unique AI-generated avatars',
    image: 'https://promptsideas.b-cdn.net/generators/60/avatar_creator.png',
    category: 'IMAGES',
    subcategory: 'ART',
    version: '2.1',
    rating: 5,
    unlocked: true,
  },
];

const PromptsSection = () => {
  const [activeCategory, setActiveCategory] = useState('Explore all tools');
  const [activeSort, setActiveSort] = useState('Newest');

  const renderStars = (rating: number) => {
    if (rating === 0) return null;
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-3 h-3 ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <section className="py-16 px-4 bg-[#0a0f1a]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Free AI Tools
          </h2>
          <p className="text-gray-400 max-w-3xl mx-auto text-lg">
            Welcome to the digital playground where cutting-edge tech meets practicality. 
            Dive into our treasure trove of free AI tools designed to streamline your work and amplify your creativity.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => setActiveCategory(category.name)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeCategory === category.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1a2332] text-gray-300 hover:bg-[#242d3d] border border-gray-700'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex justify-center items-center gap-4 mb-10">
          <span className="text-gray-400 text-sm">Sort by:</span>
          <div className="flex gap-2">
            {sortOptions.map((option) => (
              <button
                key={option}
                onClick={() => setActiveSort(option)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeSort === option
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Prompts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className="bg-[#111827] rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all duration-300 group"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={prompt.image}
                  alt={prompt.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop';
                  }}
                />
                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 bg-[#1a2332]/90 text-gray-300 text-xs font-medium rounded-md border border-gray-700">
                    {prompt.category}
                  </span>
                </div>
                {/* Unlocked Badge */}
                {prompt.unlocked && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 bg-green-600/90 text-white text-xs font-medium rounded-md">
                      Unlocked
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Subcategory & Rating */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-400 text-xs font-medium">
                    | {prompt.subcategory}
                  </span>
                  {renderStars(prompt.rating)}
                </div>

                {/* Title */}
                <h3 className="text-white font-semibold text-base mb-1 line-clamp-1">
                  {prompt.title}
                </h3>

                {/* Version */}
                <p className="text-blue-400 text-xs mb-2">
                  Version: {prompt.version}
                </p>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {prompt.description}
                </p>

                {/* Action Button */}
                <button
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    prompt.unlocked
                      ? 'bg-transparent border-2 border-blue-500 text-blue-400 hover:bg-blue-500/10'
                      : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600'
                  }`}
                >
                  {prompt.unlocked ? 'View Prompt' : 'Try It Free'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
            Load More Tools
          </button>
        </div>
      </div>
    </section>
  );
};

export default PromptsSection;
