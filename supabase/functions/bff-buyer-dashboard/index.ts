/**
 * BFF API: Buyer Dashboard Data
 * Server-side validated endpoint for buyer dashboard core data
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { 
  verifyAuth, 
  createServiceClient, 
  corsHeaders, 
  errorResponse, 
  successResponse 
} from '../_shared/auth-verify.ts';

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
      favoritesResult
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
      
      // Seller product orders
      supabase
        .from('seller_orders')
        .select(`
          *,
          product:seller_products(name, icon_url, seller_id),
          seller:seller_profiles!seller_orders_seller_id_fkey(store_name, store_logo_url)
        `)
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      
      // Favorites
      supabase
        .from('favorites')
        .select('prompt_id')
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

    // 4. Return clean response
    return successResponse({
      profile: profileResult.data || null,
      wallet: wallet || { balance: 0 },
      purchases: purchasesResult.data || [],
      sellerOrders: sellerOrdersResult.data || [],
      favorites: (favoritesResult.data || []).map(f => f.prompt_id),
      _meta: {
        fetchedAt: new Date().toISOString(),
        userId
      }
    });

  } catch (error) {
    console.error('[BFF-BuyerDashboard] Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
});
