import { useState, useEffect } from 'react';
import { Zap, ChevronRight, ShoppingCart, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { trackProductClick } from '@/lib/analytics-tracker';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface NewProduct {
  id: string;
  name: string;
  slug: string | null;
  price: number;
  icon_url: string | null;
  created_at: string;
  seller_name?: string;
  store_slug?: string;
  type: 'ai' | 'seller';
}

interface NewArrivalsSectionProps {
  onProductClick: (product: NewProduct) => void;
  className?: string;
}

export function NewArrivalsSection({ onProductClick, className }: NewArrivalsSectionProps) {
  const [products, setProducts] = useState<NewProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewArrivals();
  }, []);

  const fetchNewArrivals = async () => {
    try {
      // Get products from last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [sellerResult, aiResult] = await Promise.all([
        supabase
          .from('seller_products')
          .select('id, name, slug, price, icon_url, created_at, seller_profiles(store_name, store_slug)')
          .eq('is_available', true)
          .eq('is_approved', true)
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('ai_accounts')
          .select('id, name, slug, price, icon_url, created_at')
          .eq('is_available', true)
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: false })
          .limit(4),
      ]);

      const newProducts: NewProduct[] = [
        ...(sellerResult.data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          icon_url: p.icon_url,
          created_at: p.created_at,
          seller_name: p.seller_profiles?.store_name,
          store_slug: p.seller_profiles?.store_slug,
          type: 'seller' as const,
        })),
        ...(aiResult.data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          icon_url: p.icon_url,
          created_at: p.created_at,
          type: 'ai' as const,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setProducts(newProducts);
    } catch (error) {
      console.error('Error fetching new arrivals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-28" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-36 flex-shrink-0 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className={cn("bg-white border border-black/10 rounded-2xl p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-black" />
          <h3 className="text-lg font-bold text-black">New Arrivals</h3>
          <span className="text-xs px-2 py-0.5 bg-black text-white rounded-full font-medium">Fresh</span>
        </div>
        <Button variant="ghost" size="sm" className="text-black/50 hover:text-black text-xs h-7">
          View All <ChevronRight className="h-3 w-3 ml-0.5" />
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {products.map((product) => (
          <Card
            key={product.id}
            className="flex-shrink-0 w-36 cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 bg-white border border-black/10 hover:border-black/20"
            onClick={() => {
              trackProductClick(product.id);
              onProductClick(product);
            }}
          >
            <CardContent className="p-3">
              <div className="relative mb-2">
                <OptimizedImage
                  src={product.icon_url}
                  alt={product.name}
                  className="w-full h-24 rounded-md"
                  aspectRatio="auto"
                  fallbackIcon={<ShoppingCart className="h-8 w-8 text-green-500/50" />}
                />
                <span className="absolute top-2 right-2 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                  New
                </span>
              </div>
              <h4 className="font-medium text-sm truncate">{product.name}</h4>
              {product.seller_name && (
                <p className="text-xs text-muted-foreground truncate">{product.seller_name}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-black">${product.price.toFixed(2)}</span>
                <span className="text-xs text-black/50 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(product.created_at), { addSuffix: false })}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
