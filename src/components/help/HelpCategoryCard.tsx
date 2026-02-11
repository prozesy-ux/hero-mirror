import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Rocket, UserPlus, Package, PlusCircle, Zap, GraduationCap,
  ShoppingCart, Users, BarChart3, Wallet, Megaphone, Store,
  ShoppingBag, CreditCard, MessageCircle, Settings, LifeBuoy
} from 'lucide-react';
import type { HelpCategory } from '@/data/help-docs';

const iconMap: Record<string, React.ElementType> = {
  Rocket, UserPlus, Package, PlusCircle, Zap, GraduationCap,
  ShoppingCart, Users, BarChart3, Wallet, Megaphone, Store,
  ShoppingBag, CreditCard, MessageCircle, Settings, LifeBuoy,
};

interface HelpCategoryCardProps {
  category: HelpCategory;
  articleCount: number;
  onClick: () => void;
}

const HelpCategoryCard: React.FC<HelpCategoryCardProps> = ({ category, articleCount, onClick }) => {
  const Icon = iconMap[category.icon] || Package;

  return (
    <Card
      className="cursor-pointer hover:shadow-md hover:border-black/20 transition-all group"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-black/5 group-hover:bg-black/10 transition-colors">
            <Icon className="h-5 w-5 text-black/70" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground">{category.name}</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{category.description}</p>
            <span className="text-xs text-muted-foreground mt-2 inline-block">{articleCount} articles</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HelpCategoryCard;
