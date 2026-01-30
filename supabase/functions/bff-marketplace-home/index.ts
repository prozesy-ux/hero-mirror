import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { applyRateLimit, RATE_LIMITS, rateLimitHeaders, getClientIP, checkRateLimit } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  // Cloudflare CDN optimized: 5 min cache, 10 min stale-while-revalidate
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
  'CDN-Cache-Control': 'max-age=600',
  'Vary': 'Accept-Encoding',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting
  const rateLimitResponse = applyRateLimit(req, corsHeaders, RATE_LIMITS.marketplace);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[BFF-MarketplaceHome] Fetching from materialized views...');

    // Try materialized views first (fastest path)
    const [categoriesResult, hotProductsResult, sellersResult] = await Promise.all([
      // Use materialized view for categories with counts
      supabase
        .from('mv_category_counts')
        .select('*')
        .order('display_order', { ascending: true }),
      
      // Use materialized view for hot products
      supabase
        .from('mv_hot_products')
        .select('*')
        .limit(50),
      
      // Featured/Verified Sellers (small table, no MV needed)
      supabase
        .from('seller_profiles')
        .select('id, store_name, store_logo_url, is_verified, store_slug')
        .eq('is_active', true)
        .eq('is_verified', true)
        .limit(10),
    ]);

    // Check if materialized views exist, fallback to direct queries
    let categoriesWithCounts = categoriesResult.data || [];
    let allProducts = hotProductsResult.data || [];
    
    // Fallback if materialized views don't exist
    if (categoriesResult.error || hotProductsResult.error) {
      console.log('[BFF-MarketplaceHome] MV not available, falling back to direct queries');
      
      const [catResult, aiResult, sellerResult] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name, icon, color, display_order')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('ai_accounts')
          .select('id, name, price, icon_url, created_at, view_count, sold_count, category_id')
          .eq('is_available', true)
          .order('sold_count', { ascending: false })
          .limit(50),
        supabase
          .from('seller_products')
          .select(`id, name, price, icon_url, created_at, sold_count, view_count, category_id,
            seller_profiles!inner(id, store_name, is_verified)`)
          .eq('is_available', true)
          .eq('is_approved', true)
          .order('sold_count', { ascending: false })
          .limit(50),
      ]);
      
      // Calculate counts manually
      categoriesWithCounts = (catResult.data || []).map(cat => {
        const aiCount = (aiResult.data || []).filter(a => a.category_id === cat.id).length;
        const sellerCount = (sellerResult.data || []).filter(p => p.category_id === cat.id).length;
        return { ...cat, product_count: aiCount + sellerCount };
      });
      
      // Map to unified format
      allProducts = [
        ...(aiResult.data || []).map(p => ({
          product_type: 'ai',
          id: p.id,
          name: p.name,
          price: p.price,
          icon_url: p.icon_url,
          sold_count: p.sold_count || 0,
          view_count: p.view_count || 0,
          created_at: p.created_at,
          category_id: p.category_id,
          seller_id: null,
          store_name: null,
          is_verified: true,
        })),
        ...(sellerResult.data || []).map(p => ({
          product_type: 'seller',
          id: p.id,
          name: p.name,
          price: p.price,
          icon_url: p.icon_url,
          sold_count: p.sold_count || 0,
          view_count: p.view_count || 0,
          created_at: p.created_at,
          category_id: p.category_id,
          seller_id: (p.seller_profiles as any)?.id,
          store_name: (p.seller_profiles as any)?.store_name,
          is_verified: (p.seller_profiles as any)?.is_verified || false,
        })),
      ];
    }

    // Transform to API format
    const transformedProducts = allProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      iconUrl: p.icon_url,
      soldCount: p.sold_count || 0,
      viewCount: p.view_count || 0,
      createdAt: p.created_at,
      type: p.product_type as 'ai' | 'seller',
      sellerName: p.store_name,
      isVerified: p.is_verified,
    }));

    // Hot Products - highest sold count (already sorted from MV)
    const hotProducts = transformedProducts.slice(0, 10);

    // Top Rated - by view count
    const topRated = [...transformedProducts]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 10);

    // New Arrivals - last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const newArrivals = transformedProducts
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

    // Transform categories
    const categories = categoriesWithCounts.map(c => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      display_order: c.display_order,
      productCount: c.product_count || 0,
    }));

    const response = {
      categories,
      hotProducts,
      topRated,
      newArrivals,
      featuredSellers,
      totalProducts: transformedProducts.length,
      cachedAt: new Date().toISOString(),
    };

    // Add rate limit headers
    const clientIP = getClientIP(req);
    const rateResult = checkRateLimit(clientIP, RATE_LIMITS.marketplace);

    console.log(`[BFF-MarketplaceHome] Returning ${categories.length} categories, ${hotProducts.length} hot, ${newArrivals.length} new`);

    return new Response(JSON.stringify(response), {
      headers: { 
        ...corsHeaders, 
        ...rateLimitHeaders(rateResult),
        'Content-Type': 'application/json' 
      },
    });
  } catch (error) {
    console.error('[BFF-MarketplaceHome] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch marketplace data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  }
});
