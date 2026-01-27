import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchSuggestion {
  type: "recent" | "trending" | "product" | "category" | "tag" | "seller";
  id: string;
  text: string;
  subtitle?: string;
  icon_url?: string;
  price?: number;
  result_count?: number;
}

interface SearchResponse {
  recent: SearchSuggestion[];
  trending: SearchSuggestion[];
  products: SearchSuggestion[];
  categories: SearchSuggestion[];
  tags: SearchSuggestion[];
  sellers: SearchSuggestion[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("q")?.trim().toLowerCase() || "";
    const categoryId = url.searchParams.get("category") || null;
    const logSearch = url.searchParams.get("log") === "true";

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create service client for all queries
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Try to get user ID from auth header
    let userId: string | null = null;
    if (authHeader) {
      const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await anonClient.auth.getUser();
      userId = user?.id || null;
    }

    const response: SearchResponse = {
      recent: [],
      trending: [],
      products: [],
      categories: [],
      tags: [],
      sellers: [],
    };

    // If logging a search, just log and return
    if (logSearch && query.length >= 2 && userId) {
      await serviceClient.from("search_history").insert({
        user_id: userId,
        query: query,
        category_id: categoryId,
      });
      
      // Update popular searches
      await serviceClient.rpc("upsert_popular_search", {
        p_query: query,
        p_category_id: categoryId,
      });

      return new Response(JSON.stringify({ logged: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch data in parallel using Promise.all with async functions
    const [recentResult, trendingResult, productsResult, categoriesResult, sellersResult] = await Promise.all([
      // 1. Recent searches (user-specific, only if authenticated)
      (async () => {
        if (!userId) return { type: "recent", data: [] };
        const { data } = await serviceClient
          .from("search_history")
          .select("id, query, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5);
        return { type: "recent", data };
      })(),

      // 2. Trending/popular searches
      (async () => {
        const { data } = await serviceClient
          .from("popular_searches")
          .select("id, query, search_count, is_trending")
          .order("search_count", { ascending: false })
          .limit(5);
        return { type: "trending", data };
      })(),

      // 3. Products matching query (from both ai_accounts and seller_products)
      (async () => {
        if (query.length < 2) return { type: "products", data: { ai: [], seller: [] } };
        
        const [aiData, sellerData] = await Promise.all([
          serviceClient
            .from("ai_accounts")
            .select("id, name, price, icon_url, tags")
            .eq("is_available", true)
            .or(`name.ilike.%${query}%,tags.cs.{${query}}`)
            .limit(4),
          serviceClient
            .from("seller_products")
            .select("id, name, price, icon_url, tags, seller_profiles(store_name)")
            .eq("is_available", true)
            .eq("is_approved", true)
            .or(`name.ilike.%${query}%,tags.cs.{${query}}`)
            .limit(4),
        ]);
        
        return {
          type: "products",
          data: {
            ai: aiData.data || [],
            seller: sellerData.data || [],
          },
        };
      })(),

      // 4. Categories matching query
      (async () => {
        if (query.length < 2) return { type: "categories", data: [] };
        const { data } = await serviceClient
          .from("categories")
          .select("id, name, icon, color")
          .eq("is_active", true)
          .ilike("name", `%${query}%`)
          .limit(4);
        return { type: "categories", data };
      })(),

      // 5. Sellers matching query
      (async () => {
        if (query.length < 2) return { type: "sellers", data: [] };
        const { data } = await serviceClient
          .from("seller_profiles")
          .select("id, store_name, store_logo_url, is_verified, store_slug")
          .eq("is_verified", true)
          .eq("is_active", true)
          .ilike("store_name", `%${query}%`)
          .limit(4);
        return { type: "sellers", data };
      })(),
    ]);

    // Process results
    // Recent searches
    if (recentResult.data) {
      const seen = new Set<string>();
      response.recent = recentResult.data
        .filter((r: any) => {
          if (seen.has(r.query)) return false;
          seen.add(r.query);
          return true;
        })
        .slice(0, 5)
        .map((r: any) => ({
          type: "recent" as const,
          id: r.id,
          text: r.query,
        }));
    }

    // Trending searches
    if (trendingResult.data) {
      response.trending = trendingResult.data.map((r: any) => ({
        type: "trending" as const,
        id: r.id,
        text: r.query,
        result_count: r.search_count,
      }));
    }

    // Products
    if (productsResult.data) {
      const aiProducts = (productsResult.data.ai || []).map((p: any) => ({
        type: "product" as const,
        id: p.id,
        text: p.name,
        price: p.price,
        icon_url: p.icon_url,
        subtitle: "AI Account",
      }));

      const sellerProducts = (productsResult.data.seller || []).map((p: any) => ({
        type: "product" as const,
        id: p.id,
        text: p.name,
        price: p.price,
        icon_url: p.icon_url,
        subtitle: p.seller_profiles?.store_name || "Seller Product",
      }));

      response.products = [...aiProducts, ...sellerProducts].slice(0, 6);
    }

    // Categories
    if (categoriesResult.data) {
      response.categories = categoriesResult.data.map((c: any) => ({
        type: "category" as const,
        id: c.id,
        text: c.name,
        icon_url: c.icon,
      }));
    }

    // Sellers
    if (sellersResult.data) {
      response.sellers = sellersResult.data.map((s: any) => ({
        type: "seller" as const,
        id: s.id,
        text: s.store_name,
        icon_url: s.store_logo_url,
        subtitle: s.is_verified ? "Verified Seller" : "Seller",
      }));
    }

    // Extract unique tags from products matching query
    if (query.length >= 2) {
      const allTags = new Set<string>();
      
      // Get tags from both product tables
      const [aiTagsResult, sellerTagsResult] = await Promise.all([
        serviceClient
          .from("ai_accounts")
          .select("tags")
          .eq("is_available", true)
          .not("tags", "is", null),
        serviceClient
          .from("seller_products")
          .select("tags")
          .eq("is_available", true)
          .eq("is_approved", true)
          .not("tags", "is", null),
      ]);

      [...(aiTagsResult.data || []), ...(sellerTagsResult.data || [])].forEach((p) => {
        (p.tags || []).forEach((tag: string) => {
          if (tag.toLowerCase().includes(query)) {
            allTags.add(tag);
          }
        });
      });

      response.tags = Array.from(allTags)
        .slice(0, 6)
        .map((tag) => ({
          type: "tag" as const,
          id: tag,
          text: `#${tag}`,
        }));
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Search error:", error);
    return new Response(
      JSON.stringify({ error: "Search failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
