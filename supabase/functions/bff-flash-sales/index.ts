import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
  'CDN-Cache-Control': 'max-age=120',
  'Vary': 'Accept-Encoding',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle HEAD requests for edge warming
  if (req.method === 'HEAD') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date().toISOString();

    console.log('[BFF-FlashSales] Fetching active flash sales');

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
      return new Response(
        JSON.stringify({ flashSales: [], products: [], sellers: [] }),
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
    })).filter(fs => fs.product !== null); // Only include sales with valid products

    console.log(`[BFF-FlashSales] Returning ${enrichedFlashSales.length} active flash sales`);

    return new Response(
      JSON.stringify({
        flashSales: enrichedFlashSales,
        cachedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[BFF-FlashSales] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  }
});
