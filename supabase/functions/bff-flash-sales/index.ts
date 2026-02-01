import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { cacheGet, cacheSet } from '../_shared/redis-cache.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
  'CDN-Cache-Control': 'max-age=120',
  'Vary': 'Accept-Encoding',
};

const CACHE_KEY = 'flash:active';
const CACHE_TTL = 60; // 1 minute - short TTL for flash sales accuracy

interface FlashSalesData {
  flashSales: unknown[];
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
    // 1. Try Redis cache first
    const cached = await cacheGet<FlashSalesData>(CACHE_KEY);
    if (cached) {
      console.log('[BFF-FlashSales] Redis HIT');
      return new Response(JSON.stringify({ ...cached, fromRedis: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[BFF-FlashSales] Cache MISS, fetching from DB');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date().toISOString();

    // Fetch active flash sales with product and seller info
    const { data: flashSales, error } = await supabase
      .from('flash_sales')
      .select(`
        id,
        product_id,
        discount_percentage,
        original_price,
        sale_price,
        starts_at,
        ends_at,
        max_quantity,
        sold_quantity,
        is_active,
        seller_id
      `)
      .eq('is_active', true)
      .lte('starts_at', now)
      .gt('ends_at', now)
      .order('discount_percentage', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[BFF-FlashSales] Query error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch flash sales' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    if (!flashSales || flashSales.length === 0) {
      const emptyResponse: FlashSalesData = {
        flashSales: [],
        cachedAt: new Date().toISOString(),
      };
      await cacheSet(CACHE_KEY, emptyResponse, CACHE_TTL);
      return new Response(
        JSON.stringify(emptyResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get unique product and seller IDs
    const productIds = [...new Set(flashSales.map(fs => fs.product_id))];
    const sellerIds = [...new Set(flashSales.map(fs => fs.seller_id))];

    // Fetch products and sellers in parallel
    const [productsResult, sellersResult] = await Promise.all([
      supabase
        .from('seller_products')
        .select('id, name, icon_url, price, seller_id')
        .in('id', productIds),
      supabase
        .from('seller_profiles')
        .select('id, store_name, store_slug, store_logo_url, is_verified')
        .in('id', sellerIds),
    ]);

    const products = productsResult.data || [];
    const sellers = sellersResult.data || [];

    // Create lookup maps
    const productMap = new Map(products.map(p => [p.id, p]));
    const sellerMap = new Map(sellers.map(s => [s.id, s]));

    // Enrich flash sales with product and seller info
    const enrichedFlashSales = flashSales.map(fs => ({
      ...fs,
      product: productMap.get(fs.product_id) || null,
      seller: sellerMap.get(fs.seller_id) || null,
    })).filter(fs => fs.product !== null);

    const response: FlashSalesData = {
      flashSales: enrichedFlashSales,
      cachedAt: new Date().toISOString(),
    };

    // Store in Redis
    await cacheSet(CACHE_KEY, response, CACHE_TTL);

    console.log(`[BFF-FlashSales] Returning ${enrichedFlashSales.length} active flash sales`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[BFF-FlashSales] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  }
});
