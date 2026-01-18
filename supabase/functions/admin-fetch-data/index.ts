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
    const { token, table, select, order, filters, limit } = await req.json();

    if (!token || !table) {
      return new Response(
        JSON.stringify({ error: 'Token and table are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Validate admin session token
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('admin_sessions')
      .select('id, expires_at, admin_id')
      .eq('session_token', token)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Whitelist of allowed tables for admin access
    const allowedTables = [
      'profiles',
      'purchases',
      'user_wallets',
      'wallet_transactions',
      'prompts',
      'categories',
      'ai_accounts',
      'ai_account_purchases',
      'refund_requests',
      'cancellation_requests',
      'account_deletion_requests',
      'support_messages',
      'payment_methods',
      'favorites',
      'user_roles',
      'user_preferences',
      'user_sessions',
      'seller_profiles',
      'seller_support_messages',
      'seller_chat_attachments',
      'seller_notifications',
      'seller_orders',
      'seller_products',
      'seller_wallets',
      'seller_withdrawals',
      'seller_chats',
      'seller_reports',
      'seller_trust_scores',
      'chat_join_requests',
      'seller_feature_requests',
      'auto_approval_settings'
    ];

    if (!allowedTables.includes(table)) {
      return new Response(
        JSON.stringify({ error: `Access to table '${table}' is not allowed` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query - use any to avoid deep type instantiation
    let query: any = supabaseAdmin.from(table).select(select || '*');

    // Apply filters if provided
    if (filters && Array.isArray(filters)) {
      for (const filter of filters) {
        if (filter.column && filter.value !== undefined) {
          const op = filter.operator || 'eq';
          if (typeof query[op] === 'function') {
            query = query[op](filter.column, filter.value);
          }
        }
      }
    }

    // Apply ordering
    if (order) {
      query = query.order(order.column || 'created_at', { ascending: order.ascending ?? false });
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Query error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
