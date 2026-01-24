import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthCheckResponse {
  healthy: boolean;
  config: {
    worker_url: boolean;
    email_secret: boolean;
    from_address: string | null;
  };
  worker_reachable: boolean;
  settings?: {
    email_enabled: boolean;
    order_emails_enabled: boolean;
    wallet_emails_enabled: boolean;
    marketing_emails_enabled: boolean;
    security_emails_enabled: boolean;
  };
  error?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const workerUrl = Deno.env.get("CLOUDFLARE_EMAIL_WORKER_URL");
    const emailSecret = Deno.env.get("CLOUDFLARE_EMAIL_SECRET");
    const fromAddress = Deno.env.get("EMAIL_FROM_ADDRESS");

    const response: HealthCheckResponse = {
      healthy: false,
      config: {
        worker_url: !!workerUrl,
        email_secret: !!emailSecret,
        from_address: fromAddress || null,
      },
      worker_reachable: false,
    };

    // Check required configuration
    if (!workerUrl || !emailSecret) {
      response.error = "Missing required configuration: CLOUDFLARE_EMAIL_WORKER_URL or CLOUDFLARE_EMAIL_SECRET";
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Try to reach the Cloudflare Worker
    try {
      const healthCheck = await fetch(workerUrl, {
        method: "GET",
        headers: {
          "X-Email-Secret": emailSecret,
        },
      });
      
      // Consider it reachable if we get any response (even 4xx/5xx means the worker is running)
      response.worker_reachable = true;
      
      // Only mark as unhealthy if we can't connect at all
      if (healthCheck.status >= 500) {
        response.error = `Worker returned status ${healthCheck.status}`;
      }
    } catch (fetchError: any) {
      response.worker_reachable = false;
      response.error = `Cannot reach Cloudflare Worker: ${fetchError.message}`;
    }

    // Fetch email settings from database
    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const { data: settings } = await supabaseAdmin
        .from('email_settings')
        .select('*')
        .eq('id', 'global')
        .single();

      if (settings) {
        response.settings = {
          email_enabled: settings.email_enabled,
          order_emails_enabled: settings.order_emails_enabled,
          wallet_emails_enabled: settings.wallet_emails_enabled,
          marketing_emails_enabled: settings.marketing_emails_enabled,
          security_emails_enabled: settings.security_emails_enabled,
        };
      }
    } catch (dbError) {
      console.error("Failed to fetch email settings:", dbError);
    }

    // Overall health check
    response.healthy = response.config.worker_url && 
                       response.config.email_secret && 
                       response.worker_reachable &&
                       !response.error;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Health check error:", error);
    return new Response(
      JSON.stringify({
        healthy: false,
        config: { worker_url: false, email_secret: false, from_address: null },
        worker_reachable: false,
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});