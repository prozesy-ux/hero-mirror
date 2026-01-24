import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const storeSlug = url.searchParams.get("slug");
    const productId = url.searchParams.get("productId");

    // Create service client (no auth needed for public data)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // If productId is provided, fetch single product
    if (productId) {
      const [productResult, reviewsResult] = await Promise.all([
        // Fetch product with seller info
        supabase
          .from("seller_products")
          .select(`
            id,
            name,
            description,
            price,
            images,
            icon_url,
            category_id,
            category_ids,
            tags,
            stock,
            sold_count,
            is_available,
            chat_allowed,
            requires_email,
            seller_id,
            created_at,
            seller_profiles (
              id,
              store_name,
              store_logo_url,
              store_slug,
              store_banner_url,
              is_verified,
              contact_email
            )
          `)
          .eq("id", productId)
          .eq("is_approved", true)
          .single(),

        // Fetch product reviews
        supabase
          .from("product_reviews")
          .select(`
            id,
            rating,
            title,
            content,
            created_at,
            is_verified_purchase,
            seller_response,
            seller_responded_at
          `)
          .eq("product_id", productId)
          .order("created_at", { ascending: false })
          .limit(20)
      ]);

      if (!productResult.data) {
        return new Response(
          JSON.stringify({ error: "Product not found", data: null }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Calculate average rating
      const reviews = reviewsResult.data || [];
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;

      return new Response(
        JSON.stringify({
          data: {
            product: productResult.data,
            reviews,
            avgRating,
            reviewCount: reviews.length,
            _meta: {
              fetchedAt: new Date().toISOString()
            }
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If storeSlug is provided, fetch store data
    if (storeSlug) {
      // Fetch seller profile first
      const { data: seller, error: sellerError } = await supabase
        .from("seller_profiles")
        .select(`
          id,
          store_name,
          store_slug,
          store_logo_url,
          store_banner_url,
          store_banner_video_url,
          store_description,
          store_banner_height,
          contact_email,
          is_verified,
          user_id
        `)
        .eq("store_slug", storeSlug)
        .eq("is_active", true)
        .single();

      if (sellerError || !seller) {
        return new Response(
          JSON.stringify({ error: "Store not found", data: null }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch products and categories in parallel
      const [productsResult, categoriesResult] = await Promise.all([
        supabase
          .from("seller_products")
          .select(`
            id,
            name,
            description,
            price,
            images,
            icon_url,
            category_id,
            category_ids,
            tags,
            stock,
            sold_count,
            is_available,
            chat_allowed,
            requires_email,
            created_at
          `)
          .eq("seller_id", seller.id)
          .eq("is_approved", true)
          .eq("is_available", true)
          .order("created_at", { ascending: false }),

        supabase
          .from("categories")
          .select("id, name, icon, color")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
      ]);

      return new Response(
        JSON.stringify({
          data: {
            seller,
            products: productsResult.data || [],
            categories: categoriesResult.data || [],
            _meta: {
              fetchedAt: new Date().toISOString(),
              totalProducts: productsResult.data?.length || 0
            }
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No slug or productId provided
    return new Response(
      JSON.stringify({ error: "Missing slug or productId parameter", data: null }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[bff-store-public] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", data: null }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
