import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  otp_code: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.user.id;
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { otp_code }: VerifyOTPRequest = await req.json();

    if (!otp_code) {
      return new Response(
        JSON.stringify({ error: "OTP code required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get seller profile
    const { data: sellerProfile, error: sellerError } = await serviceClient
      .from("seller_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (sellerError || !sellerProfile) {
      return new Response(
        JSON.stringify({ error: "Seller profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find valid OTP
    const { data: otpRecord, error: otpError } = await serviceClient
      .from("withdrawal_otps")
      .select("*")
      .eq("seller_id", sellerProfile.id)
      .eq("otp_code", otp_code)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (otpError || !otpRecord) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as verified
    await serviceClient
      .from("withdrawal_otps")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    // Get payment account details
    const { data: account } = await serviceClient
      .from("seller_payment_accounts")
      .select("account_name, account_number, bank_name, payment_method_code")
      .eq("id", otpRecord.payment_account_id)
      .maybeSingle();

    // Get wallet balance
    const { data: wallet } = await serviceClient
      .from("seller_wallets")
      .select("balance")
      .eq("seller_id", sellerProfile.id)
      .maybeSingle();

    if (!wallet || wallet.balance < otpRecord.withdrawal_amount) {
      return new Response(
        JSON.stringify({ error: "Insufficient balance" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create withdrawal request - unique index will prevent duplicates at DB level
    const { error: withdrawalError } = await serviceClient
      .from("seller_withdrawals")
      .insert({
        seller_id: sellerProfile.id,
        amount: otpRecord.withdrawal_amount,
        payment_method: account?.payment_method_code || "unknown",
        account_details: account 
          ? `${account.account_name} - ${account.account_number}${account.bank_name ? ` (${account.bank_name})` : ""}`
          : "Unknown account",
        status: "pending"
      });

    if (withdrawalError) {
      console.error("Withdrawal creation error:", withdrawalError);
      
      return new Response(
        JSON.stringify({ error: "Failed to create withdrawal" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deduct from balance
    const { error: walletError } = await serviceClient
      .from("seller_wallets")
      .update({ balance: wallet.balance - otpRecord.withdrawal_amount })
      .eq("seller_id", sellerProfile.id);

    if (walletError) {
      console.error("Wallet update error:", walletError);
    }

    // Delete used OTP
    await serviceClient
      .from("withdrawal_otps")
      .delete()
      .eq("id", otpRecord.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Withdrawal request submitted successfully",
        amount: otpRecord.withdrawal_amount
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
