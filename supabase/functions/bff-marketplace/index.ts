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

    // Fetch all marketplace data in parallel
    const [
      aiAccountsResult,
      sellerProductsResult,
      categoriesResult,
      walletResult,
      purchasesResult,
      sellerOrdersResult
    ] = await Promise.all([
      // AI Accounts
      supabase
        .from("ai_accounts")
        .select(`
          id,
          name,
          description,
          price,
          original_price,
          icon_url,
          category,
          category_id,
          tags,
          stock,
          sold_count,
          is_available,
          is_featured,
          is_trending,
          chat_allowed,
          categories (
            id,
            name,
            icon,
            color
          )
        `)
        .eq("is_available", true)
        .order("display_order", { ascending: true }),

      // Seller Products (approved and available)
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
          seller_profiles (
            id,
            store_name,
            store_logo_url,
            store_slug,
            is_verified
          )
        `)
        .eq("is_approved", true)
        .eq("is_available", true)
        .order("created_at", { ascending: false }),

      // Dynamic categories
      supabase
        .from("categories")
        .select("id, name, icon, color, description, category_type")
        .eq("is_active", true)
        .order("display_order", { ascending: true }),

      // User wallet balance
      supabase
        .from("user_wallets")
        .select("balance")
        .eq("user_id", userId)
        .single(),

      // User's AI account purchases
      supabase
        .from("ai_account_purchases")
        .select(`
          id,
          ai_account_id,
          amount,
          payment_status,
          delivery_status,
          account_credentials,
          purchased_at,
          delivered_at,
          ai_accounts (
            id,
            name,
            icon_url,
            category
          )
        `)
        .eq("user_id", userId)
        .order("purchased_at", { ascending: false }),

      // User's seller orders
      supabase
        .from("seller_orders")
        .select(`
          id,
          product_id,
          amount,
          status,
          credentials,
          buyer_approved,
          created_at,
          delivered_at,
          seller_products (
            id,
            name,
            images,
            icon_url
          ),
          seller_profiles (
            id,
            store_name,
            store_logo_url
          )
        `)
        .eq("buyer_id", userId)
        .order("created_at", { ascending: false })
    ]);

    // Create wallet if doesn't exist
    let walletBalance = walletResult.data?.balance || 0;
    if (!walletResult.data) {
      await supabase
        .from("user_wallets")
        .insert({ user_id: userId, balance: 0 });
    }

    // Separate categories by type
    const allCategories = categoriesResult.data || [];
    const aiCategories = allCategories.filter(c => c.category_type === "ai_account" || !c.category_type);
    const productCategories = allCategories.filter(c => c.category_type === "product" || !c.category_type);

    return successResponse({
      aiAccounts: aiAccountsResult.data || [],
      sellerProducts: sellerProductsResult.data || [],
      categories: {
        all: allCategories,
        aiAccounts: aiCategories,
        products: productCategories
      },
      wallet: {
        balance: walletBalance
      },
      purchases: {
        aiAccounts: purchasesResult.data || [],
        sellerOrders: sellerOrdersResult.data || []
      },
      _meta: {
        fetchedAt: new Date().toISOString(),
        userId,
        totalAiAccounts: aiAccountsResult.data?.length || 0,
        totalProducts: sellerProductsResult.data?.length || 0
      }
    });

  } catch (error) {
    console.error("[bff-marketplace] Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
