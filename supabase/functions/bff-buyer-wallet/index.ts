/**
 * BFF API: Buyer Wallet Data
 * Server-side validated endpoint for buyer wallet and withdrawals
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
      console.log('[BFF-BuyerWallet] Auth failed:', authResult.error);
      return errorResponse(authResult.error || 'Unauthorized', 401);
    }

    const userId = authResult.userId;
    console.log('[BFF-BuyerWallet] Authenticated user:', userId);

    // 2. Create service client for trusted queries
    const supabase = createServiceClient();

    // 3. Fetch wallet and withdrawals in parallel
    const [walletResult, withdrawalsResult, paymentMethodsResult] = await Promise.all([
      // Wallet
      supabase
        .from('user_wallets')
        .select('balance, updated_at')
        .eq('user_id', userId)
        .single(),
      
      // Withdrawals
      supabase
        .from('buyer_withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      
      // Payment methods (for withdrawal options)
      supabase
        .from('payment_methods')
        .select('id, name, code, currency_code, exchange_rate, min_withdrawal, max_withdrawal, withdrawal_enabled')
        .eq('is_enabled', true)
        .eq('withdrawal_enabled', true)
        .order('name')
    ]);

    // Create wallet if not exists
    let wallet = walletResult.data;
    if (walletResult.error && walletResult.error.code === 'PGRST116') {
      const { data: newWallet } = await supabase
        .from('user_wallets')
        .insert({ user_id: userId, balance: 0 })
        .select('balance, updated_at')
        .single();
      wallet = newWallet;
    }

    // 4. Return clean response
    return successResponse({
      wallet: wallet || { balance: 0 },
      withdrawals: withdrawalsResult.data || [],
      paymentMethods: paymentMethodsResult.data || [],
      _meta: {
        fetchedAt: new Date().toISOString(),
        userId
      }
    });

  } catch (error) {
    console.error('[BFF-BuyerWallet] Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
});
