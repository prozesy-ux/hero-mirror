import { useState, useEffect } from 'react';
import { Star, ChevronRight, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { trackProductClick } from '@/lib/analytics-tracker';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface TopRatedProduct {
  id: string;
  name: string;
  slug: string | null;
  price: number;
  icon_url: string | null;
  avg_rating: number;
  review_count: number;
  seller_name?: string;
  store_slug?: string;
}

interface TopRatedSectionProps {
  onProductClick: (product: TopRatedProduct) => void;
  className?: string;
}

export function TopRatedSection({ onProductClick, className }: TopRatedSectionProps) {
  const [products, setProducts] = useState<TopRatedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopRatedProducts();
  }, []);

  const fetchTopRatedProducts = async () => {
    try {
      // Get products with highest average ratings (min 2 reviews)
      const { data: reviewData } = await supabase
        .from('product_reviews')
        .select('product_id, rating')
        .order('created_at', { ascending: false });

      // Calculate average ratings per product
      const productRatings: Record<string, { total: number; count: number }> = {};
      
      reviewData?.forEach((review: any) => {
        if (!productRatings[review.product_id]) {
          productRatings[review.product_id] = { total: 0, count: 0 };
        }
        productRatings[review.product_id].total += review.rating;
        productRatings[review.product_id].count++;
      });

      // Filter products with at least 2 reviews and calculate average
      const topRatedIds = Object.entries(productRatings)
        .filter(([_, data]) => data.count >= 2)
        .map(([id, data]) => ({
          id,
          avg: data.total / data.count,
          count: data.count,
        }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 10);

      if (topRatedIds.length === 0) {
        // Fall back to featured products if no ratings
        const { data: featured } = await supabase
          .from('seller_products')
          .select('id, name, slug, price, icon_url, seller_profiles(store_name, store_slug)')
          .eq('is_available', true)
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .limit(10);

        setProducts(
          (featured || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            icon_url: p.icon_url,
            avg_rating: 4.5,
            review_count: 0,
            seller_name: p.seller_profiles?.store_name,
            store_slug: p.seller_profiles?.store_slug,
          }))
        );
        setLoading(false);
        return;
      }

      // Fetch product details for top rated
      const { data: productData } = await supabase
        .from('seller_products')
        .select('id, name, slug, price, icon_url, seller_profiles(store_name, store_slug)')
        .eq('is_available', true)
        .eq('is_approved', true)
        .in('id', topRatedIds.map(p => p.id));

      const topRatedProducts: TopRatedProduct[] = topRatedIds
        .map((rating) => {
          const product = productData?.find((p: any) => p.id === rating.id);
          if (!product) return null;
          return {
            id: product.id,
            name: product.name,
            slug: (product as any).slug,
            price: product.price,
            icon_url: product.icon_url,
            avg_rating: Math.round(rating.avg * 10) / 10,
            review_count: rating.count,
            seller_name: (product as any).seller_profiles?.store_name,
            store_slug: (product as any).seller_profiles?.store_slug,
          };
        })
        .filter(Boolean) as TopRatedProduct[];

      setProducts(topRatedProducts);
    } catch (error) {
      console.error('Error fetching top rated products:', error);
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
    <div className={cn("space-y-4 p-6 bg-gradient-to-r from-yellow-50/50 to-white rounded-2xl border border-black/5", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-yellow-500/10">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          </div>
          <h3 className="text-lg font-semibold">Top Rated</h3>
          <Badge variant="secondary" className="text-xs">
            ⭐ 4.5+
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
                  fallbackIcon={<ShoppingCart className="h-8 w-8 text-yellow-500/50" />}
                />
                <Badge className="absolute top-1 right-1 bg-yellow-500 text-black text-[10px] px-1.5">
                  ⭐ {product.avg_rating}
                </Badge>
              </div>
              <h4 className="font-medium text-sm truncate">{product.name}</h4>
              {product.seller_name && (
                <p className="text-xs text-muted-foreground truncate">{product.seller_name}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-primary">${product.price.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">
                  {product.review_count} reviews
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
