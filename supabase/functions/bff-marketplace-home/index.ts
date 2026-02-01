import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { cacheGet, cacheSet } from '../_shared/redis-cache.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
  'CDN-Cache-Control': 'max-age=600',
  'Vary': 'Accept-Encoding',
};

const CACHE_KEY = 'marketplace:home';
const CACHE_TTL = 300; // 5 minutes

interface MarketplaceHomeData {
  categories: unknown[];
  hotProducts: unknown[];
  topRated: unknown[];
  newArrivals: unknown[];
  featuredSellers: unknown[];
  totalProducts: number;
  cachedAt: string;
  fromRedis?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle HEAD requests for edge warming
  if (req.method === 'HEAD') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // 1. Try Redis cache first
    const cached = await cacheGet<MarketplaceHomeData>(CACHE_KEY);
    if (cached) {
      console.log('[BFF-MarketplaceHome] Redis HIT');
      return new Response(JSON.stringify({ ...cached, fromRedis: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[BFF-MarketplaceHome] Cache MISS, fetching from DB');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Run all queries in parallel for maximum speed
    const [
      categoriesResult,
      aiAccountsResult,
      sellerProductsResult,
      sellersResult,
    ] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name, icon, color, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
      
      supabase
        .from('ai_accounts')
        .select('id, name, slug, price, icon_url, is_trending, is_featured, created_at, view_count, sold_count, category_id')
        .eq('is_available', true)
        .order('created_at', { ascending: false })
        .limit(50),
      
      supabase
        .from('seller_products')
        .select(`
          id, name, slug, price, icon_url, is_approved, is_available, created_at, sold_count, view_count, category_id,
          seller_profiles!inner(id, store_name, store_slug, is_verified)
        `)
        .eq('is_available', true)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(50),
      
      supabase
        .from('seller_profiles')
        .select('id, store_name, store_logo_url, is_verified, store_slug')
        .eq('is_active', true)
        .eq('is_verified', true)
        .limit(10),
    ]);

    // Calculate product counts per category
    const categoriesWithCounts = (categoriesResult.data || []).map(cat => {
      const aiCount = (aiAccountsResult.data || []).filter(a => a.category_id === cat.id).length;
      const sellerCount = (sellerProductsResult.data || []).filter(p => p.category_id === cat.id).length;
      return {
        ...cat,
        productCount: aiCount + sellerCount,
      };
    });

    // Process products
    const allProducts = [
      ...(aiAccountsResult.data || []).map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug || null,
        price: p.price,
        iconUrl: p.icon_url,
        soldCount: p.sold_count || 0,
        viewCount: p.view_count || 0,
        createdAt: p.created_at,
        type: 'ai' as const,
        sellerName: null,
        storeSlug: null,
        isVerified: true,
      })),
      ...(sellerProductsResult.data || []).map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug || null,
        price: p.price,
        iconUrl: p.icon_url,
        soldCount: p.sold_count || 0,
        viewCount: p.view_count || 0,
        createdAt: p.created_at,
        type: 'seller' as const,
        sellerName: (p.seller_profiles as any)?.store_name || null,
        storeSlug: (p.seller_profiles as any)?.store_slug || null,
        isVerified: (p.seller_profiles as any)?.is_verified || false,
      })),
    ];

    // Hot Products - highest sold count
    const hotProducts = [...allProducts]
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 10);

    // Top Rated - use view count as proxy
    const topRated = [...allProducts]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 10);

    // New Arrivals - last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const newArrivals = allProducts
      .filter(p => p.createdAt >= sevenDaysAgo)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // Featured Sellers
    const featuredSellers = (sellersResult.data || []).map(s => ({
      id: s.id,
      storeName: s.store_name,
      logoUrl: s.store_logo_url,
      isVerified: s.is_verified,
      storeSlug: s.store_slug,
    }));

    const response: MarketplaceHomeData = {
      categories: categoriesWithCounts,
      hotProducts,
      topRated,
      newArrivals,
      featuredSellers,
      totalProducts: allProducts.length,
      cachedAt: new Date().toISOString(),
    };

    // 3. Store in Redis for next request
    await cacheSet(CACHE_KEY, response, CACHE_TTL);

    console.log(`[BFF-MarketplaceHome] Returning ${categoriesWithCounts.length} categories, ${hotProducts.length} hot, ${newArrivals.length} new`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[BFF-MarketplaceHome] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch marketplace data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  }
});
