/**
 * BFF API: Buyer Dashboard Data
 * Server-side validated endpoint for buyer dashboard core data
 * Optimized for fast first-load with cache headers
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { 
  verifyAuth, 
  createServiceClient, 
  corsHeaders, 
  errorResponse 
} from '../_shared/auth-verify.ts';

// Enhanced response with cache headers for performance
const cachedSuccessResponse = (data: unknown, cacheSeconds = 30) => {
  return new Response(JSON.stringify(data), {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': `private, max-age=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 2}`,
    },
    status: 200,
  });
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Verify authentication server-side
    const authHeader = req.headers.get('Authorization');
    const authResult = await verifyAuth(authHeader);

    if (!authResult.success || !authResult.userId) {
      console.log('[BFF-BuyerDashboard] Auth failed:', authResult.error);
      return errorResponse(authResult.error || 'Unauthorized', 401);
    }

    const userId = authResult.userId;
    console.log('[BFF-BuyerDashboard] Authenticated user:', userId);

    // 2. Create service client for trusted queries
    const supabase = createServiceClient();

    // 3. Fetch all buyer data in parallel
    const [
      walletResult, 
      profileResult,
      purchasesResult,
      sellerOrdersResult,
      favoritesResult,
      wishlistResult
    ] = await Promise.all([
      // Wallet
      supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', userId)
        .single(),
      
      // Profile
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single(),
      
      // AI Account purchases
      supabase
        .from('ai_account_purchases')
        .select(`
          *,
          ai_account:ai_accounts(name, icon_url, category)
        `)
        .eq('user_id', userId)
        .order('purchased_at', { ascending: false })
        .limit(50),
      
      // Seller product orders - fetch all for accurate stats
      supabase
        .from('seller_orders')
        .select(`
          *,
          product:seller_products(id, name, icon_url, description),
          seller:seller_profiles!seller_orders_seller_id_fkey(id, store_name, store_logo_url)
        `)
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false }),
      
      // Favorites (prompts)
      supabase
        .from('favorites')
        .select('prompt_id')
        .eq('user_id', userId),

      // Wishlist count
      supabase
        .from('buyer_wishlist')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
    ]);

    // Create wallet if not exists
    let wallet = walletResult.data;
    if (walletResult.error && walletResult.error.code === 'PGRST116') {
      const { data: newWallet } = await supabase
        .from('user_wallets')
        .insert({ user_id: userId, balance: 0 })
        .select('balance')
        .single();
      wallet = newWallet;
    }

    // Calculate order stats from all orders
    const allOrders = sellerOrdersResult.data || [];
    const orderStats = {
      total: allOrders.length,
      pending: allOrders.filter((o: any) => o.status === 'pending').length,
      delivered: allOrders.filter((o: any) => o.status === 'delivered').length,
      completed: allOrders.filter((o: any) => o.status === 'completed').length,
      cancelled: allOrders.filter((o: any) => o.status === 'cancelled').length,
      totalSpent: allOrders.reduce((sum: number, o: any) => sum + (o.amount || 0), 0)
    };

    // 4. Return clean response with cache headers
    return cachedSuccessResponse({
      profile: profileResult.data || null,
      wallet: wallet || { balance: 0 },
      purchases: purchasesResult.data || [],
      sellerOrders: allOrders,
      favorites: (favoritesResult.data || []).map((f: any) => f.prompt_id),
      wishlistCount: wishlistResult.count || 0,
      orderStats,
      _meta: {
        fetchedAt: new Date().toISOString(),
        userId
      }
    }, 30); // Cache for 30 seconds

  } catch (error) {
    console.error('[BFF-BuyerDashboard] Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
});
