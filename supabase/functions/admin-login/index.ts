import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Body = {
  identifier?: string;
  password?: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { identifier, password }: Body = await req.json();

    if (!identifier || !password) {
      return new Response(JSON.stringify({ error: "identifier and password are required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Resolve username -> email using service role (bypasses RLS)
    let email = identifier;
    if (!identifier.includes("@")) {
      const adminClient = createClient(supabaseUrl, serviceRoleKey);

      const { data: profile, error: profileError } = await adminClient
        .from("profiles")
        .select("email")
        .eq("username", identifier)
        .single();

      if (profileError || !profile?.email) {
        return new Response(JSON.stringify({ error: "Username not found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        });
      }

      email = profile.email;
    }

    // Use the Auth password grant endpoint to verify credentials and get tokens.
    const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
      },
      body: JSON.stringify({ email, password }),
    });

    const tokenJson = await tokenRes.json();

    if (!tokenRes.ok) {
      return new Response(JSON.stringify({ error: tokenJson?.error_description ?? "Invalid credentials" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Return only what the client needs to establish a session
    return new Response(
      JSON.stringify({
        access_token: tokenJson.access_token,
        refresh_token: tokenJson.refresh_token,
        expires_in: tokenJson.expires_in,
        token_type: tokenJson.token_type,
        user: tokenJson.user,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
