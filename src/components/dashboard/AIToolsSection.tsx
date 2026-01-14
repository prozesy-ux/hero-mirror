import { useState } from 'react';
import { Sparkles, Lock, ExternalLink, Zap, Crown, Rocket, Brain, Palette, Search, Video, Mic } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

interface AITool {
  id: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  isPremium: boolean;
  category: string;
}

const freeTools: AITool[] = [
  {
    id: '1',
    name: 'ChatGPT Free',
    description: 'OpenAI\'s free conversational AI assistant',
    icon: '🤖',
    url: 'https://chat.openai.com',
    isPremium: false,
    category: 'Chat'
  },
  {
    id: '2',
    name: 'Google Gemini',
    description: 'Google\'s multimodal AI for text and images',
    icon: '✨',
    url: 'https://gemini.google.com',
    isPremium: false,
    category: 'Chat'
  },
  {
    id: '3',
    name: 'Microsoft Copilot',
    description: 'AI assistant powered by GPT-4',
    icon: '🎯',
    url: 'https://copilot.microsoft.com',
    isPremium: false,
    category: 'Chat'
  },
  {
    id: '4',
    name: 'Perplexity AI',
    description: 'AI-powered search and research assistant',
    icon: '🔍',
    url: 'https://perplexity.ai',
    isPremium: false,
    category: 'Research'
  },
  {
    id: '5',
    name: 'Leonardo AI Free',
    description: 'Free tier AI image generation',
    icon: '🎨',
    url: 'https://leonardo.ai',
    isPremium: false,
    category: 'Image'
  },
  {
    id: '6',
    name: 'Canva AI',
    description: 'AI-powered design tools',
    icon: '🖼️',
    url: 'https://canva.com',
    isPremium: false,
    category: 'Design'
  }
];

const premiumTools: AITool[] = [
  {
    id: '7',
    name: 'ChatGPT Plus',
    description: 'GPT-4 with faster responses and plugins',
    icon: '🚀',
    url: 'https://chat.openai.com',
    isPremium: true,
    category: 'Chat'
  },
  {
    id: '8',
    name: 'Claude Pro',
    description: 'Anthropic\'s advanced AI with 100K context',
    icon: '🧠',
    url: 'https://claude.ai',
    isPremium: true,
    category: 'Chat'
  },
  {
    id: '9',
    name: 'Midjourney',
    description: 'Premium AI art and image generation',
    icon: '🎭',
    url: 'https://midjourney.com',
    isPremium: true,
    category: 'Image'
  },
  {
    id: '10',
    name: 'DALL-E 3',
    description: 'OpenAI\'s most advanced image model',
    icon: '🌟',
    url: 'https://openai.com/dall-e-3',
    isPremium: true,
    category: 'Image'
  },
  {
    id: '11',
    name: 'Runway ML',
    description: 'AI video generation and editing',
    icon: '🎬',
    url: 'https://runway.ml',
    isPremium: true,
    category: 'Video'
  },
  {
    id: '12',
    name: 'ElevenLabs',
    description: 'Premium AI voice synthesis',
    icon: '🎙️',
    url: 'https://elevenlabs.io',
    isPremium: true,
    category: 'Audio'
  }
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Chat': return <Brain size={14} />;
    case 'Image': return <Palette size={14} />;
    case 'Research': return <Search size={14} />;
    case 'Video': return <Video size={14} />;
    case 'Audio': return <Mic size={14} />;
    default: return <Sparkles size={14} />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Chat': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'Image': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'Research': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'Video': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    case 'Audio': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'Design': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const AIToolsSection = () => {
  const { profile } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'free' | 'premium'>('free');
  const isPro = profile?.is_pro;

  const tools = activeTab === 'free' ? freeTools : premiumTools;

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl blur-lg opacity-50" />
          <div className="relative p-4 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-lg">
            <Rocket size={28} className="text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white">AI Tools</h2>
          <p className="text-gray-400">Discover and access popular AI tools</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setActiveTab('free')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            activeTab === 'free'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
          }`}
        >
          <Zap className="w-5 h-5" />
          Free Tools
        </button>
        <button
          onClick={() => setActiveTab('premium')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
            activeTab === 'premium'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
          }`}
        >
          <Crown className="w-5 h-5" />
          Premium Tools
        </button>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className={`group relative bg-gradient-to-br from-[#1a1a2e]/80 to-[#12121f]/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-500/30 shadow-xl shadow-black/30 hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-300 ${
              tool.isPremium && !isPro ? 'opacity-70' : ''
            }`}
          >
            {/* Hover glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

            {tool.isPremium && !isPro && (
              <div className="absolute top-4 right-4 z-10">
                <Lock className="w-5 h-5 text-gray-500" />
              </div>
            )}

            <div className="relative flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0f0f18] to-[#1a1a2e] border border-white/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 shadow-inner">
                {tool.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-white group-hover:text-cyan-300 transition-colors">{tool.name}</h3>
                  {tool.isPremium && (
                    <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2.5 py-1 rounded-full font-semibold">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-2">{tool.description}</p>
                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium border ${getCategoryColor(tool.category)}`}>
                  {getCategoryIcon(tool.category)}
                  {tool.category}
                </span>
              </div>
            </div>

            <div className="relative mt-5">
              {tool.isPremium && !isPro ? (
                <button className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-gray-500 py-3 rounded-xl cursor-not-allowed font-medium">
                  <Lock className="w-4 h-4" />
                  Upgrade to Access
                </button>
              ) : (
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 relative overflow-hidden group/btn"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-80 group-hover/btn:opacity-100 transition-opacity rounded-xl" />
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 blur-xl opacity-0 group-hover/btn:opacity-40 transition-opacity" />
                  <span className="relative flex items-center justify-center gap-2 py-3 text-white font-semibold w-full">
                    <ExternalLink className="w-4 h-4" />
                    Open Tool
                  </span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade CTA */}
      {activeTab === 'premium' && !isPro && (
        <div className="mt-10 relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 rounded-3xl blur-xl opacity-50" />
          <div className="relative p-8 bg-gradient-to-br from-[#1a1a2e]/90 to-[#12121f]/90 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="flex items-center gap-6 flex-wrap">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50" />
                <div className="relative p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">Upgrade to Pro</h3>
                <p className="text-gray-400">Get access to all premium AI tools and exclusive features</p>
              </div>
              <button className="relative overflow-hidden group/btn px-6 py-3 rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-90 group-hover/btn:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 blur-xl opacity-0 group-hover/btn:opacity-50 transition-opacity" />
                <span className="relative text-white font-semibold">Upgrade Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIToolsSection;