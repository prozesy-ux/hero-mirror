import { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingBag, Star, MessageSquare, Heart, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'purchase' | 'review' | 'chat' | 'wishlist' | 'view';
  title: string;
  description: string;
  timestamp: string;
  data?: any;
}

const ActivityFeed = ({ limit = 10 }: { limit?: number }) => {
  const { user } = useAuthContext();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const fetchActivities = async () => {
      const activities: Activity[] = [];

      // Recent Orders
      const { data: orders } = await supabase
        .from('seller_orders')
        .select('id, created_at, product:seller_products(name)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      orders?.forEach((order: any) => {
        activities.push({
          id: `order-${order.id}`,
          type: 'purchase',
          title: 'Purchase',
          description: `You bought "${order.product?.name || 'a product'}"`,
          timestamp: order.created_at,
        });
      });

      // Recent Reviews
      const { data: reviews } = await supabase
        .from('product_reviews')
        .select('id, created_at, rating, product:seller_products(name)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      reviews?.forEach((review: any) => {
        activities.push({
          id: `review-${review.id}`,
          type: 'review',
          title: 'Review',
          description: `You left a ${review.rating}★ review for "${review.product?.name || 'a product'}"`,
          timestamp: review.created_at,
        });
      });

      // Wishlisted Items
      const { data: wishlist } = await supabase
        .from('buyer_wishlist')
        .select('id, created_at, product:seller_products(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      wishlist?.forEach((item: any) => {
        activities.push({
          id: `wishlist-${item.id}`,
          type: 'wishlist',
          title: 'Wishlist',
          description: `You saved "${item.product?.name || 'a product'}" to wishlist`,
          timestamp: item.created_at,
        });
      });

      // Sort by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(activities.slice(0, limit));
      setLoading(false);
    };

    fetchActivities();
  }, [user, limit]);

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'purchase':
        return <ShoppingBag className="h-4 w-4 text-emerald-500" />;
      case 'review':
        return <Star className="h-4 w-4 text-amber-500" />;
      case 'chat':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'wishlist':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'view':
        return <TrendingUp className="h-4 w-4 text-slate-500" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>;

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-semibold text-slate-900 mb-3">Activity Feed</h3>
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No activity yet</p>
        ) : (
          activities.map(activity => (
            <div key={activity.id} className="flex gap-3 pb-3 border-b last:border-b-0 last:pb-0">
              <div className="mt-1">{getIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{activity.description}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
