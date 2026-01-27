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
      favoritesResult,
      wishlistItemsResult
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
          product:seller_products(id, name, icon_url, description, category_id),
          seller:seller_profiles!seller_orders_seller_id_fkey(id, store_name, store_logo_url, store_slug)
        `)
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false }),
      
      // Favorites (prompts)
      supabase
        .from('favorites')
        .select('prompt_id')
        .eq('user_id', userId),

      // Wishlist items with full product details
      supabase
        .from('buyer_wishlist')
        .select('id, product_id, product_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    ]);

    // Fetch product details for wishlist items
    const wishlistItems = wishlistItemsResult.data || [];
    const wishlistWithProducts: any[] = [];
    
    if (wishlistItems.length > 0) {
      const sellerProductIds = wishlistItems
        .filter((item: any) => item.product_type === 'seller')
        .map((item: any) => item.product_id);
      
      if (sellerProductIds.length > 0) {
        const { data: products } = await supabase
          .from('seller_products')
          .select('id, name, price, icon_url, is_available, seller:seller_profiles(store_name, store_slug)')
          .in('id', sellerProductIds);
        
        const productMap = new Map((products || []).map((p: any) => [p.id, p]));
        
        for (const item of wishlistItems) {
          wishlistWithProducts.push({
            ...item,
            product: productMap.get(item.product_id) || null
          });
        }
      } else {
        wishlistWithProducts.push(...wishlistItems);
      }
    }

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

    // 4. Return clean response
    return successResponse({
      profile: profileResult.data || null,
      wallet: wallet || { balance: 0 },
      purchases: purchasesResult.data || [],
      sellerOrders: allOrders,
      favorites: (favoritesResult.data || []).map((f: any) => f.prompt_id),
      wishlist: wishlistWithProducts,
      wishlistCount: wishlistWithProducts.length,
      orderStats,
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
