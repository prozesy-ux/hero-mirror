import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  Rocket, UserPlus, Package, PlusCircle, Zap, GraduationCap,
  ShoppingCart, Users, BarChart3, Wallet, Megaphone, Store,
  ShoppingBag, CreditCard, MessageCircle, Settings, LifeBuoy
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { HelpCategory, HelpArticle } from '@/data/help-docs';

const iconMap: Record<string, React.ElementType> = {
  Rocket, UserPlus, Package, PlusCircle, Zap, GraduationCap,
  ShoppingCart, Users, BarChart3, Wallet, Megaphone, Store,
  ShoppingBag, CreditCard, MessageCircle, Settings, LifeBuoy,
};

interface HelpSidebarProps {
  categories: HelpCategory[];
  articles: HelpArticle[];
  activeCategory: string | null;
  activeArticle: string | null;
  onCategoryClick: (slug: string) => void;
  onArticleClick: (slug: string) => void;
}

const HelpSidebar: React.FC<HelpSidebarProps> = ({
  categories, articles, activeCategory, activeArticle, onCategoryClick, onArticleClick
}) => {
  return (
    <nav className="space-y-1">
      <button
        onClick={() => onCategoryClick('')}
        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          !activeCategory && !activeArticle ? 'bg-[#14A800] text-white' : 'hover:bg-[#f7f7f7] text-[#001e00]'
        }`}
      >
        All Categories
      </button>

      {categories.map((cat) => {
        const Icon = iconMap[cat.icon] || Package;
        const catArticles = articles.filter(a => a.categorySlug === cat.slug).sort((a, b) => a.order - b.order);
        const isActive = activeCategory === cat.slug || catArticles.some(a => a.slug === activeArticle);

        return (
          <Collapsible key={cat.slug} defaultOpen={isActive}>
            <CollapsibleTrigger asChild>
              <button
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeCategory === cat.slug && !activeArticle
                    ? 'bg-[#14A800]/10 text-[#14A800] font-semibold'
                    : 'hover:bg-[#f7f7f7] text-[#001e00]'
                }`}
                onClick={() => onCategoryClick(cat.slug)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left truncate">{cat.name}</span>
                {isActive ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-6 mt-1 space-y-0.5 border-l border-[#d5e0d5] pl-3">
                {catArticles.map((article) => (
                  <button
                    key={article.slug}
                    onClick={() => onArticleClick(article.slug)}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                      activeArticle === article.slug
                        ? 'bg-[#14A800] text-white font-medium'
                        : 'hover:bg-[#f7f7f7] text-[#5e6d55] hover:text-[#001e00]'
                    }`}
                  >
                    {article.title}
                  </button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </nav>
  );
};

export default HelpSidebar;
