import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    // Create anon client for auth
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    const { data } = await anonClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");

    const { amount, gateway, transactionId } = await req.json();
    if (!amount || amount < 1) throw new Error("Invalid amount");

    // Create or get wallet
    let { data: wallet, error: walletError } = await supabaseClient
      .from("user_wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!wallet) {
      const { data: newWallet, error: createError } = await supabaseClient
        .from("user_wallets")
        .insert({ user_id: user.id, balance: 0 })
        .select()
        .single();
      
      if (createError) throw createError;
      wallet = newWallet;
    }

    // Create transaction record
    const { data: transaction, error: txError } = await supabaseClient
      .from("wallet_transactions")
      .insert({
        user_id: user.id,
        type: "topup",
        amount: amount,
        payment_gateway: gateway,
        transaction_id: transactionId || null,
        status: "completed",
        description: `Wallet top-up via ${gateway.toUpperCase()}`,
      })
      .select()
      .single();

    if (txError) throw txError;

    // Update wallet balance
    const { error: updateError } = await supabaseClient
      .from("user_wallets")
      .update({ balance: parseFloat(wallet.balance) + parseFloat(amount) })
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, transaction }), {
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
