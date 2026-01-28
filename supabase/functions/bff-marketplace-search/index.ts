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
  recentlyViewed: SearchSuggestion[];
  didYouMean?: string;
  priceFilter?: { min?: number; max?: number };
}

// Parse price range from query
function parsePriceQuery(query: string): { cleanedQuery: string; priceFilter?: { min?: number; max?: number } } {
  const patterns = [
    { regex: /under\s*\$?(\d+)/i, handler: (m: RegExpMatchArray) => ({ max: parseInt(m[1]) }) },
    { regex: /below\s*\$?(\d+)/i, handler: (m: RegExpMatchArray) => ({ max: parseInt(m[1]) }) },
    { regex: /less\s*than\s*\$?(\d+)/i, handler: (m: RegExpMatchArray) => ({ max: parseInt(m[1]) }) },
    { regex: /above\s*\$?(\d+)/i, handler: (m: RegExpMatchArray) => ({ min: parseInt(m[1]) }) },
    { regex: /over\s*\$?(\d+)/i, handler: (m: RegExpMatchArray) => ({ min: parseInt(m[1]) }) },
    { regex: /more\s*than\s*\$?(\d+)/i, handler: (m: RegExpMatchArray) => ({ min: parseInt(m[1]) }) },
    { regex: /\$?(\d+)\s*-\s*\$?(\d+)/i, handler: (m: RegExpMatchArray) => ({ min: parseInt(m[1]), max: parseInt(m[2]) }) },
    { regex: /\$?(\d+)\s*to\s*\$?(\d+)/i, handler: (m: RegExpMatchArray) => ({ min: parseInt(m[1]), max: parseInt(m[2]) }) },
    { regex: /between\s*\$?(\d+)\s*and\s*\$?(\d+)/i, handler: (m: RegExpMatchArray) => ({ min: parseInt(m[1]), max: parseInt(m[2]) }) },
  ];

  for (const { regex, handler } of patterns) {
    const match = query.match(regex);
    if (match) {
      const cleanedQuery = query.replace(regex, '').trim();
      return { cleanedQuery, priceFilter: handler(match) };
    }
  }

  return { cleanedQuery: query };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const rawQuery = url.searchParams.get("q")?.trim().toLowerCase() || "";
    const categoryId = url.searchParams.get("category") || null;
    const scope = url.searchParams.get("scope") || "all"; // all, products, sellers, categories
    const logSearch = url.searchParams.get("log") === "true";

    // Parse price from query
    const { cleanedQuery: query, priceFilter } = parsePriceQuery(rawQuery);

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

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
      recentlyViewed: [],
      priceFilter,
    };

    // If logging a search, just log and return
    if (logSearch && query.length >= 2 && userId) {
      await serviceClient.from("search_history").insert({
        user_id: userId,
        query: query,
        category_id: categoryId,
      });
      
      await serviceClient.rpc("upsert_popular_search", {
        p_query: query,
        p_category_id: categoryId,
      });

      return new Response(JSON.stringify({ logged: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Helper: fuzzy search with pg_trgm
    const buildFuzzyQuery = async (table: string, column: string, searchTerm: string, limit: number) => {
      if (searchTerm.length < 2) return [];
      
      // First try exact ILIKE match
      let queryBuilder = serviceClient.from(table).select("*");
      
      if (table === "ai_accounts") {
        queryBuilder = queryBuilder.eq("is_available", true);
      } else if (table === "seller_products") {
        queryBuilder = queryBuilder.eq("is_available", true).eq("is_approved", true);
      } else if (table === "seller_profiles") {
        queryBuilder = queryBuilder.eq("is_verified", true).eq("is_active", true);
      } else if (table === "categories") {
        queryBuilder = queryBuilder.eq("is_active", true);
      }
      
      // Apply price filter if exists
      if (priceFilter && (table === "ai_accounts" || table === "seller_products")) {
        if (priceFilter.min !== undefined) {
          queryBuilder = queryBuilder.gte("price", priceFilter.min);
        }
        if (priceFilter.max !== undefined) {
          queryBuilder = queryBuilder.lte("price", priceFilter.max);
        }
      }
      
      const { data: exactResults } = await queryBuilder
        .ilike(column, `%${searchTerm}%`)
        .limit(limit);
      
      // If few results, try fuzzy match with synonyms
      if (!exactResults || exactResults.length < 3) {
        // Check synonyms table
        const { data: synonymData } = await serviceClient
          .from("search_synonyms")
          .select("term, synonyms")
          .or(`term.eq.${searchTerm},synonyms.cs.{${searchTerm}}`);
        
        const expandedTerms = new Set<string>([searchTerm]);
        if (synonymData) {
          for (const row of synonymData) {
            expandedTerms.add(row.term);
            (row.synonyms || []).forEach((s: string) => expandedTerms.add(s));
          }
        }
        
        // Search with expanded terms
        const allResults = new Map<string, any>();
        (exactResults || []).forEach(r => allResults.set(r.id, r));
        
        for (const term of expandedTerms) {
          if (term === searchTerm) continue;
          
          let expandedQuery = serviceClient.from(table).select("*");
          
          if (table === "ai_accounts") {
            expandedQuery = expandedQuery.eq("is_available", true);
          } else if (table === "seller_products") {
            expandedQuery = expandedQuery.eq("is_available", true).eq("is_approved", true);
          } else if (table === "seller_profiles") {
            expandedQuery = expandedQuery.eq("is_verified", true).eq("is_active", true);
          } else if (table === "categories") {
            expandedQuery = expandedQuery.eq("is_active", true);
          }
          
          if (priceFilter && (table === "ai_accounts" || table === "seller_products")) {
            if (priceFilter.min !== undefined) {
              expandedQuery = expandedQuery.gte("price", priceFilter.min);
            }
            if (priceFilter.max !== undefined) {
              expandedQuery = expandedQuery.lte("price", priceFilter.max);
            }
          }
          
          const { data } = await expandedQuery
            .ilike(column, `%${term}%`)
            .limit(limit);
          
          (data || []).forEach(r => allResults.set(r.id, r));
        }
        
        return Array.from(allResults.values()).slice(0, limit);
      }
      
      return exactResults || [];
    };

    // Fetch data based on scope
    const fetchPromises: Promise<any>[] = [];
    
    // Always fetch recent and trending (unless scope is specific)
    if (scope === "all" || query.length < 2) {
      // Recent searches
      fetchPromises.push(
        (async () => {
          if (!userId) return { type: "recent", data: [] };
          const { data } = await serviceClient
            .from("search_history")
            .select("id, query, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(5);
          return { type: "recent", data };
        })()
      );

      // Trending searches
      fetchPromises.push(
        (async () => {
          const { data } = await serviceClient
            .from("popular_searches")
            .select("id, query, search_count, is_trending")
            .order("search_count", { ascending: false })
            .limit(5);
          return { type: "trending", data };
        })()
      );

      // Recently viewed
      fetchPromises.push(
        (async () => {
          if (!userId) return { type: "recentlyViewed", data: [] };
          
          const { data: viewedData } = await serviceClient
            .from("recently_viewed")
            .select("product_id, product_type, viewed_at")
            .eq("user_id", userId)
            .order("viewed_at", { ascending: false })
            .limit(5);

          if (!viewedData || viewedData.length === 0) {
            return { type: "recentlyViewed", data: [] };
          }

          const aiIds = viewedData.filter(v => v.product_type === 'ai_account').map(v => v.product_id);
          const sellerIds = viewedData.filter(v => v.product_type !== 'ai_account').map(v => v.product_id);

          const [aiProducts, sellerProducts] = await Promise.all([
            aiIds.length > 0
              ? serviceClient
                  .from("ai_accounts")
                  .select("id, name, price, icon_url")
                  .in("id", aiIds)
                  .eq("is_available", true)
              : Promise.resolve({ data: [] }),
            sellerIds.length > 0
              ? serviceClient
                  .from("seller_products")
                  .select("id, name, price, icon_url, seller_profiles(store_name)")
                  .in("id", sellerIds)
                  .eq("is_available", true)
                  .eq("is_approved", true)
              : Promise.resolve({ data: [] }),
          ]);

          const productMap = new Map<string, any>();
          (aiProducts.data || []).forEach((p: any) => productMap.set(p.id, { ...p, source: 'ai' }));
          (sellerProducts.data || []).forEach((p: any) => productMap.set(p.id, { ...p, source: 'seller' }));

          const orderedProducts = viewedData
            .map(v => productMap.get(v.product_id))
            .filter(Boolean);

          return { type: "recentlyViewed", data: orderedProducts };
        })()
      );
    }

    // Products search
    if ((scope === "all" || scope === "products") && query.length >= 2) {
      fetchPromises.push(
        (async () => {
          const [aiData, sellerData] = await Promise.all([
            buildFuzzyQuery("ai_accounts", "name", query, 4),
            buildFuzzyQuery("seller_products", "name", query, 4),
          ]);
          return {
            type: "products",
            data: { ai: aiData, seller: sellerData },
          };
        })()
      );
    }

    // Categories search
    if ((scope === "all" || scope === "categories") && query.length >= 2) {
      fetchPromises.push(
        (async () => {
          const data = await buildFuzzyQuery("categories", "name", query, 4);
          return { type: "categories", data };
        })()
      );
    }

    // Sellers search
    if ((scope === "all" || scope === "sellers") && query.length >= 2) {
      fetchPromises.push(
        (async () => {
          const { data } = await serviceClient
            .from("seller_profiles")
            .select("id, store_name, store_logo_url, is_verified, store_slug")
            .eq("is_verified", true)
            .eq("is_active", true)
            .ilike("store_name", `%${query}%`)
            .limit(4);
          return { type: "sellers", data };
        })()
      );
    }

    const results = await Promise.all(fetchPromises);

    // Process results
    for (const result of results) {
      if (!result) continue;
      
      switch (result.type) {
        case "recent":
          if (result.data) {
            const seen = new Set<string>();
            response.recent = result.data
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
          break;
          
        case "trending":
          if (result.data) {
            response.trending = result.data.map((r: any) => ({
              type: "trending" as const,
              id: r.id,
              text: r.query,
              result_count: r.search_count,
            }));
          }
          break;
          
        case "products":
          if (result.data) {
            const aiProducts = (result.data.ai || []).map((p: any) => ({
              type: "product" as const,
              id: p.id,
              text: p.name,
              price: p.price,
              icon_url: p.icon_url,
              subtitle: "AI Account",
            }));

            const sellerProducts = (result.data.seller || []).map((p: any) => ({
              type: "product" as const,
              id: p.id,
              text: p.name,
              price: p.price,
              icon_url: p.icon_url,
              subtitle: p.seller_profiles?.store_name || "Seller Product",
            }));

            response.products = [...aiProducts, ...sellerProducts].slice(0, 6);
          }
          break;
          
        case "categories":
          if (result.data) {
            response.categories = result.data.map((c: any) => ({
              type: "category" as const,
              id: c.id,
              text: c.name,
              icon_url: c.icon,
            }));
          }
          break;
          
        case "sellers":
          if (result.data) {
            response.sellers = result.data.map((s: any) => ({
              type: "seller" as const,
              id: s.id,
              text: s.store_name,
              icon_url: s.store_logo_url,
              subtitle: s.is_verified ? "Verified Seller" : "Seller",
            }));
          }
          break;
          
        case "recentlyViewed":
          if (result.data && Array.isArray(result.data)) {
            response.recentlyViewed = result.data.map((p: any) => ({
              type: "product" as const,
              id: p.id,
              text: p.name,
              price: p.price,
              icon_url: p.icon_url,
              subtitle: p.source === 'ai' ? 'AI Account' : (p.seller_profiles?.store_name || 'Seller Product'),
            }));
          }
          break;
      }
    }

    // Extract tags from products
    if (query.length >= 2 && (scope === "all" || scope === "products")) {
      const allTags = new Set<string>();
      
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

    // Generate "Did you mean?" if few results and query looks like a typo
    if (query.length >= 3 && response.products.length < 2) {
      const { data: similarProducts } = await serviceClient
        .from("ai_accounts")
        .select("name")
        .eq("is_available", true)
        .limit(100);
      
      if (similarProducts) {
        // Simple Levenshtein-like check
        const queryLower = query.toLowerCase();
        let bestMatch = "";
        let bestScore = 0;
        
        for (const product of similarProducts) {
          const nameLower = product.name.toLowerCase();
          // Calculate similarity (simple substring overlap)
          let score = 0;
          for (let i = 0; i < queryLower.length - 1; i++) {
            if (nameLower.includes(queryLower.substring(i, i + 2))) {
              score++;
            }
          }
          if (score > bestScore && nameLower !== queryLower) {
            bestScore = score;
            bestMatch = product.name;
          }
        }
        
        if (bestScore >= queryLower.length * 0.5 && bestMatch) {
          response.didYouMean = bestMatch;
        }
      }
    }

    // Non-personalized queries (no user) can be public for Cloudflare edge caching
    const isPersonalized = !!userId;
    const cacheMaxAge = query.length < 2 ? 60 : 30;
    
    return new Response(JSON.stringify(response), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "Cache-Control": isPersonalized 
          ? `private, max-age=${cacheMaxAge}, stale-while-revalidate=120`
          : `public, max-age=${cacheMaxAge}, stale-while-revalidate=120`,
        "Vary": "Accept-Encoding, Authorization",
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return new Response(
      JSON.stringify({ error: "Search failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
