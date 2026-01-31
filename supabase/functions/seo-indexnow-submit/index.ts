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
    const { urls, actionType, adminToken } = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'URLs array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!adminToken) {
      return new Response(
        JSON.stringify({ error: 'Admin token is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Validate admin session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('admin_sessions')
      .select('id, admin_id')
      .eq('session_token', adminToken)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired admin session' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get SEO settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('seo_settings')
      .select('indexnow_key, indexnow_enabled')
      .eq('id', 'global')
      .single();

    if (settingsError || !settings || !settings.indexnow_enabled || !settings.indexnow_key) {
      return new Response(
        JSON.stringify({ error: 'IndexNow is not configured or enabled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const host = 'hero-mirror.lovable.app';
    const key = settings.indexnow_key;
    const keyLocation = `https://${host}/${key}.txt`;

    // Prepare URL list
    const urlList = urls.map((url: string) => {
      if (url.startsWith('http')) return url;
      return `https://${host}${url.startsWith('/') ? url : '/' + url}`;
    });

    console.log('Submitting to IndexNow:', { host, urlList: urlList.length });

    // Submit to IndexNow API
    const indexNowResponse = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        host,
        key,
        keyLocation,
        urlList,
      }),
    });

    const responseStatus = indexNowResponse.status;
    let responseData: any = {};
    
    try {
      responseData = await indexNowResponse.text();
    } catch (e) {
      responseData = { status: responseStatus };
    }

    console.log('IndexNow response:', responseStatus, responseData);

    // Determine success based on status code
    // IndexNow returns 200 for success, 202 for accepted
    const isSuccess = responseStatus === 200 || responseStatus === 202;

    // Log each URL submission
    const historyEntries = urlList.map((url: string) => ({
      url,
      search_engine: 'indexnow',
      action_type: actionType || 'URL_UPDATED',
      status: isSuccess ? 'success' : 'failed',
      response_data: { status: responseStatus, body: responseData },
      submitted_by: session.admin_id,
    }));

    await supabaseAdmin.from('url_indexing_history').insert(historyEntries);

    if (!isSuccess) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `IndexNow returned status ${responseStatus}`,
          details: responseData 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully submitted ${urlList.length} URL(s) to IndexNow`,
        status: responseStatus
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('IndexNow submission error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
