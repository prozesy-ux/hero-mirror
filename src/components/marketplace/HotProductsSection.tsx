import { useState, useEffect } from 'react';
import { Flame, ChevronRight, Star, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { generateProductUrl } from '@/lib/url-utils';

interface HotProduct {
  id: string;
  name: string;
  price: number;
  icon_url: string | null;
  sold_count: number;
  seller_name?: string;
  seller_slug?: string;
  type: 'ai' | 'seller';
}

interface HotProductsSectionProps {
  onProductClick: (product: HotProduct) => void;
  className?: string;
}

export function HotProductsSection({ onProductClick, className }: HotProductsSectionProps) {
  const [products, setProducts] = useState<HotProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotProducts();
  }, []);

  const fetchHotProducts = async () => {
    try {
      // Get products with most purchases in recent orders
      const { data: orderData } = await supabase
        .from('seller_orders')
        .select('product_id, seller_products(id, name, price, icon_url, sold_count, seller_profiles(store_name, store_slug))')
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      // Count purchases per product
      const productCounts: Record<string, { count: number; product: any }> = {};
      
      orderData?.forEach((order: any) => {
        if (order.seller_products) {
          const pid = order.product_id;
          if (!productCounts[pid]) {
            productCounts[pid] = { count: 0, product: order.seller_products };
          }
          productCounts[pid].count++;
        }
      });

      // Sort by purchase count and take top 10
      const hotProducts: HotProduct[] = Object.entries(productCounts)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([id, data]) => ({
          id,
          name: data.product.name,
          price: data.product.price,
          icon_url: data.product.icon_url,
          sold_count: data.product.sold_count || data.count,
          seller_name: data.product.seller_profiles?.store_name,
          seller_slug: data.product.seller_profiles?.store_slug,
          type: 'seller' as const,
        }));

      // If we don't have enough hot products, fill with top selling products
      if (hotProducts.length < 6) {
        const { data: topSelling } = await supabase
          .from('seller_products')
          .select('id, name, price, icon_url, sold_count, seller_profiles(store_name, store_slug)')
          .eq('is_available', true)
          .eq('is_approved', true)
          .order('sold_count', { ascending: false })
          .limit(10 - hotProducts.length);

        topSelling?.forEach((p: any) => {
          if (!hotProducts.find(hp => hp.id === p.id)) {
            hotProducts.push({
              id: p.id,
              name: p.name,
              price: p.price,
              icon_url: p.icon_url,
              sold_count: p.sold_count || 0,
              seller_name: p.seller_profiles?.store_name,
              seller_slug: p.seller_profiles?.store_slug,
              type: 'seller',
            });
          }
        });
      }

      setProducts(hotProducts);
    } catch (error) {
      console.error('Error fetching hot products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-32" />
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
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-orange-500/10">
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold">Hot Right Now</h3>
          <Badge variant="secondary" className="text-xs">
            Trending
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          View All <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {products.map((product) => (
          <Card
            key={product.id}
            className="flex-shrink-0 w-40 cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-card border-border"
            onClick={() => onProductClick(product)}
          >
            <CardContent className="p-3">
              <div className="relative mb-2">
                <OptimizedImage
                  src={product.icon_url}
                  alt={product.name}
                  className="w-full h-24 rounded-md"
                  aspectRatio="auto"
                  fallbackIcon={<ShoppingCart className="h-8 w-8 text-primary/50" />}
                />
                <Badge className="absolute top-1 right-1 bg-orange-500 text-white text-[10px] px-1.5">
                  🔥 Hot
                </Badge>
              </div>
              <h4 className="font-medium text-sm truncate">{product.name}</h4>
              {product.seller_name && (
                <p className="text-xs text-muted-foreground truncate">{product.seller_name}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-primary">${product.price.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {product.sold_count} sold
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
