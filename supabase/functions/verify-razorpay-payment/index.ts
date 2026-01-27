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

  // Use service role for database operations
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Use anon key for user authentication
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
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

    // Get payment details from request
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = await req.json();
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error("Missing payment details");
    }

    if (!amount || amount < 1) {
      throw new Error("Invalid amount");
    }

    // Fetch API secret from payment_methods table (with env fallback)
    const { data: paymentMethod } = await supabaseAdmin
      .from('payment_methods')
      .select('api_secret')
      .eq('code', 'razorpay')
      .single();

    const keySecret = paymentMethod?.api_secret || Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) {
      throw new Error("Razorpay secret not configured");
    }

    console.log("Verifying Razorpay payment for order:", razorpay_order_id);

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(keySecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
    const generatedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    if (generatedSignature !== razorpay_signature) {
      console.error("Signature mismatch:", { generated: generatedSignature, received: razorpay_signature });
      throw new Error("Invalid payment signature - payment verification failed");
    }

    console.log("Razorpay signature verified for payment:", razorpay_payment_id);

    // Check if payment already processed
    const { data: existingTx } = await supabaseAdmin
      .from('wallet_transactions')
      .select('id')
      .eq('transaction_id', razorpay_payment_id)
      .eq('status', 'completed')
      .single();

    if (existingTx) {
      console.log("Payment already processed:", razorpay_payment_id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Payment already processed" 
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get current wallet balance
    const { data: wallet } = await supabaseAdmin
      .from('user_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    const currentBalance = wallet?.balance || 0;
    const newBalance = currentBalance + amount;

    // Upsert wallet (create if doesn't exist, update if exists)
    const { error: walletError } = await supabaseAdmin
      .from('user_wallets')
      .upsert({
        user_id: user.id,
        balance: newBalance,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id' 
      });

    if (walletError) {
      console.error("Wallet update error:", walletError);
      throw new Error("Failed to update wallet balance");
    }

    // Create transaction record
    const { error: txError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        type: 'topup',
        amount: amount,
        payment_gateway: 'razorpay',
        status: 'completed',
        transaction_id: razorpay_payment_id,
        description: `Wallet top-up via Razorpay`
      });

    if (txError) {
      console.error("Transaction record error:", txError);
      // Don't throw here - wallet already updated
    }

    console.log(`Wallet credited: $${amount} for user ${user.id}. New balance: $${newBalance}`);

    // Send wallet top-up confirmation email (non-blocking)
    try {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('user_id', user.id)
        .single();
      
      if (profile?.email) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        
        await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${serviceKey}`
          },
          body: JSON.stringify({
            template_id: 'wallet_topup',
            to: profile.email,
            subject: `Wallet credited - ₹${amount}`,
            html: `<p>Your wallet has been credited with ₹${amount}. New balance: ₹${newBalance.toFixed(2)}</p>`,
            category: 'wallet',
            user_id: user.id,
            variables: {
              user_name: profile.email.split('@')[0],
              amount: amount.toString(),
              new_balance: newBalance.toFixed(2),
              payment_method: 'Razorpay',
              transaction_id: razorpay_payment_id.slice(0, 16),
            }
          })
        });
        console.log(`Top-up email sent to ${profile.email}`);
      }
    } catch (emailError) {
      console.error("Email send error (non-blocking):", emailError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        amount,
        new_balance: newBalance 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("Error verifying Razorpay payment:", error);
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
