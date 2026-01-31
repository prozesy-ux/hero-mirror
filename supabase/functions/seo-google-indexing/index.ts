import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Base64 URL encoding without padding
function base64urlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Create JWT for Google API authentication
async function createJWT(email: string, privateKeyPEM: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encoder = new TextEncoder();
  const headerB64 = base64urlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64urlEncode(encoder.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  // Import the private key - handle various formats
  // First, handle escaped newlines from JSON storage
  let cleanedKey = privateKeyPEM
    .replace(/\\n/g, '\n')  // Convert escaped newlines to actual newlines
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/[\r\n\s]/g, '');  // Remove all whitespace including newlines
  
  // Validate base64 characters
  if (!/^[A-Za-z0-9+/=]+$/.test(cleanedKey)) {
    throw new Error('Invalid private key format - contains non-base64 characters');
  }
  
  const binaryKey = Uint8Array.from(atob(cleanedKey), c => c.charCodeAt(0));
  
  const key = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(signingInput)
  );

  const signatureB64 = base64urlEncode(new Uint8Array(signature));
  
  return `${signingInput}.${signatureB64}`;
}

// Exchange JWT for access token
async function getAccessToken(jwt: string): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Submit URL to Google Indexing API
async function submitToGoogle(url: string, type: string, accessToken: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const response = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      url,
      type: type === 'URL_DELETED' ? 'URL_DELETED' : 'URL_UPDATED',
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { success: false, error: data.error?.message || 'Unknown error', data };
  }

  return { success: true, data };
}

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
      .select('google_indexing_enabled, google_service_account_email, google_service_account_key')
      .eq('id', 'global')
      .single();

    if (settingsError || !settings || !settings.google_indexing_enabled) {
      return new Response(
        JSON.stringify({ error: 'Google Indexing is not configured or enabled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { google_service_account_email, google_service_account_key } = settings;

    if (!google_service_account_email || !google_service_account_key) {
      return new Response(
        JSON.stringify({ error: 'Google service account credentials not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating JWT for Google Indexing API...');
    
    // Create JWT and get access token
    const jwt = await createJWT(google_service_account_email, google_service_account_key);
    const accessToken = await getAccessToken(jwt);

    console.log('Access token obtained, submitting URLs...');

    const host = 'hero-mirror.lovable.app';
    const results: { url: string; success: boolean; data?: any; error?: string }[] = [];

    // Submit each URL
    for (const url of urls) {
      const fullUrl = url.startsWith('http') ? url : `https://${host}${url.startsWith('/') ? url : '/' + url}`;
      
      try {
        const result = await submitToGoogle(fullUrl, actionType || 'URL_UPDATED', accessToken);
        results.push({ url: fullUrl, ...result });
        
        // Log to history
        await supabaseAdmin.from('url_indexing_history').insert({
          url: fullUrl,
          search_engine: 'google',
          action_type: actionType || 'URL_UPDATED',
          status: result.success ? 'success' : 'failed',
          response_data: result.data || { error: result.error },
          submitted_by: session.admin_id,
        });
      } catch (e) {
        console.error('Error submitting URL:', fullUrl, e);
        results.push({ url: fullUrl, success: false, error: String(e) });
        
        await supabaseAdmin.from('url_indexing_history').insert({
          url: fullUrl,
          search_engine: 'google',
          action_type: actionType || 'URL_UPDATED',
          status: 'failed',
          response_data: { error: String(e) },
          submitted_by: session.admin_id,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.length - successCount;

    return new Response(
      JSON.stringify({ 
        success: successCount > 0,
        message: `Submitted ${successCount} URL(s) successfully, ${failedCount} failed`,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Google Indexing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
