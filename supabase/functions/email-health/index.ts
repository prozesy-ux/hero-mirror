import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthCheckResponse {
  healthy: boolean;
  config: {
    resend_api_key: boolean;
    from_address: string | null;
  };
  api_reachable: boolean;
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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromAddress = Deno.env.get("EMAIL_FROM_ADDRESS");

    const response: HealthCheckResponse = {
      healthy: false,
      config: {
        resend_api_key: !!resendApiKey,
        from_address: fromAddress || "onboarding@resend.dev (default)",
      },
      api_reachable: false,
    };

    // Check required configuration
    if (!resendApiKey) {
      response.error = "Missing RESEND_API_KEY secret. Please add it in Lovable Cloud.";
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Try to reach Resend API (just check auth, don't send anything)
    try {
      const healthCheck = await fetch("https://api.resend.com/domains", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
        },
      });
      
      // 200 = valid key, 401 = invalid key
      if (healthCheck.status === 200) {
        response.api_reachable = true;
      } else if (healthCheck.status === 401) {
        response.api_reachable = false;
        response.error = "Invalid RESEND_API_KEY. Please check your API key.";
      } else {
        response.api_reachable = true; // API is reachable but might have other issues
        response.error = `Resend API returned status ${healthCheck.status}`;
      }
    } catch (fetchError: any) {
      response.api_reachable = false;
      response.error = `Cannot reach Resend API: ${fetchError.message}`;
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
    response.healthy = response.config.resend_api_key && 
                       response.api_reachable &&
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
        config: { resend_api_key: false, from_address: null },
        api_reachable: false,
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
