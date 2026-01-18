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
    const { token, table, operation, data, id, filters } = await req.json();

    console.log(`Admin mutation request: ${operation} on ${table}`);

    if (!token || !table || !operation) {
      return new Response(
        JSON.stringify({ error: 'Token, table, and operation are required' }),
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
      console.error('Session validation failed:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin session validated:', session.admin_id);

    // Whitelist of allowed tables for admin mutations
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
      'notifications',
      'seller_profiles',
      'seller_products',
      'seller_withdrawals',
      'seller_feature_requests',
      'auto_approval_settings'
    ];

    if (!allowedTables.includes(table)) {
      return new Response(
        JSON.stringify({ error: `Access to table '${table}' is not allowed` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Allowed operations
    const allowedOperations = ['insert', 'update', 'delete'];
    if (!allowedOperations.includes(operation)) {
      return new Response(
        JSON.stringify({ error: `Operation '${operation}' is not allowed` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;
    let error;

    switch (operation) {
      case 'insert':
        if (!data) {
          return new Response(
            JSON.stringify({ error: 'Data is required for insert' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.log('Inserting data:', data);
        ({ data: result, error } = await supabaseAdmin.from(table).insert(data).select());
        break;

      case 'update':
        if (!data || !id) {
          return new Response(
            JSON.stringify({ error: 'Data and id are required for update' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.log('Updating id:', id, 'with data:', data);
        ({ data: result, error } = await supabaseAdmin.from(table).update(data).eq('id', id).select());
        break;

      case 'delete':
        if (!id && !filters) {
          return new Response(
            JSON.stringify({ error: 'Either id or filters are required for delete' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (id) {
          console.log('Deleting id:', id);
          ({ error } = await supabaseAdmin.from(table).delete().eq('id', id));
        } else if (filters && Array.isArray(filters)) {
          let query: any = supabaseAdmin.from(table).delete();
          for (const filter of filters) {
            if (filter.column && filter.value !== undefined) {
              const op = filter.operator || 'eq';
              if (typeof query[op] === 'function') {
                query = query[op](filter.column, filter.value);
              }
            }
          }
          ({ error } = await query);
        }
        result = { deleted: true };
        break;
    }

    if (error) {
      console.error('Mutation error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Mutation successful:', result);

    return new Response(
      JSON.stringify({ success: true, data: result }),
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
