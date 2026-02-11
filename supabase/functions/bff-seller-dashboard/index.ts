/**
 * BFF API: Seller Dashboard Data
 * Server-side validated endpoint for seller dashboard data
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
const cachedSuccessResponse = (data: unknown, cacheSeconds = 60) => {
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
      console.log('[BFF-Seller] Auth failed:', authResult.error);
      return errorResponse(authResult.error || 'Unauthorized', 401);
    }

    const userId = authResult.userId;
    console.log('[BFF-Seller] Authenticated user:', userId);

    // 2. Create service client for trusted queries
    const supabase = createServiceClient();

    // 3. Fetch seller profile
    const { data: profile, error: profileError } = await supabase
      .from('seller_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.log('[BFF-Seller] No seller profile found for user:', userId);
      return errorResponse('Seller profile not found', 404);
    }

    // Get seller's country for withdrawal methods
    const sellerCountry = profile.country || 'GLOBAL';

    const sellerId = profile.id;

    // 4. Fetch all seller data in parallel
    const [walletResult, productsResult, ordersResult, withdrawalsResult, withdrawalConfigResult, sellerLevelResult, allLevelsResult] = await Promise.all([
      // Wallet
      supabase
        .from('seller_wallets')
        .select('*')
        .eq('seller_id', sellerId)
        .single(),
      
      // Products
      supabase
        .from('seller_products')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false }),
      
      // Orders with product info
      supabase
        .from('seller_orders')
        .select(`
          *,
          product:seller_products(name, icon_url, delivery_type)
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false }),
      
      // Withdrawals
      supabase
        .from('seller_withdrawals')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false }),
      
      // Withdrawal methods from admin config (for seller's country + GLOBAL)
      supabase
        .from('withdrawal_method_config')
        .select('*')
        .in('country_code', [sellerCountry, 'GLOBAL'])
        .eq('is_enabled', true)
        .order('account_type, method_name'),
      
      // Seller's current level (if level_id exists)
      profile.level_id ? supabase
        .from('seller_levels')
        .select('*')
        .eq('id', profile.level_id)
        .single() : Promise.resolve({ data: null, error: null }),
      
      // All levels for progression display
      supabase
        .from('seller_levels')
        .select('*')
        .order('display_order', { ascending: true })
    ]);

    // 5. Fetch buyer info for orders (batch to avoid N+1)
    let ordersWithBuyers = ordersResult.data || [];
    if (ordersResult.data && ordersResult.data.length > 0) {
      const buyerIds = [...new Set(ordersResult.data.map(o => o.buyer_id))];
      
      const { data: buyers } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', buyerIds);

      const buyerMap = new Map(buyers?.map(b => [b.user_id, b]) || []);
      
      ordersWithBuyers = ordersResult.data.map(order => ({
        ...order,
        buyer: buyerMap.get(order.buyer_id) || null
      }));
    }

    // Attach level to profile
    const profileWithLevel = {
      ...profile,
      level: sellerLevelResult.data || null
    };

    // 6. Return clean response with cache headers
    return cachedSuccessResponse({
      profile: profileWithLevel,
      wallet: walletResult.data || null,
      products: productsResult.data || [],
      orders: ordersWithBuyers,
      withdrawals: withdrawalsResult.data || [],
      withdrawalMethods: withdrawalConfigResult.data || [],
      sellerLevels: allLevelsResult.data || [],
      sellerCountry,
      _meta: {
        fetchedAt: new Date().toISOString(),
        userId,
        sellerId
      }
    }, 60); // Cache for 60 seconds

  } catch (error) {
    console.error('[BFF-Seller] Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
});
