import { Sparkles, Image, MessageSquare, Video, Music, Code, Palette, Bot } from 'lucide-react';

const tools = [
  { name: 'ChatGPT', icon: MessageSquare, prompts: 150, color: 'from-green-500 to-emerald-600' },
  { name: 'Midjourney', icon: Image, prompts: 200, color: 'from-purple-500 to-violet-600' },
  { name: 'DALL-E 3', icon: Palette, prompts: 120, color: 'from-cyan-500 to-blue-600' },
  { name: 'Stable Diffusion', icon: Sparkles, prompts: 180, color: 'from-orange-500 to-red-600' },
  { name: 'Sora', icon: Video, prompts: 80, color: 'from-pink-500 to-rose-600' },
  { name: 'Claude', icon: Bot, prompts: 100, color: 'from-amber-500 to-yellow-600' },
  { name: 'Suno AI', icon: Music, prompts: 60, color: 'from-indigo-500 to-purple-600' },
  { name: 'GitHub Copilot', icon: Code, prompts: 90, color: 'from-gray-500 to-slate-600' },
];

const AIToolsGrid = () => {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-black text-white text-xs font-semibold rounded-full mb-4 uppercase tracking-wider">
            300+ AI Tools
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Premium Prompts for Every AI Tool
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get instant access to professionally crafted prompts for the world's most powerful AI tools
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {tools.map((tool, index) => (
            <div
              key={index}
              className="group relative bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <tool.icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="font-semibold text-black text-lg mb-1">{tool.name}</h3>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{tool.prompts}+ prompts</span>
              </div>

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs font-medium text-gray-400">View →</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <button className="px-8 py-3 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-colors">
            View All 300+ Tools
          </button>
        </div>
      </div>
    </section>
  );
};

export default AIToolsGrid;
