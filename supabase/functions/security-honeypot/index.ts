import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limits configuration
// NOTE: devtools_detected is noisy and can trigger false positives in normal usage.
// We log it for audit, but we do NOT block access based on it.
const BLOCK_THRESHOLDS = {
  devtools_detected: { maxAttempts: 999999, blockDurationHours: 0 },
  repeated_inspection: { maxAttempts: 3, blockDurationHours: 48 },
  rate_limit_exceeded: { maxAttempts: 10, blockDurationHours: 1 },
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
    // Extract client IP from various headers
    const clientIP = 
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";

    const userAgent = req.headers.get("user-agent") || "unknown";
    
    const body = await req.json();
    const { event_type, metadata = {}, check_only = false } = body;

    // Check if IP is currently blocked (ignore devtools_detected blocks - too noisy)
    const { data: existingBlock } = await supabaseClient
      .from("security_logs")
      .select("*")
      .eq("ip_address", clientIP)
      .eq("is_blocked", true)
      .neq("event_type", "devtools_detected")
      .gt("blocked_until", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingBlock) {
      const blockedUntil = new Date(existingBlock.blocked_until);
      const remainingMinutes = Math.ceil((blockedUntil.getTime() - Date.now()) / 60000);
      
      return new Response(
        JSON.stringify({
          blocked: true,
          reason: existingBlock.block_reason,
          remaining_minutes: remainingMinutes,
          blocked_until: existingBlock.blocked_until,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // If just checking block status, return not blocked
    if (check_only) {
      return new Response(
        JSON.stringify({ blocked: false }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get threshold config for this event type
    const thresholdConfig = BLOCK_THRESHOLDS[event_type as keyof typeof BLOCK_THRESHOLDS] || 
      { maxAttempts: 5, blockDurationHours: 24 };

    // Check recent attempts from this IP for this event type (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentAttempts, error: countError } = await supabaseClient
      .from("security_logs")
      .select("id, attempt_count")
      .eq("ip_address", clientIP)
      .eq("event_type", event_type)
      .gte("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: false });

    if (countError) {
      console.error("Error checking recent attempts:", countError);
    }

    const totalAttempts = (recentAttempts?.reduce((sum, log) => sum + (log.attempt_count || 1), 0) || 0) + 1;
    const shouldBlock = totalAttempts >= thresholdConfig.maxAttempts;

    // Calculate block expiry
    const blockedUntil = shouldBlock 
      ? new Date(Date.now() + thresholdConfig.blockDurationHours * 60 * 60 * 1000).toISOString()
      : null;

    // Log the security event
    const { error: insertError } = await supabaseClient
      .from("security_logs")
      .insert({
        ip_address: clientIP,
        user_agent: userAgent,
        event_type,
        attempt_count: 1,
        is_blocked: shouldBlock,
        block_reason: shouldBlock ? `Exceeded ${thresholdConfig.maxAttempts} ${event_type} attempts` : null,
        blocked_until: blockedUntil,
        metadata: {
          ...metadata,
          total_attempts: totalAttempts,
          threshold: thresholdConfig.maxAttempts,
        },
      });

    if (insertError) {
      console.error("Error logging security event:", insertError);
    }

    console.log(`Security event: ${event_type} from ${clientIP}, attempts: ${totalAttempts}, blocked: ${shouldBlock}`);

    return new Response(
      JSON.stringify({
        blocked: shouldBlock,
        remaining_attempts: Math.max(0, thresholdConfig.maxAttempts - totalAttempts),
        total_attempts: totalAttempts,
        ...(shouldBlock && { 
          reason: `Too many ${event_type} attempts`,
          blocked_until: blockedUntil,
        }),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: shouldBlock ? 403 : 200,
      }
    );
  } catch (error: unknown) {
    console.error("Honeypot error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
