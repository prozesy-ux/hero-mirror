import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'No admin token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Validate admin session
    const { data: session, error: sessionError } = await adminClient
      .from('admin_sessions')
      .select('id, admin_id, expires_at, admin_credentials(username)')
      .eq('session_token', token)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired admin session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const username = (session.admin_credentials as any)?.username || 'Admin';

    console.log('Admin export started by:', username);

    // Fetch all tables in parallel batches
    const [
      // BATCH 1: User Data
      profilesRes,
      userPreferencesRes,
      userRolesRes,
      userSessionsRes,
      userWalletsRes,
      
      // BATCH 2: Transactions
      walletTransactionsRes,
      purchasesRes,
      aiAccountPurchasesRes,
    ] = await Promise.all([
      adminClient.from('profiles').select('*'),
      adminClient.from('user_preferences').select('*'),
      adminClient.from('user_roles').select('*'),
      adminClient.from('user_sessions').select('*'),
      adminClient.from('user_wallets').select('*'),
      adminClient.from('wallet_transactions').select('*'),
      adminClient.from('purchases').select('*'),
      adminClient.from('ai_account_purchases').select('*'),
    ]);

    const [
      // BATCH 3: Products
      promptsRes,
      categoriesRes,
      aiAccountsRes,
      aiToolsRes,
      
      // BATCH 4: Seller Core
      sellerProfilesRes,
      sellerProductsRes,
      sellerOrdersRes,
      sellerWalletsRes,
    ] = await Promise.all([
      adminClient.from('prompts').select('*'),
      adminClient.from('categories').select('*'),
      adminClient.from('ai_accounts').select('*'),
      adminClient.from('ai_tools').select('*'),
      adminClient.from('seller_profiles').select('*'),
      adminClient.from('seller_products').select('*'),
      adminClient.from('seller_orders').select('*'),
      adminClient.from('seller_wallets').select('*'),
    ]);

    const [
      // BATCH 5: Seller Extended
      sellerWithdrawalsRes,
      sellerChatsRes,
      sellerPaymentAccountsRes,
      sellerTrustScoresRes,
      sellerReportsRes,
      sellerNotificationsRes,
      sellerFeatureRequestsRes,
      
      // Support
      supportMessagesRes,
    ] = await Promise.all([
      adminClient.from('seller_withdrawals').select('*'),
      adminClient.from('seller_chats').select('*'),
      adminClient.from('seller_payment_accounts').select('*'),
      adminClient.from('seller_trust_scores').select('*'),
      adminClient.from('seller_reports').select('*'),
      adminClient.from('seller_notifications').select('*'),
      adminClient.from('seller_feature_requests').select('*'),
      adminClient.from('support_messages').select('*'),
    ]);

    const [
      // BATCH 6: Support & Requests
      sellerSupportMessagesRes,
      refundRequestsRes,
      cancellationRequestsRes,
      accountDeletionRequestsRes,
      
      // Platform Settings
      paymentMethodsRes,
      autoApprovalSettingsRes,
      notificationsRes,
    ] = await Promise.all([
      adminClient.from('seller_support_messages').select('*'),
      adminClient.from('refund_requests').select('*'),
      adminClient.from('cancellation_requests').select('*'),
      adminClient.from('account_deletion_requests').select('*'),
      adminClient.from('payment_methods').select('*'),
      adminClient.from('auto_approval_settings').select('*'),
      adminClient.from('notifications').select('*'),
    ]);

    const [
      // BATCH 7: Engagement & Security
      favoritesRes,
      productReviewsRes,
      securityLogsRes,
      rateLimitsRes,
    ] = await Promise.all([
      adminClient.from('favorites').select('*'),
      adminClient.from('product_reviews').select('*'),
      adminClient.from('security_logs').select('*'),
      adminClient.from('rate_limits').select('*'),
    ]);

    // Compile all data
    const exportData = {
      exportedAt: new Date().toISOString(),
      exportType: 'full_database_backup',
      exportedBy: username,
      
      users: {
        profiles: profilesRes.data || [],
        user_preferences: userPreferencesRes.data || [],
        user_roles: userRolesRes.data || [],
        user_sessions: userSessionsRes.data || [],
        user_wallets: userWalletsRes.data || [],
      },
      
      transactions: {
        wallet_transactions: walletTransactionsRes.data || [],
        purchases: purchasesRes.data || [],
        ai_account_purchases: aiAccountPurchasesRes.data || [],
      },
      
      products: {
        prompts: promptsRes.data || [],
        categories: categoriesRes.data || [],
        ai_accounts: aiAccountsRes.data || [],
        ai_tools: aiToolsRes.data || [],
      },
      
      sellers: {
        seller_profiles: sellerProfilesRes.data || [],
        seller_products: sellerProductsRes.data || [],
        seller_orders: sellerOrdersRes.data || [],
        seller_wallets: sellerWalletsRes.data || [],
        seller_withdrawals: sellerWithdrawalsRes.data || [],
        seller_chats: sellerChatsRes.data || [],
        seller_payment_accounts: sellerPaymentAccountsRes.data || [],
        seller_trust_scores: sellerTrustScoresRes.data || [],
        seller_reports: sellerReportsRes.data || [],
        seller_notifications: sellerNotificationsRes.data || [],
        seller_feature_requests: sellerFeatureRequestsRes.data || [],
      },
      
      support: {
        support_messages: supportMessagesRes.data || [],
        seller_support_messages: sellerSupportMessagesRes.data || [],
        refund_requests: refundRequestsRes.data || [],
        cancellation_requests: cancellationRequestsRes.data || [],
        account_deletion_requests: accountDeletionRequestsRes.data || [],
      },
      
      platform: {
        payment_methods: paymentMethodsRes.data || [],
        auto_approval_settings: autoApprovalSettingsRes.data || [],
        notifications: notificationsRes.data || [],
      },
      
      engagement: {
        favorites: favoritesRes.data || [],
        product_reviews: productReviewsRes.data || [],
      },
      
      security: {
        security_logs: securityLogsRes.data || [],
        rate_limits: rateLimitsRes.data || [],
      },
      
      stats: {
        totalProfiles: (profilesRes.data || []).length,
        totalTransactions: (walletTransactionsRes.data || []).length,
        totalProducts: (promptsRes.data || []).length + (sellerProductsRes.data || []).length,
        totalSellers: (sellerProfilesRes.data || []).length,
        totalOrders: (purchasesRes.data || []).length + (sellerOrdersRes.data || []).length,
      }
    };

    console.log('Export complete. Stats:', exportData.stats);

    return new Response(
      JSON.stringify(exportData, null, 2),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="database-backup-${new Date().toISOString().split('T')[0]}.json"`
        } 
      }
    );

  } catch (error) {
    console.error('Export error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Failed to export data', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
