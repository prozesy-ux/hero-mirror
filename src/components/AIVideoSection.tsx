import { Play, Sparkles } from 'lucide-react';

const videoTools = [
  {
    name: 'Sora Templates',
    description: 'OpenAI\'s revolutionary video AI',
    prompts: 50,
    preview: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&h=225&fit=crop',
  },
  {
    name: 'Runway Gen-3',
    description: 'Professional video generation',
    prompts: 80,
    preview: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=400&h=225&fit=crop',
  },
  {
    name: 'Pika Labs',
    description: 'Text-to-video magic',
    prompts: 60,
    preview: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=225&fit=crop',
  },
  {
    name: 'Kling AI',
    description: 'Cinematic video creation',
    prompts: 40,
    preview: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=225&fit=crop',
  },
];

const AIVideoSection = () => {
  return (
    <section className="py-20 px-4 bg-black relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-semibold rounded-full mb-4 uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            AI Video Revolution
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Create Stunning AI Videos
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Professional prompts for the latest AI video generation tools. Perfect for TikTok, YouTube Shorts, and more.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {videoTools.map((tool, index) => (
            <div
              key={index}
              className="group relative rounded-2xl overflow-hidden cursor-pointer"
            >
              {/* Video thumbnail */}
              <div className="relative aspect-video">
                <img
                  src={tool.preview}
                  alt={tool.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />
                
                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300 border border-white/30">
                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                  </div>
                </div>

                {/* Glowing border on hover */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-purple-500/50 transition-colors duration-300 pointer-events-none" />
              </div>

              {/* Info */}
              <div className="p-4 bg-white/5 backdrop-blur-sm border-x border-b border-white/10 rounded-b-2xl">
                <h3 className="font-semibold text-white mb-1">{tool.name}</h3>
                <p className="text-gray-400 text-sm mb-2">{tool.description}</p>
                <span className="text-xs text-purple-400 font-medium">{tool.prompts}+ prompts</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium rounded-full hover:opacity-90 transition-opacity inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Explore All Video Prompts
          </button>
        </div>
      </div>
    </section>
  );
};

export default AIVideoSection;
