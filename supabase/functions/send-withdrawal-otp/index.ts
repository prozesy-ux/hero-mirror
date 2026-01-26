import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WithdrawalOTPRequest {
  amount: number;
  account_id: string;
}

// Canonical list of statuses that block new withdrawals
const BLOCKING_STATUSES = ['pending', 'processing', 'queued', 'in_review', 'awaiting', 'requested'];

function isBlockingStatus(status: string | null | undefined): boolean {
  if (!status) return false;
  return BLOCKING_STATUSES.includes(status.toLowerCase().trim());
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
    
    // Create client with user's token for auth
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
    const userEmail = claimsData.user.email;

    // Service client for privileged operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { amount, account_id }: WithdrawalOTPRequest = await req.json();

    if (!amount || !account_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get seller profile for this user
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

    // Check for any existing in-progress withdrawal BEFORE generating OTP
    const { data: existingWithdrawals } = await serviceClient
      .from("seller_withdrawals")
      .select("id, status")
      .eq("seller_id", sellerProfile.id);

    const hasBlockingWithdrawal = existingWithdrawals?.some(w => isBlockingStatus(w.status));
    
    if (hasBlockingWithdrawal) {
      console.log(`[OTP] Blocked - seller ${sellerProfile.id} already has pending withdrawal`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "You already have a pending withdrawal. Please wait for it to be processed before requesting another." 
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get account details
    const { data: account, error: accountError } = await serviceClient
      .from("seller_payment_accounts")
      .select("account_name, payment_method_code")
      .eq("id", account_id)
      .eq("seller_id", sellerProfile.id)
      .maybeSingle();

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: "Payment account not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log(`[OTP] Generated OTP for seller ${sellerProfile.id}, amount: $${amount}`);

    // Delete any existing OTPs for this seller
    await serviceClient
      .from("withdrawal_otps")
      .delete()
      .eq("seller_id", sellerProfile.id)
      .eq("verified", false);

    // Store OTP in database
    const { error: otpError } = await serviceClient
      .from("withdrawal_otps")
      .insert({
        seller_id: sellerProfile.id,
        withdrawal_amount: amount,
        payment_account_id: account_id,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        verified: false
      });

    if (otpError) {
      console.error("Failed to store OTP:", otpError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send OTP email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom = Deno.env.get("EMAIL_FROM_ADDRESS") || "noreply@uptoza.com";

    if (resendApiKey && userEmail) {
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 40px 20px; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <div style="max-width: 560px; margin: 0 auto;">
    <div style="text-align: center; padding: 32px 0;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">uptoza</h1>
    </div>
    <div style="background: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
      <div style="padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: #f3e8ff; border-radius: 12px; line-height: 48px;">
            <svg style="width: 24px; height: 24px; vertical-align: middle;" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
        </div>
        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a; text-align: center;">Withdrawal Verification</h2>
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center;">
          You're about to withdraw <strong>$${amount}</strong> to <strong>${account.account_name}</strong>
        </p>
        <p style="margin: 0 0 24px 0; font-size: 14px; color: #4b5563; line-height: 1.6; text-align: center;">
          Enter this code to confirm:
        </p>
        <div style="text-align: center; padding: 24px 0;">
          <div style="display: inline-block; background: #f3e8ff; border: 2px dashed #8b5cf6; border-radius: 8px; padding: 20px 40px;">
            <span style="font-family: 'SF Mono', monospace; font-size: 32px; font-weight: 600; color: #1a1a1a; letter-spacing: 6px;">${otpCode}</span>
          </div>
          <p style="margin: 12px 0 0 0; font-size: 12px; color: #6b7280;">This code expires in 10 minutes</p>
        </div>
        <p style="margin: 24px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
          If you didn't request this withdrawal, please ignore this email and secure your account.
        </p>
      </div>
    </div>
    <div style="text-align: center; padding: 32px 20px;">
      <p style="margin: 0; font-size: 12px; color: #6b7280;">© ${new Date().getFullYear()} Uptoza. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

      console.log(`[OTP] Sending email to ${userEmail} via Resend...`);
      
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [userEmail],
          subject: `Withdrawal Verification Code: ${otpCode}`,
          html: emailHtml
        })
      });

      if (!emailRes.ok) {
        const errorText = await emailRes.text();
        console.error("[OTP] Email send failed:", errorText);
        
        // Delete OTP since email failed
        await serviceClient
          .from("withdrawal_otps")
          .delete()
          .eq("seller_id", sellerProfile.id)
          .eq("otp_code", otpCode);
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Failed to send verification email. Please try again.",
            debug: errorText
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const emailResult = await emailRes.json();
      console.log(`[OTP] Email sent successfully:`, emailResult);
    } else {
      console.error("[OTP] Missing RESEND_API_KEY or user email");
      
      // Delete OTP since we can't send email
      await serviceClient
        .from("withdrawal_otps")
        .delete()
        .eq("seller_id", sellerProfile.id)
        .eq("otp_code", otpCode);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Email configuration error. Please contact support."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[OTP] Success - OTP sent to ${userEmail}`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent to your email",
        expires_at: expiresAt.toISOString()
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
