import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get admin session token from header
    const authHeader = req.headers.get('Authorization')
    const sessionToken = authHeader?.replace('Bearer ', '')

    // Validate admin session token
    if (!sessionToken) {
      return new Response(
        JSON.stringify({ error: 'No session token provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if session exists and is valid
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('admin_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { action, table, data, options, id } = body

    let result

    switch (action) {
      case 'create_session': {
        // Create a new admin session
        const { token, expiresAt } = body
        const { data: newSession, error } = await supabaseAdmin
          .from('admin_sessions')
          .insert({
            session_token: token,
            expires_at: expiresAt
          })
          .select()
          .single()

        if (error) throw error
        result = { success: true, session: newSession }
        break
      }

      case 'select': {
        let query = supabaseAdmin.from(table).select(options?.select || '*')
        
        if (options?.order) {
          query = query.order(options.order.column, { ascending: options.order.ascending ?? true })
        }
        if (options?.limit) {
          query = query.limit(options.limit)
        }
        if (options?.eq) {
          for (const [key, value] of Object.entries(options.eq)) {
            query = query.eq(key, value)
          }
        }
        if (options?.neq) {
          for (const [key, value] of Object.entries(options.neq)) {
            query = query.neq(key, value)
          }
        }
        if (options?.gt) {
          for (const [key, value] of Object.entries(options.gt)) {
            query = query.gt(key, value)
          }
        }
        if (options?.lt) {
          for (const [key, value] of Object.entries(options.lt)) {
            query = query.lt(key, value)
          }
        }
        
        const { data: selectData, error, count } = await query
        if (error) throw error
        result = { data: selectData, count }
        break
      }

      case 'insert': {
        const { data: insertData, error } = await supabaseAdmin
          .from(table)
          .insert(data)
          .select()
        if (error) throw error
        result = { data: insertData }
        break
      }

      case 'update': {
        let query = supabaseAdmin.from(table).update(data)
        
        if (id) {
          query = query.eq('id', id)
        }
        if (options?.eq) {
          for (const [key, value] of Object.entries(options.eq)) {
            query = query.eq(key, value)
          }
        }
        
        const { data: updateData, error } = await query.select()
        if (error) throw error
        result = { data: updateData }
        break
      }

      case 'delete': {
        let query = supabaseAdmin.from(table).delete()
        
        if (id) {
          query = query.eq('id', id)
        }
        if (options?.eq) {
          for (const [key, value] of Object.entries(options.eq)) {
            query = query.eq(key, value)
          }
        }
        if (options?.lt) {
          for (const [key, value] of Object.entries(options.lt)) {
            query = query.lt(key, value)
          }
        }
        
        const { error } = await query
        if (error) throw error
        result = { success: true }
        break
      }

      case 'count': {
        const { count, error } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true })
        if (error) throw error
        result = { count }
        break
      }

      case 'rpc': {
        const { functionName, args } = body
        const { data: rpcData, error } = await supabaseAdmin.rpc(functionName, args)
        if (error) throw error
        result = { data: rpcData }
        break
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Admin API error:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
