import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    // Check if all required config is present
    if (!workerUrl || !emailSecret) {
      response.error = "Missing required configuration";
      return new Response(
        JSON.stringify(response),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Try to ping the worker with a health check (GET request)
    try {
      const pingResponse = await fetch(workerUrl, {
        method: "GET",
        headers: {
          "X-Email-Secret": emailSecret,
        },
      });
      
      // Even if it returns an error status, if we got a response, the worker is reachable
      response.worker_reachable = true;
      
      // Consider it healthy if config is complete and worker is reachable
      response.healthy = true;
    } catch (fetchError) {
      console.error("Worker ping failed:", fetchError);
      response.worker_reachable = false;
      response.error = "Could not reach Cloudflare Worker";
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error("Health check error:", error);
    return new Response(
      JSON.stringify({ 
        healthy: false, 
        error: error.message,
        config: { worker_url: false, email_secret: false, from_address: null },
        worker_reachable: false 
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
});
