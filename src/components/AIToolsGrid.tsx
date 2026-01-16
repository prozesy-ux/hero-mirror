import { useState, useEffect } from 'react';
import { Sparkles, Image, MessageSquare, Video, Music, Code, Palette, Bot, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import * as LucideIcons from 'lucide-react';

interface AITool {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  is_active: boolean;
  display_order: number;
  prompt_count?: number;
}

// Icon mapping for fallback
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  Image,
  Palette,
  Sparkles,
  Video,
  Bot,
  Music,
  Code,
};

const AIToolsGrid = () => {
  const [tools, setTools] = useState<AITool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchToolsWithCounts();
  }, []);

  const fetchToolsWithCounts = async () => {
    try {
      // Fetch AI tools
      const { data: toolsData, error: toolsError } = await supabase
        .from('ai_tools')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (toolsError) throw toolsError;

      // Fetch prompt counts per tool
      const { data: promptsData, error: promptsError } = await supabase
        .from('prompts')
        .select('tool');

      if (promptsError) throw promptsError;

      // Count prompts per tool
      const countMap: Record<string, number> = {};
      promptsData?.forEach((p) => {
        countMap[p.tool] = (countMap[p.tool] || 0) + 1;
      });

      // Merge counts with tools
      const toolsWithCounts = (toolsData || []).map((tool) => ({
        ...tool,
        prompt_count: countMap[tool.name] || 0,
      }));

      setTools(toolsWithCounts);
    } catch (error) {
      console.error('Error fetching AI tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderIcon = (iconName: string | null) => {
    if (!iconName) return <Sparkles className="w-6 h-6 text-white" />;
    
    // Try to get from our map first
    const MappedIcon = iconMap[iconName];
    if (MappedIcon) return <MappedIcon className="w-6 h-6 text-white" />;
    
    // Try to get from Lucide dynamically
    const LucideIcon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    if (LucideIcon) return <LucideIcon className="w-6 h-6 text-white" />;
    
    return <Sparkles className="w-6 h-6 text-white" />;
  };

  if (loading) {
    return (
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="block px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {tools.length}+ AI Tools
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Premium Prompts for Every AI Tool
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get instant access to professionally crafted prompts for the world's most powerful AI tools
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="group relative bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${tool.color || 'from-gray-500 to-gray-600'} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color || 'from-gray-500 to-gray-600'} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {renderIcon(tool.icon)}
              </div>
              
              <h3 className="font-semibold text-black text-lg mb-1">{tool.name}</h3>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{tool.prompt_count || 0}+ prompts</span>
              </div>

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs font-medium text-gray-400">View →</span>
              </div>
            </div>
          ))}
        </div>

        {tools.length > 0 && (
          <div className="text-center mt-10">
            <button className="px-8 py-3 bg-black text-white font-medium rounded-full hover:bg-gray-800 transition-colors">
              View All {tools.length}+ Tools
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default AIToolsGrid;
