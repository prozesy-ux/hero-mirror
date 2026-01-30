import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-store',
};

const APP_VERSION = '1.0.3';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const start = Date.now();
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check DB connectivity with simple query
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
    
    const dbLatency = Date.now() - start;
    
    if (error) throw error;

    // Check materialized views exist
    const { data: mvCheck, error: mvError } = await supabase
      .from('mv_category_counts')
      .select('id')
      .limit(1);
    
    const mvStatus = mvError ? 'missing' : 'ready';

    const response = {
      status: 'healthy',
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          connected: true,
          latency: dbLatency,
        },
        materializedViews: {
          status: mvStatus,
        },
      },
      uptime: Deno.memoryUsage ? {
        heapUsed: Math.round(Deno.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(Deno.memoryUsage().heapTotal / 1024 / 1024),
      } : undefined,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[HealthCheck] Error:', errorMessage);
    
    return new Response(
      JSON.stringify({
        status: 'degraded',
        version: APP_VERSION,
        timestamp: new Date().toISOString(),
        error: errorMessage,
        latency: Date.now() - start,
      }),
      { 
        status: 503, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
