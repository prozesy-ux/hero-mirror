import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=utf-8',
};

const BASE_URL = 'https://uptoza.com';

interface Store {
  store_slug: string;
  updated_at: string;
}

interface Product {
  slug: string;
  updated_at: string;
  seller_profiles: {
    store_slug: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Static pages with priorities
    const staticPages = [
      { loc: '/', changefreq: 'daily', priority: '1.0' },
      { loc: '/marketplace', changefreq: 'hourly', priority: '0.9' },
      { loc: '/signin', changefreq: 'monthly', priority: '0.3' },
    ];

    // Fetch active stores
    const { data: stores, error: storesError } = await supabase
      .from('seller_profiles')
      .select('store_slug, updated_at')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .not('store_slug', 'is', null);

    if (storesError) {
      console.error('Error fetching stores:', storesError);
    }

    // Fetch active products with store slugs
    const { data: products, error: productsError } = await supabase
      .from('seller_products')
      .select(`
        slug,
        updated_at,
        seller_profiles!inner(store_slug)
      `)
      .eq('is_available', true)
      .eq('is_approved', true)
      .not('slug', 'is', null);

    if (productsError) {
      console.error('Error fetching products:', productsError);
    }

    const today = new Date().toISOString().split('T')[0];

    // Build XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${BASE_URL}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Add store pages
    if (stores && stores.length > 0) {
      for (const store of stores as Store[]) {
        if (store.store_slug) {
          const lastmod = store.updated_at 
            ? new Date(store.updated_at).toISOString().split('T')[0] 
            : today;
          xml += `  <url>
    <loc>${BASE_URL}/store/${store.store_slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
        }
      }
    }

    // Add product pages
    if (products && products.length > 0) {
      for (const product of products as unknown as Product[]) {
        if (product.slug && product.seller_profiles?.store_slug) {
          const lastmod = product.updated_at 
            ? new Date(product.updated_at).toISOString().split('T')[0] 
            : today;
          xml += `  <url>
    <loc>${BASE_URL}/store/${product.seller_profiles.store_slug}/product/${product.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
        }
      }
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: corsHeaders,
      status: 200,
    });

  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <priority>1.0</priority>
  </url>
</urlset>`,
      { headers: corsHeaders, status: 200 }
    );
  }
});
