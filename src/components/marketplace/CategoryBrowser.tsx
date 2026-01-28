import { FolderOpen, ChevronRight, Sparkle, Bot, Gamepad2, Music, Video, ShoppingBag, Palette, BookOpen, Code, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMarketplaceData } from '@/hooks/useMarketplaceData';

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  product_count?: number;
}

interface CategoryBrowserProps {
  onCategoryClick: (categoryId: string, categoryName: string) => void;
  selectedCategory?: string;
  className?: string;
}

const iconMap: Record<string, any> = {
  'sparkle': Sparkle,
  'bot': Bot,
  'gamepad': Gamepad2,
  'music': Music,
  'video': Video,
  'shopping': ShoppingBag,
  'palette': Palette,
  'book': BookOpen,
  'code': Code,
  'briefcase': Briefcase,
};

const colorMap: Record<string, string> = {
  'violet': 'from-violet-500/20 to-violet-500/5 text-violet-500',
  'blue': 'from-blue-500/20 to-blue-500/5 text-blue-500',
  'green': 'from-green-500/20 to-green-500/5 text-green-500',
  'yellow': 'from-yellow-500/20 to-yellow-500/5 text-yellow-500',
  'orange': 'from-orange-500/20 to-orange-500/5 text-orange-500',
  'red': 'from-red-500/20 to-red-500/5 text-red-500',
  'pink': 'from-pink-500/20 to-pink-500/5 text-pink-500',
  'cyan': 'from-cyan-500/20 to-cyan-500/5 text-cyan-500',
  'indigo': 'from-indigo-500/20 to-indigo-500/5 text-indigo-500',
  'teal': 'from-teal-500/20 to-teal-500/5 text-teal-500',
};

export function CategoryBrowser({ onCategoryClick, selectedCategory, className }: CategoryBrowserProps) {
  const { categories: marketplaceCategories, loading } = useMarketplaceData();
  
  // Map marketplace data to local Category type with counts
  const categories: Category[] = marketplaceCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    product_count: cat.productCount,
  }));

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-36" />
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <FolderOpen className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Browse by Category</h3>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          See All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {categories.map((category) => {
          const IconComponent = iconMap[category.icon?.toLowerCase() || ''] || FolderOpen;
          const colorClass = colorMap[category.color?.toLowerCase() || 'violet'] || colorMap.violet;
          const isSelected = selectedCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryClick(category.id, category.name)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200",
                "hover:scale-105 hover:shadow-md",
                "bg-gradient-to-br",
                colorClass,
                isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            >
              <IconComponent className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium text-center truncate w-full">
                {category.name}
              </span>
              {category.product_count !== undefined && category.product_count > 0 && (
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {category.product_count} items
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
