import { useState } from 'react';
import { Sparkles, Lock, ExternalLink, Zap, Crown } from 'lucide-react';
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

const AIToolsSection = () => {
  const { profile } = useAuthContext();
  const [activeTab, setActiveTab] = useState<'free' | 'premium'>('free');
  const isPro = profile?.is_pro;

  const tools = activeTab === 'free' ? freeTools : premiumTools;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">AI Tools</h2>
        <p className="text-gray-400">Discover and access popular AI tools</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('free')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'free'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <Zap className="w-4 h-4" />
          Free Tools
        </button>
        <button
          onClick={() => setActiveTab('premium')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'premium'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          <Crown className="w-4 h-4" />
          Premium Tools
        </button>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className={`relative bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-purple-500 transition-all duration-300 group ${
              tool.isPremium && !isPro ? 'opacity-75' : ''
            }`}
          >
            {tool.isPremium && !isPro && (
              <div className="absolute top-3 right-3">
                <Lock className="w-4 h-4 text-gray-500" />
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {tool.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{tool.name}</h3>
                  {tool.isPremium && (
                    <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mt-1">{tool.description}</p>
                <span className="text-xs text-purple-400 mt-2 inline-block">{tool.category}</span>
              </div>
            </div>

            <div className="mt-4">
              {tool.isPremium && !isPro ? (
                <button className="w-full flex items-center justify-center gap-2 bg-gray-700 text-gray-400 py-2 rounded-lg cursor-not-allowed">
                  <Lock className="w-4 h-4" />
                  Upgrade to Access
                </button>
              ) : (
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Tool
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {activeTab === 'premium' && !isPro && (
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl border border-purple-500/30">
          <div className="flex items-center gap-4">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">Upgrade to Pro</h3>
              <p className="text-gray-300">Get access to all premium AI tools and exclusive features</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIToolsSection;
