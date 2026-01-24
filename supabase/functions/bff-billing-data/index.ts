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

    // Fetch all billing data in parallel
    const [
      walletResult,
      transactionsResult,
      purchasesResult,
      refundRequestsResult,
      cancellationResult,
      paymentMethodsResult,
      profileResult
    ] = await Promise.all([
      // User wallet
      supabase
        .from("user_wallets")
        .select("balance, updated_at")
        .eq("user_id", userId)
        .single(),

      // Wallet transactions
      supabase
        .from("wallet_transactions")
        .select("id, type, amount, status, description, created_at, payment_method, transaction_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),

      // Pro plan purchases
      supabase
        .from("purchases")
        .select("id, amount, payment_status, purchased_at, payment_intent_id")
        .eq("user_id", userId)
        .order("purchased_at", { ascending: false }),

      // Refund requests
      supabase
        .from("refund_requests")
        .select("id, amount, reason, status, created_at, processed_at, admin_notes, purchase_type")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),

      // Cancellation request
      supabase
        .from("cancellation_requests")
        .select("id, reason, status, created_at, processed_at, admin_notes")
        .eq("user_id", userId)
        .eq("status", "pending")
        .single(),

      // Available payment methods
      supabase
        .from("payment_methods")
        .select(`
          id, 
          name, 
          code, 
          icon_url, 
          is_enabled, 
          is_automatic,
          currency_code,
          exchange_rate,
          instructions,
          account_number,
          account_name,
          qr_image_url,
          min_withdrawal,
          max_withdrawal
        `)
        .eq("is_enabled", true)
        .order("display_order", { ascending: true }),

      // User profile for Pro status
      supabase
        .from("profiles")
        .select("is_pro, email")
        .eq("user_id", userId)
        .single()
    ]);

    // Create wallet if doesn't exist
    let wallet = walletResult.data || { balance: 0, updated_at: null };
    if (!walletResult.data) {
      const { data: newWallet } = await supabase
        .from("user_wallets")
        .insert({ user_id: userId, balance: 0 })
        .select()
        .single();
      wallet = newWallet || { balance: 0, updated_at: new Date().toISOString() };
    }

    return successResponse({
      wallet: {
        balance: wallet.balance,
        updatedAt: wallet.updated_at
      },
      transactions: transactionsResult.data || [],
      purchases: purchasesResult.data || [],
      refundRequests: refundRequestsResult.data || [],
      cancellationRequest: cancellationResult.data || null,
      paymentMethods: paymentMethodsResult.data || [],
      profile: {
        isPro: profileResult.data?.is_pro || false,
        email: profileResult.data?.email || ""
      },
      _meta: {
        fetchedAt: new Date().toISOString(),
        userId,
        totalTransactions: transactionsResult.data?.length || 0
      }
    });

  } catch (error) {
    console.error("[bff-billing-data] Error:", error);
    return errorResponse("Internal server error", 500);
  }
});
