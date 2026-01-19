import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client for user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !userData.user) {
      throw new Error("User not authenticated");
    }
    
    const user = userData.user;
    if (!user.email) {
      throw new Error("User email not available");
    }

    // Get request body
    const { amount } = await req.json();
    
    if (!amount || amount < 1) {
      throw new Error("Invalid amount. Minimum is $1");
    }

    // Get Razorpay credentials
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    
    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials not configured");
    }

    // Create Razorpay order using REST API
    const auth = btoa(`${keyId}:${keySecret}`);
    
    // Convert USD to INR (approximate rate - you can adjust or make dynamic)
    const inrAmount = Math.round(amount * 84 * 100); // Amount in paise
    
    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`
      },
      body: JSON.stringify({
        amount: inrAmount,
        currency: "INR",
        receipt: `wallet_topup_${user.id.substring(0, 8)}_${Date.now()}`,
        notes: {
          user_id: user.id,
          user_email: user.email,
          type: "wallet_topup",
          amount_usd: amount.toString()
        }
      })
    });

    const order = await orderResponse.json();
    
    if (!orderResponse.ok) {
      console.error("Razorpay order creation failed:", order);
      throw new Error(order.error?.description || "Failed to create Razorpay order");
    }

    console.log("Razorpay order created:", order.id);

    return new Response(
      JSON.stringify({ 
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: keyId,
        amount_usd: amount
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error creating Razorpay order:", error);
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
