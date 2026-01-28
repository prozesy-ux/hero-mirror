import { useEffect, useState } from 'react';
import { TrendingUp, Star, DollarSign, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import SellerLevelBadge from './SellerLevelBadge';

interface SellerLevel {
  id: string;
  name: string;
  badge_color: string;
  badge_icon: string;
  min_orders: number;
  min_rating: number;
  min_revenue: number;
  commission_rate: number;
  benefits: string[];
  display_order: number;
}

interface SellerLevelProgressProps {
  currentLevel: SellerLevel | null;
  totalOrders: number;
  avgRating: number;
  totalRevenue: number;
}

const SellerLevelProgress = ({
  currentLevel,
  totalOrders,
  avgRating,
  totalRevenue,
}: SellerLevelProgressProps) => {
  const [nextLevel, setNextLevel] = useState<SellerLevel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNextLevel = async () => {
      if (!currentLevel) return;
      
      const { data } = await supabase
        .from('seller_levels')
        .select('*')
        .gt('display_order', currentLevel.display_order)
        .order('display_order', { ascending: true })
        .limit(1)
        .single();

      setNextLevel(data as SellerLevel | null);
      setLoading(false);
    };

    fetchNextLevel();
  }, [currentLevel]);

  if (loading || !currentLevel) {
    return null;
  }

  // If at max level
  if (!nextLevel) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
        <div className="flex items-center gap-3 mb-3">
          <SellerLevelBadge level={currentLevel} size="lg" />
          <div>
            <p className="text-sm font-medium text-slate-900">Maximum Level Achieved!</p>
            <p className="text-xs text-slate-500">Enjoy the lowest commission rate: {currentLevel.commission_rate}%</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(currentLevel.benefits as string[]).map((benefit, i) => (
            <span key={i} className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {benefit}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Calculate progress for each metric
  const orderProgress = Math.min(100, (totalOrders / nextLevel.min_orders) * 100);
  const ratingProgress = Math.min(100, (avgRating / nextLevel.min_rating) * 100);
  const revenueProgress = Math.min(100, (totalRevenue / nextLevel.min_revenue) * 100);

  const metrics = [
    {
      label: 'Orders',
      current: totalOrders,
      required: nextLevel.min_orders,
      progress: orderProgress,
      icon: TrendingUp,
      color: 'bg-blue-500',
    },
    {
      label: 'Rating',
      current: avgRating.toFixed(1),
      required: nextLevel.min_rating,
      progress: ratingProgress,
      icon: Star,
      color: 'bg-amber-500',
    },
    {
      label: 'Revenue',
      current: `$${totalRevenue.toFixed(0)}`,
      required: `$${nextLevel.min_revenue}`,
      progress: revenueProgress,
      icon: DollarSign,
      color: 'bg-emerald-500',
    },
  ];

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
      {/* Current & Next Level */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SellerLevelBadge level={currentLevel} size="md" />
          <ChevronRight className="h-4 w-4 text-slate-400" />
          <SellerLevelBadge level={nextLevel} size="md" />
        </div>
        <span className="text-xs text-slate-500">
          {currentLevel.commission_rate}% → {nextLevel.commission_rate}% fee
        </span>
      </div>

      {/* Progress Metrics */}
      <div className="space-y-3">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <metric.icon className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-600">{metric.label}</span>
              </div>
              <span className="text-xs text-slate-500">
                {metric.current} / {metric.required}
              </span>
            </div>
            <Progress value={metric.progress} className="h-1.5" />
          </div>
        ))}
      </div>

      {/* Next Level Benefits */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-[10px] text-slate-500 mb-2">Unlock at {nextLevel.name}:</p>
        <div className="flex flex-wrap gap-1">
          {(nextLevel.benefits as string[]).slice(0, 3).map((benefit, i) => (
            <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {benefit}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SellerLevelProgress;
