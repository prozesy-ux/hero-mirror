import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const storeSlug = url.searchParams.get('slug');

    if (!storeSlug) {
      return new Response(
        JSON.stringify({ error: 'Store slug is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!seller) {
      return new Response(
        JSON.stringify({ error: 'Store not found', notFound: true }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch products and categories in parallel
    const [productsResult, categoriesResult, reviewsResult] = await Promise.all([
      supabase
        .from('seller_products')
        .select('id, name, description, price, icon_url, category_id, is_available, is_approved, tags, stock, sold_count, chat_allowed, seller_id, view_count, original_price, images')
        .eq('seller_id', seller.id)
        .eq('is_available', true)
        .eq('is_approved', true)
        .order('sold_count', { ascending: false }),
      supabase
        .from('categories')
        .select('id, name, icon, color')
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
      // Get average rating for the store
      supabase
        .from('product_reviews')
        .select('rating')
        .in('product_id', [] as string[]) // Will be populated after products are fetched
    ]);

    const products = productsResult.data || [];
    const categories = categoriesResult.data || [];

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
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
