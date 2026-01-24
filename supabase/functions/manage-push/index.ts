import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// VAPID key generation utilities
async function generateVapidKeys() {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );

  const publicKeyBuffer = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  // Convert to base64url
  const publicKey = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const privateKey = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return { publicKey, privateKey };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "get-public-key": {
        // Check if VAPID keys exist
        const { data: config } = await supabase
          .from("push_config")
          .select("public_key")
          .eq("id", "default")
          .single();

        if (config) {
          return new Response(
            JSON.stringify({ publicKey: config.public_key }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate new VAPID keys
        const { publicKey, privateKey } = await generateVapidKeys();

        // Store in database
        const { error: insertError } = await supabase.from("push_config").insert({
          id: "default",
          public_key: publicKey,
          private_key: privateKey,
          subject: "mailto:support@uptoza.com",
        });

        if (insertError) {
          // Another request might have inserted, try to fetch again
          const { data: retryConfig } = await supabase
            .from("push_config")
            .select("public_key")
            .eq("id", "default")
            .single();

          if (retryConfig) {
            return new Response(
              JSON.stringify({ publicKey: retryConfig.public_key }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          throw insertError;
        }

        return new Response(
          JSON.stringify({ publicKey }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "subscribe": {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "Authorization required" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify the user
        const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
          global: { headers: { Authorization: authHeader } },
        });

        const { data: { user }, error: authError } = await userClient.auth.getUser();
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: "Invalid token" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { subscription, userAgent } = body;
        if (!subscription?.endpoint || !subscription?.keys) {
          return new Response(
            JSON.stringify({ error: "Invalid subscription data" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Parse user agent for device name
        let deviceName = "Unknown Device";
        if (userAgent) {
          if (userAgent.includes("Chrome")) deviceName = "Chrome";
          else if (userAgent.includes("Firefox")) deviceName = "Firefox";
          else if (userAgent.includes("Safari")) deviceName = "Safari";
          else if (userAgent.includes("Edge")) deviceName = "Edge";
          
          if (userAgent.includes("Windows")) deviceName += " on Windows";
          else if (userAgent.includes("Mac")) deviceName += " on Mac";
          else if (userAgent.includes("Android")) deviceName += " on Android";
          else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) deviceName += " on iOS";
          else if (userAgent.includes("Linux")) deviceName += " on Linux";
        }

        // Upsert subscription
        const { error: subError } = await supabase.from("push_subscriptions").upsert(
          {
            user_id: user.id,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            user_agent: userAgent,
            device_name: deviceName,
            is_active: true,
            last_used_at: new Date().toISOString(),
          },
          { onConflict: "user_id,endpoint" }
        );

        if (subError) {
          console.error("Subscription error:", subError);
          return new Response(
            JSON.stringify({ error: "Failed to save subscription" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "unsubscribe": {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "Authorization required" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
          global: { headers: { Authorization: authHeader } },
        });

        const { data: { user }, error: authError } = await userClient.auth.getUser();
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: "Invalid token" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { endpoint } = body;

        if (endpoint) {
          // Deactivate specific subscription
          await supabase
            .from("push_subscriptions")
            .update({ is_active: false })
            .eq("user_id", user.id)
            .eq("endpoint", endpoint);
        } else {
          // Deactivate all subscriptions for user
          await supabase
            .from("push_subscriptions")
            .update({ is_active: false })
            .eq("user_id", user.id);
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "check-subscription": {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
          return new Response(
            JSON.stringify({ isSubscribed: false }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
          global: { headers: { Authorization: authHeader } },
        });

        const { data: { user } } = await userClient.auth.getUser();
        if (!user) {
          return new Response(
            JSON.stringify({ isSubscribed: false }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1);

        return new Response(
          JSON.stringify({ isSubscribed: (subs?.length || 0) > 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "track-click": {
        const { logId } = body;
        if (logId) {
          await supabase
            .from("push_logs")
            .update({ status: "clicked", clicked_at: new Date().toISOString() })
            .eq("id", logId);
        }
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Push management error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
