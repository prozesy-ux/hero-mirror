import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to get user id
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Use service role client for fetching all data
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all user data from various tables
    const [
      profileResult,
      preferencesResult,
      purchasesResult,
      favoritesResult,
      walletResult,
      transactionsResult,
      aiAccountPurchasesResult,
      refundRequestsResult,
      cancellationRequestsResult,
      supportMessagesResult
    ] = await Promise.all([
      adminClient.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
      adminClient.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
      adminClient.from('purchases').select('*').eq('user_id', userId),
      adminClient.from('favorites').select('*, prompts(*)').eq('user_id', userId),
      adminClient.from('user_wallets').select('*').eq('user_id', userId).maybeSingle(),
      adminClient.from('wallet_transactions').select('*').eq('user_id', userId),
      adminClient.from('ai_account_purchases').select('*').eq('user_id', userId),
      adminClient.from('refund_requests').select('*').eq('user_id', userId),
      adminClient.from('cancellation_requests').select('*').eq('user_id', userId),
      adminClient.from('support_messages').select('*').eq('user_id', userId)
    ]);

    // Compile all data
    const userData = {
      exportedAt: new Date().toISOString(),
      account: {
        email: user.email,
        createdAt: user.created_at,
        lastSignIn: user.last_sign_in_at
      },
      profile: profileResult.data,
      preferences: preferencesResult.data,
      wallet: walletResult.data,
      transactions: transactionsResult.data || [],
      purchases: purchasesResult.data || [],
      aiAccountPurchases: aiAccountPurchasesResult.data || [],
      favorites: favoritesResult.data || [],
      refundRequests: refundRequestsResult.data || [],
      cancellationRequests: cancellationRequestsResult.data || [],
      supportMessages: supportMessagesResult.data || []
    };

    return new Response(
      JSON.stringify(userData, null, 2),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="my-data.json"'
        } 
      }
    );

  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to export data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});