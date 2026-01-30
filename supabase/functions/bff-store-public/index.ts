import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  // Cloudflare CDN optimized: 5 min cache, 10 min stale-while-revalidate
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
  'CDN-Cache-Control': 'max-age=600',
  'Vary': 'Accept-Encoding',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle HEAD requests for edge warming (no slug required)
  if (req.method === 'HEAD') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const storeSlug = url.searchParams.get('slug');

    if (!storeSlug) {
      return new Response(
        JSON.stringify({ error: 'Store slug is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[BFF-StorePublic] Fetching store: ${storeSlug}`);

    // First fetch seller profile
    const { data: seller, error: sellerError } = await supabase
      .from('seller_profiles')
      .select('id, user_id, store_name, store_description, store_logo_url, store_banner_url, store_video_url, store_tagline, store_slug, is_verified, is_active, total_sales, total_orders, social_links, banner_height, show_reviews, show_product_count, show_order_count, show_description, show_social_links')
      .eq('store_slug', storeSlug)
      .eq('is_active', true)
      .maybeSingle();

    if (sellerError) {
      console.error('[BFF-StorePublic] Seller fetch error:', sellerError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch store' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    if (!seller) {
      return new Response(
        JSON.stringify({ error: 'Store not found', notFound: true }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    // Fetch products, categories, and flash sales in parallel
    const now = new Date().toISOString();
    const [productsResult, categoriesResult, flashSalesResult] = await Promise.all([
      supabase
        .from('seller_products')
        .select('id, name, slug, description, price, icon_url, category_id, is_available, is_approved, tags, stock, sold_count, chat_allowed, seller_id, view_count, images')
        .eq('seller_id', seller.id)
        .eq('is_available', true)
        .eq('is_approved', true)
        .order('sold_count', { ascending: false }),
      supabase
        .from('categories')
        .select('id, name, icon, color')
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
      supabase
        .from('flash_sales')
        .select('id, product_id, discount_percentage, original_price, sale_price, starts_at, ends_at, max_quantity, sold_quantity, is_active')
        .eq('seller_id', seller.id)
        .eq('is_active', true)
        .lte('starts_at', now)
        .gt('ends_at', now),
    ]);

    if (productsResult.error) {
      console.error('[BFF-StorePublic] Products query error:', productsResult.error);
    }
    if (categoriesResult.error) {
      console.error('[BFF-StorePublic] Categories query error:', categoriesResult.error);
    }
    if (flashSalesResult.error) {
      console.error('[BFF-StorePublic] Flash sales query error:', flashSalesResult.error);
    }

    const products = productsResult.data || [];
    const categories = categoriesResult.data || [];
    const flashSales = flashSalesResult.data || [];

    // Get product IDs and fetch reviews
    const productIds = products.map(p => p.id);
    let averageRating = 4.9;
    let totalReviews = 0;

    if (productIds.length > 0) {
      const { data: reviews } = await supabase
        .from('product_reviews')
        .select('rating')
        .in('product_id', productIds);
      
      if (reviews && reviews.length > 0) {
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        averageRating = Math.round((sum / reviews.length) * 10) / 10;
        totalReviews = reviews.length;
      }
    }

    const response = {
      seller: {
        ...seller,
        averageRating,
        totalReviews,
      },
      products,
      categories,
      flashSales,
      cachedAt: new Date().toISOString(),
    };

    console.log(`[BFF-StorePublic] Returning ${products.length} products for ${seller.store_name}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[BFF-StorePublic] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  }
});
