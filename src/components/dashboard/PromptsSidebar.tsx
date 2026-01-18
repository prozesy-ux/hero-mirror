import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Flame, FolderOpen, Tag, Menu, Sparkles } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface Prompt {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  image_url: string | null;
  tool: string;
  is_free: boolean;
  is_featured?: boolean;
  is_trending?: boolean;
  category_id: string | null;
  categories?: {
    id: string;
    name: string;
    icon?: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

interface PromptsSidebarProps {
  trendingPrompts: Prompt[];
  categories: Category[];
  prompts: Prompt[];
  selectedCategory: string;
  selectedTags: string[];
  onCategorySelect: (categoryId: string) => void;
  onTagSelect: (tag: string) => void;
  onPromptClick: (prompt: Prompt) => void;
  getCategoryCount: (categoryId: string) => number;
}

const getCategoryColorClass = (color?: string) => {
  const colorMap: Record<string, string> = {
    violet: 'bg-violet-100',
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    orange: 'bg-orange-100',
    pink: 'bg-pink-100',
    purple: 'bg-purple-100',
    red: 'bg-red-100',
    yellow: 'bg-yellow-100',
    indigo: 'bg-indigo-100',
    teal: 'bg-teal-100',
  };
  return colorMap[color || 'violet'] || 'bg-gray-100';
};

const getCategoryBorderClass = (color?: string) => {
  const colorMap: Record<string, string> = {
    violet: 'border-l-violet-500',
    blue: 'border-l-blue-500',
    green: 'border-l-green-500',
    orange: 'border-l-orange-500',
    pink: 'border-l-pink-500',
    purple: 'border-l-purple-500',
    red: 'border-l-red-500',
    yellow: 'border-l-yellow-500',
    indigo: 'border-l-indigo-500',
    teal: 'border-l-teal-500',
  };
  return colorMap[color || 'violet'] || 'border-l-gray-500';
};

const getToolColor = (tool: string) => {
  const toolColors: Record<string, { bg: string; text: string }> = {
    'ChatGPT': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
    'Midjourney': { bg: 'bg-purple-100', text: 'text-purple-700' },
    'Claude': { bg: 'bg-orange-100', text: 'text-orange-700' },
    'DALL-E': { bg: 'bg-pink-100', text: 'text-pink-700' },
    'Stable Diffusion': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'Gemini': { bg: 'bg-cyan-100', text: 'text-cyan-700' },
    'Leonardo': { bg: 'bg-violet-100', text: 'text-violet-700' },
  };
  return toolColors[tool] || { bg: 'bg-gray-100', text: 'text-gray-700' };
};

const SidebarContent = ({
  trendingPrompts,
  categories,
  prompts,
  selectedCategory,
  selectedTags,
  onCategorySelect,
  onTagSelect,
  onPromptClick,
  getCategoryCount,
}: PromptsSidebarProps) => {
  const trendingRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-scroll trending section
  useEffect(() => {
    const container = trendingRef.current;
    if (!container || trendingPrompts.length === 0) return;

    let animationId: number;
    let scrollPosition = 0;

    const scroll = () => {
      if (!isPaused && container) {
        scrollPosition += 0.5;
        if (scrollPosition >= container.scrollHeight - container.clientHeight) {
          scrollPosition = 0;
        }
        container.scrollTop = scrollPosition;
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [trendingPrompts, isPaused]);

  // Extract unique tools as tags
  const allTools = useMemo(() => {
    const toolSet = new Set<string>();
    prompts.forEach(prompt => {
      if (prompt.tool) toolSet.add(prompt.tool);
    });
    return Array.from(toolSet);
  }, [prompts]);

  return (
    <div className="space-y-4">
      {/* Trending Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50">
          <Flame className="w-5 h-5 text-violet-500" />
          <h3 className="font-bold text-gray-900 text-sm">Trending Prompts</h3>
        </div>
        <div
          ref={trendingRef}
          className="max-h-48 overflow-y-auto scrollbar-hide"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {trendingPrompts.slice(0, 10).map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => onPromptClick(prompt)}
              className="w-full p-3 text-left hover:bg-gray-50 transition-all border-b border-gray-50 last:border-b-0"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{prompt.title}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getToolColor(prompt.tool).bg} ${getToolColor(prompt.tool).text}`}>
                    {prompt.tool}
                  </span>
                </div>
              </div>
            </button>
          ))}
          {trendingPrompts.length === 0 && (
            <div className="p-4 text-center text-gray-400 text-sm">
              No trending prompts yet
            </div>
          )}
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
        <div className="flex items-center gap-2 p-3 border-b border-gray-100">
          <FolderOpen className="w-4 h-4 text-violet-500" />
          <h3 className="font-bold text-gray-900 text-sm">Categories</h3>
        </div>
        <div className="overflow-y-auto max-h-64">
          <button
            onClick={() => onCategorySelect('all')}
            className={`w-full px-3 py-2.5 text-left transition-all flex items-center justify-between border-l-3 ${
              selectedCategory === 'all'
                ? 'bg-violet-50 border-l-violet-500 text-violet-700 font-medium'
                : 'border-l-transparent hover:bg-gray-50 text-gray-700'
            }`}
          >
            <span className="text-sm">All Prompts</span>
            <span className="text-xs text-gray-400">{prompts.length}</span>
          </button>
          {categories.map(category => {
            const count = getCategoryCount(category.id);
            const isSelected = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => onCategorySelect(category.id)}
                className={`w-full px-3 py-2.5 text-left transition-all flex items-center justify-between border-l-3 ${
                  isSelected
                    ? `${getCategoryColorClass(category.color)} ${getCategoryBorderClass(category.color)} font-medium`
                    : 'border-l-transparent hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-sm">{category.name}</span>
                <span className="text-xs text-gray-400">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* AI Tools/Tags Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-gray-100">
          <Tag className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-gray-900 text-sm">AI Tools</h3>
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {allTools.map(tool => {
              const isSelected = selectedTags.includes(tool);
              const colors = getToolColor(tool);
              return (
                <button
                  key={tool}
                  onClick={() => onTagSelect(tool)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-violet-500 text-white shadow-md'
                      : `${colors.bg} ${colors.text} hover:opacity-80`
                  }`}
                >
                  {tool}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PromptsSidebar = (props: PromptsSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-4">
          <SidebarContent {...props} />
        </div>
      </div>

      {/* Mobile Filter Button & Sheet */}
      <div className="lg:hidden mb-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-md hover:bg-gray-50 transition-all">
              <Menu size={18} className="text-gray-600" />
              <span className="font-medium text-gray-700">Filters</span>
              {(props.selectedCategory !== 'all' || props.selectedTags.length > 0) && (
                <span className="w-2 h-2 bg-violet-500 rounded-full" />
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="p-4 overflow-y-auto h-[calc(100vh-80px)]">
              <SidebarContent {...props} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default PromptsSidebar;
