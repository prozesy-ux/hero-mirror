import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    // Get user from auth header
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.id) throw new Error("User not authenticated");

    const { session_id } = await req.json();
    if (!session_id) throw new Error("Session ID required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve the checkout session from Stripe
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(session_id);
    } catch (stripeError) {
      console.error("Stripe session retrieval error:", stripeError);
      throw new Error("Could not find payment session");
    }
    
    // Verify payment was successful - allow "paid" or handle unpaid gracefully
    if (session.payment_status !== 'paid') {
      console.log(`Session ${session_id} status: ${session.payment_status}`);
      throw new Error("Payment not completed yet");
    }

    // Verify this session belongs to this user
    if (session.metadata?.user_id !== user.id) {
      throw new Error("Session does not belong to this user");
    }

    const amount = parseFloat(session.metadata?.amount || "0");
    if (amount <= 0) throw new Error("Invalid amount");

    // Check if this session was already processed
    const { data: existingTx } = await supabaseClient
      .from('wallet_transactions')
      .select('id')
      .eq('transaction_id', session_id)
      .eq('status', 'completed')
      .single();

    if (existingTx) {
      // Already processed, return success without double-crediting
      return new Response(JSON.stringify({ 
        success: true, 
        amount,
        message: "Payment already processed" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get or create user wallet
    const { data: wallet } = await supabaseClient
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    const currentBalance = wallet?.balance || 0;
    const newBalance = currentBalance + amount;

    // Upsert wallet with new balance
    await supabaseClient
      .from('user_wallets')
      .upsert({
        user_id: user.id,
        balance: newBalance,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    // Create completed transaction record
    await supabaseClient
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        type: 'topup',
        amount: amount,
        payment_gateway: 'stripe',
        status: 'completed',
        transaction_id: session_id,
        description: `Wallet top-up via Stripe`
      });

    console.log(`Wallet credited: user=${user.id}, amount=${amount}, new_balance=${newBalance}`);

    return new Response(JSON.stringify({ 
      success: true, 
      amount,
      new_balance: newBalance 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
