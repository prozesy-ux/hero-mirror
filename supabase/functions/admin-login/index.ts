import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('x-real-ip') 
      || req.headers.get('cf-connecting-ip')
      || 'unknown';

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check rate limit
    const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc('check_admin_rate_limit', {
      p_ip_address: clientIp
    });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      // Continue anyway to not block login if rate limit check fails
    } else if (rateLimitCheck?.blocked) {
      const blockedUntil = new Date(rateLimitCheck.blocked_until);
      const waitMinutes = Math.ceil((blockedUntil.getTime() - Date.now()) / 60000);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Too many failed attempts. Please try again in ${waitMinutes} minute(s).`,
          blocked: true,
          blocked_until: rateLimitCheck.blocked_until
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { username, password } = await req.json()

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username and password required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify credentials using pgcrypto
    const { data: admin, error } = await supabase
      .from('admin_credentials')
      .select('id, username')
      .eq('username', username)
      .single()

    if (error || !admin) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify password using raw SQL with pgcrypto
    const { data: passwordMatch, error: passwordError } = await supabase.rpc('verify_admin_password', {
      p_username: username,
      p_password: password
    })

    if (passwordError || !passwordMatch) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Login successful - reset rate limit
    await supabase.rpc('reset_admin_rate_limit', { p_ip_address: clientIp });

    // Generate session token
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store session in admin_sessions table
    const { error: sessionError } = await supabase
      .from('admin_sessions')
      .insert({
        admin_id: admin.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString()
      })

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        token: sessionToken,
        username: admin.username,
        expiresAt: expiresAt.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Admin login error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})