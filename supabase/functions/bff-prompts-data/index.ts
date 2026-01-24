import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  verifyAuth, 
  createServiceClient, 
  corsHeaders, 
  errorResponse, 
  successResponse 
} from "../_shared/auth-verify.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authResult = await verifyAuth(req.headers.get("Authorization"));
    if (!authResult.success || !authResult.userId) {
      return errorResponse(authResult.error || "Unauthorized", 401);
    }

    const userId = authResult.userId;
    const supabase = createServiceClient();

    // Fetch all prompts data in parallel
    const [
      promptsResult,
      categoriesResult,
      favoritesResult,
      profileResult
    ] = await Promise.all([
      // All prompts with category info
      supabase
        .from("prompts")
        .select(`
          id,
          title,
          content,
          description,
          image_url,
          tool,
          is_free,
          is_featured,
          is_trending,
          category_id,
          categories (
            id,
            name,
            icon,
            color
          )
        `)
        .order("created_at", { ascending: false }),

      // All prompt categories
      supabase
        .from("categories")
        .select("id, name, icon, color, description")
        .eq("category_type", "prompt")
        .eq("is_active", true)
        .order("display_order", { ascending: true }),

      // User's favorites
      supabase
        .from("favorites")
        .select("prompt_id")
        .eq("user_id", userId),

      // User profile for isPro check
      supabase
        .from("profiles")
        .select("is_pro")
        .eq("user_id", userId)
        .single()
    ]);

    // Extract favorite IDs
    const favoriteIds = favoritesResult.data?.map(f => f.prompt_id) || [];
    const isPro = profileResult.data?.is_pro || false;

    // Separate featured/trending prompts
    const allPrompts = promptsResult.data || [];
    const featuredPrompts = allPrompts.filter(p => p.is_featured);
    const trendingPrompts = allPrompts.filter(p => p.is_trending);

    return successResponse({
      prompts: allPrompts,
      featuredPrompts,
      trendingPrompts,
      categories: categoriesResult.data || [],
      favorites: favoriteIds,
      isPro,
      _meta: {
        fetchedAt: new Date().toISOString(),
        userId,
        totalPrompts: allPrompts.length
      }
    });

  } catch (error) {
    console.error("[bff-prompts-data] Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
