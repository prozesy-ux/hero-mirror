import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limits configuration (requests per window)
const RATE_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
  "signin": { maxRequests: 5, windowMs: 60000 },           // 5 per minute
  "signup": { maxRequests: 3, windowMs: 60000 },           // 3 per minute  
  "create-topup": { maxRequests: 10, windowMs: 60000 },    // 10 per minute
  "verify-topup": { maxRequests: 10, windowMs: 60000 },    // 10 per minute
  "api-general": { maxRequests: 100, windowMs: 60000 },    // 100 per minute
  "password-reset": { maxRequests: 3, windowMs: 300000 },  // 3 per 5 minutes
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { identifier, endpoint } = await req.json();
    
    if (!identifier || !endpoint) {
      return new Response(
        JSON.stringify({ error: "Missing identifier or endpoint" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Get rate limit config for this endpoint
    const config = RATE_LIMITS[endpoint] || RATE_LIMITS["api-general"];
    const windowStart = new Date(Date.now() - config.windowMs).toISOString();

    // Check existing rate limit record
    const { data: existing } = await supabaseClient
      .from("rate_limits")
      .select("*")
      .eq("identifier", identifier)
      .eq("endpoint", endpoint)
      .gte("window_start", windowStart)
      .single();

    if (existing) {
      // Check if limit exceeded
      if (existing.request_count >= config.maxRequests) {
        const windowResetTime = new Date(new Date(existing.window_start).getTime() + config.windowMs);
        const retryAfterSeconds = Math.ceil((windowResetTime.getTime() - Date.now()) / 1000);
        
        return new Response(
          JSON.stringify({
            allowed: false,
            remaining: 0,
            reset_at: windowResetTime.toISOString(),
            retry_after: Math.max(0, retryAfterSeconds),
          }),
          {
            headers: { 
              ...corsHeaders, 
              "Content-Type": "application/json",
              "Retry-After": String(Math.max(0, retryAfterSeconds)),
            },
            status: 429,
          }
        );
      }

      // Increment count
      await supabaseClient
        .from("rate_limits")
        .update({ request_count: existing.request_count + 1 })
        .eq("id", existing.id);

      return new Response(
        JSON.stringify({
          allowed: true,
          remaining: config.maxRequests - existing.request_count - 1,
          limit: config.maxRequests,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Create new rate limit record
    await supabaseClient
      .from("rate_limits")
      .upsert({
        identifier,
        endpoint,
        request_count: 1,
        window_start: new Date().toISOString(),
      }, { onConflict: "identifier,endpoint" });

    return new Response(
      JSON.stringify({
        allowed: true,
        remaining: config.maxRequests - 1,
        limit: config.maxRequests,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Rate limit error:", error);
    // On error, allow the request (fail open for availability)
    return new Response(
      JSON.stringify({ allowed: true, error: "Rate limit check failed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
