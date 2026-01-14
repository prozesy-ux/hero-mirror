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
    case 'Chat': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Image': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'Research': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Video': return 'bg-pink-100 text-pink-700 border-pink-200';
    case 'Audio': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'Design': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const AIToolsSection = () => {
  const { profile } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'free' | 'premium'>('free');
  const isPro = profile?.is_pro;

  const tools = activeTab === 'free' ? freeTools : premiumTools;

  return (
    <div className="section-tools animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl shadow-lg shadow-cyan-500/30">
          <Rocket size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">AI Tools</h2>
          <p className="text-gray-500">Discover and access popular AI tools</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setActiveTab('free')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
            activeTab === 'free'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Zap className="w-5 h-5" />
          Free Tools
        </button>
        <button
          onClick={() => setActiveTab('premium')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
            activeTab === 'premium'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
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
            className={`group bg-white rounded-3xl p-6 border border-black/5 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-300 ${
              tool.isPremium && !isPro ? 'opacity-80' : ''
            }`}
          >
            {tool.isPremium && !isPro && (
              <div className="absolute top-4 right-4">
                <Lock className="w-5 h-5 text-gray-400" />
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300 shadow-inner border border-cyan-100">
                {tool.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900">{tool.name}</h3>
                  {tool.isPremium && (
                    <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2.5 py-1 rounded-full font-semibold">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mb-2">{tool.description}</p>
                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${getCategoryColor(tool.category)}`}>
                  {getCategoryIcon(tool.category)}
                  {tool.category}
                </span>
              </div>
            </div>

            <div className="mt-5">
              {tool.isPremium && !isPro ? (
                <button className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-400 py-3 rounded-xl cursor-not-allowed font-medium">
                  <Lock className="w-4 h-4" />
                  Upgrade to Access
                </button>
              ) : (
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white py-3 rounded-xl transition-all font-semibold shadow-lg shadow-cyan-500/25"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Tool
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade CTA */}
      {activeTab === 'premium' && !isPro && (
        <div className="mt-10 p-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl border border-purple-200/50">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/30">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Upgrade to Pro</h3>
              <p className="text-gray-600">Get access to all premium AI tools and exclusive features</p>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/25">
              Upgrade Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIToolsSection;