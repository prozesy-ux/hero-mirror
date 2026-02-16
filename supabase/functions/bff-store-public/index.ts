import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { cacheGet, cacheSet } from '../_shared/redis-cache.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
  'CDN-Cache-Control': 'max-age=600',
  'Vary': 'Accept-Encoding',
};

const CACHE_TTL = 300; // 5 minutes

interface StoreData {
  seller: unknown;
  products: unknown[];
  categories: unknown[];
  flashSales: unknown[];
  storeDesign: unknown | null;
  cachedAt: string;
  fromRedis?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

    const cacheKey = `store:${storeSlug}:home`;

    // 1. Try Redis cache first
    const cached = await cacheGet<StoreData>(cacheKey);
    if (cached) {
      console.log(`[BFF-StorePublic] Redis HIT for ${storeSlug}`);
      return new Response(JSON.stringify({ ...cached, fromRedis: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[BFF-StorePublic] Cache MISS, fetching store: ${storeSlug}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // First fetch seller profile
    const { data: seller, error: sellerError } = await supabase
      .from('seller_profiles')
      .select('id, user_id, store_name, store_description, store_logo_url, store_banner_url, store_video_url, store_tagline, store_slug, is_verified, is_active, total_sales, total_orders, social_links, banner_height, show_reviews, show_product_count, show_order_count, show_description, show_social_links, card_style, card_button_text, card_button_color, card_button_text_color, card_accent_color, card_border_radius, card_show_rating, card_show_seller_name, card_show_badge')
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

    // Fetch products, categories, flash sales, and custom design in parallel
    const now = new Date().toISOString();
    const [productsResult, categoriesResult, flashSalesResult, storeDesignResult] = await Promise.all([
      supabase
        .from('seller_products')
        .select('id, name, slug, description, price, icon_url, category_id, is_available, is_approved, tags, stock, sold_count, chat_allowed, seller_id, view_count, images, product_type, product_metadata')
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
      supabase
        .from('store_designs')
        .select('id, is_active, theme_preset, global_styles, sections')
        .eq('seller_id', seller.id)
        .eq('is_active', true)
        .maybeSingle(),
    ]);

    if (productsResult.error) console.error('[BFF-StorePublic] Products query error:', productsResult.error);
    if (categoriesResult.error) console.error('[BFF-StorePublic] Categories query error:', categoriesResult.error);
    if (flashSalesResult.error) console.error('[BFF-StorePublic] Flash sales query error:', flashSalesResult.error);

    const products = productsResult.data || [];
    const categories = categoriesResult.data || [];
    const flashSales = flashSalesResult.data || [];
    const storeDesign = storeDesignResult.data || null;

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

    const response: StoreData = {
      seller: {
        ...seller,
        averageRating,
        totalReviews,
      },
      products,
      categories,
      flashSales,
      storeDesign,
      cachedAt: new Date().toISOString(),
    };

    // Store in Redis
    await cacheSet(cacheKey, response, CACHE_TTL);

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
