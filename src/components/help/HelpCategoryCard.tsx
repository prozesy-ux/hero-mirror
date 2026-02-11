import React from 'react';
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
    <button
      className="group p-6 bg-white border border-[#d5e0d5] rounded-lg hover:border-[#14A800] hover:shadow-lg transition-all duration-200 text-left w-full"
      onClick={onClick}
    >
      <div className="mb-5 text-[#14A800]">
        <Icon className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-[#001e00] group-hover:text-[#14A800] transition">
        {category.name}
      </h3>
      <p className="text-sm text-[#5e6d55] leading-relaxed">
        {category.description}
      </p>
    </button>
  );
};

export default HelpCategoryCard;
